/**
 * Endpoint /api/orders
 * Mengelola Data Pesanan & Lisensi Pembeli di Database Cloudflare D1
 * GET: Mengambil daftar pesanan (Admin) atau verifikasi token lisensi tunggal (Pembeli saat Onboarding)
 * POST: Membuat lisensi pesanan baru (Admin) atau menandai status aktif setelah 1-Click Deploy
 */

import { Env } from './_db';

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token');

    // SKENARIO 1: PEMBELI MEMVERIFIKASI TOKEN LISENSI SAAT ONBOARDING
    if (token) {
      const cleanToken = token.trim().toUpperCase();

      if (context.env.DB) {
        const order = await context.env.DB.prepare(
          'SELECT id, client_name, client_slug, package_tier_id, license_token, activation_status, custom_domain_dashboard, custom_domain_app, deployed_urls FROM orders WHERE license_token = ? LIMIT 1'
        ).bind(cleanToken).first<any>();

        if (order) {
          return new Response(
            JSON.stringify({
              valid: true,
              client: {
                id: order.id,
                name: order.client_name,
                token: order.license_token,
                slug: order.client_slug,
                status: order.activation_status,
                customDomainDashboard: order.custom_domain_dashboard,
                customDomainApp: order.custom_domain_app,
                deployedUrl: order.deployed_urls,
              },
              isAlreadyDeployed: order.activation_status === 'active',
              message: order.activation_status === 'active'
                ? `Lisensi untuk "${order.client_name}" sudah aktif.`
                : `Token lisensi resmi terverifikasi untuk "${order.client_name}".`,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Jika D1 belum ada atau token tidak ditemukan
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'NOT_FOUND',
          message: `Token "${cleanToken}" tidak terdaftar di database lisensi resmi.`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SKENARIO 2: ADMIN MENGAMBIL SELURUH DAFTAR PESANAN / LISENSI
    if (context.env.DB) {
      const { results } = await context.env.DB.prepare(
        'SELECT * FROM orders ORDER BY created_at DESC'
      ).all();

      const formatted = (results || []).map((row: any) => ({
        id: row.id,
        name: row.client_name,
        slug: row.client_slug,
        token: row.license_token,
        createdAt: row.created_at,
        status: row.activation_status,
        packageTierId: row.package_tier_id,
        amountPaidRp: row.amount_paid_rp,
        paymentStatus: row.payment_status,
        customDomainDashboard: row.custom_domain_dashboard,
        customDomainApp: row.custom_domain_app,
        deployedUrl: row.deployed_urls,
      }));

      return new Response(JSON.stringify({ ok: true, orders: formatted }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    return new Response(JSON.stringify({ ok: true, orders: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Membuat Pesanan/Lisensi Baru ATAU Update Status Deploy
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body: any = await context.request.json();
    const { action } = body;

    // AKSI 1: Pembeli menyelesaikan deployment -> update status di database ke 'active'
    if (action === 'mark_deployed') {
      const { token, deployedUrl, customDomainDashboard, customDomainApp } = body;
      if (!token) {
        return new Response(JSON.stringify({ ok: false, error: 'Token wajib diisi' }), { status: 400 });
      }

      if (context.env.DB) {
        await context.env.DB.prepare(`
          UPDATE orders 
          SET activation_status = 'active', 
              deployed_urls = ?, 
              custom_domain_dashboard = COALESCE(?, custom_domain_dashboard),
              custom_domain_app = COALESCE(?, custom_domain_app),
              deployed_at = CURRENT_TIMESTAMP
          WHERE license_token = ?
        `).bind(deployedUrl || '', customDomainDashboard || null, customDomainApp || null, token.trim().toUpperCase()).run();
      }

      return new Response(JSON.stringify({ ok: true, message: 'Status aktivasi berhasil diperbarui di database.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // AKSI 2: Admin membuat pesanan / lisensi baru
    const {
      id,
      clientName,
      clientSlug,
      packageTierId,
      amountPaidRp,
      licenseToken,
      buyerPhone,
    } = body;

    if (!clientName || !licenseToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'clientName dan licenseToken wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orderId = id || `ord_${Date.now()}`;
    const cleanSlug = (clientSlug || clientName).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    if (context.env.DB) {
      await context.env.DB.prepare(`
        INSERT INTO orders (id, client_name, client_slug, package_tier_id, amount_paid_rp, payment_status, license_token, activation_status, buyer_phone, created_at)
        VALUES (?, ?, ?, ?, ?, 'paid', ?, 'pending', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(license_token) DO UPDATE SET 
          client_name = excluded.client_name,
          client_slug = excluded.client_slug
      `).bind(
        orderId,
        clientName,
        cleanSlug,
        packageTierId || 'business',
        amountPaidRp || 2999000,
        licenseToken.trim().toUpperCase(),
        buyerPhone || null
      ).run();
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Pesanan & lisensi berhasil disimpan di Database Cloudflare!',
        order: {
          id: orderId,
          name: clientName,
          token: licenseToken.trim().toUpperCase(),
          status: 'pending',
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
