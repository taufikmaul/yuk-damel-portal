import { useState, useEffect, lazy, Suspense } from 'react';
import { Logo } from './assets/logo';
import {
  Sparkles,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  XCircle,
  Smartphone,
  MapPin,
  Clock,
  TrendingDown,
  Users,
  MessageCircle,
  HelpCircle,
  Lock,
  CalendarCheck,
  Receipt,
  ExternalLink,
  Zap,
  Key,
} from 'lucide-react';
import {
  Squares,
  ClickSpark,
  SpotlightCard,
  TiltedCard,
  ShinyText,
  DecryptedText,
  SplitText,
  StarBorder,
  Magnet,
  CountUp,
} from './components/reactbits';
import { PricingSection } from './components/pricing-section';

const OnboardingPage = lazy(() =>
  import('./components/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const AdminPortalPage = lazy(() =>
  import('./components/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage }))
);

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://dash-ngabsen.historycake.com';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://ngabsen.historycake.com';
import { loadSellerConfig } from './services/config';

export function App() {
  const sellerConfig = loadSellerConfig();

  // Routing view: 'landing' | 'onboarding' | 'admin'
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') === 'true' || window.location.pathname.startsWith('/onboarding')) {
      return 'onboarding';
    }
    if (window.location.pathname.startsWith('/salesAdmin')) {
      return 'admin';
    }
    return 'landing';
  });

  const [activeToken, setActiveToken] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) setActiveToken(token);
  }, []);

  // Kalkulator hemat biaya
  const [employeeCount, setEmployeeCount] = useState<number>(20);
  const [saasPricePerUser, setSaasPricePerUser] = useState<number>(30000); // Rp 30.000 / user / bulan

  const yearlySaaSCost = employeeCount * saasPricePerUser * 12;
  const threeYearSaaSCost = yearlySaaSCost * 3;
  const totalSavings = threeYearSaaSCost;

  const getWaLink = (tierName?: string) => {
    const text = tierName
      ? `Halo Tim ${sellerConfig.brandName}, saya tertarik untuk memesan paket *${tierName}* (Beli Putus). Bisa info rekening pembayaran & cara aktivasinya?`
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
          onBackToLanding={() => setCurrentView('landing')}
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
          onBackToLanding={() => setCurrentView('landing')}
          onOpenOnboardingWithToken={(tok) => {
            setActiveToken(tok);
            setCurrentView('onboarding');
          }}
        />
      </Suspense>
    );
  }

  return (
    <ClickSpark sparkColor="#a9484c" sparkSize={9} sparkRadius={30} sparkCount={10}>
      <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#a9484c]/30 selection:text-white overflow-x-hidden">
        {/* NAVBAR */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-inner">
                <Logo className="w-full h-full" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                  akugawe
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Beli Putus
                  </span>
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <a href="#fitur" className="hover:text-white transition-colors">Fitur Unggulan</a>
              <a href="#harga" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Paket & Harga</a>
              <a href="#kalkulator" className="hover:text-white transition-colors">Kalkulator Hemat</a>
              <a href="#perbandingan" className="hover:text-white transition-colors">SaaS vs Beli Putus</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-2.5">
              <a
                href={`${DASHBOARD_URL}/login`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-1.5"
              >
                <span>Login Owner</span>
                <ExternalLink className="size-3 text-slate-500" />
              </a>

              <Magnet magnetStrength={4}>
                <a
                  href={`${DASHBOARD_URL}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-[#a9484c] to-[#8f3b3f] text-white shadow-lg shadow-[#a9484c]/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
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
            borderColor="rgba(255, 255, 255, 0.04)"
            hoverFillColor="rgba(169, 72, 76, 0.16)"
            className="opacity-75 z-0"
          />

          {/* Glow Background Effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#a9484c]/20 via-rose-950/20 to-transparent blur-[120px] pointer-events-none rounded-full z-0" />

          <div className="max-w-4xl mx-auto text-center relative z-10 pointer-events-auto">
            {/* ReactBits: ShinyText on Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShinyText text="Bebas Biaya Langganan Bulanan untuk UMKM Indonesia" speed={3} />
            </div>

            {/* ReactBits: SplitText Animation */}
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black text-white tracking-tight leading-[1.15] mb-6 flex flex-col">
              <SplitText text="Aplikasi Absensi & Payroll" delay={35} className="block mb-2" />
              <span className="bg-gradient-to-r from-[#e2aba7] via-[#a9484c] to-amber-200 bg-clip-text text-transparent">
                Sekali Beli, Biaya Server Rp 0 / Bulan
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              tanpa tagihan SaaS bulanan yang makin mahal tiap kali menambah karyawan.
              Sistem absensi selfie anti-fake GPS dan hitung gaji BPJS & PPh 21 otomatis.
            </p>

            {/* CTA Buttons with ReactBits: Magnet & StarBorder */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <a
                href={`${DASHBOARD_URL}/login`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#a9484c] to-[#8f3b3f] text-white font-bold text-sm shadow-xl shadow-[#a9484c]/25 hover:shadow-[#a9484c]/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <Sparkles className="size-4" />
                <span>Jelajahi Demo Owner (1-Klik)</span>
              </a>

              <a
                href={`${APP_URL}/login`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="size-4 text-purple-400" />
                <span>Coba Demo Karyawan (PWA)</span>
              </a>

              <StarBorder
                as="a"
                href={getWaLink()}
                target="_blank"
                rel="noreferrer"
                color="#10b981"
                speed="3.5s"
                className="cursor-pointer"
              >
                <MessageCircle className="size-4 text-emerald-400" />
                <span>Beli via WhatsApp</span>
              </StarBorder>
            </div>

            {/* ReactBits: TiltedCard Metric Badges with CountUp */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-center items-center justify-center">
              <TiltedCard maxTilt={10} glare={true}>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm h-full">
                  <div className="text-2xl font-black text-emerald-400 mb-0.5">
                    Rp 0
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Biaya Server Bulanan</div>
                </div>
              </TiltedCard>

              <TiltedCard maxTilt={10} glare={true}>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm h-full">
                  <div className="text-2xl font-black text-white mb-0.5">
                    <CountUp to={3} suffix=" Menit" duration={1.5} />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Setup Kantor Pertama</div>
                </div>
              </TiltedCard>

              <TiltedCard maxTilt={10} glare={true}>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm h-full">
                  <div className="text-2xl font-black text-[#a9484c] mb-0.5">
                    <CountUp to={100} suffix="%" duration={1.5} />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Privasi Data & Milik Anda</div>
                </div>
              </TiltedCard>
            </div>
          </div>
        </section>

        {/* KALKULATOR HEMAT BIAYA */}
        <section id="kalkulator" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#a9484c]/10 text-[#a9484c] text-xs font-semibold mb-3 border border-[#a9484c]/20">
                <Calculator className="size-3.5" />
                <ShinyText text="Simulasi Penghematan Dana UMKM" speed={4} />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Berapa Biaya yang Bisa Anda Hemat?
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
                Bandingkan biaya sewa aplikasi absensi berlangganan (SaaS) per kepala dengan kepemilikan mandiri sistem akugawe.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* ReactBits: SpotlightCard for Input Controls */}
              <div className="lg:col-span-6">
                <SpotlightCard
                  spotlightColor="rgba(169, 72, 76, 0.15)"
                  className="p-6 sm:p-8 space-y-6 bg-slate-900"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Users className="size-4 text-[#a9484c]" />
                        Jumlah Karyawan Anda:
                      </label>
                      <span className="text-lg font-black text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
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
                      className="w-full accent-[#a9484c] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-1">
                      <span>5 Orang</span>
                      <span>25 Orang</span>
                      <span>50 Orang</span>
                      <span>100 Orang</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <TrendingDown className="size-4 text-amber-400" />
                        Rata-rata Biaya SaaS per Karyawan / Bulan:
                      </label>
                      <span className="text-xs font-bold text-slate-200">
                        Rp {saasPricePerUser.toLocaleString('id-ID')} / staf
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[20000, 30000, 50000].map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setSaasPricePerUser(price)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${saasPricePerUser === price
                            ? 'bg-[#a9484c]/20 text-[#a9484c] border-[#a9484c]/50 shadow-md'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                        >
                          Rp {price.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                    💡 <strong className="text-slate-200">Catatan Cloudflare:</strong> Kuota Cloudflare Workers & D1 Free Tier memberikan <strong>100.000 requests/hari</strong> secara cuma-cuma, lebih dari cukup untuk menampung presensi hingga 100+ karyawan tanpa membayar sepeser pun.
                  </div>
                </SpotlightCard>
              </div>

              {/* ReactBits: SpotlightCard with Emerald Glow & CountUp for Results */}
              <div className="lg:col-span-6">
                <SpotlightCard
                  spotlightColor="rgba(16, 185, 129, 0.22)"
                  className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-emerald-500/30 shadow-2xl relative overflow-hidden"
                >
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="size-4" />
                    <span>Estimasi Penghematan Anda</span>
                  </div>

                  <div className="text-3xl sm:text-5xl font-black text-white tracking-tight my-4">
                    <CountUp
                      to={totalSavings}
                      prefix="Rp "
                      duration={1}
                      separator="."
                      className="text-white"
                    />
                    <span className="text-xs font-normal text-slate-400 block mt-1">
                      Penghematan kas operasional dalam kurun waktu 3 tahun
                    </span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Biaya SaaS 1 Tahun ({employeeCount} staf):</span>
                      <span className="line-through text-rose-400 font-semibold">
                        <CountUp to={yearlySaaSCost} prefix="Rp " duration={0.8} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Biaya SaaS 3 Tahun ({employeeCount} staf):</span>
                      <span className="line-through text-rose-400 font-semibold">
                        <CountUp to={threeYearSaaSCost} prefix="Rp " duration={0.8} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-bold pt-2 border-t border-slate-800">
                      <span>Biaya Server akugawe (Cloudflare):</span>
                      <span className="text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
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
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        <MessageCircle className="size-4" />
                        Klaim Penghematan & Beli Lisensi Sekarang
                      </a>
                    </Magnet>
                  </div>
                </SpotlightCard>
              </div>
            </div>
          </div>
        </section>

        {/* FITUR UNGGULAN with ReactBits: SpotlightCard & DecryptedText */}
        <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
                <Zap className="size-3.5" />
                <ShinyText text="Enterprise-Grade Features" speed={3.5} />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Fitur Lengkap Standar Enterprise untuk UMKM
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
                Didesain khusus untuk memenuhi kebutuhan hukum ketenagakerjaan dan kebiasaan kerja di Indonesia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 */}
              <SpotlightCard
                spotlightColor="rgba(169, 72, 76, 0.2)"
                className="p-6 space-y-3 cursor-default flex flex-col items-center justify-center text-center"
              >
                <div className='flex justify-center align center mb-2'>
                  <div className="size-11 rounded-2xl bg-[#a9484c]/10 text-[#a9484c] border border-[#a9484c]/20 flex items-center justify-center mb-2">
                    <MapPin className="size-5" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  <DecryptedText text="Geofence GPS & Anti-Fake GPS" animateOn="hover" speed={30} className='text-xl' />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Menghitung jarak Haversine secara presisi hingga satuan meter dari titik koordinat kantor. Dilengkapi deteksi mock location untuk mencegah kecurangan absen staf.
                </p>
              </SpotlightCard>

              {/* Card 2 */}
              <SpotlightCard
                spotlightColor="rgba(59, 130, 246, 0.2)"
                className="p-6 space-y-3 cursor-default flex align-center justify-center text-center"
              >
                <div className='flex justify-center align center mb-2'>
                  <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-2">
                    <Smartphone className="size-5" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  <DecryptedText text="PWA Mobile Ringan (Tanpa AppStore)" animateOn="hover" speed={30} className='text-xl' />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Staf tidak perlu download bergiga-giga di PlayStore. Cukup buka link dan tekan "Add to Home Screen". Hemat memori HP, hemat kuota internet, dan loading kilat.
                </p>
              </SpotlightCard>

              {/* Card 3 */}
              <SpotlightCard
                spotlightColor="rgba(245, 158, 11, 0.2)"
                className="p-6 space-y-3 cursor-default flex align-center justify-center text-center"
              >
                <div className='flex justify-center align center mb-2'>
                  <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-2">
                    <Receipt className="size-5" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  <DecryptedText text="Payroll & BPJS Indonesia Otomatis" animateOn="hover" speed={30} className='text-xl' />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kalkulasi otomatis BPJS Ketenagakerjaan (JKK, JKM, JHT, JP), BPJS Kesehatan, dan PPh 21 TER 2024. Lengkap dengan cetak slip gaji digital transparan.
                </p>
              </SpotlightCard>

              {/* Card 4 */}
              <SpotlightCard
                spotlightColor="rgba(168, 85, 247, 0.2)"
                className="p-6 space-y-3 cursor-default flex align-center justify-center text-center"
              >
                <div className='flex justify-center align center mb-2'>
                  <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-2">
                    <CalendarCheck className="size-5" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  <DecryptedText text="Manajemen Cuti & Lembur Fleksibel" animateOn="hover" speed={30} className='text-xl' />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Alur pengajuan cuti tahunan, cuti sakit dengan lampiran surat dokter, kasbon gaji, serta persetujuan lembur terpadu dari panel dashboard.
                </p>
              </SpotlightCard>

              {/* Card 5 */}
              <SpotlightCard
                spotlightColor="rgba(16, 185, 129, 0.2)"
                className="p-6 space-y-3 cursor-default flex align-center justify-center text-center"
              >
                <div className='flex justify-center align center mb-2'>
                  <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-2">
                    <Clock className="size-5" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  <DecryptedText text="Multi-Shift & Toleransi Keterlambatan" animateOn="hover" speed={30} className='text-xl' />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Atur jadwal shift kerja (pagi, sore, malam), hari libur nasional, serta toleransi menit keterlambatan yang otomatis memotong uang kehadiran.
                </p>
              </SpotlightCard>

              {/* Card 6 */}
              <SpotlightCard
                spotlightColor="rgba(6, 182, 212, 0.2)"
                className="p-6 space-y-3 cursor-default flex align-center justify-center text-center"
              >
                <div className='flex justify-center align center mb-2'>
                  <div className="size-11 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-2">
                    <Lock className="size-5" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  <DecryptedText text="100% Hak Milik & Database Mandiri" animateOn="hover" speed={30} className='text-xl' />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Setiap instance memiliki database D1 dan enkripsi terpisah. Data rahasia gaji karyawan Anda tidak pernah digabung dengan bisnis lain.
                </p>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* PRICING TIERS & PROMO SECTION (@efferd/pricing-2) */}
        <PricingSection
          onProceedToOnboarding={(token) => {
            setActiveToken(token);
            setCurrentView('onboarding');
            window.history.pushState({}, '', `/?onboarding=true&token=${token}`);
          }}
        />

        {/* PERBANDINGAN SAAS VS BELI PUTUS */}
        <section id="perbandingan" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-900/30 border-t border-slate-800/80">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Mengapa Beli Putus Lebih Menguntungkan?
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Perbandingan objektif antara aplikasi absensi sewa (SaaS) vs akugawe Self-Hosted.
              </p>
            </div>

            <SpotlightCard
              spotlightColor="rgba(169, 72, 76, 0.12)"
              className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60">
                    <th className="p-4 sm:p-5 font-bold text-slate-300">Aspek Evaluasi</th>
                    <th className="p-4 sm:p-5 font-bold text-rose-400">Aplikasi Absensi SaaS (Sewa)</th>
                    <th className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">akugawe (Beli Putus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Biaya Langganan Bulanan</td>
                    <td className="p-4 sm:p-5 text-rose-400/90 flex items-center gap-1.5">
                      <XCircle className="size-4 shrink-0 text-rose-500" />
                      Rp 25.000 - Rp 50.000 / staf / bulan
                    </td>
                    <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-emerald-500/5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                        Rp 0 / bulan (Gratis Cloudflare Free Tier)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Biaya Tambah Karyawan Baru</td>
                    <td className="p-4 sm:p-5 text-rose-400/90">
                      Tagihan membengkak otomatis tiap rekrut staf baru
                    </td>
                    <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-emerald-500/5">
                      Gratis & Tanpa Batas (Bebas tambah karyawan)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Kepemilikan Data & Privasi</td>
                    <td className="p-4 sm:p-5 text-slate-400">
                      Tersimpan di server vendor bersama ribuan perusahaan lain
                    </td>
                    <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-emerald-500/5">
                      100% di akun Cloudflare privat milik Anda
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Ketergantungan Vendor</td>
                    <td className="p-4 sm:p-5 text-slate-400">
                      Jika vendor menaikkan harga sepihak, Anda terpaksa bayar
                    </td>
                    <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-emerald-500/5">
                      Nol ketergantungan. Sistem aktif selamanya
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Instalasi & Onboarding</td>
                    <td className="p-4 sm:p-5 text-slate-400">
                      Karyawan harus cari & download di PlayStore
                    </td>
                    <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-emerald-500/5">
                      Cukup 1 link PWA & First-Run Wizard 3 menit
                    </td>
                  </tr>
                </tbody>
              </table>
            </SpotlightCard>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Semua yang perlu Anda ketahui mengenai skema Beli Putus & teknologi Cloudflare.
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
                  spotlightColor="rgba(169, 72, 76, 0.12)"
                  className="p-6 space-y-2 bg-slate-900 border-slate-800"
                >
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="size-4 text-[#a9484c] shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-900/60 to-slate-950 border-t border-slate-800">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              <ShinyText text="Mulai Hemat Anggaran HR Perusahaan Anda Hari Ini" speed={4} />
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Coba demo langsung tanpa komitmen apa pun, atau diskusikan kebutuhan kantor Anda dengan tim kami.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Magnet magnetStrength={3}>
                <a
                  href={`${DASHBOARD_URL}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#a9484c] to-[#8f3b3f] text-white font-bold text-sm shadow-xl shadow-[#a9484c]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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
                  color="#10b981"
                  speed="3.5s"
                  className="cursor-pointer"
                >
                  <MessageCircle className="size-4 text-emerald-400" />
                  <span>Hubungi via WhatsApp</span>
                </StarBorder>
              </Magnet>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
          <p>© 2026 akugawe. Aplikasi Presensi Biometrik & Penggajian Mandiri UMKM Indonesia.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="text-slate-600">Dioptimalkan khusus untuk Cloudflare Edge</span>
            <a
              href="/salesAdmin"
              className="text-[11px] text-slate-600 hover:text-slate-400 flex items-center gap-1 transition"
            >
              <Key className="size-3" /> Area Penjual / Onboarding
            </a>
          </div>
        </footer>
      </div>
    </ClickSpark>
  );
}

export default App;
