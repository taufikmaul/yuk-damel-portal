/**
 * Webhook Endpoint /api/webhooks/pakasir
 * Menerima callback status pembayaran dari Pakasir Payment Gateway
 * Mengubah status order menjadi 'paid' & mengirimkan notifikasi Telegram ke Seller
 */

import { Env, getSystemConfig } from '../_db';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body: any = await context.request.json();
    
    // Format payload Pakasir (order_id, status, amount, transaction_id, etc.)
    const orderId = body.order_id || body.orderId || body.reference;
    const status = (body.status || body.payment_status || '').toLowerCase();
    const amount = Number(body.amount || 0);

    if (!orderId) {
      return new Response(JSON.stringify({ ok: false, error: 'order_id wajib disertakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isPaid = status === 'completed' || status === 'paid' || status === 'settlement' || status === 'success';

    if (context.env.DB) {
      // 1. Ambil detail order
      const order = await context.env.DB.prepare(
        'SELECT id, client_name, buyer_phone, package_tier_id, amount_paid_rp, license_token, payment_status FROM orders WHERE id = ? LIMIT 1'
      ).bind(orderId).first<any>();

      if (!order) {
        return new Response(JSON.stringify({ ok: false, error: 'Order tidak ditemukan' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (isPaid) {
        // 2. Update status order menjadi paid
        await context.env.DB.prepare(
          "UPDATE orders SET payment_status = 'paid' WHERE id = ?"
        ).bind(orderId).run();

        // 3. Kirim notifikasi Telegram ke Seller
        const botToken = await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN');
        const chatId = await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID');

        if (botToken && chatId) {
          try {
            const text = `🎉 *PEMBAYARAN DITERIMA VIA PAKASIR!*\n\n` +
              `🆔 Order ID: \`${orderId}\`\n` +
              `🏢 Klien: *${order.client_name}*\n` +
              `📱 WhatsApp: ${order.buyer_phone || '-'}\n` +
              `💰 Jumlah: *Rp ${(amount || order.amount_paid_rp).toLocaleString('id-ID')}*\n` +
              `🔑 Token Lisensi: \`${order.license_token}\`\n\n` +
              `Pembeli kini dapat langsung melakukan 1-Click Onboarding ke Cloudflare mereka.`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
            });
          } catch (_) {}
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, message: 'Webhook Pakasir berhasil diproses', status: isPaid ? 'paid' : status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
