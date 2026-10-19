/**
 * Service Telegram Bot untuk Portal Penjual akugawe
 * Mendukung pengiriman melalui Edge Function (/api/send-otp)
 * dengan fallback langsung ke Telegram API untuk ketahanan lokal & produksi.
 */

export const BOT_USERNAME = 'AkugawePortalBot';
export const DEFAULT_TELEGRAM_BOT_TOKEN = '';
export const AUTHORIZED_SELLER_CHAT_ID = '';

import { generateSecureOtp } from './security';

export interface OtpSession {
  code: string;
  expiresAt: number;
  chatId: string;
}

// Generate 6-digit cryptographic random OTP (CSPRNG via Web Crypto)
export function generateOtp(): string {
  return generateSecureOtp();
}

let lastTelegramError: string | null = null;

export function getLastTelegramError(): string | null {
  return lastTelegramError;
}

export function setLastTelegramError(err: string | null) {
  lastTelegramError = err;
}

/**
 * Kirim pesan OTP secara aman ke Telegram Chat ID pemilik.
 * Mencoba via Edge Serverless (/api/send-otp) terlebih dahulu,
 * dengan auto-fallback langsung ke Telegram API jika serverless proxy offline.
 */
export async function sendTelegramOtp(
  param1: string,
  param2?: string,
  options?: { title?: string; clientName?: string; message?: string; botToken?: string }
): Promise<boolean> {
  lastTelegramError = null;
  const isParam1Otp = /^\d{4,6}$/.test(param1);
  const otpCode = isParam1Otp ? param1 : (param2 || param1);
  const targetChatId = isParam1Otp ? (param2 || AUTHORIZED_SELLER_CHAT_ID) : param1;

  if (!targetChatId || targetChatId.trim() === '') {
    lastTelegramError = 'Chat ID tujuan belum dikonfigurasi. Silakan chat bot dengan PIN terlebih dahulu.';
    return false;
  }

  const payload = JSON.stringify({
    otp: otpCode,
    chatId: targetChatId,
    title: options?.title,
    clientName: options?.clientName,
    message: options?.message,
  });

  const endpoints = ['/api/send-otp'];
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    endpoints.push('https://akugawe-portal.pages.dev/api/send-otp');
  }

  // 1. Coba kirim via serverless endpoints
  for (const endpoint of endpoints) {
    try {
      const proxyRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.ok === true) {
          lastTelegramError = null;
          return true;
        }
        lastTelegramError = data.error || 'Pesan gagal dikirim oleh server Telegram.';
        // Jika error spesifik seperti chat not found, tidak perlu coba endpoint lain
        if (typeof data.error === 'string' && (data.error.includes('chat not found') || data.error.includes('belum terhubung'))) {
          return false;
        }
      } else {
        const errData = await proxyRes.json().catch(() => ({}));
        lastTelegramError = errData.error || proxyRes.statusText || 'Gagal mengirim OTP.';
        if (typeof errData.error === 'string' && errData.error.includes('chat not found')) {
          return false;
        }
      }
    } catch (err: any) {
      lastTelegramError = err?.message || 'Gagal terhubung ke endpoint /api/send-otp';
    }
  }

  // 2. Direct Fallback: Kirim langsung via Telegram API resmi (didukung CORS dari browser)
  try {
    const token = options?.botToken || DEFAULT_TELEGRAM_BOT_TOKEN;
    if (token && targetChatId) {
      const title = options?.title || (options?.clientName ? `KODE VERIFIKASI ONBOARDING: ${options?.clientName}` : 'KODE VERIFIKASI TELEGRAM');
      const textMsg = options?.message || `🔐 *${title}:*\n\`${otpCode}\`\n\n_(Ketuk angka di atas atau tombol di bawah untuk menyalin kode)_\n\n⚠️ Kode OTP ini rahasia untuk verifikasi akses Sales Admin. Jangan berikan kepada siapa pun.`;

      const directRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: textMsg,
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

      const dData = await directRes.json().catch(() => ({}));
      if (directRes.ok && dData.ok) {
        lastTelegramError = null;
        return true;
      } else {
        const desc = dData.description || 'Gagal mengirim pesan via Telegram.';
        if (typeof desc === 'string' && desc.includes('chat not found')) {
          lastTelegramError = `Chat Telegram belum terhubung. Buka bot @${BOT_USERNAME} di Telegram, kirimkan PIN dan ulangi lagi.`;
        } else {
          lastTelegramError = desc;
        }
        return false;
      }
    }
  } catch (directErr: any) {
    lastTelegramError = directErr?.message || 'Gagal terhubung ke Telegram API.';
  }

  return false;
}

/**
 * Memeriksa apakah ada pesan masuk ke bot Telegram dengan teks yang cocok dengan PIN.
 * Jika ditemukan, mengambil Chat ID dan mengirimkan pesan konfirmasi balik.
 */
export async function checkTelegramPairing(
  expectedPin: string,
  botToken?: string
): Promise<{ success: boolean; chatId?: string; senderName?: string; error?: string }> {
  const token = botToken || DEFAULT_TELEGRAM_BOT_TOKEN;
  const cleanPin = expectedPin.trim();

  // 1. Coba via API Serverless jika tersedia
  try {
    const serverRes = await fetch('/api/check-telegram-pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin }),
    });
    if (serverRes.ok) {
      const sData = await serverRes.json();
      if (sData.ok && sData.chatId) {
        return {
          success: true,
          chatId: String(sData.chatId),
          senderName: sData.senderName || 'Admin',
        };
      }
    }
  } catch (_) {
    // Abaikan jika serverless tidak tersedia di local dev
  }

  // 2. Direct Polling via getUpdates
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-20&limit=20`);
    if (!res.ok) {
      return { success: false, error: 'Gagal menghubungi server Telegram.' };
    }

    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) {
      return { success: false, error: data.description || 'Gagal membaca pesan bot.' };
    }

    // Urutkan dari pesan terbaru
    const updates = [...data.result].reverse();

    for (const update of updates) {
      const msg = update.message;
      if (!msg || !msg.text) continue;

      const text = msg.text.trim();
      const isMatch =
        text === cleanPin ||
        text === `/start ${cleanPin}` ||
        text.includes(cleanPin) ||
        (cleanPin === '2468' && text === '/start');

      if (isMatch && msg.chat && msg.chat.id) {
        const foundChatId = String(msg.chat.id);
        const senderName = msg.from?.first_name || msg.chat.first_name || 'Admin';

        // Kirim ucapan selamat & konfirmasi ke obrolan Telegram
        try {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: foundChatId,
              text: `✅ *Bot Akugawe Terhubung!*\n\nHalo *${senderName}*, Telegram Anda berhasil dikonfigurasi sebagai akun Sales Admin akugawe.\n\nKode OTP Anda siap dikirimkan.`,
              parse_mode: 'Markdown',
            }),
          });
        } catch (_) {}

        return {
          success: true,
          chatId: foundChatId,
          senderName,
        };
      }
    }

    return {
      success: false,
      error: 'Belum terdeteksi pesan dengan PIN yang sesuai di bot Telegram.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error memeriksa pesan Telegram.',
    };
  }
}
