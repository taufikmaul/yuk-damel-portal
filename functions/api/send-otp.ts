import { Env, getSystemConfig } from './_db';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body: any = await context.request.json();
    
    // Ambil Token & Chat ID dari Database D1 / KV (dengan fallback ke Environment Variables)
    const botToken = await getSystemConfig(context.env, 'TELEGRAM_BOT_TOKEN');
    const targetChatId = await getSystemConfig(context.env, 'AUTHORIZED_CHAT_ID');

    if (!botToken || !targetChatId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Server configuration error: TELEGRAM_BOT_TOKEN atau AUTHORIZED_CHAT_ID belum dikonfigurasi di Database / Environment Cloudflare.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const otpCode = body.otp;

    if (!otpCode || !/^\d{4,6}$/.test(otpCode)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid OTP code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = `🔐 *KODE LOGIN SELLER:*\n\`${otpCode}\`\n\n_(Ketuk angka di atas atau klik tombol di bawah untuk salin)_`;

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const data = await telegramRes.json();
    return new Response(JSON.stringify(data), {
      status: telegramRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
