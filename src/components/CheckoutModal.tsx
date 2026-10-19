import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Loader2,
  BadgeCheck,
  Zap,
  Clock,
  Users,
  Mail,
  MailCheck,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { PricingTier, SellerConfig } from '@/services/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: PricingTier;
  selectedDurationMonths?: number;
  sellerConfig: SellerConfig;
  onProceedToOnboarding?: (token: string) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedTier,
  selectedDurationMonths = 1,
  sellerConfig,
  onProceedToOnboarding: _onProceedToOnboarding,
}: CheckoutModalProps) {
  const [clientName, setClientName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [hasManagedSetup, setHasManagedSetup] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'qris' | 'whatsapp'>(
    sellerConfig.paymentMode === 'whatsapp' ? 'whatsapp' : 'qris'
  );

  // Status transaksi
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'awaiting_payment' | 'paid'>('idle');
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Status Verifikasi Kode Email Free Tier (Anti-Spam)
  const [freeTierStep, setFreeTierStep] = useState<'form' | 'verify_code'>('form');
  const [activationCode, setActivationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isFreeTier = Boolean(selectedTier?.isFree || selectedTier?.id === 'free_trial');
  const durationMonths = isFreeTier ? (selectedTier.freeDurationMonths || 4) : selectedDurationMonths;

  // Auto pre-fill dari URL Parameters jika prospek datang dari Demo App
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setOrderData(null);
      setHasManagedSetup(false);
      setSelectedMethod(sellerConfig.paymentMode === 'whatsapp' ? 'whatsapp' : 'qris');
      setFreeTierStep('form');
      setActivationCode('');
      setIsSendingCode(false);
      setResendCooldown(0);

      try {
        const params = new URLSearchParams(window.location.search);
        const urlCompany = params.get('company') || params.get('companyName') || params.get('name');
        const urlPhone = params.get('phone') || params.get('whatsapp');
        const urlEmail = params.get('email');

        if (urlCompany && !clientName) setClientName(urlCompany);
        if (urlPhone && !buyerPhone) setBuyerPhone(urlPhone);
        if (urlEmail && !buyerEmail) setBuyerEmail(urlEmail);
      } catch (_) {}
    }
  }, [isOpen, sellerConfig.paymentMode]);

  // Countdown timer untuk kirim ulang kode aktivasi
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Kalkulasi harga paket
  let basePrice = 15000;
  const durStr = String(durationMonths);
  if (isFreeTier) {
    basePrice = 0;
  } else if (selectedTier?.pricing && selectedTier.pricing[durStr]) {
    basePrice = sellerConfig.isPromoActive
      ? selectedTier.pricing[durStr].promoRp
      : selectedTier.pricing[durStr].normalRp;
  } else {
    basePrice = (sellerConfig.isPromoActive ? selectedTier.promoPriceRp : selectedTier.normalPriceRp) * durationMonths;
  }

  const managedFee = hasManagedSetup ? sellerConfig.managedSetupPriceRp : 0;
  const estimatedTotal = basePrice + managedFee;

  // Handler pengiriman kode aktivasi email Free Tier
  const handleSendActivationCode = async () => {
    if (!clientName.trim()) {
      toast.error('Nama toko / usaha wajib diisi.');
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error('Nomor WhatsApp aktif wajib diisi.');
      return;
    }
    if (!buyerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) {
      toast.error('Alamat email aktif wajib diisi untuk verifikasi akun Free Tier.');
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await fetch('/api/send-activation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          buyerPhone: buyerPhone.trim(),
          email: buyerEmail.trim(),
          packageTierId: selectedTier.id,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Gagal mengirim kode aktivasi.');
      }

      setFreeTierStep('verify_code');
      setResendCooldown(60);
      toast.success(data.message || `Kode aktivasi telah dikirim ke ${buyerEmail.trim()}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim kode aktivasi.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Handler verifikasi kode aktivasi & pembuatan order Free Tier
  const handleActivateFreeTierWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode || activationCode.trim().length !== 6) {
      toast.error('Harap masukkan 6-digit kode aktivasi yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim(),
          packageTierId: selectedTier.id,
          cycleMonths: durationMonths,
          hasManagedSetup: false,
          paymentMethod: 'free_instant',
          activationCode: activationCode.trim(),
        }),
      });

      const data = await res.json();
      if (!data.ok || !data.order) {
        throw new Error(data.error || 'Gagal memverifikasi kode aktivasi.');
      }

      setOrderData(data.order);
      setPaymentStatus('paid');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Selamat! Akun Free Tier 4 Bulan Anda berhasil diaktifkan!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi aktivasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Nama toko / usaha wajib diisi.');
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error('Nomor WhatsApp aktif wajib diisi.');
      return;
    }

    // Jika Free Tier, wajib lewat verifikasi kode aktivasi email
    if (isFreeTier) {
      handleSendActivationCode();
      return;
    }

    // Jika metode WhatsApp dipilih (Hanya berlaku untuk paket berbayar)
    if (selectedMethod === 'whatsapp') {
      const waText =
        `Halo Tim ${sellerConfig.brandName},\n\n` +
        `Saya ingin memesan paket langganan *${selectedTier.name} (${durationMonths} Bulan)*.\n\n` +
        `🏢 Nama Usaha: *${clientName}*\n` +
        `📱 No WhatsApp: ${buyerPhone}\n` +
        `✉️ Email: ${buyerEmail || '-'}\n` +
        `👥 Kuota: Maks ${selectedTier.maxEmployees} Karyawan\n` +
        `🛠️ VIP Setup: *${hasManagedSetup ? 'YA' : 'Mandiri'}*\n` +
        `💰 Total: *Rp ${estimatedTotal.toLocaleString('id-ID')}*\n\n` +
        `Mohon info rekening & cara aktivasinya ya. Terima kasih!`;
      const url = `https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(waText)}`;
      window.open(url, '_blank');
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim() || undefined,
          packageTierId: selectedTier.id,
          cycleMonths: durationMonths,
          hasManagedSetup: hasManagedSetup,
          paymentMethod: sellerConfig.paymentMode === 'pakasir' ? 'pakasir' : 'qris_manual',
        }),
      });

      const data = await res.json();
      if (!data.ok || !data.order) {
        throw new Error(data.error || 'Gagal memproses transaksi.');
      }

      setOrderData(data.order);
      setPaymentStatus('awaiting_payment');
      toast.success('Kode QRIS pembayaran berhasil dibuat!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghubungi server portal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheckPaid = async () => {
    if (!orderData?.licenseToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?token=${encodeURIComponent(orderData.licenseToken)}`);
      const data = await res.json();
      if (data.valid) {
        setPaymentStatus('paid');
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        toast.success('Pembayaran terkonfirmasi! Layanan aktif.');
      } else {
        toast.info('Pembayaran belum terdeteksi. Silakan tunggu beberapa saat atau konfirmasi via WhatsApp.');
      }
    } catch {
      toast.error('Gagal mengecek status pembayaran.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyNominal = (val: number) => {
    navigator.clipboard.writeText(val.toString());
    setCopiedNominal(true);
    toast.success('Nominal disalin');
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const copyToken = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedToken(true);
    toast.success('Token lisensi disalin');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-[#f0dbd8] rounded-3xl shadow-2xl text-slate-800 p-6 sm:p-8 my-8 transition-all">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* LAYAR 1: FORM CHECKOUT & VERIFIKASI KODE */}
        {paymentStatus === 'idle' && (
          <div>
            {isFreeTier && freeTierStep === 'verify_code' ? (
              /* SUB-LAYAR 1B: VERIFIKASI KODE AKTIVASI EMAIL FREE TIER */
              <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="size-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <MailCheck className="size-7" />
                </div>

                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Langkah Terakhir Verifikasi Anti-Spam
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Masukkan Kode Aktivasi
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 max-w-sm mx-auto">
                    Kami telah mengirimkan 6-digit kode aktivasi ke email Anda:
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
                    <Mail className="size-3.5 text-emerald-600" />
                    <span>{buyerEmail}</span>
                  </div>
                </div>

                <form onSubmit={handleActivateFreeTierWithCode} className="space-y-4 max-w-sm mx-auto text-left">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 text-center">
                      6-Digit Kode Aktivasi Email
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      placeholder="••••••"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.4em] text-2xl font-black h-14 bg-[#faf6f5] font-mono border-[#f0dbd8] focus-visible:ring-emerald-600 text-slate-900 rounded-2xl shadow-inner"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                      ⏱️ Kode berlaku 10 menit. Periksa folder Inbox atau Spam.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || activationCode.length !== 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Memverifikasi & Mengaktifkan...
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 mr-1.5" />
                        Verifikasi & Aktifkan Free Tier (Rp 0)
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFreeTierStep('form');
                        setActivationCode('');
                      }}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="size-3.5" />
                      Ubah Data / Email
                    </button>

                    <button
                      type="button"
                      disabled={isSendingCode || resendCooldown > 0}
                      onClick={handleSendActivationCode}
                      className={`font-semibold cursor-pointer transition-colors ${
                        resendCooldown > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-[#a9484c] hover:underline'
                      }`}
                    >
                      {isSendingCode ? (
                        'Mengirim...'
                      ) : resendCooldown > 0 ? (
                        `Kirim ulang (${resendCooldown}s)`
                      ) : (
                        'Kirim Ulang Kode'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* SUB-LAYAR 1A: FORM INPUT USAHA & KONTAK */
              <div>
                <div className="mb-5">
                  <p className={`text-xs font-bold uppercase tracking-wider ${
                    isFreeTier ? 'text-emerald-700' : 'text-[#a9484c]'
                  }`}>
                    {isFreeTier ? 'Aktivasi Instan Free Trial (Rp 0)' : 'Konfirmasi Pesanan Langganan'}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                    {isFreeTier ? 'Mulai Free Tier 4 Bulan' : `Checkout Paket ${selectedTier.name}`}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {isFreeTier
                      ? 'Nikmati akses penuh 4 bulan tanpa bayar. Cukup verifikasi email aktif Anda untuk aktivasi instan.'
                      : `Paket langganan ${durationMonths} bulan untuk operasional absensi & payroll tim Anda.`}
                  </p>
                </div>

                {/* Rincian Paket */}
                <div className="p-4 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8] mb-5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#a9484c]" />
                      Batas Maksimal Karyawan
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedTier.maxEmployees === -1 ? 'Unlimited' : `${selectedTier.maxEmployees} Karyawan`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="size-3.5 text-[#a9484c]" />
                      Durasi Masa Aktif
                    </span>
                    <span className="font-bold text-slate-900">
                      {durationMonths} Bulan Penuh
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Biaya Langganan</span>
                    <span className="font-mono font-bold text-slate-900">
                      {isFreeTier ? 'Rp 0 (Gratis)' : `Rp ${basePrice.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  {/* ADD-ON TERIMA BERES (Hanya untuk Paket Berbayar) */}
                  {!isFreeTier && sellerConfig.managedSetupEnabled && (
                    <div
                      onClick={() => setHasManagedSetup(!hasManagedSetup)}
                      className={`mt-2 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        hasManagedSetup
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-white border-[#f0dbd8] hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`size-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                            hasManagedSetup
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {hasManagedSetup && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                              <Sparkles className="size-3 text-amber-600" />
                              {sellerConfig.managedSetupTitle}
                            </span>
                            <span className="text-[11px] font-mono font-extrabold text-amber-700">
                              +Rp {sellerConfig.managedSetupPriceRp.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-[#f0dbd8] flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Total Tagihan Hari Ini</span>
                    <span className={`text-base font-black font-mono ${isFreeTier ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isFreeTier ? 'Rp 0' : `Rp ${estimatedTotal.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>

                {/* Notice Anti-Spam Free Tier */}
                {isFreeTier && (
                  <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-left flex items-start gap-2.5">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-emerald-900 leading-relaxed">
                      <b>Verifikasi Pelanggan:</b> Kode aktivasi 6-digit akan dikirimkan ke email Anda untuk memvalidasi kepemilikan sebelum akun gratis diaktifkan.
                    </div>
                  </div>
                )}

                {/* Form Input Pelanggan */}
                <form onSubmit={handleCreateOrder} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Toko / Usaha Anda <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Contoh: Kedai Kopi Senja / Bengkel Prima"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-white border-[#f0dbd8] text-slate-900 placeholder:text-slate-400 text-xs py-2 focus-visible:ring-[#a9484c]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="bg-white border-[#f0dbd8] text-slate-900 placeholder:text-slate-400 text-xs py-2 focus-visible:ring-[#a9484c]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Pemilik {isFreeTier ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                      </label>
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="bg-white border-[#f0dbd8] text-slate-900 placeholder:text-slate-400 text-xs py-2 focus-visible:ring-[#a9484c]"
                        required={isFreeTier}
                      />
                    </div>
                  </div>

                  {/* Opsi Metode Pembayaran (Hanya untuk Paket Berbayar Mode Hybrid) */}
                  {!isFreeTier && sellerConfig.paymentMode === 'hybrid' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Pilih Cara Pembayaran
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('qris')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedMethod === 'qris'
                              ? 'bg-[#fbf2f0] border-[#a9484c] text-slate-900 shadow-xs ring-1 ring-[#a9484c]'
                              : 'bg-[#faf6f5] border-[#f0dbd8] text-slate-600 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <QrCode className="size-3.5 text-[#a9484c]" />
                            <span className="text-xs font-bold text-slate-900">QRIS Instan</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            BCA, GoPay, DANA, ShopeePay
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod('whatsapp')}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedMethod === 'whatsapp'
                              ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-xs ring-1 ring-emerald-500'
                              : 'bg-[#faf6f5] border-[#f0dbd8] text-slate-600 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <MessageCircle className="size-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-900">Via WhatsApp</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            Konfirmasi manual
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || isSendingCode}
                    className={`w-full mt-2 py-3 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer ${
                      isFreeTier
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        : 'bg-[#a9484c] hover:bg-[#8f3b3f] shadow-[#a9484c]/20'
                    }`}
                  >
                    {isSendingCode ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Mengirim Kode Aktivasi ke Email...
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Memproses Pesanan...
                      </>
                    ) : isFreeTier ? (
                      <>
                        <Mail className="size-4 mr-1.5" />
                        Kirim Kode Aktivasi via Email (Gratis)
                      </>
                    ) : selectedMethod === 'whatsapp' ? (
                      <>
                        <MessageCircle className="size-4 mr-2" />
                        Kirim Pesanan ke WhatsApp Penjual
                      </>
                    ) : (
                      <>
                        <QrCode className="size-4 mr-2" />
                        Lanjut ke Pembayaran QRIS (Rp {estimatedTotal.toLocaleString('id-ID')})
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* LAYAR 2: TAMPILAN QRIS PEMBAYARAN */}
        {paymentStatus === 'awaiting_payment' && orderData && (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Menunggu Pembayaran
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
              Scan QRIS untuk Menyelesaikan Pesanan
            </h3>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              Nominal sudah terkunci otomatis. Bebas biaya admin via aplikasi bank/e-wallet mana pun.
            </p>

            {/* BOX KODE QR */}
            <div className="p-4 bg-[#faf6f5] border border-[#f0dbd8] rounded-2xl max-w-[240px] mx-auto shadow-sm mb-4">
              {orderData.qrCodeImageUrl ? (
                <img
                  src={orderData.qrCodeImageUrl}
                  alt="QRIS Pembayaran"
                  className="w-full h-auto aspect-square object-contain mx-auto bg-white p-2 rounded-xl"
                />
              ) : (
                <div className="size-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  QRIS sedang diproses
                </div>
              )}
              <div className="mt-2 text-center">
                <span className="text-[10px] font-bold text-slate-700 tracking-wider">
                  QRIS STANDAR PEMBAYARAN NASIONAL
                </span>
              </div>
            </div>

            {/* TOTAL TAGIHAN PERSIS */}
            <div className="p-3 bg-[#faf6f5] border border-[#f0dbd8] rounded-xl mb-4 max-w-sm mx-auto">
              <div className="text-[11px] text-slate-500 mb-0.5">Total yang Harus Dibayar:</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-emerald-700">
                  Rp {orderData.finalAmount.toLocaleString('id-ID')}
                </span>
                <button
                  onClick={() => copyNominal(orderData.finalAmount)}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Salin Nominal"
                >
                  {copiedNominal ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </button>
              </div>
              {orderData.uniqueCode > 0 && (
                <div className="text-[10px] text-amber-700 mt-1">
                  *Termasuk kode unik 3-digit verifikasi: <b>{orderData.uniqueCode}</b>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 max-w-sm mx-auto">
              {orderData.pakasirCheckoutUrl && (
                <a
                  href={orderData.pakasirCheckoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-[#a9484c] hover:bg-[#8f3b3f] text-white transition-all shadow-sm cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  Buka Halaman Pembayaran Pakasir
                </a>
              )}

              <Button
                onClick={handleManualCheckPaid}
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4 mr-2" />
                )}
                Saya Sudah Bayar (Cek Verifikasi)
              </Button>

              <button
                onClick={() => {
                  const waText = `Halo Admin akugawe, saya sudah transfer via QRIS sebesar *Rp ${orderData.finalAmount.toLocaleString('id-ID')}* untuk pesanan *${clientName}* (#${orderData.id}). Mohon konfirmasi aktivasi layanan ya. Terima kasih!`;
                  window.open(`https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(waText)}`, '_blank');
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="size-3.5 text-emerald-600" />
                Konfirmasi Manual via WhatsApp Admin
              </button>
            </div>
          </div>
        )}

        {/* LAYAR 3: SUKSES (FREE TIER INSTAN & PAID LUNAS) */}
        {paymentStatus === 'paid' && orderData && (
          <div className="text-center py-4">
            <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <BadgeCheck className="size-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {isFreeTier ? 'Akun Free 4 Bulan Anda Aktif!' : 'Pembayaran Berhasil!'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Layanan absensi & payroll untuk <b>{clientName}</b> telah aktif dan siap digunakan.
            </p>

            {/* TOKEN BOX */}
            <div className="my-5 p-4 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8] text-left max-w-sm mx-auto">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Token Lisensi Anda:
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-widest">
                  {orderData.licenseToken}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToken(orderData.licenseToken)}
                  className="border-[#f0dbd8] bg-white text-slate-700 text-xs h-8 cursor-pointer shadow-xs"
                >
                  {copiedToken ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                </Button>
              </div>
            </div>

            {/* LINK AKSES INSTAN */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left mb-6 max-w-sm mx-auto space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <BadgeCheck className="size-4 text-emerald-600" /> Akses Sistem Langsung Siap:
              </div>
              <div className="text-[11px] text-emerald-700 break-all space-y-1">
                <div>📱 Presensi Karyawan: <b>{orderData.appUrl || `https://app.akugawe.web.id/${orderData.clientSlug || ''}`}</b></div>
                <div>💻 Dashboard HRD: <b>{orderData.dashboardUrl || `https://hrd.akugawe.web.id/${orderData.clientSlug || ''}`}</b></div>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                Kredensial login awal & token lisensi telah dikirimkan ke email ({orderData.buyerEmail || buyerEmail}) dan WhatsApp ({buyerPhone}).
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm mx-auto">
              <Button
                onClick={() => {
                  onClose();
                  const targetApp = orderData.appUrl || `https://app.akugawe.web.id/${orderData.clientSlug || ''}`;
                  window.open(targetApp, '_blank');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                📱 Buka Presensi
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  const targetDash = orderData.dashboardUrl || `https://hrd.akugawe.web.id/${orderData.clientSlug || ''}`;
                  window.open(targetDash, '_blank');
                }}
                className="flex-1 py-2.5 bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-bold text-xs rounded-xl shadow-md shadow-[#a9484c]/20 cursor-pointer"
              >
                💻 Buka HRD &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
