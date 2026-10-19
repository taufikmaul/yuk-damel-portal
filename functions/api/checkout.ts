/**
 * Endpoint /api/checkout
 * Membuat Transaksi Pembelian Baru & Menginisialisasi Pembayaran (Free Tier Instan / Pakasir / QRIS Dinamis)
 */

import { Env, getSystemConfig, getActivePod, sendTelegramAlert, jsonResponse, handleOptions } from './_db';
import { checkRateLimit } from './_ratelimit';
import { ensureEmailVerificationsTable, sendEmail, renderWelcomeFreeTierHtml } from './_email';

export const onRequestOptions = async () => {
  return handleOptions();
};

// Generator token lisensi unik
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'AKUGAWE-';
  for (let i = 0; i < 4; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  res += '-';
  for (let i = 0; i < 4; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// CRC16-CCITT implementation untuk QRIS dinamis
function calculateCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function makeDynamicQris(staticQris: string, amount: number): string {
  let qris = staticQris.trim();
  const crcIndex = qris.lastIndexOf('6304');
  if (crcIndex !== -1) {
    qris = qris.substring(0, crcIndex);
  }
  if (qris.includes('010211')) {
    qris = qris.replace('010211', '010212');
  }
  const tag54Regex = /54(\d{2})(\d+)/;
  if (tag54Regex.test(qris)) {
    qris = qris.replace(tag54Regex, '');
  }
  const amountStr = Math.round(amount).toString();
  const tag54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  const tag58Index = qris.indexOf('5802ID');
  if (tag58Index !== -1) {
    qris = qris.substring(0, tag58Index) + tag54 + qris.substring(tag58Index);
  } else {
    qris = qris + tag54;
  }
  qris = qris + '6304';
  const crc = calculateCrc16(qris);
  return qris + crc;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    // 1. Rate Limiting: Maksimal 10 percobaan checkout per 10 menit per IP
    const rateCheck = await checkRateLimit(context.env, context.request, 'checkout', 10, 600);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body: any = await context.request.json().catch(() => ({}));
    const {
      clientName,
      buyerPhone,
      buyerEmail,
      packageTierId,
      cycleMonths = 1,
      hasManagedSetup = false,
      paymentMethod = 'qris_manual',
      activationCode,
    } = body;

    // 2. Strict Input Validation
    if (!clientName || typeof clientName !== 'string' || clientName.trim().length < 2 || clientName.trim().length > 100) {
      return jsonResponse({ ok: false, error: 'Nama Usaha harus berupa teks (2-100 karakter).' }, 400);
    }

    if (!buyerPhone || typeof buyerPhone !== 'string' || !/^[0-9+() -]{8,20}$/.test(buyerPhone.trim())) {
      return jsonResponse({ ok: false, error: 'Nomor WhatsApp tidak valid (minimal 8 digit angka).' }, 400);
    }

    if (!packageTierId || typeof packageTierId !== 'string' || !/^[a-zA-Z0-9_-]{2,50}$/.test(packageTierId)) {
      return jsonResponse({ ok: false, error: 'Pilihan Paket tidak valid.' }, 400);
    }

    if (buyerEmail && (typeof buyerEmail !== 'string' || buyerEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim()))) {
      return jsonResponse({ ok: false, error: 'Format email tidak valid.' }, 400);
    }

    // Ambil konfigurasi publik dari D1 / KV
    const rawPublicConfig = await getSystemConfig(context.env, 'PUBLIC_SELLER_CONFIG');
    const publicConfig = rawPublicConfig ? JSON.parse(rawPublicConfig) : null;
    
    const tiers = publicConfig?.pricingTiers || [];
    const matchedTier = tiers.find((t: any) => t.id === packageTierId);

    const isFreeTier = matchedTier?.isFree || packageTierId === 'free_trial';
    const cleanClientName = clientName.trim();
    const cleanPhone = buyerPhone.trim();
    const cleanEmail = (buyerEmail || '').trim().toLowerCase();
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const clientSlug = slugify(cleanClientName);
    const licenseToken = generateToken();

    // Alokasikan Pod Cloudflare sesuai aturan baku (Shared: Demo/Free/Starter, Dedicated: Pro/Enterprise)
    const activePod = await getActivePod(context.env, packageTierId);
    const podId = activePod?.id || 'pod-01';
    const isSharedPod = (packageTierId === 'pro' || packageTierId === 'enterprise') ? 0 : 1;

    // ==========================================
    // SKENARIO 1: FREE TIER (4 Karyawan & 4 Bulan)
    // Wajib Verifikasi Kode Aktivasi Email (Anti-Spam)
    // ==========================================
    if (isFreeTier) {
      // 1. Validasi Email Wajib untuk Free Tier
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return jsonResponse({ ok: false, error: 'Alamat email aktif wajib diisi untuk verifikasi akun Free Tier.' }, 400);
      }

      // 2. Validasi Kode Aktivasi 6 Digit Wajib
      if (!activationCode || typeof activationCode !== 'string' || !/^\d{6}$/.test(activationCode.trim())) {
        return jsonResponse({
          ok: false,
          error: 'Kode aktivasi 6 digit wajib disertakan. Harap klik "Kirim Kode Aktivasi" untuk menerima kode via email.',
        }, 400);
      }

      const cleanCode = activationCode.trim();
      await ensureEmailVerificationsTable(context.env);

      // 3. Verifikasi Kode Aktivasi di Cloudflare D1
      if (context.env.DB) {
        // Anti-Abuse: Pastikan email belum pernah klaim Free Tier
        const existingFree = await context.env.DB.prepare(`
          SELECT id, client_name FROM orders 
          WHERE LOWER(buyer_email) = ? AND (package_tier_id = 'free_trial' OR amount_paid_rp = 0)
          LIMIT 1
        `).bind(cleanEmail).first<{ id: string; client_name: string }>();

        if (existingFree) {
          return jsonResponse({
            ok: false,
            error: `Email "${cleanEmail}" sudah pernah digunakan untuk mengaktifkan akun Free Tier (${existingFree.client_name}). Setiap email hanya berhak mengklaim 1x Free Tier. Silakan upgrade ke paket Starter.`,
          }, 400);
        }

        // Cari kode verifikasi terbaru yang belum digunakan
        const verif = await context.env.DB.prepare(`
          SELECT * FROM email_verifications 
          WHERE LOWER(email) = ? AND verified_at IS NULL
          ORDER BY created_at DESC LIMIT 1
        `).bind(cleanEmail).first<any>();

        if (!verif) {
          return jsonResponse({
            ok: false,
            error: 'Kode aktivasi tidak ditemukan atau belum diminta. Silakan klik "Kirim Kode Aktivasi" terlebih dahulu.',
          }, 400);
        }

        if (verif.attempts >= 5) {
          return jsonResponse({
            ok: false,
            error: 'Terlalu banyak percobaan kode yang salah (maks 5x). Harap minta kode aktivasi baru.',
          }, 400);
        }

        const expiresAt = new Date(verif.expires_at.includes('Z') ? verif.expires_at : verif.expires_at + 'Z').getTime();
        if (expiresAt < Date.now()) {
          return jsonResponse({
            ok: false,
            error: 'Kode aktivasi telah kedaluwarsa (berlaku 15 menit). Harap minta kode aktivasi baru.',
          }, 400);
        }

        if (verif.code !== cleanCode) {
          await context.env.DB.prepare(
            'UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?'
          ).bind(verif.id).run().catch(() => {});

          return jsonResponse({
            ok: false,
            error: 'Kode aktivasi salah. Periksa kembali kotak masuk atau spam email Anda.',
          }, 400);
        }

        // Tandai verifikasi berhasil digunakan
        await context.env.DB.prepare(
          'UPDATE email_verifications SET verified_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(verif.id).run().catch(() => {});
      }

      // Hapus cache KV jika ada
      if (context.env.CONFIG_KV) {
        await context.env.CONFIG_KV.delete(`ev:${cleanEmail}`).catch(() => {});
      }

      const freeMonths = matchedTier?.freeDurationMonths || 4;
      const maxEmployees = matchedTier?.maxEmployees || 4;
      const appUrl = `${activePod?.app_base_url || 'https://app.akugawe.web.id'}/${clientSlug}`;
      const dashboardUrl = `${(activePod as any)?.dashboard_base_url || 'https://hrd.akugawe.web.id'}/${clientSlug}`;

      if (context.env.DB) {
        await context.env.DB.prepare(`
          INSERT INTO orders (
            id, client_name, client_slug, package_tier_id, 
            amount_paid_rp, payment_status, license_token, 
            activation_status, buyer_phone, buyer_email,
            billing_cycle_months, subscription_status,
            current_period_start, current_period_end,
            max_employees, pod_id, is_shared_pod,
            deployed_urls, created_at, deployed_at
          ) VALUES (
            ?, ?, ?, ?,
            0, 'paid', ?,
            'active', ?, ?,
            ?, 'active',
            CURRENT_TIMESTAMP, datetime('now', '+' || ? || ' months'),
            ?, ?, ?,
            ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `).bind(
          orderId, cleanClientName, clientSlug, packageTierId,
          licenseToken, cleanPhone, cleanEmail,
          freeMonths, String(freeMonths),
          maxEmployees, podId, isSharedPod,
          JSON.stringify({ app: appUrl, dashboard: dashboardUrl })
        ).run();

        // Update jumlah tenant pada pod
        await context.env.DB.prepare(
          'UPDATE cloudflare_pods SET current_companies_count = current_companies_count + 1 WHERE id = ?'
        ).bind(podId).run().catch(() => {});
      }

      // Notifikasi Telegram Admin
      const telegramText =
        `🎉 *FREE TIER 4 BULAN BERHASIL DIAKTIFKAN (EMAIL TERVERIFIKASI)!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 Order ID: \`${orderId}\`\n` +
        `🏢 Usaha: *${cleanClientName}*\n` +
        `✉️ Email: \`${cleanEmail}\` (Terverifikasi ✅)\n` +
        `📱 WhatsApp: ${cleanPhone}\n` +
        `👥 Kuota: *${maxEmployees} Karyawan*\n` +
        `⏰ Masa Aktif: *${freeMonths} Bulan Penuh*\n` +
        `☁️ Pod: \`${podId}\`\n` +
        `🔑 Token Lisensi: \`${licenseToken}\`\n` +
        `📱 App Presensi: ${appUrl}\n` +
        `💻 Dashboard HRD: ${dashboardUrl}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Aplikasi sudah langsung aktif dan siap digunakan._`;

      await sendTelegramAlert(context.env, telegramText);

      // Kirim Email Selamat Datang & Kredensial ke Pengguna
      sendEmail(context.env, {
        to: cleanEmail,
        subject: `🎉 Selamat! Akun Free Tier akugawe Anda Telah Aktif (${cleanClientName})`,
        html: renderWelcomeFreeTierHtml({
          clientName: cleanClientName,
          licenseToken,
          appUrl,
          dashboardUrl,
          freeMonths,
        }),
      }).catch((e) => console.warn('Failed sending welcome email to user:', e));

      return jsonResponse({
        ok: true,
        isFree: true,
        order: {
          id: orderId,
          clientName: cleanClientName,
          clientSlug,
          buyerPhone: cleanPhone,
          buyerEmail: cleanEmail,
          packageTierId,
          packageName: matchedTier?.name || 'Free Trial UMKM',
          finalAmount: 0,
          paymentStatus: 'paid',
          subscriptionStatus: 'active',
          licenseToken,
          billingCycleMonths: freeMonths,
          maxEmployees,
          appUrl,
          dashboardUrl,
          message: 'Selamat! Akun Free Tier 4 Bulan Anda berhasil diverifikasi dan diaktifkan.',
        },
      });
    }

    // ==========================================
    // SKENARIO 2: PAID SUBSCRIPTION (1 Bln - 5 Thn)
    // ==========================================
    let basePrice = 15000;
    const selectedMonthsStr = String(cycleMonths);
    const maxEmployees = matchedTier?.maxEmployees || 15;

    if (matchedTier?.pricing && matchedTier.pricing[selectedMonthsStr]) {
      const durPricing = matchedTier.pricing[selectedMonthsStr];
      basePrice = publicConfig?.isPromoActive ? durPricing.promoRp : durPricing.normalRp;
    } else if (matchedTier) {
      basePrice = publicConfig?.isPromoActive ? matchedTier.promoPriceRp : matchedTier.normalPriceRp;
    }

    const managedFee = hasManagedSetup ? (publicConfig?.managedSetupPriceRp || 150000) : 0;
    const uniqueCode = paymentMethod === 'qris_manual' ? Math.floor(100 + Math.random() * 899) : 0;
    const finalAmount = basePrice + managedFee + uniqueCode;
    const packageName = matchedTier?.name || 'Starter UMKM';

    // Simpan ke D1 dengan status pending
    if (context.env.DB) {
      await context.env.DB.prepare(`
        INSERT INTO orders (
          id, client_name, client_slug, package_tier_id, 
          amount_paid_rp, payment_status, license_token, 
          activation_status, buyer_phone, buyer_email,
          billing_cycle_months, subscription_status,
          max_employees, pod_id, is_shared_pod,
          created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, 'pending', ?,
          'pending', ?, ?,
          ?, 'pending',
          ?, ?, ?,
          CURRENT_TIMESTAMP
        )
      `).bind(
        orderId, cleanClientName, clientSlug, packageTierId,
        finalAmount, licenseToken,
        cleanPhone, cleanEmail || null,
        Number(cycleMonths),
        maxEmployees, podId, isSharedPod
      ).run();
    }

    let dynamicQrisString = '';
    let qrCodeImageUrl = '';
    let pakasirCheckoutUrl = '';

    // 1. Integrasi Pakasir Payment Gateway
    if (paymentMethod === 'pakasir') {
      const pakasirApiKey = await getSystemConfig(context.env, 'PAKASIR_API_KEY');
      const pakasirProjectSlug = publicConfig?.pakasirProjectSlug || '';

      if (pakasirApiKey && pakasirProjectSlug) {
        try {
          const endpointUrl = `https://app.pakasir.com/api/v2/create-transaction/${encodeURIComponent(pakasirProjectSlug)}/${encodeURIComponent(orderId)}`;
          const pakasirRes = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': pakasirApiKey.trim(),
            },
            body: JSON.stringify({
              method: 'qris',
              amount: finalAmount,
            }),
          });
          const pakasirData: any = await pakasirRes.json();
          if (pakasirData && pakasirData.qr_string) {
            dynamicQrisString = pakasirData.qr_string;
            qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(dynamicQrisString)}`;
          }
          pakasirCheckoutUrl = `https://app.pakasir.com/pay/${encodeURIComponent(pakasirProjectSlug)}/${encodeURIComponent(orderId)}`;
        } catch (e) {
          console.error('Gagal memanggil API Pakasir v2:', e);
        }
      }
    }

    // 2. Fallback QRIS Manual Dinamis
    if (paymentMethod === 'qris_manual' || !dynamicQrisString) {
      const staticQris = (await getSystemConfig(context.env, 'STATIC_QRIS_STRING')) || publicConfig?.staticQrisString;
      if (staticQris && staticQris.trim().length > 20) {
        dynamicQrisString = makeDynamicQris(staticQris.trim(), finalAmount);
        qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(dynamicQrisString)}`;
      }
    }

    // Notifikasi Telegram Order Baru Masuk
    const telegramText =
      `🛒 *ORDER LANGGANAN BARU MASUK (#${orderId})*\n\n` +
      `🏢 Usaha: *${cleanClientName}*\n` +
      `📱 WhatsApp: ${cleanPhone}\n` +
      `📦 Paket: *${packageName} (${cycleMonths} Bulan)*\n` +
      `👥 Kuota: *Maks ${maxEmployees} Karyawan*\n` +
      `🛠️ VIP Setup: *${hasManagedSetup ? 'YA' : 'Mandiri'}*\n` +
      `💰 Total Tagihan: *Rp ${finalAmount.toLocaleString('id-ID')}*\n` +
      `💳 Metode: *${paymentMethod.toUpperCase()}*\n` +
      `🔑 Token Dialokasikan: \`${licenseToken}\`\n\n` +
      `Menunggu konfirmasi pembayaran via QRIS...`;

    await sendTelegramAlert(context.env, telegramText);

    return jsonResponse({
      ok: true,
      isFree: false,
      order: {
        id: orderId,
        clientName: cleanClientName,
        clientSlug,
        buyerPhone: cleanPhone,
        packageTierId,
        packageName,
        billingCycleMonths: Number(cycleMonths),
        maxEmployees,
        basePrice,
        hasManagedSetup,
        managedFee,
        uniqueCode,
        finalAmount,
        paymentMethod,
        dynamicQrisString,
        qrCodeImageUrl,
        pakasirCheckoutUrl,
        licenseToken,
        appUrl: `${activePod?.app_base_url || 'https://app.akugawe.web.id'}/${clientSlug}`,
        dashboardUrl: `${(activePod as any)?.dashboard_base_url || 'https://hrd.akugawe.web.id'}/${clientSlug}`,
      },
    });
  } catch (err: any) {
    console.error('Error on checkout:', err);
    return jsonResponse({ ok: false, error: err?.message || 'Gagal memproses transaksi.' }, 500);
  }
};
