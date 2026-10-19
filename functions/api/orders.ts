/**
 * Endpoint /api/orders
 * Mengelola Data Pesanan & Lisensi Pembeli di Database Cloudflare D1
 * GET: Mengambil daftar pesanan (Admin) atau verifikasi token lisensi tunggal (Pembeli saat Onboarding)
 * POST: Membuat lisensi pesanan baru, perpanjang manual, toggle suspend, atau update status deploy
 * OPTIONS: CORS Preflight
 */

import { Env, corsHeaders, handleOptions, jsonResponse, getActivePod } from './_db';

export const onRequestOptions = async () => {
  return handleOptions();
};

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token');

    // SKENARIO 1: PEMBELI MEMVERIFIKASI TOKEN LISENSI SAAT ONBOARDING
    if (token) {
      const cleanToken = token.trim().toUpperCase();

      if (context.env.DB) {
        const order = await context.env.DB.prepare(
          'SELECT * FROM orders WHERE license_token = ? LIMIT 1'
        ).bind(cleanToken).first<any>();

        if (order) {
          return jsonResponse({
            valid: true,
            client: {
              id: order.id,
              name: order.client_name,
              token: order.license_token,
              slug: order.client_slug,
              status: order.activation_status,
              subscriptionStatus: order.subscription_status || 'active',
              maxEmployees: order.max_employees || 15,
              currentPeriodEnd: order.current_period_end,
              billingCycleMonths: order.billing_cycle_months || 1,
              customDomainDashboard: order.custom_domain_dashboard,
              customDomainApp: order.custom_domain_app,
              deployedUrl: order.deployed_urls,
              podId: order.pod_id || 'pod-01',
            },
            isAlreadyDeployed: order.activation_status === 'active',
            message: order.activation_status === 'active'
              ? `Lisensi untuk "${order.client_name}" sudah aktif.`
              : `Token lisensi resmi terverifikasi untuk "${order.client_name}".`,
          });
        }
      }

      return jsonResponse({
        valid: false,
        reason: 'NOT_FOUND',
        message: `Token "${cleanToken}" tidak terdaftar di database lisensi resmi.`,
      }, 404);
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
        subscriptionStatus: row.subscription_status || 'active',
        maxEmployees: row.max_employees || 15,
        billingCycleMonths: row.billing_cycle_months || 1,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        packageTierId: row.package_tier_id,
        amountPaidRp: row.amount_paid_rp,
        paymentStatus: row.payment_status,
        buyerPhone: row.buyer_phone,
        buyerEmail: row.buyer_email,
        podId: row.pod_id || 'pod-01',
        customDomainDashboard: row.custom_domain_dashboard,
        customDomainApp: row.custom_domain_app,
        deployedUrl: row.deployed_urls,
      }));

      return jsonResponse({ ok: true, orders: formatted });
    }

    return jsonResponse({ ok: true, orders: [] });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message }, 500);
  }
};

