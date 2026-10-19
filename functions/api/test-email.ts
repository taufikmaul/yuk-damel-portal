/**
 * Endpoint /api/test-email
 * Menguji Pengiriman Email via Resend / MailChannels dari Admin Portal
 */

import { Env, handleOptions, jsonResponse } from './_db';
import { sendEmail } from './_email';
import { checkRateLimit } from './_ratelimit';

export const onRequestOptions = handleOptions;

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const rateCheck = await checkRateLimit(context.env, context.request, 'test_email', 5, 300);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body: any = await context.request.json().catch(() => ({}));
    const { targetEmail, apiKey, emailFrom } = body;

    if (!targetEmail || typeof targetEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail.trim())) {
      return jsonResponse({ ok: false, error: 'Target email tidak valid.' }, 400);
    }

    const cleanEmail = targetEmail.trim().toLowerCase();

    const result = await sendEmail(context.env, {
      to: cleanEmail,
      apiKeyOverride: typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : undefined,
      fromOverride: typeof emailFrom === 'string' && emailFrom.trim() ? emailFrom.trim() : undefined,
      subject: '✅ Uji Coba Pengiriman Email akugawe Berhasil',
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #f0dbd8; border-radius: 16px;">
          <h2 style="color: #a9484c; margin-top: 0;">akugawe Email Service</h2>
          <p>Halo Admin,</p>
          <p>Ini adalah email uji coba untuk memverifikasi bahwa konfigurasi layanan email aktivasi Anda di Cloudflare Edge telah aktif dan bekerja dengan baik.</p>
          <div style="background: #faf6f5; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569;">
            Status: <strong>Aktif & Terhubung</strong><br>
            Waktu Uji: <strong>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</strong>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">akugawe SaaS Platform</p>
        </div>
      `,
      text: 'Halo Admin, ini adalah email uji coba untuk memverifikasi layanan email akugawe aktif.',
    });

    if (!result.success) {
      return jsonResponse({ ok: false, error: result.error || 'Gagal mengirim email uji coba.' }, 500);
    }

    return jsonResponse({
      ok: true,
      message: `Email uji coba berhasil dikirim ke ${cleanEmail} via provider [${result.provider}].`,
      provider: result.provider,
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message || 'Internal server error saat uji email.' }, 500);
  }
};
