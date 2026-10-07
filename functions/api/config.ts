/**
 * Endpoint /api/config
 * Mengelola konfigurasi operasional dan kredensial sensitif di Cloudflare Database
 * GET: Mengambil konfigurasi publik (marketing, pricing, demo url)
 * POST: Menyimpan konfigurasi & kredensial ke database (Dilindungi verifikasi Master PIN)
 */

import { Env, getSystemConfig, setSystemConfig } from './_db';

const DEFAULT_ADMIN_PIN_HASH = 'a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972';

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/config: Mengembalikan konfigurasi publik (branding, WA, pricing) TANPA token rahasia
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  try {
    const rawPublicConfig = await getSystemConfig(context.env, 'PUBLIC_SELLER_CONFIG');
    const parsedPublicConfig = rawPublicConfig ? JSON.parse(rawPublicConfig) : null;

    // Cek apakah kredensial sensitif sudah terkonfigurasi di server (hanya return boolean status)
    const hasTelegram = !!(await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN'));
    const hasGitHub = !!(await getSystemConfig(context.env, 'GITHUB_DISPATCH_PAT'));
    const hasPakasir = !!(await getSystemConfig(context.env, 'PAKASIR_API_KEY'));
    const hasStaticQris = !!(await getSystemConfig(context.env, 'STATIC_QRIS_STRING'));
    const authorizedChatId = await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID');

    return new Response(
      JSON.stringify({
        ok: true,
        config: parsedPublicConfig,
        credentialsStatus: {
          isTelegramConfigured: hasTelegram,
          isGitHubConfigured: hasGitHub,
          isPakasirConfigured: hasPakasir,
          hasStaticQris: hasStaticQris,
          authorizedChatId: authorizedChatId || '',
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/config: Menyimpan konfigurasi & rahasia ke Database (Wajib verifikasi Master PIN)
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body: any = await context.request.json();
    const { masterPin, publicConfig, sensitiveSecrets } = body;

    if (!masterPin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Akses ditolak: Master PIN wajib disertakan untuk menyimpan konfigurasi.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifikasi Master PIN terhadap Hash tersimpan di database
    const storedPinHash = (await getSystemConfig(context.env, 'ADMIN_PIN_HASH')) || DEFAULT_ADMIN_PIN_HASH;
    const inputHash = await sha256(String(masterPin).trim());

    if (inputHash !== storedPinHash) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Master PIN tidak valid.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Simpan Public Config ke Database
    if (publicConfig && typeof publicConfig === 'object') {
      await setSystemConfig(context.env, 'PUBLIC_SELLER_CONFIG', JSON.stringify(publicConfig), false);
    }

    // 2. Simpan Kredensial Sensitif ke Database secara terisolasi (is_secret = 1)
    if (sensitiveSecrets && typeof sensitiveSecrets === 'object') {
      if (sensitiveSecrets.telegramBotToken && sensitiveSecrets.telegramBotToken.trim()) {
        await setSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN', sensitiveSecrets.telegramBotToken.trim(), true);
      }
      if (sensitiveSecrets.authorizedChatId && sensitiveSecrets.authorizedChatId.trim()) {
        await setSystemConfig(context.env, 'AUTHORIZED_CHAT_ID', sensitiveSecrets.authorizedChatId.trim(), true);
      }
      if (sensitiveSecrets.githubPatToken && sensitiveSecrets.githubPatToken.trim()) {
        await setSystemConfig(context.env, 'GITHUB_DISPATCH_PAT', sensitiveSecrets.githubPatToken.trim(), true);
      }
      if (sensitiveSecrets.pakasirApiKey && sensitiveSecrets.pakasirApiKey.trim()) {
        await setSystemConfig(context.env, 'PAKASIR_API_KEY', sensitiveSecrets.pakasirApiKey.trim(), true);
      }
      if (sensitiveSecrets.staticQrisString && sensitiveSecrets.staticQrisString.trim()) {
        await setSystemConfig(context.env, 'STATIC_QRIS_STRING', sensitiveSecrets.staticQrisString.trim(), false);
      }
      if (sensitiveSecrets.newAdminPin && sensitiveSecrets.newAdminPin.trim()) {
        const newHash = await sha256(sensitiveSecrets.newAdminPin.trim());
        await setSystemConfig(context.env, 'ADMIN_PIN_HASH', newHash, true);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Konfigurasi & kredensial berhasil diamankan dan disimpan ke Cloudflare Database!',
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
