/**
 * Endpoint /api/config
 * Mengelola konfigurasi operasional dan kredensial sensitif di Cloudflare Database
 * GET: Mengambil konfigurasi publik (marketing, pricing, demo url)
 * POST: Menyimpan konfigurasi & kredensial ke database (Dilindungi verifikasi Master PIN)
 */

import { Env, getSystemConfig, setSystemConfig, handleOptions, jsonResponse } from './_db';
import { checkRateLimit } from './_ratelimit';

export const onRequestOptions = handleOptions;

const DEFAULT_ADMIN_PIN_HASH = 'a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972';

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/config: Mengembalikan konfigurasi dari Cloudflare D1 Database
// Jika menyertakan X-Admin-Pin atau query ?adminPin= yang valid, mengembalikan config lengkap beserta kredensial
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  try {
    const rawPublicConfig = await getSystemConfig(context.env, 'PUBLIC_SELLER_CONFIG');
    const parsedPublicConfig = rawPublicConfig ? JSON.parse(rawPublicConfig) : null;

    // Cek otentikasi admin via header X-Admin-Pin atau query parameter
    const adminPinHeader = context.request.headers.get('x-admin-pin');
    const authHeader = context.request.headers.get('authorization');
    const url = new URL(context.request.url);
    const queryPin = url.searchParams.get('adminPin');
    const pinToVerify = adminPinHeader || queryPin || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    let isAdmin = false;
    const storedPinHash = (await getSystemConfig(context.env, 'ADMIN_PIN_HASH')) || DEFAULT_ADMIN_PIN_HASH;

    if (pinToVerify && pinToVerify.trim().length >= 4) {
      const inputHash = await sha256(pinToVerify.trim());
      const isCustomPin = storedPinHash && storedPinHash !== DEFAULT_ADMIN_PIN_HASH;
      if (inputHash === storedPinHash || (!isCustomPin && pinToVerify.trim() === '2468')) {
        isAdmin = true;
      }
    }

    // Ambil seluruh kredensial langsung dari Database D1
    const telegramBotToken = await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN');
    const authorizedChatId = await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID');
    const telegramBotUsername = await getSystemConfig(context.env, 'TELEGRAM_BOT_USERNAME');
    const githubPat = await getSystemConfig(context.env, 'GITHUB_DISPATCH_PAT');
    const pakasirApiKey = await getSystemConfig(context.env, 'PAKASIR_API_KEY');
    const resendApiKey = await getSystemConfig(context.env, 'RESEND_API_KEY');
    const emailFrom = (await getSystemConfig(context.env, 'EMAIL_FROM')) || '';
    const staticQris = await getSystemConfig(context.env, 'STATIC_QRIS_STRING');

    // Jika admin terverifikasi, sertakan data kredensial lengkap dari DB
    const adminSecrets = isAdmin ? {
      telegramBotToken: telegramBotToken || '',
      authorizedChatId: authorizedChatId || '',
      telegramBotUsername: telegramBotUsername || 'AkugawePortalBot',
      githubPatToken: githubPat || '',
      pakasirApiKey: pakasirApiKey || '',
      resendApiKey: resendApiKey || '',
      emailFrom: emailFrom || '',
      staticQrisString: staticQris || (parsedPublicConfig?.staticQrisString || ''),
    } : {};

    return jsonResponse({
      ok: true,
      isAdmin,
      config: {
        ...(parsedPublicConfig || {}),
        ...adminSecrets,
      },
      credentialsStatus: {
        isTelegramConfigured: !!(telegramBotToken && telegramBotToken.trim().length > 5),
        isGitHubConfigured: !!(githubPat && githubPat.trim().length > 5),
        isPakasirConfigured: !!(pakasirApiKey && pakasirApiKey.trim().length > 3),
        hasStaticQris: !!(staticQris && staticQris.trim().length > 10) || !!parsedPublicConfig?.staticQrisString,
        isResendConfigured: !!(resendApiKey && resendApiKey.trim().length > 5),
        emailFrom: emailFrom || (parsedPublicConfig?.emailFrom || 'akugawe <onboarding@resend.dev>'),
        authorizedChatId: authorizedChatId || '',
        telegramBotUsername: telegramBotUsername || 'AkugawePortalBot',
      },
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message }, 500);
  }
};

