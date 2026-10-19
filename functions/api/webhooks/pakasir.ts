/**
 * Webhook Endpoint /api/webhooks/pakasir
 * Menerima callback status pembayaran dari Pakasir Payment Gateway
 * Mengubah status order menjadi 'paid' & memperpanjang masa aktif subscription
 */

import { Env, getSystemConfig, sendTelegramAlert, jsonResponse, handleOptions } from '../_db';

export const onRequestOptions = async () => {
  return handleOptions();
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const configuredApiKey = await getSystemConfig(context.env, 'PAKASIR_API_KEY');
    if (configuredApiKey) {
      const incomingKey =
        context.request.headers.get('x-api-key') ||
        context.request.headers.get('x-pakasir-key') ||
        context.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

      if (!incomingKey || incomingKey.trim() !== configuredApiKey.trim()) {
        return jsonResponse({ ok: false, error: 'Akses ditolak: Webhook signature / API Key tidak valid' }, 401);
      }
    }

    const body: any = await context.request.json().catch(() => ({}));
    
    // Format payload Pakasir (order_id, status, amount, transaction_id, etc.)
    const rawOrderId = body.order_id || body.orderId || body.reference;
    if (!rawOrderId || typeof rawOrderId !== 'string' || !/^[A-Za-z0-9_-]{4,64}$/.test(rawOrderId.trim())) {
      return jsonResponse({ ok: false, error: 'order_id wajib disertakan dengan format valid' }, 400);
    }
    const orderId = rawOrderId.trim();
    const status = String(body.status || body.payment_status || '').toLowerCase().trim();
    const amount = Number(body.amount || 0);

    const isPaid = status === 'completed' || status === 'paid' || status === 'settlement' || status === 'success';

    if (context.env.DB) {
      // 1. Ambil detail order
      const order = await context.env.DB.prepare(
        'SELECT * FROM orders WHERE id = ? LIMIT 1'
      ).bind(orderId).first<any>();

      if (!order) {
        return jsonResponse({ ok: false, error: 'Order tidak ditemukan' }, 404);
      }

      if (isPaid) {
        const cycleMonths = order.billing_cycle_months || 1;
        const now = new Date();
        const existingEnd = order.current_period_end ? new Date(order.current_period_end) : null;

        // Logika penambahan masa aktif: jika masih aktif, tambahkan dari tanggal expired sebelumnya
        let baseStartDate = (existingEnd && existingEnd > now) ? existingEnd : now;
        const newEndDate = new Date(baseStartDate);
        newEndDate.setMonth(newEndDate.getMonth() + cycleMonths);
        const newEndDateIso = newEndDate.toISOString();

        // 2. Update status order menjadi paid dan aktifkan subscription
        await context.env.DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid',
              activation_status = 'active',
              subscription_status = 'active',
              current_period_start = COALESCE(current_period_start, CURRENT_TIMESTAMP),
              current_period_end = ?,
              last_payment_amount = ?,
              last_payment_date = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(newEndDateIso, amount || order.amount_paid_rp, orderId).run();

        // 3. Catat riwayat invoice baru
        const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
        await context.env.DB.prepare(`
          INSERT INTO invoices (
            id, order_id, client_slug, package_tier_id,
            cycle_months, amount_rp, payment_status, payment_method,
            due_date, paid_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'paid', 'pakasir_qris', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          invoiceId,
          orderId,
          order.client_slug,
          order.package_tier_id || 'starter',
          cycleMonths,
          amount || order.amount_paid_rp,
          newEndDateIso
        ).run().catch((e: any) => console.error('Error creating invoice record:', e));

        // 4. Update count pod jika belum tercatat
        if (order.pod_id) {
          await context.env.DB.prepare(
            'UPDATE cloudflare_pods SET current_companies_count = current_companies_count + 1 WHERE id = ?'
          ).bind(order.pod_id).run().catch(() => {});
        }

        // 5. Kirim notifikasi Telegram ke Admin
        const text =
          `🎉 *PEMBAYARAN DITERIMA VIA PAKASIR!*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 Order ID: \`${orderId}\`\n` +
          `🏢 Klien: *${order.client_name}*\n` +
          `📱 WhatsApp: ${order.buyer_phone || '-'}\n` +
          `💰 Jumlah: *Rp ${(amount || order.amount_paid_rp).toLocaleString('id-ID')}*\n` +
          `📦 Siklus: *${cycleMonths} Bulan*\n` +
          `⏰ Masa Aktif Hingga: *${newEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*\n` +
          `🔑 Token Lisensi: \`${order.license_token}\`\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `_Layanan aplikasi klien otomatis aktif kembali secara real-time._`;

        await sendTelegramAlert(context.env, text);
      }
    }

    return jsonResponse({
      ok: true,
      message: 'Webhook Pakasir berhasil diproses',
      status: isPaid ? 'paid' : status,
    });
  } catch (err: any) {
    console.error('Error handling Pakasir webhook:', err);
    return jsonResponse({ ok: false, error: err?.message }, 500);
  }
};
