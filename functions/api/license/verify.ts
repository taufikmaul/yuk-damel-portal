/**
 * Endpoint /api/license/verify
 * Heartbeat API Verifikasi Lisensi & Masa Langganan untuk Seluruh Aplikasi Klien (app)
 * GET: Memeriksa validitas lisensi, masa aktif, sisa hari, dan batas kuota karyawan
 * OPTIONS: CORS Preflight
 */

import { Env, corsHeaders, handleOptions, jsonResponse } from '../_db';

export const onRequestOptions = async () => {
  return handleOptions();
};

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  try {
    const url = new URL(context.request.url);
    const tokenParam = url.searchParams.get('token') || context.request.headers.get('X-License-Token');
    const slugParam = url.searchParams.get('slug');

    if (!tokenParam && !slugParam) {
      return jsonResponse({
        valid: false,
        status: 'invalid',
        error: 'Token lisensi atau client slug wajib disertakan.',
      }, 400);
    }

    if (!context.env.DB) {
      // Fallback demo/mock
      return jsonResponse({
        valid: true,
        status: 'active',
        tier: 'starter',
        clientName: 'Demo Client',
        clientSlug: slugParam || 'demo',
        maxEmployees: 15,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 30,
        isGracePeriod: false,
        isExpired: false,
      });
    }

    let query = 'SELECT * FROM orders WHERE ';
    const bindings: any[] = [];

    if (tokenParam) {
      query += 'license_token = ? LIMIT 1';
      bindings.push(tokenParam.trim().toUpperCase());
    } else {
      query += 'client_slug = ? LIMIT 1';
      bindings.push(slugParam?.trim().toLowerCase());
    }

    const order = await context.env.DB.prepare(query).bind(...bindings).first<any>();

    if (!order) {
      return jsonResponse({
        valid: false,
        status: 'not_found',
        message: 'Lisensi tidak ditemukan di sistem resmi akugawe.',
      }, 404);
    }

    const now = new Date();
    const periodEnd = order.current_period_end ? new Date(order.current_period_end) : null;
    
    // Perhitungan sisa hari
    let daysRemaining = 999;
    let isExpired = false;
    let isGracePeriod = false;

    if (periodEnd) {
      const diffMs = periodEnd.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        isExpired = true;
        // Masa tenggang (Grace Period) adalah 3 hari setelah jatuh tempo
        if (daysRemaining >= -3) {
          isGracePeriod = true;
        }
      }
    }

    // Tentukan status efektif
    let effectiveStatus = order.subscription_status || 'active';
    if (order.activation_status === 'pending' && !periodEnd) {
      effectiveStatus = 'pending_activation';
    } else if (order.subscription_status === 'suspended' || (isExpired && !isGracePeriod)) {
      effectiveStatus = 'suspended';
    } else if (isExpired && isGracePeriod) {
      effectiveStatus = 'grace_period';
    } else {
      effectiveStatus = 'active';
    }

    const isFree = order.package_tier_id === 'free_trial' || order.package_tier_id === 'free' || order.amount_paid_rp === 0;
    const isPro = !isFree && Boolean(
      (order.pod_id || '').includes('pro') ||
      (order.pod_id || '').includes('historycake') ||
      order.package_tier_id === 'pro' ||
      order.package_tier_id === 'business_pro' ||
      order.package_tier_id === 'enterprise' ||
      (order.package_tier_id || '').includes('pro') ||
      (order.client_slug || '').includes('historycake') ||
      (order.client_slug || '').includes('ngabsen')
    );
    const tier = isFree ? 'free' : isPro ? 'pro' : 'starter';
    const maxEmployees = order.max_employees || (isFree ? 4 : isPro ? 50 : 15);

    return jsonResponse({
      valid: true,
      orderId: order.id,
      clientName: order.client_name,
      clientSlug: order.client_slug,
      packageTierId: order.package_tier_id || (isFree ? 'free_trial' : 'starter'),
      tier,
      isFree,
      maxEmployees,
      status: effectiveStatus,
      isExpired,
      isGracePeriod,
      daysRemaining,
      currentPeriodStart: order.current_period_start,
      currentPeriodEnd: order.current_period_end,
      billingCycleMonths: order.billing_cycle_months || 1,
      podId: order.pod_id || 'pod-01',
      renewalUrl: `https://portal.akugawe.web.id/?renew=${encodeURIComponent(order.id)}&slug=${encodeURIComponent(order.client_slug)}`,
    });
  } catch (err: any) {
    console.error('Error verifying license:', err);
    return jsonResponse({ valid: false, error: err?.message || 'Server error saat validasi lisensi.' }, 500);
  }
};