// POST /api/config: Menyimpan seluruh konfigurasi & kredensial ke Database Cloudflare D1
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    // Rate Limiting: Maksimal 15 percobaan simpan konfigurasi per 15 menit
    const rateCheck = await checkRateLimit(context.env, context.request, 'admin_config', 15, 900);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }
    const body: any = await context.request.json().catch(() => ({}));
    const { masterPin, publicConfig, sensitiveSecrets } = body;

    if (!masterPin) {
      return jsonResponse({ ok: false, error: 'Akses ditolak: Master PIN wajib disertakan untuk menyimpan konfigurasi ke Database.' }, 401);
    }

    // Verifikasi Master PIN terhadap Hash tersimpan di database
    const storedPinHash = (await getSystemConfig(context.env, 'ADMIN_PIN_HASH')) || DEFAULT_ADMIN_PIN_HASH;
    const inputHash = await sha256(String(masterPin).trim());
    const isCustomPin = storedPinHash && storedPinHash !== DEFAULT_ADMIN_PIN_HASH;

    if (inputHash !== storedPinHash && (isCustomPin || String(masterPin).trim() !== '2468')) {
      return jsonResponse({ ok: false, error: 'Master PIN tidak valid.' }, 403);
    }

    // 1. Simpan Public Config ke Cloudflare Database D1 (Key-Value)
    if (publicConfig && typeof publicConfig === 'object') {
      await setSystemConfig(context.env, 'PUBLIC_SELLER_CONFIG', JSON.stringify(publicConfig), false);
    }

    // 2. Simpan Seluruh Kredensial Sensitif ke Database D1 secara terisolasi (is_secret = 1)
    if (sensitiveSecrets && typeof sensitiveSecrets === 'object') {
      if (typeof sensitiveSecrets.telegramBotToken === 'string') {
        await setSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN', sensitiveSecrets.telegramBotToken.trim(), true);
      }
      if (typeof sensitiveSecrets.authorizedChatId === 'string') {
        await setSystemConfig(context.env, 'AUTHORIZED_CHAT_ID', sensitiveSecrets.authorizedChatId.trim(), true);
      }
      if (typeof sensitiveSecrets.telegramBotUsername === 'string') {
        const cleanBotUsername = sensitiveSecrets.telegramBotUsername.trim().replace(/^@/, '');
        await setSystemConfig(context.env, 'TELEGRAM_BOT_USERNAME', cleanBotUsername, false);
      }
      if (typeof sensitiveSecrets.githubPatToken === 'string') {
        await setSystemConfig(context.env, 'GITHUB_DISPATCH_PAT', sensitiveSecrets.githubPatToken.trim(), true);
      }
      if (typeof sensitiveSecrets.pakasirApiKey === 'string') {
        await setSystemConfig(context.env, 'PAKASIR_API_KEY', sensitiveSecrets.pakasirApiKey.trim(), true);
      }
      if (typeof sensitiveSecrets.resendApiKey === 'string') {
        await setSystemConfig(context.env, 'RESEND_API_KEY', sensitiveSecrets.resendApiKey.trim(), true);
      }
      if (typeof sensitiveSecrets.emailFrom === 'string') {
        await setSystemConfig(context.env, 'EMAIL_FROM', sensitiveSecrets.emailFrom.trim(), false);
      }
      if (typeof sensitiveSecrets.staticQrisString === 'string') {
        await setSystemConfig(context.env, 'STATIC_QRIS_STRING', sensitiveSecrets.staticQrisString.trim(), false);
      }
      if (typeof sensitiveSecrets.newAdminPin === 'string' && sensitiveSecrets.newAdminPin.trim().length >= 4) {
        const newHash = await sha256(sensitiveSecrets.newAdminPin.trim());
        await setSystemConfig(context.env, 'ADMIN_PIN_HASH', newHash, true);
      }
    }

    return jsonResponse({
      ok: true,
      message: 'Semua konfigurasi & kredensial berhasil disimpan ke Database Cloudflare D1!',
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message }, 500);
  }
};
