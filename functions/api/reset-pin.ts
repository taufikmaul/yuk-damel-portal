/**
 * Endpoint /api/reset-pin
 * Menangani reset Master Admin PIN dan mengirimkan PIN baru ke Telegram yang terdaftar
 * Digunakan ketika penjual/admin lupa PIN lama di halaman Settings.
 */

import { Env, getSystemConfig, setSystemConfig, handleOptions, jsonResponse } from './_db';
import { checkRateLimit } from './_ratelimit';

export const onRequestOptions = handleOptions;

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    // 1. Rate Limiting: Maksimal 3 kali percobaan reset PIN per 15 menit per IP
    const rateCheck = await checkRateLimit(context.env, context.request, 'reset_pin', 3, 900);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    let body: any = {};
    try {
      body = await context.request.json();
    } catch (_) {}

    // 2. Ambil Bot Token & Chat ID dari Database D1 / KV / env dengan fallback ke body
    const botToken = (await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN')) || body?.telegramBotToken;
    const authorizedChatId = (await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID')) || body?.authorizedChatId;

    if (!botToken || !authorizedChatId) {
      return jsonResponse(
        {
          ok: false,
          error: 'Bot Telegram belum terhubung atau Token/Chat ID belum dikonfigurasi. Hubungkan bot Telegram terlebih dahulu.',
        },
        400
      );
    }

    // 3. Generate random 6-digit Master PIN secara kriptografis (CSPRNG)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const newPin = (100000 + (array[0] % 900000)).toString();

    // 4. Hitung SHA-256 hash dari PIN baru
    const newHash = await sha256(newPin);

    // 5. Simpan Hash PIN baru ke Cloudflare Database D1 / KV (isSecret = true)
    await setSystemConfig(context.env, 'ADMIN_PIN_HASH', newHash, true);

    // 6. Format pesan notifikasi reset PIN ke Telegram
    const message = `🔐 *RESET MASTER ADMIN PIN AKUGAWE*\n\nHalo Admin, permintaan reset Master PIN Anda berhasil diproses.\n\nMaster PIN baru Anda:\n\`${newPin}\`\n\n_(Ketuk angka di atas atau tombol di bawah untuk menyalin)_\n\n⚠️ *Perhatian:* PIN lama Anda tidak lagi berlaku. Gunakan Master PIN baru ini untuk login, membuka sesi (Auto-Lock), dan mengonfirmasi simpan konfigurasi di portal seller.`;

    // Pasang AbortController 8 detik agar tidak hang jika server Telegram lambat
    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 8000);

    let telegramRes: Response;
    try {
      telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          chat_id: authorizedChatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `📋 Salin Master PIN: ${newPin}`,
                  copy_text: { text: newPin },
                },
              ],
            ],
          },
        }),
      });
    } catch (fetchErr: any) {
      if (fetchErr?.name === 'AbortError') {
        return jsonResponse({ ok: false, error: 'Timeout menghubungi server Telegram. Silakan coba sesaat lagi.' }, 504);
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    const tgData: any = await telegramRes.json().catch(() => ({}));
    if (!telegramRes.ok || !tgData.ok) {
      const errorMsg = tgData.description || 'Gagal mengirim pesan reset PIN via bot Telegram.';
      return jsonResponse({ ok: false, error: errorMsg, details: tgData }, telegramRes.status || 400);
    }

    return jsonResponse({
      ok: true,
      message: 'Master PIN baru berhasil dibuat dan dikirim ke Telegram Anda.',
      newPinHash: newHash,
    });
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message || 'Internal Server Error' }, 500);
  }
};
