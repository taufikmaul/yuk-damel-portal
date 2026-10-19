import { Env, getSystemConfig, setSystemConfig, handleOptions, jsonResponse } from './_db';

export const onRequestOptions = handleOptions;

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    let body: any = {};
    try {
      body = await context.request.json();
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Request body must be valid JSON' }, 400);
    }

    const expectedPin = body.pin ? String(body.pin).trim() : '2468';
    const botToken = await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return jsonResponse({ ok: false, error: 'Server configuration error: TELEGRAM_BOT_TOKEN belum diset.' }, 500);
    }

    // Ambil update terbaru dari bot Telegram (offset -20)
    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 8000);

    let telegramRes: Response;
    try {
      telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-20&limit=20`, {
        signal: abortCtrl.signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr?.name === 'AbortError') {
        return jsonResponse({ ok: false, error: 'Timeout menghubungi server Telegram.' }, 504);
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!telegramRes.ok) {
      const errData = await telegramRes.json().catch(() => ({}));
      return jsonResponse(
        { ok: false, error: errData.description || 'Gagal membaca pesan dari Telegram.' },
        telegramRes.status || 400
      );
    }

    const data: any = await telegramRes.json();
    if (!data.ok || !Array.isArray(data.result)) {
      return jsonResponse({ ok: false, error: 'Response Telegram tidak valid.' }, 400);
    }

    // Cek pesan terbaru yang cocok dengan PIN
    const updates = [...data.result].reverse();
    for (const update of updates) {
      const msg = update.message;
      if (!msg || !msg.text) continue;

      const text = msg.text.trim();
      const isMatch =
        text === expectedPin ||
        text === `/start ${expectedPin}` ||
        text.includes(expectedPin) ||
        (expectedPin === '2468' && text === '/start');

      if (isMatch && msg.chat && msg.chat.id) {
        const foundChatId = String(msg.chat.id);
        const senderName = msg.from?.first_name || msg.chat.first_name || 'Admin';

        // Simpan Chat ID ke Database Cloudflare D1 / KV
        await setSystemConfig(context.env, 'AUTHORIZED_CHAT_ID', foundChatId, true);

        // Kirim konfirmasi balik ke Telegram
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: foundChatId,
              text: `✅ *Bot Akugawe Terhubung!*\n\nHalo *${senderName}*, Telegram Anda berhasil dikonfigurasi sebagai akun Sales Admin akugawe.\n\nKode OTP login Anda siap dikirimkan.`,
              parse_mode: 'Markdown',
            }),
          });
        } catch (_) {}

        return jsonResponse({
          ok: true,
          chatId: foundChatId,
          senderName,
          message: `Berhasil terhubung ke akun ${senderName} (ID: ${foundChatId})`,
        });
      }
    }

    return jsonResponse({
      ok: false,
      error: 'Belum terdeteksi pesan dengan PIN yang sesuai di bot Telegram.',
    }, 200);
  } catch (err: any) {
    return jsonResponse({ ok: false, error: err?.message || 'Internal Server Error' }, 500);
  }
};
