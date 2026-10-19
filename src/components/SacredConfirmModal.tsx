import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Lock,
  Building2,
  Eye,
  EyeOff,
  Trash2,
  ShieldAlert,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface SacredConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actionType?: 'delete_license' | 'suspend_license' | 'reset_config' | 'custom';
  targetBusinessName?: string;
  targetDetails?: {
    label: string;
    value: string;
    badge?: string;
  }[];
  warningMessage?: string;
  requireBusinessName?: boolean;
  requirePin?: boolean;
  confirmButtonText?: string;
  confirmButtonVariant?: 'destructive' | 'default';
  isLoading?: boolean;
  onConfirm: (data: { businessName: string; pin: string }) => Promise<void> | void;
}

export function SacredConfirmModal({
  isOpen,
  onClose,
  title = 'Konfirmasi Aksi Sakral',
  subtitle = 'Aksi ini berdampak sistemik dan membutuhkan verifikasi tingkat tinggi.',
  actionType = 'delete_license',
  targetBusinessName,
  targetDetails = [],
  warningMessage,
  requireBusinessName = true,
  requirePin = true,
  confirmButtonText = 'Konfirmasi & Eksekusi',
  confirmButtonVariant = 'destructive',
  isLoading = false,
  onConfirm,
}: SacredConfirmModalProps) {
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Reset input setiap kali modal dibuka / ditutup
  useEffect(() => {
    if (isOpen) {
      setBusinessNameInput('');
      setPinInput('');
      setShowPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const expectedNameClean = (targetBusinessName || '').trim().toLowerCase();
  const inputNameClean = businessNameInput.trim().toLowerCase();
  const isNameMatched = !requireBusinessName || !targetBusinessName || (inputNameClean === expectedNameClean && inputNameClean.length > 0);
  const isPinValid = !requirePin || pinInput.trim().length >= 4;
  const canSubmit = isNameMatched && isPinValid && !isLoading;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      businessName: businessNameInput.trim(),
      pin: pinInput.trim(),
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-5 pb-4 bg-gradient-to-br from-rose-50/80 via-white to-slate-50 border-b border-rose-100 relative">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="absolute top-4 right-4 size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
              {actionType === 'delete_license' ? (
                <Trash2 className="size-5" />
              ) : actionType === 'suspend_license' ? (
                <ShieldAlert className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <Badge
                  variant="outline"
                  className="bg-rose-50 text-rose-800 border-rose-200 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0"
                >
                  Sakral
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Summary Card */}
          {(targetBusinessName || targetDetails.length > 0) && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              {targetBusinessName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Building2 className="size-3.5 text-slate-400" />
                    Target Bisnis:
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {targetBusinessName}
                  </span>
                </div>
              )}
              {targetDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">{detail.label}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-800 font-medium text-[11px]">
                      {detail.value}
                    </span>
                    {detail.badge && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-white">
                        {detail.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warning Message Banner */}
          <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-bold block text-rose-900">Perhatian: Aksi Permanen</span>
              <span>
                {warningMessage ||
                  'Data lisensi pada Cloudflare Portal dan seluruh data operasional tenant pada Pod (karyawan, absensi, payroll, shift, dsb.) akan dibersihkan.'}
              </span>
            </div>
          </div>

          {/* Step 1: Input Konfirmasi Nama Bisnis */}
          {requireBusinessName && targetBusinessName && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>1. Ketik Nama Bisnis Persis:</span>
                {isNameMatched && (
                  <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Cocok
                  </span>
                )}
              </label>
              <div className="text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded font-mono select-all">
                {targetBusinessName}
              </div>
              <Input
                type="text"
                autoFocus
                disabled={isLoading}
                placeholder={`Ketik "${targetBusinessName}"`}
                value={businessNameInput}
                onChange={(e) => setBusinessNameInput(e.target.value)}
                className={`text-xs h-9 bg-white transition-colors ${
                  businessNameInput && !isNameMatched
                    ? 'border-rose-300 focus-visible:ring-rose-400'
                    : isNameMatched
                    ? 'border-emerald-300 focus-visible:ring-emerald-400'
                    : 'border-slate-200'
                }`}
              />
              {businessNameInput && !isNameMatched && (
                <p className="text-[10px] text-rose-600 font-medium">
                  Nama yang diketik belum cocok persis dengan nama bisnis di atas.
                </p>
              )}
            </div>
          )}

          {/* Step 2: Input Master Admin PIN */}
          {requirePin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  {requireBusinessName && targetBusinessName ? '2. ' : ''}Masukkan Master Admin PIN:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Min. 4 digit</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="size-3.5" />
                </div>
                <Input
                  type={showPin ? 'text' : 'password'}
                  disabled={isLoading}
                  placeholder="Ketik Master PIN..."
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  maxLength={20}
                  className="pl-8.5 pr-10 text-xs h-9 font-mono tracking-widest bg-white border-slate-200"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onClose}
              className="text-xs h-9 px-4 border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className={`text-xs h-9 px-4 font-bold transition-all shadow-xs ${
                confirmButtonVariant === 'destructive'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-200 disabled:text-rose-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                confirmButtonText
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
