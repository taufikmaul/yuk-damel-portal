import { useState, useEffect, lazy, Suspense } from 'react';
import { Logo } from './assets/logo';
import {
  Sparkles,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  XCircle,
  Smartphone,
  TrendingDown,
  Users,
  MessageCircle,
  HelpCircle,
  Key,
} from 'lucide-react';
import {
  Squares,
  ClickSpark,
  SpotlightCard,
  TiltedCard,
  ShinyText,
  StarBorder,
  Magnet,
  CountUp,
} from './components/reactbits';
import { PricingSection } from './components/pricing-section';
import { InteractiveDemoShowcase } from './components/InteractiveDemoShowcase';
import { AiAgentShowcase } from './components/AiAgentShowcase';
import { FeatureTabsSection } from './components/FeatureTabsSection';
import { FloatingCtaBar } from './components/FloatingCtaBar';
import { loadSellerConfig } from './services/config';

const OnboardingPage = lazy(() =>
  import('./components/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const AdminPortalPage = lazy(() =>
  import('./components/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage }))
);

export function App() {
  const sellerConfig = loadSellerConfig();
  const dashboardUrl = sellerConfig.demoDashboardUrl || import.meta.env.VITE_DASHBOARD_URL || 'https://dash-ngabsen.historycake.com';
  const appUrl = sellerConfig.demoAppUrl || import.meta.env.VITE_APP_URL || 'https://ngabsen.historycake.com';

  // Routing view: 'landing' | 'onboarding' | 'admin'
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    // 1. Explicit onboarding query or path in URL
    if (params.get('onboarding') === 'true' || pathname.startsWith('/onboarding')) {
      return 'onboarding';
    }

    // 2. Fallback session storage: if user refreshed while in onboarding
    const savedView = sessionStorage.getItem('ngabsen_current_view');
    if (savedView === 'onboarding') {
      return 'onboarding';
    }

    // 3. Admin portal URL
    if (pathname.startsWith('/salesAdmin')) {
      return 'admin';
    }

    // 4. Fallback session storage for admin
    if (savedView === 'admin' && pathname.startsWith('/salesAdmin')) {
      return 'admin';
    }

    return 'landing';
  });

  const [activeToken, setActiveToken] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) return token;
    return sessionStorage.getItem('ngabsen_active_token') || '';
  });

  // Keep state and sessionStorage synchronized with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setActiveToken(token);
      sessionStorage.setItem('ngabsen_active_token', token);
    }
  }, []);

  // Sync sessionStorage whenever currentView or activeToken changes
  useEffect(() => {
    sessionStorage.setItem('ngabsen_current_view', currentView);
    if (activeToken) {
      sessionStorage.setItem('ngabsen_active_token', activeToken);
    }
  }, [currentView, activeToken]);

  // Handle browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname;
      const token = params.get('token') || sessionStorage.getItem('ngabsen_active_token') || '';
      setActiveToken(token);

      if (params.get('onboarding') === 'true' || pathname.startsWith('/onboarding')) {
        setCurrentView('onboarding');
      } else if (pathname.startsWith('/salesAdmin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Kalkulator hemat biaya
  const [employeeCount, setEmployeeCount] = useState<number>(20);
  const [saasPricePerUser, setSaasPricePerUser] = useState<number>(30000); // Rp 30.000 / user / bulan

  const yearlySaaSCost = employeeCount * saasPricePerUser * 12;
  const threeYearSaaSCost = yearlySaaSCost * 3;
  const totalSavings = threeYearSaaSCost;

  const getWaLink = (tierName?: string) => {
    const text = tierName
      ? `Halo Tim ${sellerConfig.brandName}, saya tertarik untuk memesan paket *${tierName}*. Bisa info rekening pembayaran & cara aktivasinya?`
      : sellerConfig.defaultSalesMessage;
    return `https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  if (currentView === 'onboarding') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#faf6f5] flex items-center justify-center">
            <div className="size-8 rounded-full border-2 border-[#a9484c] border-t-transparent animate-spin" />
          </div>
        }
      >
        <OnboardingPage
          initialToken={activeToken}
          onBackToLanding={() => {
            setCurrentView('landing');
            sessionStorage.setItem('ngabsen_current_view', 'landing');
            window.history.pushState({ view: 'landing' }, '', '/');
          }}
        />
      </Suspense>
    );
  }

  if (currentView === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#faf6f5] flex items-center justify-center">
            <div className="size-8 rounded-full border-2 border-[#a9484c] border-t-transparent animate-spin" />
          </div>
        }
      >
        <AdminPortalPage
          onBackToLanding={() => {
            setCurrentView('landing');
            sessionStorage.setItem('ngabsen_current_view', 'landing');
            window.history.pushState({ view: 'landing' }, '', '/');
          }}
          onOpenOnboardingWithToken={(tok) => {
            setActiveToken(tok);
            setCurrentView('onboarding');
            sessionStorage.setItem('ngabsen_current_view', 'onboarding');
            sessionStorage.setItem('ngabsen_admin_mode', 'true');
            if (tok) sessionStorage.setItem('ngabsen_active_token', tok);
            const targetUrl = tok
              ? `/?onboarding=true&token=${encodeURIComponent(tok)}&admin=true`
              : '/?onboarding=true&admin=true';
            window.history.pushState({ view: 'onboarding', token: tok }, '', targetUrl);
          }}
        />
      </Suspense>
    );
  }

  return (
    <ClickSpark sparkColor="#a9484c" sparkSize={9} sparkRadius={30} sparkCount={10}>
      <div className="w-full min-h-screen bg-[#faf6f5] text-slate-800 font-sans selection:bg-[#a9484c]/20 selection:text-[#a9484c] overflow-x-hidden">
        {/* NAVBAR */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-[#f0dbd8] px-4 sm:px-8 py-3.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-white border border-[#f0dbd8] flex items-center justify-center p-1 shadow-xs">
                <Logo className="w-full h-full" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  akugawe
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#demo-roles" className="text-[#a9484c] hover:text-[#8f3b3f] font-semibold transition-colors">Demo Peran</a>
              <a href="#ai-agent" className="hover:text-[#a9484c] transition-colors">AI HR Agent</a>
              <a href="#fitur" className="hover:text-[#a9484c] transition-colors">Fitur Unggulan</a>
              <a href="#kalkulator" className="hover:text-[#a9484c] transition-colors">Kalkulator</a>
              <a href="#harga" className="hover:text-[#a9484c] transition-colors">Paket & Harga</a>
              <a href="#perbandingan" className="hover:text-[#a9484c] transition-colors">SaaS vs akugawe</a>
              <a href="#faq" className="hover:text-[#a9484c] transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-2.5">
              <Magnet magnetStrength={4}>
                <a
                  href={`${dashboardUrl}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#a9484c] hover:bg-[#8f3b3f] text-white shadow-md shadow-[#a9484c]/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>Coba Demo</span>
                </a>
              </Magnet>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6">
          {/* ReactBits: Squares Interactive Canvas Background */}
          <Squares
            direction="diagonal"
            speed={0.4}
            squareSize={46}
            borderColor="rgba(169, 72, 76, 0.08)"
            hoverFillColor="rgba(169, 72, 76, 0.06)"
            className="opacity-75 z-0"
          />

          {/* Glow Background Effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#f7e5e3]/70 via-[#fbf2f0]/60 to-transparent blur-[120px] pointer-events-none rounded-full z-0" />

          <div className="max-w-4xl mx-auto text-center relative z-10 pointer-events-auto">
            {/* ReactBits: ShinyText on Badge with Quick Feature Pills */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-[#f0dbd8] text-xs font-medium text-slate-700 mb-6 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <ShinyText text="Bebas Biaya Langganan Bulanan untuk UMKM Indonesia" speed={3} />
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-emerald-700 font-semibold hidden sm:inline">Server Rp 0/bln Cloudflare</span>
            </div>

            {/* Headline without TrueFocus animation */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.2] mb-6 flex flex-col items-center">
              <span className="block mb-2">Aplikasi Absensi & Gaji Karyawan</span>
              <span className="text-[#a9484c] my-1 font-black">
                Beli Sekali Tanpa Iuran
              </span>
              <span className="bg-gradient-to-r from-[#ba5d62] via-[#a9484c] to-[#773236] bg-clip-text text-transparent mt-2">
                Biaya Server Rp 0 Selamanya
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
              Gak perlu lagi bayar sewa bulanan tiap nambah karyawan. Absen selfie anti-fake GPS, hitung gaji & lembur otomatis, plus asisten AI praktis untuk bantu rekap absensi usaha Anda.
            </p>

            {/* CTA Buttons with ReactBits: Magnet & StarBorder */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <a
                href="#demo-roles"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#a9484c] to-[#8f3b3f] text-white font-bold text-sm shadow-xl shadow-[#a9484c]/25 hover:shadow-[#a9484c]/35 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Sparkles className="size-4" />
                <span>Coba Demo Gratis (1-Klik)</span>
              </a>

              <a
                href={`${appUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#f0dbd8] text-slate-800 font-semibold text-sm shadow-xs hover:border-[#cf807c] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="size-4 text-purple-600" />
                <span>Coba Aplikasi HP</span>
              </a>

              <StarBorder
                as="a"
                href={getWaLink()}
                target="_blank"
                rel="noreferrer"
                color="#059669"
                speed="3.5s"
                className="cursor-pointer"
              >
                <MessageCircle className="size-4 text-emerald-600" />
                <span>Chat WhatsApp</span>
              </StarBorder>
            </div>

            {/* ReactBits: TiltedCard Metric Badges with CountUp */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-center items-center justify-center">
              <TiltedCard maxTilt={10} glare={true}>
                <div className="p-4 rounded-2xl bg-white border border-[#f0dbd8] shadow-xs h-full">
                  <div className="text-2xl font-black text-emerald-700 mb-0.5">
                    Rp 0
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Biaya Server Bulanan</div>
                </div>
              </TiltedCard>

              <TiltedCard maxTilt={10} glare={true}>
                <div className="p-4 rounded-2xl bg-white border border-[#f0dbd8] shadow-xs h-full">
                  <div className="text-2xl font-black text-slate-900 mb-0.5">
                    <CountUp to={3} suffix=" Menit" duration={1.5} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Setup Kantor Pertama</div>
                </div>
              </TiltedCard>

              <TiltedCard maxTilt={10} glare={true}>
                <div className="p-4 rounded-2xl bg-white border border-[#f0dbd8] shadow-xs h-full">
                  <div className="text-2xl font-black text-[#a9484c] mb-0.5">
                    <CountUp to={100} suffix="%" duration={1.5} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Privasi Data & Milik Anda</div>
                </div>
              </TiltedCard>
            </div>
          </div>
        </section>

        {/* INTERACTIVE MULTI-ROLE DEMO SHOWCASE */}
        <InteractiveDemoShowcase dashboardUrl={dashboardUrl} appUrl={appUrl} />

        {/* AUTONOMOUS AI AGENT & MCP SHOWCASE */}
        <AiAgentShowcase />

        {/* KALKULATOR HEMAT BIAYA */}
        <section id="kalkulator" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-y border-[#f0dbd8]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#fbf2f0] text-[#a9484c] text-xs font-semibold mb-3 border border-[#f0dbd8]">
                <Calculator className="size-3.5" />
                <ShinyText text="Simulasi Penghematan Dana UMKM" speed={4} />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Berapa Biaya yang Bisa Anda Hemat?
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                Bandingkan biaya sewa aplikasi per orang tiap bulan dengan sekali beli pakai akugawe.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* ReactBits: SpotlightCard for Input Controls */}
              <div className="lg:col-span-6">
                <SpotlightCard
                  spotlightColor="rgba(169, 72, 76, 0.08)"
                  className="p-6 sm:p-8 space-y-6 bg-white border border-[#f0dbd8] rounded-3xl shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#fbf2f0] text-[#a9484c] border border-[#f0dbd8]">
                          <Users className="size-3.5" />
                        </span>
                        <span>Jumlah Karyawan Anda:</span>
                      </label>
                      <span className="text-base font-black text-[#8f3b3f] bg-[#fbf2f0] px-3.5 py-1 rounded-xl border border-[#f0dbd8] shadow-xs">
                        {employeeCount} Orang
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#a9484c]"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold mt-1.5">
                      <span>5 Orang</span>
                      <span>25 Orang</span>
                      <span>50 Orang</span>
                      <span>100 Orang</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#fbf2f0] text-amber-600 border border-[#f0dbd8]">
                          <TrendingDown className="size-3.5" />
                        </span>
                        <span>Perkiraan Biaya Sewa per Karyawan / Bulan:</span>
                      </label>
                      <span className="text-xs font-extrabold text-[#8f3b3f]">
                        Rp {saasPricePerUser.toLocaleString('id-ID')} / orang
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[20000, 30000, 50000].map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setSaasPricePerUser(price)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            saasPricePerUser === price
                              ? 'bg-[#a9484c] text-white border-[#8f3b3f] shadow-md shadow-[#a9484c]/20'
                              : 'bg-[#faf6f5] text-slate-700 border-[#f0dbd8] hover:bg-white hover:border-[#a9484c]/40'
                          }`}
                        >
                          Rp {price.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fbf2f0] border border-[#f0dbd8] text-xs text-slate-700 leading-relaxed shadow-xs flex items-start gap-2.5">
                    <span className="text-base leading-none">💡</span>
                    <div>
                      <strong className="text-slate-900 font-bold">Hemat Maksimal:</strong> Aplikasi berjalan di server gratis Cloudflare (hingga <strong className="text-[#8f3b3f]">100.000 akses/hari</strong>), sangat cukup untuk toko atau kantor Anda tanpa harus bayar biaya server bulanan.
                    </div>
                  </div>
                </SpotlightCard>
              </div>

              {/* ReactBits: SpotlightCard for Results */}
              <div className="lg:col-span-6">
                <SpotlightCard
                  spotlightColor="rgba(255, 255, 255, 0.2)"
                  className="p-6 sm:p-8 bg-gradient-to-br from-[#ba5d62] via-[#a9484c] to-[#8f3b3f] text-white border border-[#8f3b3f] shadow-2xl shadow-[#a9484c]/25 rounded-3xl relative overflow-hidden"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-xs mb-3">
                    <ShieldCheck className="size-3.5 text-rose-200" />
                    <span>Uang yang Bisa Anda Hemat</span>
                  </div>

                  <div className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                    <CountUp
                      to={totalSavings}
                      prefix="Rp "
                      duration={1}
                      separator="."
                      className="text-white"
                    />
                    <span className="text-xs font-medium text-rose-100 block mt-1">
                      Total uang usaha yang terselamatkan dalam 3 tahun
                    </span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/20 text-xs">
                    <div className="flex items-center justify-between text-rose-100 py-0.5">
                      <span>Jika Sewa 1 Tahun ({employeeCount} staf):</span>
                      <span className="line-through text-rose-200/80 font-semibold">
                        <CountUp to={yearlySaaSCost} prefix="Rp " duration={0.8} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-rose-100 py-0.5">
                      <span>Jika Sewa 3 Tahun ({employeeCount} staf):</span>
                      <span className="line-through text-rose-200/80 font-semibold">
                        <CountUp to={threeYearSaaSCost} prefix="Rp " duration={0.8} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white font-bold pt-2.5 border-t border-white/20">
                      <span>Biaya Pakai akugawe:</span>
                      <span className="text-xs font-black bg-white text-[#8f3b3f] px-3 py-1 rounded-full shadow-xs">
                        Rp 0 / bulan
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Magnet magnetStrength={3} className="w-full">
                      <a
                        href={getWaLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3.5 rounded-xl bg-white hover:bg-[#faf6f5] text-[#8f3b3f] font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg hover:shadow-xl"
                      >
                        <MessageCircle className="size-4" />
                        Beli Sekali & Mulai Hemat Sekarang
                      </a>
                    </Magnet>
                  </div>
                </SpotlightCard>
              </div>
            </div>
          </div>
        </section>

        {/* FITUR UNGGULAN DINAMIS (DYNAMIC TABS) */}
        <FeatureTabsSection />

        {/* PRICING TIERS & PROMO SECTION (@efferd/pricing-2) */}
        <PricingSection
          onProceedToOnboarding={(token) => {
            setActiveToken(token);
            setCurrentView('onboarding');
            window.history.pushState({}, '', `/?onboarding=true&token=${token}`);
          }}
        />

        {/* PERBANDINGAN SAAS VS AKUGAWE */}
        <section id="perbandingan" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#faf6f5] border-t border-[#f0dbd8]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mengapa akugawe Lebih Menguntungkan?
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Perbandingan objektif antara aplikasi absensi sewa (SaaS) vs akugawe.
              </p>
            </div>

            <SpotlightCard
              spotlightColor="rgba(169, 72, 76, 0.08)"
              className="overflow-x-auto rounded-3xl border border-[#f0dbd8] bg-white shadow-xs"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#f0dbd8] bg-[#fbf2f0]">
                    <th className="p-4 sm:p-5 font-bold text-slate-800">Aspek Evaluasi</th>
                    <th className="p-4 sm:p-5 font-bold text-rose-600">Aplikasi Absensi SaaS (Sewa)</th>
                    <th className="p-4 sm:p-5 font-bold text-[#a9484c] bg-[#fbf2f0]">akugawe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0dbd8] text-slate-700">
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-slate-900">Biaya Langganan Bulanan</td>
                    <td className="p-4 sm:p-5 text-rose-600 flex items-center gap-1.5">
                      <XCircle className="size-4 shrink-0 text-rose-500" />
                      Rp 25.000 - Rp 50.000 / staf / bulan
                    </td>
                    <td className="p-4 sm:p-5 text-[#a9484c] font-bold bg-[#fbf2f0]/30">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        Rp 0 / bulan (Gratis Cloudflare Free Tier)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-slate-900">Biaya Tambah Karyawan Baru</td>
                    <td className="p-4 sm:p-5 text-rose-600/90">
                      Tagihan membengkak otomatis tiap rekrut staf baru
                    </td>
                    <td className="p-4 sm:p-5 text-[#a9484c] font-bold bg-[#fbf2f0]/30">
                      Gratis & Tanpa Batas (Bebas tambah karyawan)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-slate-900">Kepemilikan Data & Privasi</td>
                    <td className="p-4 sm:p-5 text-slate-500">
                      Tersimpan di server vendor bersama ribuan perusahaan lain
                    </td>
                    <td className="p-4 sm:p-5 text-[#a9484c] font-bold bg-[#fbf2f0]/30">
                      100% di akun Cloudflare privat milik Anda
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-slate-900">Ketergantungan Vendor</td>
                    <td className="p-4 sm:p-5 text-slate-500">
                      Jika vendor menaikkan harga sepihak, Anda terpaksa bayar
                    </td>
                    <td className="p-4 sm:p-5 text-[#a9484c] font-bold bg-[#fbf2f0]/30">
                      Nol ketergantungan. Sistem aktif selamanya
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-slate-900">Instalasi & Onboarding</td>
                    <td className="p-4 sm:p-5 text-slate-500">
                      Karyawan harus cari & download di PlayStore
                    </td>
                    <td className="p-4 sm:p-5 text-[#a9484c] font-bold bg-[#fbf2f0]/30">
                      Cukup 1 link PWA & First-Run Wizard 3 menit
                    </td>
                  </tr>
                </tbody>
              </table>
            </SpotlightCard>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#faf6f5] border-t border-[#f0dbd8]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white text-[#a9484c] text-xs font-semibold mb-3 border border-[#f0dbd8] shadow-xs">
                <HelpCircle className="size-3.5 text-[#a9484c]" />
                <span>Pusat Informasi & Tanya Jawab</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                Semua yang perlu Anda ketahui mengenai akugawe & teknologi Cloudflare.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'Benarkah biaya servernya Rp 0 / bulan?',
                  a: 'Ya, 100% benar. akugawe dibangun di atas ekosistem Cloudflare Serverless (Workers, D1 SQLite, KV, dan Pages). Kuota gratis Cloudflare menyediakan hingga 100.000 requests per hari dan 5 juta pembacaan database per hari. Untuk operasional UMKM dengan 5 hingga 100 karyawan, kuota ini tidak akan habis dan tetap gratis selamanya.',
                },
                {
                  q: 'Apakah saya membutuhkan server VPS atau programmer khusus?',
                  a: 'Tidak sama sekali. Sistem sudah kami sediakan dengan First-Run Setup Wizard. Begitu instance Anda aktif, Anda cukup membuka link dashboard dan mengisi nama kantor, titik GPS, dan shift dalam 3 menit.',
                },
                {
                  q: 'Bagaimana jika karyawan saya menggunakan iPhone dan Android berbeda?',
                  a: 'akugawe menggunakan standar Progressive Web App (PWA). Karyawan Android cukup membukanya di Google Chrome dan menekan "Tambahkan ke Layar Utama". Karyawan iPhone membukanya di Safari dan menekan "Add to Home Screen". Tanpa perlu registrasi akun Google Play atau Apple ID.',
                },
                {
                  q: 'Apakah bisa ekspor laporan ke Excel atau PDF?',
                  a: 'Tentu saja. Data rekap absensi harian, bulanan, riwayat keterlambatan, hingga rekap slip gaji dan PPh 21 dapat diunduh dalam format Excel (CSV) dan PDF siap cetak kapan saja.',
                },
              ].map((faq, idx) => (
                <SpotlightCard
                  key={idx}
                  spotlightColor="rgba(169, 72, 76, 0.08)"
                  className="p-5 sm:p-6 bg-white border border-[#f0dbd8] rounded-2xl shadow-xs hover:border-[#a9484c]/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="size-8 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center shrink-0 mt-0.5 text-[#a9484c]">
                      <HelpCircle className="size-4" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {faq.q}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-[#fbf2f0] to-white border-t border-[#f0dbd8]">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              <ShinyText text="Mulai Hemat Anggaran HR Perusahaan Anda Hari Ini" speed={4} />
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Coba demo langsung tanpa komitmen apa pun, atau diskusikan kebutuhan kantor Anda dengan tim kami.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Magnet magnetStrength={3}>
                <a
                  href={`${dashboardUrl}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#a9484c] to-[#8f3b3f] text-white font-bold text-sm shadow-xl shadow-[#a9484c]/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>Buka Live Demo Sekarang</span>
                </a>
              </Magnet>

              <Magnet magnetStrength={3}>
                <StarBorder
                  as="a"
                  href={getWaLink()}
                  target="_blank"
                  rel="noreferrer"
                  color="#059669"
                  speed="3.5s"
                  className="cursor-pointer"
                >
                  <MessageCircle className="size-4 text-emerald-600" />
                  <span>Hubungi via WhatsApp</span>
                </StarBorder>
              </Magnet>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#f0dbd8] bg-[#faf6f5] py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
          <p>© 2026 akugawe. Aplikasi Presensi Biometrik & Penggajian Mandiri UMKM Indonesia.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="text-slate-500">Dioptimalkan khusus untuk Cloudflare Edge</span>
            <a
              href="/salesAdmin"
              className="text-[11px] text-slate-500 hover:text-[#a9484c] flex items-center gap-1 transition"
            >
              <Key className="size-3" /> Area Penjual / Onboarding
            </a>
          </div>
        </footer>

        {/* FLOATING QUICK CTA BAR */}
        <FloatingCtaBar dashboardUrl={dashboardUrl} appUrl={appUrl} waLink={getWaLink()} />
      </div>
    </ClickSpark>
  );
}

export default App;