// POST: Membuat Pesanan/Lisensi Baru, Perpanjang Manual, atau Toggle Suspend
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { action } = body;

    // AKSI 1: Admin memperpanjang masa aktif langganan manual (+N bulan)
    if (action === 'extend_subscription') {
      const { orderId, monthsToAdd = 1 } = body;
      if (!orderId) {
        return jsonResponse({ ok: false, error: 'orderId wajib diisi.' }, 400);
      }

      if (context.env.DB) {
        const order = await context.env.DB.prepare(
          'SELECT current_period_end FROM orders WHERE id = ? LIMIT 1'
        ).bind(orderId).first<any>();

        if (!order) {
          return jsonResponse({ ok: false, error: 'Order tidak ditemukan.' }, 404);
        }

        const now = new Date();
        const existingEnd = order.current_period_end ? new Date(order.current_period_end) : null;
        let baseDate = (existingEnd && existingEnd > now) ? existingEnd : now;
        const newEnd = new Date(baseDate);
        newEnd.setMonth(newEnd.getMonth() + Number(monthsToAdd));

        await context.env.DB.prepare(`
          UPDATE orders 
          SET current_period_end = ?, 
              subscription_status = 'active', 
              payment_status = 'paid' 
          WHERE id = ?
        `).bind(newEnd.toISOString(), orderId).run();

        return jsonResponse({
          ok: true,
          message: `Masa aktif berhasil diperpanjang +${monthsToAdd} bulan!`,
          newPeriodEnd: newEnd.toISOString(),
        });
      }
    }

    // AKSI 2: Admin mengubah status suspend / active
    if (action === 'toggle_suspend') {
      const { orderId, newStatus } = body; // 'active' | 'suspended'
      if (!orderId || !newStatus) {
        return jsonResponse({ ok: false, error: 'orderId dan newStatus wajib diisi.' }, 400);
      }

      if (context.env.DB) {
        await context.env.DB.prepare(
          'UPDATE orders SET subscription_status = ? WHERE id = ?'
        ).bind(newStatus, orderId).run();

        return jsonResponse({
          ok: true,
          message: `Status langganan diubah menjadi: ${newStatus.toUpperCase()}`,
        });
      }
    }

    // AKSI 3: Pembeli menyelesaikan deployment -> update status ke 'active'
    if (action === 'mark_deployed') {
      const { token, deployedUrl, customDomainDashboard, customDomainApp } = body;
      if (!token) {
        return jsonResponse({ ok: false, error: 'Token wajib diisi' }, 400);
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

      return jsonResponse({ ok: true, message: 'Status aktivasi berhasil diperbarui di database.' });
    }

    // AKSI 4: Admin membuat pesanan / lisensi baru manual
    const {
      id,
      clientName,
      clientSlug,
      packageTierId,
      amountPaidRp,
      licenseToken,
      buyerPhone,
      maxEmployees = 15,
      billingCycleMonths = 1,
    } = body;

    if (!clientName || !licenseToken) {
      return jsonResponse({ ok: false, error: 'clientName dan licenseToken wajib disertakan.' }, 400);
    }

    const orderId = id || `ord_${Date.now()}`;
    const cleanSlug = (clientSlug || clientName).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const appUrl = `https://app.akugawe.web.id/${cleanSlug}`;
    const dashboardUrl = `https://hrd.akugawe.web.id/${cleanSlug}`;

    // Alokasi Pod sesuai aturan baku
    const tier = packageTierId || 'starter';
    const activePod = await getActivePod(context.env, tier);
    const podId = activePod?.id || 'pod-01';
    const isSharedPod = (tier === 'pro' || tier === 'enterprise') ? 0 : 1;

    if (context.env.DB) {
      await context.env.DB.prepare(`
        INSERT INTO orders (
          id, client_name, client_slug, package_tier_id, 
          amount_paid_rp, payment_status, license_token, 
          activation_status, buyer_phone, max_employees, 
          billing_cycle_months, subscription_status,
          current_period_start, current_period_end, deployed_urls,
          pod_id, is_shared_pod, created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, 'paid', ?,
          'active', ?, ?,
          ?, 'active',
          CURRENT_TIMESTAMP, datetime('now', '+' || ? || ' months'), ?,
          ?, ?, CURRENT_TIMESTAMP
        )
        ON CONFLICT(license_token) DO UPDATE SET 
          client_name = excluded.client_name,
          client_slug = excluded.client_slug,
          package_tier_id = excluded.package_tier_id,
          amount_paid_rp = excluded.amount_paid_rp,
          max_employees = excluded.max_employees,
          billing_cycle_months = excluded.billing_cycle_months,
          current_period_end = excluded.current_period_end,
          deployed_urls = excluded.deployed_urls,
          pod_id = excluded.pod_id,
          is_shared_pod = excluded.is_shared_pod
      `).bind(
        orderId,
        clientName,
        cleanSlug,
        tier,
        amountPaidRp !== undefined ? Number(amountPaidRp) : (tier === 'free_trial' ? 0 : 15000),
        licenseToken.trim().toUpperCase(),
        buyerPhone || null,
        maxEmployees,
        Number(billingCycleMonths),
        String(billingCycleMonths),
        JSON.stringify({ app: appUrl, dashboard: dashboardUrl }),
        podId,
        isSharedPod
      ).run();

      // Update tenant count jika shared pod
      if (isSharedPod) {
        await context.env.DB.prepare(
          'UPDATE cloudflare_pods SET current_companies_count = current_companies_count + 1 WHERE id = ?'
        ).bind(podId).run().catch(() => {});
      }
    }

    return jsonResponse({
      ok: true,
      message: 'Pesanan & lisensi berhasil disimpan di Database Cloudflare!',
      order: {
        id: orderId,
        name: clientName,
        slug: cleanSlug,
        token: licenseToken.trim().toUpperCase(),
        packageTierId: tier,
        podId,
        isSharedPod: Boolean(isSharedPod),
        appUrl,
        dashboardUrl,
        status: 'active',
      },
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message }, 500);
  }
};
