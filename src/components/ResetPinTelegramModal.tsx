import React, { useState, useEffect } from 'react';
import {
  Key,
  Bot,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SellerConfig } from '@/services/config';
import { resetMasterPinViaTelegram, BOT_USERNAME } from '@/services/telegram';

export interface ResetPinTelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SellerConfig;
  onResetSuccess: (newPinHash: string, newPin?: string) => void;
  onNavigateToTelegramTab?: () => void;
}

export function ResetPinTelegramModal({
  isOpen,
  onClose,
  config,
  onResetSuccess,
  onNavigateToTelegramTab,
}: ResetPinTelegramModalProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsResetting(false);
      setResetSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const botUsername = config.telegramBotUsername || BOT_USERNAME;
  const isBotConfigured = Boolean(config.authorizedChatId && config.authorizedChatId.trim());

  const handleExecuteReset = async () => {
    setIsResetting(true);
    setErrorMessage(null);

    try {
      const res = await resetMasterPinViaTelegram({
        telegramBotToken: config.telegramBotToken,
        telegramBotUsername: config.telegramBotUsername,
        authorizedChatId: config.authorizedChatId,
      });

      if (res.success && res.newPinHash) {
        setResetSuccess(true);
        onResetSuccess(res.newPinHash, res.newPin);
      } else {
        setErrorMessage(res.error || 'Gagal mengirim reset PIN ke Telegram.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat mereset PIN.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isResetting) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl border border-[#f0dbd8] shadow-2xl max-w-md w-full overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-5 pb-4 bg-gradient-to-br from-[#fbf2f0] via-white to-slate-50 border-b border-[#f0dbd8] relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center shrink-0 shadow-2xs">
              <Key className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Reset PIN ke Telegram
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim Master PIN baru secara aman ke bot Telegram
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {resetSuccess ? (
            /* Success State */
            <div className="space-y-4 py-2 text-center">
              <div className="size-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">
                  Master PIN Baru Berhasil Dikirim!
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Sistem telah membuat Master PIN baru 6-digit dan mengirimkannya langsung ke bot Telegram Anda.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tujuan Pengiriman:</span>
                  <span className="font-semibold text-slate-800">@{botUsername}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Status PIN Lama:</span>
                  <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-[10px]">
                    Nonaktif / Kedaluwarsa
                  </Badge>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-[11px] text-slate-500">
                  💡 Buka aplikasi Telegram Anda untuk melihat dan menyalin PIN baru tersebut. Anda dapat langsung menggunakannya atau memasukkannya ke kolom <strong>PIN Lama</strong> jika ingin menggantinya kembali.
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <Send className="size-3.5" />
                  <span>Buka Telegram @{botUsername}</span>
                  <ExternalLink className="size-3 ml-0.5 opacity-70" />
                </a>

                <Button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#a9484c] hover:bg-[#8f3b3f] text-white text-xs font-semibold"
                >
                  Selesai & Tutup
                </Button>
              </div>
            </div>
          ) : (
            /* Prompt State */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <span>Lupa Master PIN Lama Anda?</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sistem akan membuat Master PIN acak baru (6 digit) dan mengirimkannya langsung ke akun Telegram Sales Admin Anda. <strong>PIN lama Anda akan segera digantikan dan tidak berlaku lagi.</strong>
                </p>
              </div>

              {/* Telegram Connection Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Akun Bot Telegram:</span>
                  <span className="font-bold text-slate-800">@{botUsername}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Chat ID Penerima:</span>
                  {isBotConfigured ? (
                    <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {config.authorizedChatId}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold text-[11px]">
                      Belum Terhubung
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                  <span className="text-slate-500 font-medium">Status Saluran:</span>
                  {isBotConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Siap Menerima Reset
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                      <span className="size-1.5 rounded-full bg-rose-500" />
                      Perlu Dikonfigurasi
                    </span>
                  )}
                </div>
              </div>

              {/* Bot Not Connected Warning */}
              {!isBotConfigured && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
                  <p className="text-[11px] leading-relaxed">
                    ⚠️ Bot Telegram belum terhubung ke akun Anda. Anda perlu menghubungkan bot terlebih dahulu agar dapat menerima kode reset PIN.
                  </p>
                  {onNavigateToTelegramTab && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onNavigateToTelegramTab();
                      }}
                      className="w-full text-xs border-rose-300 text-rose-700 hover:bg-rose-100"
                    >
                      <Bot className="size-3.5 mr-1.5" />
                      Buka Tab Telegram Bot Sekarang
                    </Button>
                  )}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isResetting}
                  className="text-xs"
                >
                  Batal
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isResetting || !isBotConfigured}
                  onClick={handleExecuteReset}
                  className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white text-xs font-semibold shadow-xs"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                      <span>Mengirim ke Telegram...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5 mr-1.5" />
                      <span>Reset & Kirim ke Telegram</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
