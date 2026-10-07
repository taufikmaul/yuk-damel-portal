import { useState } from "react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Check, Sparkles, MessageCircle, QrCode } from "lucide-react";
import { PricingTier, loadSellerConfig } from "@/services/config";
import { CheckoutModal } from "./CheckoutModal";

interface PricingSectionProps {
  onSelectTier?: (tier: PricingTier) => void;
  onProceedToOnboarding?: (token: string) => void;
}

export function PricingSection({ onSelectTier, onProceedToOnboarding }: PricingSectionProps) {
  const sellerConfig = loadSellerConfig();
  const tiers = sellerConfig.pricingTiers;

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<PricingTier>(tiers[1] || tiers[0]);

  const handleSelectTier = (tier: PricingTier) => {
    setActiveTier(tier);
    if (sellerConfig.paymentMode === 'whatsapp') {
      const text = `Halo Tim ${sellerConfig.brandName}, saya tertarik untuk memesan paket *${tier.name}* (Beli Putus). Bisa info rekening pembayaran & aktivasinya?`;
      window.open(`https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
      onSelectTier?.(tier);
    } else {
      setCheckoutModalOpen(true);
      onSelectTier?.(tier);
    }
  };

  return (
    <section id="harga" className="mx-auto min-h-screen max-w-6xl place-content-center border-x border-slate-800/80 py-16 px-4 sm:px-6">
      {/* BANNER PROMO */}
      {sellerConfig.isPromoActive && (
        <div className="mb-8 max-w-2xl mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-center shadow-lg shadow-amber-500/5">
          <span className="font-extrabold text-xs sm:text-sm text-amber-300 tracking-wide flex items-center justify-center gap-2">
            <Sparkles className="size-4 shrink-0 text-amber-400" />
            {sellerConfig.promoBannerText}
          </span>
        </div>
      )}

      {/* HIGHLIGHT FASILITAS TERIMA BERES */}
      {sellerConfig.managedSetupEnabled && (
        <div className="mb-10 max-w-3xl mx-auto p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Tersedia Fasilitas: VIP Setup Terima Beres</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  +Rp {sellerConfig.managedSetupPriceRp.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bagi pengusaha non-teknis: Tim kami yang siapkan akun Cloudflare, domain, & database sampai live siap pakai.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 whitespace-nowrap bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            ✓ Bisa Dipilih Saat Checkout
          </span>
        </div>
      )}

      <div className="relative">
        <FullWidthDivider position="top" />
        <FullWidthDivider position="bottom" />

        <div className="grid grid-cols-1 gap-px bg-slate-800 md:grid-cols-2 lg:grid-cols-4 rounded-3xl overflow-hidden border border-slate-800">
          {/* Header Left Card */}
          <div className="flex flex-col justify-between bg-slate-950 p-6 sm:p-8 md:col-span-2 lg:col-span-1">
            <div>
              <p className="mb-4 text-xs font-bold text-[#e57f8e] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> PAKET BELI PUTUS
              </p>
              <h2 className="font-extrabold text-2xl sm:text-4xl leading-tight text-white tracking-tight">
                Investasi Sekali Bayar Selamanya
              </h2>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                Tanpa iuran bulanan per kepala, tanpa biaya lisensi per tahun. Sistem 100% mandiri berjalan di Cloudflare Free Tier bisnis Anda.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="size-3.5" /> Free Serverless Cloud Hosting
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="size-3.5" /> Full Database D1 Ownership
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="size-3.5" /> Garansi First-Run Wizard
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isPromoActive={sellerConfig.isPromoActive}
              paymentMode={sellerConfig.paymentMode}
              onSelect={() => handleSelectTier(tier)}
            />
          ))}
        </div>
      </div>

      {/* CHECKOUT MODAL POP-UP */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        selectedTier={activeTier}
        sellerConfig={sellerConfig}
        onProceedToOnboarding={onProceedToOnboarding}
      />
    </section>
  );
}

function PricingCard({
  tier,
  isPromoActive,
  paymentMode,
  onSelect,
}: {
  tier: PricingTier;
  isPromoActive: boolean;
  paymentMode: 'whatsapp' | 'pakasir' | 'qris_manual' | 'hybrid';
  onSelect: () => void;
}) {
  const currentPrice = isPromoActive ? tier.promoPriceRp : tier.normalPriceRp;

  return (
    <div
      className={`flex flex-col justify-between bg-slate-950 p-6 sm:p-8 transition-colors ${
        tier.isPopular ? "bg-slate-900/60 ring-1 ring-inset ring-[#e57f8e]/50" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {tier.name}
          </p>
          {tier.badge && (
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                tier.isPopular
                  ? "bg-[#e57f8e] text-white"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              {tier.badge}
            </span>
          )}
        </div>

        <div className="mb-2">
          {isPromoActive && tier.normalPriceRp > tier.promoPriceRp && (
            <div className="text-xs text-slate-500 line-through font-mono mb-0.5">
              Rp {tier.normalPriceRp.toLocaleString("id-ID")}
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <h3 className="font-extrabold text-2xl sm:text-3xl font-mono text-white">
              Rp {currentPrice.toLocaleString("id-ID")}
            </h3>
          </div>
          <span className="text-slate-500 text-[11px] block mt-0.5">
            / Sekali Bayar Selamanya
          </span>
        </div>

        <p className="mb-6 line-clamp-2 text-xs text-slate-400 leading-relaxed min-h-[32px]">
          {tier.description}
        </p>

        <div className="mb-6">
          <button
            type="button"
            onClick={onSelect}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              tier.isPopular
                ? "bg-[#e57f8e] hover:bg-[#d66b7a] text-white shadow-[#e57f8e]/20"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            {paymentMode === 'whatsapp' ? (
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

        <div className="space-y-3 pt-6 border-t border-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            FITUR & FASILITAS:
          </p>

          {tier.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed"
            >
              <Check className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
