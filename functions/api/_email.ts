/**
 * Email Dispatcher & Helper untuk Cloudflare Pages Functions
 * Mendukung pengiriman melalui Resend API (rekomendasi) & MailChannels (fallback native Cloudflare)
 */

import { Env, getSystemConfig } from './_db';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  provider?: 'resend' | 'mailchannels' | 'simulation';
  error?: string;
  details?: any;
}

/**
 * Memastikan tabel email_verifications tersedia di Cloudflare D1
 */
export async function ensureEmailVerificationsTable(env: Env): Promise<void> {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        client_name TEXT NOT NULL,
        phone TEXT,
        package_tier_id TEXT DEFAULT 'free_trial',
        attempts INTEGER DEFAULT 0,
        expires_at DATETIME NOT NULL,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)`).run().catch(() => {});
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code)`).run().catch(() => {});
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at)`).run().catch(() => {});
  } catch (err) {
    console.warn('Notice: table email_verifications check/create:', err);
  }
}

/**
 * Mengirim email menggunakan Resend API atau MailChannels (Cloudflare)
 */
export async function sendEmail(env: Env, options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text } = options;
  const cleanTo = to.trim().toLowerCase();

  // 1. Coba via Resend API jika API Key tersedia
  const resendApiKey = await getSystemConfig(env, 'RESEND_API_KEY');
  const configuredFrom = await getSystemConfig(env, 'EMAIL_FROM');
  const senderEmail = configuredFrom ? configuredFrom.trim() : 'akugawe <onboarding@resend.dev>';

  if (resendApiKey && resendApiKey.trim().length > 5) {
    try {
      const abortCtrl = new AbortController();
      const timeout = setTimeout(() => abortCtrl.abort(), 8000);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [cleanTo],
          subject,
          html,
          text: text || subject,
        }),
        signal: abortCtrl.signal,
      }).finally(() => clearTimeout(timeout));

      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data?.id) {
        return { success: true, provider: 'resend', details: data };
      }

      console.warn('Resend API returned error:', data);
    } catch (err: any) {
      console.warn('Failed calling Resend API:', err?.message || err);
    }
  }

  // 2. Fallback via MailChannels (Native Cloudflare Workers SMTP Relay)
  try {
    const abortCtrl = new AbortController();
    const timeout = setTimeout(() => abortCtrl.abort(), 8000);

    const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: cleanTo }],
          },
        ],
        from: {
          email: configuredFrom?.includes('@') ? configuredFrom.replace(/.*<([^>]+)>.*/, '$1').trim() : 'noreply@akugawe.id',
          name: 'akugawe',
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
      signal: abortCtrl.signal,
    }).finally(() => clearTimeout(timeout));

    if (mcRes.status === 202 || mcRes.ok) {
      return { success: true, provider: 'mailchannels' };
    }

    const mcErrorText = await mcRes.text().catch(() => '');
    console.warn('MailChannels returned status:', mcRes.status, mcErrorText);
  } catch (mcErr: any) {
    console.warn('Failed calling MailChannels:', mcErr?.message || mcErr);
  }

  // 3. Jika kedua provider tidak tersedia / gagal
  return {
    success: false,
    error: 'Tidak dapat mengirim email aktivasi. Pastikan RESEND_API_KEY telah dikonfigurasi di Admin Portal atau hubungi admin.',
  };
}

/**
 * Render template email kode aktivasi Free Tier dengan gaya Akugawe
 */
export function renderActivationEmailHtml(params: { clientName: string; code: string }): string {
  const { clientName, code } = params;
  const formattedCode = code.split('').join(' ');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Aktivasi Free Tier akugawe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #334155;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #f0dbd8;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(169, 72, 76, 0.08);
    }
    .header {
      background: #a9484c;
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #fbd5d5;
    }
    .content {
      padding: 28px 24px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .code-box {
      background: #faf6f5;
      border: 2px dashed #a9484c;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8f3b3f;
      margin-bottom: 8px;
    }
    .code-digits {
      font-family: 'SF Mono', Consolas, Monaco, monospace;
      font-size: 34px;
      font-weight: 900;
      color: #a9484c;
      letter-spacing: 8px;
      margin: 4px 0;
    }
    .code-expire {
      font-size: 11px;
      color: #64748b;
      margin-top: 8px;
    }
    .note {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
      margin-bottom: 20px;
    }
    .footer {
      background: #faf6f5;
      border-top: 1px solid #f0dbd8;
      padding: 18px 24px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>akugawe</h1>
      <p>Verifikasi Aktivasi Akun Free Tier (4 Bulan)</p>
    </div>
    <div class="content">
      <div class="greeting">Halo ${escapeHtml(clientName)},</div>
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">
        Terima kasih telah memilih <strong>akugawe</strong> untuk mengelola absensi & sistem kerja tim Anda.
        Untuk melindungi akun dan mengaktifkan <strong>Free Tier 4 Bulan (Rp 0)</strong>, gunakan kode verifikasi di bawah ini:
      </p>

      <div class="code-box">
        <div class="code-label">Kode Aktivasi Anda:</div>
        <div class="code-digits">${formattedCode}</div>
        <div class="code-expire">⏱️ Berlaku selama 10 menit</div>
      </div>

      <div class="note">
        <strong>⚠️ Peringatan Keamanan:</strong> Jangan berikan kode ini kepada siapa pun. Tim akugawe tidak akan pernah meminta kode aktivasi Anda.
      </div>

      <p style="font-size: 12px; color: #64748b; margin: 0;">
        Jika Anda tidak merasa meminta pendaftaran ini, silakan abaikan email ini dengan aman.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} akugawe &bull; Aplikasi Absensi GPS & Slip Gaji Mandiri
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Render template email selamat datang setelah Free Tier aktif
 */
export function renderWelcomeFreeTierHtml(params: {
  clientName: string;
  licenseToken: string;
  appUrl: string;
  dashboardUrl?: string;
  freeMonths: number;
}): string {
  const { clientName, licenseToken, appUrl, dashboardUrl, freeMonths } = params;
  const effectiveDashboardUrl = dashboardUrl || appUrl.replace('app.akugawe', 'hrd.akugawe');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Selamat Datang di akugawe Free Tier</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; padding: 24px; color: #334155; }
    .card { max-width: 540px; margin: 0 auto; background: #fff; border-radius: 20px; border: 1px solid #f0dbd8; overflow: hidden; }
    .head { background: #059669; color: #fff; padding: 24px; text-align: center; }
    .body { padding: 24px; font-size: 13px; line-height: 1.6; }
    .box { background: #faf6f5; border: 1px solid #f0dbd8; border-radius: 12px; padding: 14px; margin: 16px 0; }
    .btn { display: inline-block; color: #fff; text-decoration: none; padding: 11px 18px; border-radius: 10px; font-weight: bold; font-size: 12px; margin: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <h2 style="margin: 0; font-size: 20px;">🎉 Akun Free Tier Aktif!</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Masa Aktif: ${freeMonths} Bulan Penuh</p>
    </div>
    <div class="body">
      <p>Halo <b>${escapeHtml(clientName)}</b>,</p>
      <p>Akun Free Tier 4 Bulan Anda berhasil diaktifkan. Anda kini dapat mulai mendaftarkan staf, mengatur radius kantor, dan mencatat absensi.</p>
      
      <div class="box">
        <div style="font-size: 11px; color: #64748b;">TOKEN LISENSI RESMI:</div>
        <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #0f172a;">${licenseToken}</div>
        
        <div style="font-size: 11px; color: #64748b; margin-top: 10px;">📱 APLIKASI PRESENSI KARYAWAN:</div>
        <div style="font-family: monospace; font-size: 13px; color: #059669; word-break: break-all;">${appUrl}</div>
        
        <div style="font-size: 11px; color: #64748b; margin-top: 10px;">💻 DASHBOARD MANAJEMEN & HRD:</div>
        <div style="font-family: monospace; font-size: 13px; color: #0284c7; word-break: break-all;">${effectiveDashboardUrl}</div>
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <a href="${appUrl}" class="btn" style="background: #059669;">Buka Presensi Karyawan &rarr;</a>
        <a href="${effectiveDashboardUrl}" class="btn" style="background: #a9484c;">Buka Dashboard HRD &rarr;</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
