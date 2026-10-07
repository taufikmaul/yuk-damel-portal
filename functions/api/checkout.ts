/**
 * Endpoint /api/checkout
 * Membuat Transaksi Pembelian Baru & Menginisialisasi Pembayaran (Pakasir / QRIS Dinamis)
 */

import { Env, getSystemConfig } from './_db';

// Simple unique token generator
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'DAMEL-';
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

// CRC16-CCITT implementation for backend
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
    const body: any = await context.request.json();
    const {
      clientName,
      buyerPhone,
      buyerEmail,
      packageTierId,
      hasManagedSetup = false,
      paymentMethod = 'qris_manual', // 'qris_manual' | 'pakasir'
    } = body;

    if (!clientName || !buyerPhone || !packageTierId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Nama Usaha, No WhatsApp, dan Paket wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ambil konfigurasi publik dari D1
    const rawPublicConfig = await getSystemConfig(context.env, 'PUBLIC_SELLER_CONFIG');
    const publicConfig = rawPublicConfig ? JSON.parse(rawPublicConfig) : null;
    
    // Tentukan harga paket
    const tiers = publicConfig?.pricingTiers || [];
    const matchedTier = tiers.find((t: any) => t.id === packageTierId);
    
    let basePrice = 2999000;
    let packageName = 'Business Pro';
    if (matchedTier) {
      basePrice = publicConfig?.isPromoActive ? matchedTier.promoPriceRp : matchedTier.normalPriceRp;
      packageName = matchedTier.name;
    }

    const managedFee = hasManagedSetup ? (publicConfig?.managedSetupPriceRp || 350000) : 0;
    
    // Kode unik 3 digit untuk QRIS manual agar mudah dicek di mutasi bank/e-wallet
    const uniqueCode = paymentMethod === 'qris_manual' ? Math.floor(100 + Math.random() * 899) : 0;
    const finalAmount = basePrice + managedFee + uniqueCode;

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const clientSlug = slugify(clientName);
    const licenseToken = generateToken();

    // Simpan ke D1
    if (context.env.DB) {
      await context.env.DB.prepare(`
        INSERT INTO orders (
          id, client_name, client_slug, package_tier_id, 
          amount_paid_rp, payment_status, license_token, 
          activation_status, buyer_phone, created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, 'pending', ?, CURRENT_TIMESTAMP)
      `).bind(orderId, clientName.trim(), clientSlug, packageTierId, finalAmount, licenseToken, buyerPhone.trim()).run();
    }

    let dynamicQrisString = '';
    let qrCodeImageUrl = '';
    let pakasirCheckoutUrl = '';

    // PROSES PAKASIR (API v2 Resmi)
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
          // URL halaman bayar langsung Pakasir
          pakasirCheckoutUrl = `https://app.pakasir.com/pay/${encodeURIComponent(pakasirProjectSlug)}/${encodeURIComponent(orderId)}`;
        } catch (e) {
          console.error('Gagal memanggil API Pakasir v2:', e);
        }
      }
    }

    // PROSES QRIS MANUAL DINAMIS
    if (paymentMethod === 'qris_manual' || !dynamicQrisString) {
      const staticQris = (await getSystemConfig(context.env, 'STATIC_QRIS_STRING')) || publicConfig?.staticQrisString;
      if (staticQris && staticQris.trim().length > 20) {
        dynamicQrisString = makeDynamicQris(staticQris.trim(), finalAmount);
        qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(dynamicQrisString)}`;
      }
    }

    // KIRIM TELEGRAM ALERT KE SELLER
    const botToken = await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN');
    const chatId = await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID');
    if (botToken && chatId) {
      try {
        const text = `🛒 *PESANAN BARU MASUK (#${orderId})*\n\n` +
          `🏢 Usaha: *${clientName}*\n` +
          `📱 WhatsApp: ${buyerPhone}\n` +
          `📦 Paket: *${packageName}*\n` +
          `🛠️ Terima Beres: *${hasManagedSetup ? 'YA (VIP Setup)' : 'Tidak (Mandiri)'}*\n` +
          `💰 Total Tagihan: *Rp ${finalAmount.toLocaleString('id-ID')}*\n` +
          `💳 Metode: *${paymentMethod.toUpperCase()}*\n` +
          `🔑 Token Dialokasikan: \`${licenseToken}\`\n\n` +
          `Menunggu konfirmasi pembayaran pembeli...`;
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
        });
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({
        ok: true,
        order: {
          id: orderId,
          clientName,
          buyerPhone,
          packageTierId,
          packageName,
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
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
