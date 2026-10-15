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
      const text = `Halo Tim ${sellerConfig.brandName}, saya tertarik untuk memesan paket *${tier.name}*. Bisa info rekening pembayaran & aktivasinya?`;
      window.open(`https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
      onSelectTier?.(tier);
    } else {
      setCheckoutModalOpen(true);
      onSelectTier?.(tier);
    }
  };

  return (
    <section id="harga" className="mx-auto min-h-screen max-w-6xl place-content-center border-x border-[#f0dbd8] py-16 px-4 sm:px-6">
      {/* BANNER PROMO */}
      {sellerConfig.isPromoActive && (
        <div className="mb-8 max-w-2xl mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-[#fbf2f0] via-[#f7e5e3] to-[#fbf2f0] border border-[#f0dbd8] text-center shadow-xs">
          <span className="font-extrabold text-xs sm:text-sm text-[#a9484c] tracking-wide flex items-center justify-center gap-2">
            <Sparkles className="size-4 shrink-0 text-[#a9484c]" />
            {sellerConfig.promoBannerText}
          </span>
        </div>
      )}

      {/* HIGHLIGHT FASILITAS TERIMA BERES */}
      {sellerConfig.managedSetupEnabled && (
        <div className="mb-10 max-w-3xl mx-auto p-4 rounded-2xl bg-white border border-[#f0dbd8] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Tersedia Fasilitas: VIP Setup Terima Beres</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#fbf2f0] text-[#a9484c] border border-[#f0dbd8]">
                  +Rp {sellerConfig.managedSetupPriceRp.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Bagi pengusaha non-teknis: Tim kami yang siapkan akun Cloudflare, domain, & database sampai live siap pakai.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            ✓ Bisa Dipilih Saat Checkout
          </span>
        </div>
      )}

      <div className="relative">
        <FullWidthDivider position="top" />
        <FullWidthDivider position="bottom" />

        <div className="grid grid-cols-1 gap-px bg-[#f0dbd8] md:grid-cols-2 lg:grid-cols-4 rounded-3xl overflow-hidden border border-[#f0dbd8]">
          {/* Header Left Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#a9484c] to-[#8f3b3f] text-white p-6 sm:p-8 md:col-span-2 lg:col-span-1">
            <div>
              <p className="mb-4 text-xs font-bold text-rose-100 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> PAKET RESMI AKUGAWE
              </p>
              <h2 className="font-extrabold text-2xl sm:text-4xl leading-tight text-white tracking-tight">
                Investasi Sekali Bayar Selamanya
              </h2>
              <p className="mt-4 text-xs text-rose-100/90 leading-relaxed">
                Tanpa iuran bulanan per kepala, tanpa biaya lisensi per tahun. Sistem 100% mandiri berjalan di Cloudflare Free Tier bisnis Anda.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 space-y-2">
              <div className="text-[11px] font-semibold text-rose-50 flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-300" /> Free Serverless Cloud Hosting
              </div>
              <div className="text-[11px] font-semibold text-rose-50 flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-300" /> Full Database D1 Ownership
              </div>
              <div className="text-[11px] font-semibold text-rose-50 flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-300" /> Garansi First-Run Wizard
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
      className={`flex flex-col justify-between p-6 sm:p-8 transition-colors ${
        tier.isPopular ? "bg-[#fbf2f0]/60 ring-2 ring-inset ring-[#a9484c]" : "bg-white"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className={`text-xs font-bold uppercase tracking-widest ${tier.isPopular ? 'text-[#a9484c]' : 'text-slate-500'}`}>
            {tier.name}
          </p>
          {tier.badge && (
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                tier.isPopular
                  ? "bg-[#a9484c] text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {tier.badge}
            </span>
          )}
        </div>

        <div className="mb-2">
          {isPromoActive && tier.normalPriceRp > tier.promoPriceRp && (
            <div className="text-xs text-slate-400 line-through font-mono mb-0.5">
              Rp {tier.normalPriceRp.toLocaleString("id-ID")}
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <h3 className="font-extrabold text-2xl sm:text-3xl font-mono text-slate-900">
              Rp {currentPrice.toLocaleString("id-ID")}
            </h3>
          </div>
          <span className="text-slate-500 text-[11px] block mt-0.5">
            / Sekali Bayar Selamanya
          </span>
        </div>

        <p className="mb-6 line-clamp-2 text-xs text-slate-600 leading-relaxed min-h-[32px]">
          {tier.description}
        </p>

        <div className="mb-6">
          <button
            type="button"
            onClick={onSelect}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
              tier.isPopular
                ? "bg-[#a9484c] hover:bg-[#8f3b3f] text-white shadow-[#a9484c]/20"
                : "bg-white hover:bg-slate-50 text-slate-800 border border-[#f0dbd8]"
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

        <div className="space-y-3 pt-6 border-t border-[#f0dbd8]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            FITUR & FASILITAS:
          </p>

          {tier.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
            >
              <Check className="size-3.5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
