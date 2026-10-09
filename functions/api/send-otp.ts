import { Env, getSystemConfig, handleOptions, jsonResponse } from './_db';

export const onRequestOptions = handleOptions;

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    let body: any = {};
    try {
      body = await context.request.json();
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Request body must be valid JSON' }, 400);
    }
    
    // Ambil Token & Chat ID dari Database D1 / KV (dengan fallback ke Environment Variables)
    const botToken = await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN');
    const targetChatId = await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID');

    if (!botToken || !targetChatId) {
      return jsonResponse(
        {
          ok: false,
          error: 'Server configuration error: TELEGRAM_BOT_TOKEN atau AUTHORIZED_CHAT_ID belum dikonfigurasi di Database / Environment Cloudflare.',
        },
        500
      );
    }

    const otpCode = body.otp;

    if (!otpCode || !/^\d{4,6}$/.test(otpCode)) {
      return jsonResponse({ ok: false, error: 'Invalid OTP code' }, 400);
    }

    const message = `🔐 *KODE LOGIN SELLER:*\n\`${otpCode}\`\n\n_(Ketuk angka di atas atau klik tombol di bawah untuk salin)_`;

    // Pasang AbortController dengan batas waktu 8 detik agar Worker tidak hang
    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 8000);

    let telegramRes: Response;
    try {
      telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `📋 Salin Kode ${otpCode}`,
                  copy_text: { text: otpCode },
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

    const data: any = await telegramRes.json().catch(() => ({}));
    if (!telegramRes.ok || !data.ok) {
      let errorMsg = data.description || 'Gagal mengirim pesan via Telegram';
      if (typeof data.description === 'string' && data.description.includes('chat not found')) {
        errorMsg = `Chat Telegram belum terhubung. Buka bot @AkugawePortalBot (https://t.me/AkugawePortalBot) di Telegram, lalu klik 'Start' dan ulangi lagi.`;
      }
      return jsonResponse({ ok: false, error: errorMsg, details: data }, telegramRes.status || 400);
    }

    return jsonResponse(data, telegramRes.status);
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message || 'Internal Server Error' }, 500);
  }
};
