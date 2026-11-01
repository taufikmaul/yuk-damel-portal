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

  // Attempt delivery via serverless endpoints
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
        // Stop fallback on permanent chat errors
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

  // If all serverless endpoints fail or return error
  return false;
}

/**
 * Memeriksa apakah ada pesan masuk ke bot Telegram dengan teks yang cocok dengan PIN.
 * Dilakukan secara aman via Edge Serverless (/api/check-telegram-pair) tanpa mengekspos token bot ke browser.
 */
export async function checkTelegramPairing(
  expectedPin: string,
  _botToken?: string
): Promise<{ success: boolean; chatId?: string; senderName?: string; error?: string }> {
  const cleanPin = expectedPin.trim();

  // Attempt serverless pairing check
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
      return {
        success: false,
        error: sData.error || 'Belum terdeteksi pesan dengan PIN yang sesuai di bot Telegram.',
      };
    } else {
      const sErr = await serverRes.json().catch(() => ({}));
      return {
        success: false,
        error: sErr.error || 'Gagal memeriksa pesan dari bot Telegram.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal terhubung ke endpoint /api/check-telegram-pair',
    };
  }
}

/**
 * Mereset Master Admin PIN dan mengirimkan PIN baru ke bot Telegram penjual.
 * Dilakukan secara aman via Edge Serverless (/api/reset-pin).
 */
export async function resetMasterPinViaTelegram(_config?: {
  telegramBotToken?: string;
  telegramBotUsername?: string;
  authorizedChatId?: string;
}): Promise<{
  success: boolean;
  newPinHash?: string;
  newPin?: string;
  error?: string;
}> {
  lastTelegramError = null;

  const endpoints = ['/api/reset-pin'];
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    endpoints.push('https://akugawe-portal.pages.dev/api/reset-pin');
  }

  // Attempt PIN reset via serverless worker endpoint
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok === true && data.newPinHash) {
          lastTelegramError = null;
          return {
            success: true,
            newPinHash: data.newPinHash,
          };
        }
        lastTelegramError = data.error || 'Gagal mereset PIN via server.';
      } else {
        const errData = await res.json().catch(() => ({}));
        lastTelegramError = errData.error || res.statusText || 'Gagal mereset PIN.';
      }
    } catch (err: any) {
      lastTelegramError = err?.message || 'Gagal terhubung ke endpoint /api/reset-pin';
    }
  }

  return {
    success: false,
    error: lastTelegramError || 'Gagal mereset Master PIN.',
  };
}

