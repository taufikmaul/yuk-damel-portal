import { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, X, Smartphone } from 'lucide-react';
import { Magnet } from './reactbits/Magnet';

interface FloatingCtaBarProps {
  dashboardUrl: string;
  appUrl: string;
  waLink: string;
}

export function FloatingCtaBar({ dashboardUrl, appUrl, waLink }: FloatingCtaBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 400px
      if (window.scrollY > 400 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <aside aria-label="Aksi Cepat" className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 pl-1">
          <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              akugawe • Sekali Beli Selamanya
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Server Rp 0 / Bln
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Absen selfie anti-titip & rekap gaji otomatis tanpa tagihan bulanan.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`${dashboardUrl}/login`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="size-3.5 text-amber-400" />
            <span className="hidden md:inline">Demo Bos</span>
            <span className="md:hidden">Demo</span>
          </a>

          <a
            href={`${appUrl}/login`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone className="size-3.5 text-purple-400" />
            <span>Demo HP Staf</span>
          </a>

          <Magnet magnetStrength={3}>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="size-3.5" />
              <span>Chat WhatsApp</span>
            </a>
          </Magnet>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            title="Tutup banner"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
