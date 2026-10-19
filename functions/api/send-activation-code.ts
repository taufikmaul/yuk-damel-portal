/**
 * Endpoint /api/send-activation-code
 * Mengirimkan Kode Aktivasi 6-Digit ke Email Calon Pelanggan Free Tier untuk Mencegah Spam
 */

import { Env, handleOptions, jsonResponse, sendTelegramAlert, getSystemConfig } from './_db';
import { checkRateLimit } from './_ratelimit';
import { ensureEmailVerificationsTable, sendEmail, renderActivationEmailHtml } from './_email';

export const onRequestOptions = handleOptions;

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    // 1. Rate Limiting ketat per IP (Maks 5 pengiriman per 10 menit per IP)
    const rateCheck = await checkRateLimit(context.env, context.request, 'activation_code', 5, 600);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body: any = await context.request.json().catch(() => ({}));
    const { email, clientName, buyerPhone, packageTierId = 'free_trial' } = body;

    // 2. Validasi input
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return jsonResponse({ ok: false, error: 'Alamat email tidak valid. Harap masukkan email aktif Anda.' }, 400);
    }

    if (!clientName || typeof clientName !== 'string' || clientName.trim().length < 2) {
      return jsonResponse({ ok: false, error: 'Nama Toko / Usaha wajib diisi (minimal 2 karakter).' }, 400);
    }

    if (!buyerPhone || typeof buyerPhone !== 'string' || !/^[0-9+() -]{8,20}$/.test(buyerPhone.trim())) {
      return jsonResponse({ ok: false, error: 'Nomor WhatsApp wajib diisi (minimal 8 digit).' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanClientName = clientName.trim();
    const cleanPhone = buyerPhone.trim();

    // 3. Pastikan tabel email_verifications tersedia di D1
    await ensureEmailVerificationsTable(context.env);

    // 4. Anti-Abuse 1: Cegah klaim Free Tier berulang dengan email yang sama
    if (context.env.DB) {
      const existingFree = await context.env.DB.prepare(`
        SELECT id, client_name FROM orders 
        WHERE LOWER(buyer_email) = ? AND (package_tier_id = 'free_trial' OR amount_paid_rp = 0)
        LIMIT 1
      `).bind(cleanEmail).first<{ id: string; client_name: string }>();

      if (existingFree) {
        return jsonResponse(
          {
            ok: false,
            error: `Email "${cleanEmail}" sudah pernah digunakan untuk mengaktifkan akun Free Tier (${existingFree.client_name}). Setiap email hanya dapat mengklaim 1x Free Tier. Silakan gunakan paket Starter atau hubungi kami.`,
          },
          400
        );
      }

      // 5. Anti-Abuse 2: Batasi cooldown pengiriman ulang per email (minimal 60 detik)
      const recentReq = await context.env.DB.prepare(`
        SELECT created_at FROM email_verifications 
        WHERE LOWER(email) = ? AND datetime(created_at, '+60 seconds') > CURRENT_TIMESTAMP
        ORDER BY created_at DESC LIMIT 1
      `).bind(cleanEmail).first<any>();

      if (recentReq) {
        return jsonResponse(
          {
            ok: false,
            error: 'Kode baru baru saja dikirim. Harap tunggu minimal 60 detik sebelum meminta kode aktivasi baru.',
          },
          429
        );
      }
    }

    // 6. Generate 6-Digit Cryptographic Code
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const codeNum = (randomArray[0] % 900000) + 100000;
    const activationCode = codeNum.toString();
    const verificationId = `EV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 7. Simpan ke database D1
    if (context.env.DB) {
      await context.env.DB.prepare(`
        INSERT INTO email_verifications (
          id, email, code, client_name, phone, package_tier_id, attempts, expires_at, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, 0, datetime('now', '+15 minutes'), CURRENT_TIMESTAMP
        )
      `).bind(
        verificationId,
        cleanEmail,
        activationCode,
        cleanClientName,
        cleanPhone,
        packageTierId
      ).run();
    }

    // Backup ke KV jika ada
    if (context.env.CONFIG_KV) {
      await context.env.CONFIG_KV.put(
        `ev:${cleanEmail}`,
        JSON.stringify({
          code: activationCode,
          verificationId,
          clientName: cleanClientName,
          phone: cleanPhone,
          expiresAt: Date.now() + 15 * 60 * 1000,
        }),
        { expirationTtl: 900 }
      ).catch(() => {});
    }

    // 8. Kirim Email Aktivasi
    const emailResult = await sendEmail(context.env, {
      to: cleanEmail,
      subject: `Kode Aktivasi Free Tier akugawe: ${activationCode}`,
      html: renderActivationEmailHtml({ clientName: cleanClientName, code: activationCode }),
      text: `Halo ${cleanClientName},\n\nKode aktivasi Free Tier 4 Bulan Anda di akugawe adalah: ${activationCode}\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.`,
    });

    if (!emailResult.success) {
      // Kirim Notifikasi ke Telegram Admin tentang kegagalan pengiriman email
      const failMsg =
        `⚠️ *GAGAL KIRIM EMAIL KODE AKTIVASI*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏢 Usaha: *${cleanClientName}*\n` +
        `✉️ Email: \`${cleanEmail}\`\n` +
        `📱 WhatsApp: ${cleanPhone}\n` +
        `🔑 Kode Disiapkan: \`${activationCode}\`\n` +
        `❌ Alasan: ${emailResult.error || 'Provider email gagal mengirim'}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Admin dapat membantu memberikan kode aktivasi manual jika diperlukan._`;
      await sendTelegramAlert(context.env, failMsg).catch(() => {});

      return jsonResponse(
        {
          ok: false,
          error: emailResult.error || 'Gagal mengirim email kode aktivasi. Silakan periksa kembali email Anda atau hubungi admin.',
        },
        500
      );
    }

    // 9. Kirim Notifikasi ke Telegram Admin (audit log)
    const telegramMsg =
      `📩 *PERMINTAAN KODE AKTIVASI FREE TIER*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏢 Usaha: *${cleanClientName}*\n` +
      `✉️ Email: \`${cleanEmail}\`\n` +
      `📱 WhatsApp: ${cleanPhone}\n` +
      `🔑 Kode Dikirim: \`${activationCode}\`\n` +
      `📨 Provider: \`${emailResult.provider || 'default'}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Calon pelanggan sedang memverifikasi kode aktivasi..._`;

    await sendTelegramAlert(context.env, telegramMsg).catch(() => {});

    return jsonResponse({
      ok: true,
      message: `Kode aktivasi 6-digit berhasil dikirim ke ${cleanEmail}. Periksa folder Inbox atau Spam email Anda.`,
      email: cleanEmail,
      expiresInSeconds: 900,
    });
  } catch (err: any) {
    console.error('Error on send-activation-code:', err);
    return jsonResponse({ ok: false, error: err?.message || 'Gagal memproses kode aktivasi email.' }, 500);
  }
};
