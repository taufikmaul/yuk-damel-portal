/**
 * Service Telegram Bot untuk Portal Penjual akugawe
 * Seluruh pengiriman pesan diarahkan melalui Edge Function (/api/send-otp)
 * agar Bot API Token tidak pernah diekspos ke client bundle.
 */

const BOT_USERNAME = 'AkugawePortalBot';
export const AUTHORIZED_SELLER_CHAT_ID = '115334079';

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

/**
 * Kirim pesan OTP secara aman ke Telegram Chat ID pemilik melalui Serverless Proxy Edge
 * Dilengkapi format monospace tap-to-copy dan tombol resmi Telegram Copy Text
 */
export async function sendTelegramOtp(param1: string, param2?: string): Promise<boolean> {
  lastTelegramError = null;
  const isParam1Otp = /^\d{4,6}$/.test(param1);
  const otpCode = isParam1Otp ? param1 : (param2 || param1);
  const targetChatId = isParam1Otp ? (param2 || AUTHORIZED_SELLER_CHAT_ID) : param1;

  // Cloudflare Pages Serverless Proxy (/api/send-otp)
  try {
    const proxyRes = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: otpCode,
        chatId: targetChatId || AUTHORIZED_SELLER_CHAT_ID,
      }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.ok === true) {
        return true;
      }
      lastTelegramError = data.error || 'Pesan gagal dikirim oleh server Telegram.';
      return false;
    } else {
      const errData = await proxyRes.json().catch(() => ({}));
      lastTelegramError = errData.error || proxyRes.statusText || 'Gagal mengirim OTP.';
      console.warn('Serverless OTP Proxy returned error:', lastTelegramError);
      return false;
    }
  } catch (err: any) {
    lastTelegramError = err?.message || 'Gagal terhubung ke server proxy /api/send-otp';
    console.error('Failed to connect to /api/send-otp proxy:', err);
    return false;
  }
}

export { BOT_USERNAME };
