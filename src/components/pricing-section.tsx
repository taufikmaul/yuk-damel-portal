import { useState, useEffect } from "react";
import { Check, Tag, MessageCircle, QrCode, Zap, Users, ShieldCheck } from "lucide-react";
import { PricingTier, SellerConfig, loadSellerConfig } from "@/services/config";
import { CheckoutModal } from "./CheckoutModal";

interface PricingSectionProps {
  onSelectTier?: (tier: PricingTier) => void;
  onProceedToOnboarding?: (token: string) => void;
  sellerConfig?: SellerConfig;
}

const DURATION_OPTIONS = [
  { value: "1", label: "1 Bulan" },
  { value: "3", label: "3 Bulan" },
  { value: "6", label: "6 Bulan" },
  { value: "12", label: "1 Tahun" },
  { value: "24", label: "2 Tahun" },
  { value: "60", label: "5 Tahun" },
];

export function PricingSection({ onSelectTier, onProceedToOnboarding, sellerConfig: propConfig }: PricingSectionProps) {
  const [sellerConfig, setSellerConfig] = useState<SellerConfig>(() => propConfig || loadSellerConfig());

  useEffect(() => {
    if (propConfig) {
      setSellerConfig(propConfig);
    }
  }, [propConfig]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSellerConfig(e.detail);
    };
    window.addEventListener('seller-config-updated', handleUpdate);
    return () => window.removeEventListener('seller-config-updated', handleUpdate);
  }, []);

  const tiers = sellerConfig.pricingTiers;

  const [selectedDuration, setSelectedDuration] = useState<string>("12"); // Default 1 Tahun
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<PricingTier>(tiers.find((t) => !t.isFree) || tiers[0]);

  // Deteksi URL query param (?checkout=free_trial atau ?checkout=starter) dari demo app
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const checkoutParam = params.get('checkout') || params.get('tier');
      if (checkoutParam) {
        const found = tiers.find(
          (t) =>
            t.id.toLowerCase() === checkoutParam.toLowerCase() ||
            (checkoutParam === 'free' && t.isFree) ||
            (checkoutParam === 'free_trial' && t.isFree) ||
            (checkoutParam === 'starter' && t.id === 'starter')
        );
        if (found) {
          setActiveTier(found);
          const durParam = params.get('duration') || params.get('durasi');
          if (durParam && DURATION_OPTIONS.some((d) => d.value === durParam)) {
            setSelectedDuration(durParam);
          }
          setCheckoutModalOpen(true);
        }
      }
    } catch (_) {}
  }, []);

  const handleSelectTier = (tier: PricingTier) => {
    setActiveTier(tier);
    if (sellerConfig.paymentMode === 'whatsapp' && !tier.isFree) {
      const durLabel = DURATION_OPTIONS.find((d) => d.value === selectedDuration)?.label || `${selectedDuration} Bulan`;
      const text = `Halo Tim ${sellerConfig.brandName}, saya tertarik untuk memesan paket *${tier.name} (${durLabel})*. Bisa info pembayaran & aktivasinya?`;
      window.open(`https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
      onSelectTier?.(tier);
    } else {
      setCheckoutModalOpen(true);
      onSelectTier?.(tier);
    }
  };

  return (
    <section id="harga" className="py-16 sm:py-24 px-4 sm:px-6 bg-zinc-50/60 border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto">
        {/* BANNER PROMO */}
        {sellerConfig.isPromoActive && (
          <div className="mb-8 max-w-xl mx-auto p-3 rounded-xl bg-white border border-zinc-200/90 text-center shadow-xs">
            <span className="font-semibold text-xs text-[#a9484c] tracking-wide flex items-center justify-center gap-2">
              <Tag className="size-4 shrink-0 text-[#a9484c]" />
              {sellerConfig.promoBannerText}
            </span>
          </div>
        )}

        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-3">
            Harga
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-tight">
            Mulai hemat, tanpa biaya bulanan tak terduga
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Pilih paket yang cocok dengan skala workspace Anda. Server & database berkecepatan tinggi ditangani penuh oleh tim kami.
          </p>

          {/* Single-line horizontal scrollable selector, no badges, no multi-row wrap */}
          <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 p-1 bg-white rounded-xl max-w-xl mx-auto border border-zinc-200 shadow-2xs mt-6 w-full justify-start sm:justify-center px-1.5">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedDuration(opt.value)}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#a9484c] text-white shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Cards: Smooth horizontal scroll on mobile, responsive grid on desktop (1 Brand Header + 3 Tiers) */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:gap-0 md:divide-x divide-zinc-200/80 rounded-2xl border border-zinc-200/90 shadow-xs bg-white">
          {/* Header Left Brand Card */}
          <div className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center rounded-2xl md:rounded-none flex flex-col justify-between bg-zinc-900 text-white p-6 sm:p-7 md:col-span-2 lg:col-span-1">
            <div>
              <p className="mb-2 text-xs font-bold text-[#cf807c] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> AKUGAWE SAAS
              </p>
              <h3 className="font-bold text-xl sm:text-2xl leading-tight text-white tracking-tight">
                Langganan hemat tanpa ribet
              </h3>
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                Semua paket sudah termasuk presensi selfie, geofence radius, dan slip gaji otomatis. Paket Business Pro dilengkapi fitur Canvasing Sales & Kunjungan Toko.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0" /> Free Tier 4 Bulan (Rp 0)
              </div>
              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0" /> Starter Mulai Rp 15rb/bln
              </div>
              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0" /> Canvasing & Kunjungan Sales (Pro)
              </div>
              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0" /> Anti-Fake GPS & PWA Mobile
              </div>
              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400 shrink-0" /> Otomasi Slip Gaji PDF
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              selectedDuration={selectedDuration}
              isPromoActive={sellerConfig.isPromoActive}
              paymentMode={sellerConfig.paymentMode}
              onSelect={() => handleSelectTier(tier)}
            />
          ))}
        </div>

        {/* CHECKOUT MODAL POP-UP */}
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          selectedTier={activeTier}
          selectedDurationMonths={Number(activeTier.isFree ? 4 : selectedDuration)}
          sellerConfig={sellerConfig}
          onProceedToOnboarding={onProceedToOnboarding}
        />
      </div>
    </section>
  );
}

function PricingCard({
  tier,
  selectedDuration,
  isPromoActive,
  paymentMode,
  onSelect,
}: {
  tier: PricingTier;
  selectedDuration: string;
  isPromoActive: boolean;
  paymentMode: 'whatsapp' | 'pakasir' | 'qris_manual' | 'hybrid';
  onSelect: () => void;
}) {
  const isFree = Boolean(tier.isFree);
  const durNum = Number(selectedDuration);

  // Kalkulasi harga berdasarkan durasi
  let displayPriceMonthly = 15000;
  let totalBilled = 15000;
  let durationLabel = `${durNum} Bulan`;

  if (isFree) {
    displayPriceMonthly = 0;
    totalBilled = 0;
    durationLabel = "4 Bulan Penuh";
  } else if (tier.pricing && tier.pricing[selectedDuration]) {
    const p = tier.pricing[selectedDuration];
    totalBilled = isPromoActive ? p.promoRp : p.normalRp;
    displayPriceMonthly = Math.round(totalBilled / durNum);
    durationLabel = p.label;
  } else {
    displayPriceMonthly = isPromoActive ? tier.promoPriceRp : tier.normalPriceRp;
    totalBilled = displayPriceMonthly * durNum;
  }

  const employeeLimitDisplay =
    tier.maxEmployees === -1
      ? "Unlimited Karyawan"
      : `Maks ${tier.maxEmployees} Karyawan`;

  return (
    <div
      className={`w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center rounded-2xl md:rounded-none border md:border-0 border-zinc-200/80 shadow-xs md:shadow-none flex flex-col justify-between p-6 sm:p-7 transition-all ${
        tier.isPopular ? "bg-[#fbf2f0]/60 ring-2 ring-inset ring-[#a9484c]" : "bg-white"
      }`}
    >
      <div>
        {/* Tier Header */}
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-bold uppercase tracking-wider ${tier.isPopular ? 'text-[#a9484c]' : 'text-slate-600'}`}>
            {tier.name}
          </p>
        </div>

        {/* Price Block */}
        <div className="mb-3">
          {isFree ? (
            <div>
              <div className="flex items-baseline gap-1">
                <h3 className="font-black text-3xl font-mono text-emerald-600">
                  Rp 0
                </h3>
                <span className="text-slate-500 text-xs font-semibold">/ 4 Bulan</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                ✓ Gratis Tanpa Kartu Kredit
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <h3 className="font-black text-2xl sm:text-3xl font-mono text-slate-900">
                  Rp {displayPriceMonthly.toLocaleString("id-ID")}
                </h3>
                <span className="text-slate-500 text-xs font-medium">/ bulan</span>
              </div>
              <span className="text-slate-500 text-[11px] block mt-0.5 font-medium">
                Ditagih Rp {totalBilled.toLocaleString("id-ID")} per {durationLabel}
              </span>
            </div>
          )}
        </div>

        {/* Max Employee Inline Info */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-zinc-600 font-semibold">
          <Users className="size-3.5 text-[#a9484c]" />
          <span>{employeeLimitDisplay}</span>
        </div>

        <p className="mb-6 line-clamp-2 text-xs text-slate-600 leading-relaxed min-h-[32px]">
          {tier.description}
        </p>

        {/* CTA Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onSelect}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
              isFree
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                : tier.isPopular
                ? "bg-[#a9484c] hover:bg-[#8f3b3f] text-white shadow-[#a9484c]/20"
                : "bg-white hover:bg-slate-50 text-slate-800 border border-[#f0dbd8]"
            }`}
          >
            {isFree ? (
              <>
                <Zap className="size-3.5" />
                Mulai 4 Bulan Gratis
              </>
            ) : paymentMode === 'whatsapp' ? (
              <>
                <MessageCircle className="size-3.5" />
                Pesan via WhatsApp
              </>
            ) : (
              <>
                <QrCode className="size-3.5" />
                Pilih Paket & Checkout
              </>
            )}
          </button>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2.5 pt-5 border-t border-[#f0dbd8]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            FASILITAS PAKET:
          </p>

          {tier.features.map((feature, idx) => {
            const isCanvasingFeature =
              feature.toLowerCase().includes('canvasing') ||
              feature.toLowerCase().includes('kunjungan toko');
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 text-xs leading-relaxed ${
                  isCanvasingFeature
                    ? 'p-2 -mx-2 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 font-semibold'
                    : 'text-slate-700'
                }`}
              >
                <Check
                  className={`size-3.5 shrink-0 mt-0.5 ${
                    isCanvasingFeature ? 'text-indigo-600' : 'text-emerald-600'
                  }`}
                />
                <span>{feature}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
