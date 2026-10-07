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
  ArrowRight,
  Loader2,
  BadgeCheck,
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
  sellerConfig: SellerConfig;
  onProceedToOnboarding?: (token: string) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedTier,
  sellerConfig,
  onProceedToOnboarding,
}: CheckoutModalProps) {
  const [clientName, setClientName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
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

  // Reset saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setOrderData(null);
      setHasManagedSetup(false);
      setSelectedMethod(sellerConfig.paymentMode === 'whatsapp' ? 'whatsapp' : 'qris');
    }
  }, [isOpen, sellerConfig.paymentMode]);

  if (!isOpen) return null;

  const basePrice = sellerConfig.isPromoActive ? selectedTier.promoPriceRp : selectedTier.normalPriceRp;
  const managedFee = hasManagedSetup ? sellerConfig.managedSetupPriceRp : 0;
  const estimatedTotal = basePrice + managedFee;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Nama toko / usaha wajib diisi.');
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error('Nomor WhatsApp wajib diisi.');
      return;
    }

    // Jika metode WhatsApp dipilih
    if (selectedMethod === 'whatsapp') {
      const waText = `Halo Tim ${sellerConfig.brandName},\n\nSaya ingin memesan paket *${selectedTier.name}* (Beli Putus).\n\n🏢 Nama Usaha: *${clientName}*\n📱 No WhatsApp: ${buyerPhone}\n🛠️ Add-on Terima Beres: *${hasManagedSetup ? 'YA (VIP Setup)' : 'Tidak (Setup Mandiri)'}*\n💰 Total Estimasi: *Rp ${estimatedTotal.toLocaleString('id-ID')}*\n\nBisa info rekening pembayaran & cara aktivasinya? Terima kasih!`;
      const url = `https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(waText)}`;
      window.open(url, '_blank');
      onClose();
      return;
    }

    // Jika metode QRIS (Pakasir / Dynamic QRIS)
    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          buyerPhone: buyerPhone.trim(),
          packageTierId: selectedTier.id,
          hasManagedSetup,
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
      toast.error(err.message || 'Gagal menghubungi server pembayaran.');
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
        // Cek apakah payment status di DB sudah paid atau token sudah valid
        setPaymentStatus('paid');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        toast.success('Pembayaran terkonfirmasi! Token lisensi aktif.');
      } else {
        toast.info('Pembayaran belum terdeteksi. Silakan tunggu beberapa detik atau konfirmasi via WhatsApp.');
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
    toast.success('Nominal disalin ke clipboard');
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const copyToken = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedToken(true);
    toast.success('Token lisensi disalin');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 p-6 sm:p-8 my-8 transition-all">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* LAYAR 1: FORM CHECKOUT */}
        {paymentStatus === 'idle' && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#e57f8e]/10 text-[#e57f8e] border border-[#e57f8e]/20 tracking-wider">
                Konfirmasi Pesanan Beli Putus
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
                Checkout Paket {selectedTier.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lisensi permanen sekali bayar. Serverless hosting gratis selamanya di Cloudflare.
              </p>
            </div>

            {/* Rincian Paket */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Harga Paket Utama</span>
                <span className="font-mono font-semibold text-white">
                  Rp {basePrice.toLocaleString('id-ID')}
                </span>
              </div>

              {/* ADD-ON TERIMA BERES TOGGLE */}
              {sellerConfig.managedSetupEnabled && (
                <div
                  onClick={() => setHasManagedSetup(!hasManagedSetup)}
                  className={`mt-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    hasManagedSetup
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors ${
                        hasManagedSetup
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {hasManagedSetup && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-amber-400" />
                          {sellerConfig.managedSetupTitle}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-amber-400">
                          +Rp {sellerConfig.managedSetupPriceRp.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {sellerConfig.managedSetupDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Total Investasi</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  Rp {estimatedTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Form Input Pelanggan */}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Toko / Usaha / Perusahaan <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Kopi Janji Bahagia / Bengkel Jaya"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-xs py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nomor WhatsApp Aktif <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-xs py-2"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Token aktivasi dan konfirmasi lisensi akan dikirimkan ke nomor ini.
                </span>
              </div>

              {/* Opsi Metode Pembayaran (Jika Mode Hybrid) */}
              {sellerConfig.paymentMode === 'hybrid' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pilih Cara Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('qris')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMethod === 'qris'
                          ? 'bg-[#e57f8e]/15 border-[#e57f8e] text-white shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <QrCode className="size-4 text-[#e57f8e]" />
                        <span className="text-xs font-bold text-white">QRIS Instan</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        BCA, GoPay, DANA, ShopeePay
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('whatsapp')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMethod === 'whatsapp'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="size-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Via WhatsApp</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Transfer manual / Tanya admin
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#e57f8e] hover:bg-[#d66b7a] text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#e57f8e]/20 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Menyiapkan Pembayaran...
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

        {/* LAYAR 2: TAMPILAN QRIS PEMBAYARAN */}
        {paymentStatus === 'awaiting_payment' && orderData && (
          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider">
              Menunggu Pembayaran
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-2">
              Scan QRIS untuk Menyelesaikan Pesanan
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Nominal sudah terkunci otomatis. Bebas biaya admin via aplikasi bank/e-wallet mana pun.
            </p>

            {/* BOX KODE QR */}
            <div className="p-4 bg-white rounded-2xl max-w-[240px] mx-auto shadow-xl mb-4">
              {orderData.qrCodeImageUrl ? (
                <img
                  src={orderData.qrCodeImageUrl}
                  alt="QRIS Pembayaran"
                  className="w-full h-auto aspect-square object-contain mx-auto"
                />
              ) : (
                <div className="size-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  QRIS tidak tersedia
                </div>
              )}
              <div className="mt-2 text-center">
                <span className="text-[10px] font-bold text-slate-800 tracking-wider">
                  QRIS STANDAR PEMBAYARAN NASIONAL
                </span>
              </div>
            </div>

            {/* TOTAL TAGIHAN PERSIS */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl mb-4 max-w-sm mx-auto">
              <div className="text-[11px] text-slate-400 mb-0.5">Total yang Harus Dibayar:</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  Rp {orderData.finalAmount.toLocaleString('id-ID')}
                </span>
                <button
                  onClick={() => copyNominal(orderData.finalAmount)}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Salin Nominal"
                >
                  {copiedNominal ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                </button>
              </div>
              {orderData.uniqueCode > 0 && (
                <div className="text-[10px] text-amber-400/90 mt-1">
                  *Termasuk kode unik verifikasi 3-digit: <b>{orderData.uniqueCode}</b>
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
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  Buka Halaman Pembayaran Pakasir
                </a>
              )}

              <Button
                onClick={handleManualCheckPaid}
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
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
                  const waText = `Halo Admin, saya sudah transfer via QRIS sebesar *Rp ${orderData.finalAmount.toLocaleString('id-ID')}* untuk pesanan *${clientName}* (#${orderData.id}). Mohon segera konfirmasi aktivasi lisensi. Terima kasih!`;
                  window.open(`https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(waText)}`, '_blank');
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="size-3.5 text-emerald-400" />
                Konfirmasi Manual ke WhatsApp Admin
              </button>
            </div>
          </div>
        )}

        {/* LAYAR 3: SUKSES PEMBAYARAN & SERAH TERIMA LISENSI */}
        {paymentStatus === 'paid' && orderData && (
          <div className="text-center py-4">
            <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <BadgeCheck className="size-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Pembayaran Berhasil!
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Terima kasih! Lisensi Beli Putus untuk <b>{clientName}</b> telah resmi diaktifkan.
            </p>

            {/* TOKEN BOX */}
            <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left max-w-sm mx-auto">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Kode Token Lisensi Anda:
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-extrabold text-white tracking-widest">
                  {orderData.licenseToken}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToken(orderData.licenseToken)}
                  className="border-slate-700 bg-slate-900 text-slate-200 text-xs h-8 cursor-pointer"
                >
                  {copiedToken ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </Button>
              </div>
            </div>

            {hasManagedSetup ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left mb-6 max-w-sm mx-auto">
                <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                  <Sparkles className="size-3.5" /> Paket VIP Terima Beres Aktif
                </div>
                Tim kami akan segera menghubungi Anda via WhatsApp ({buyerPhone}) untuk serah terima akun Cloudflare dan setup domain toko Anda sampai tuntas.
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs text-left mb-6 max-w-sm mx-auto">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                  <BadgeCheck className="size-3.5" /> Panduan Setup 1-Click Mandiri
                </div>
                Gunakan token di atas untuk menjalankan portal aktivasi otomatis ke akun Cloudflare gratis Anda.
              </div>
            )}

            <Button
              onClick={() => {
                onClose();
                if (onProceedToOnboarding) {
                  onProceedToOnboarding(orderData.licenseToken);
                } else {
                  window.location.href = `/?onboarding=true&token=${orderData.licenseToken}`;
                }
              }}
              className="w-full max-w-sm py-3 bg-[#e57f8e] hover:bg-[#d66b7a] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#e57f8e]/20 cursor-pointer"
            >
              Mulai 1-Click Onboarding Sekarang
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
