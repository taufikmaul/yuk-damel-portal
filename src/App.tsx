import { useState, useEffect, lazy, Suspense } from 'react';
import { Logo } from './assets/logo';
import {
  MessageCircle,
  Key,
  ArrowRight,
  Clock,
  MapPin,
  Building2,
  Receipt,
  Menu,
  X,
  Plus,
  Minus,
  ScanFace,
  ShieldCheck,
  Fingerprint,
  Calendar,
  FileText,
  CreditCard,
  Flame,
  Gift,
  Bot,
  Sparkles,
  Calculator,
  Wallet,
} from 'lucide-react';
import { PricingSection } from './components/pricing-section';
import { ScrollReveal } from './components/ScrollReveal';
import { loadSellerConfig } from './services/config';

const OnboardingPage = lazy(() =>
  import('./components/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const AdminPortalPage = lazy(() =>
  import('./components/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage }))
);

export function App() {
  const sellerConfig = loadSellerConfig();
  const dashboardUrl =
    sellerConfig.demoDashboardUrl ||
    import.meta.env.VITE_DASHBOARD_URL ||
    'https://hrd.akugawe.web.id/demo';
  const appUrl =
    sellerConfig.demoAppUrl ||
    import.meta.env.VITE_APP_URL ||
    'https://app.akugawe.web.id/demo';

  // Routing view: 'landing' | 'onboarding' | 'admin'
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    if (params.get('onboarding') === 'true' || pathname.startsWith('/onboarding')) {
      return 'onboarding';
    }

    const savedView = sessionStorage.getItem('ngabsen_current_view');
    if (savedView === 'onboarding') {
      return 'onboarding';
    }

    if (pathname.startsWith('/salesAdmin')) {
      return 'admin';
    }

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

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  // FAQ open item tracker
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Scroll reading progress indicator
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync token from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setActiveToken(token);
      sessionStorage.setItem('ngabsen_active_token', token);
    }
  }, []);

  // Sync sessionStorage
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

  const getWaLink = (tierName?: string) => {
    const text = tierName
      ? `Halo Tim ${sellerConfig.brandName}, saya tertarik untuk memesan paket *${tierName}*. Bisa info pembayaran & cara aktivasinya?`
      : sellerConfig.defaultSalesMessage;
    return `https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  if (currentView === 'onboarding') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
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
          <div className="min-h-screen bg-white flex items-center justify-center">
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

  // FAQ dengan bahasa sederhana dan jelas untuk user umum
  const faqItems = [
    {
      q: 'Bagaimana akugawe mencegah karyawan titip absen atau curang lokasi?',
      a: 'akugawe punya perlindungan ganda yang sangat ketat: karyawan wajib absen selfie langsung dari kamera HP dan harus berada di dalam radius kantor atau toko. Aplikasi otomatis menolak Fake GPS dan foto dari galeri. Ditambah fitur Kunci HP, di mana 1 akun karyawan hanya bisa login di 1 HP miliknya yang sudah diverifikasi oleh atasan.',
    },
    {
      q: 'Bagaimana cara kerja Sistem Poin Hadiah & Streak kedisiplinan?',
      a: 'Setiap kali karyawan absen masuk tepat waktu sebelum batas toleransi habis, mereka otomatis dapat +10 poin harian dan lencana streak on-time (misal: 14 hari tanpa telat berturut-turut). Poin yang terkumpul bisa ditukar langsung lewat HP dengan voucher belanja (Indomaret/Alfamart), saldo e-wallet, atau tambahan hari libur cuti.',
    },
    {
      q: 'Bagaimana aturan cicilan Kasbon Darurat dan potong gajinya?',
      a: 'Saat butuh dana darurat, staf bisa mengajukan kasbon langsung dari HP dengan pilihan cicilan 1 sampai 6 bulan. Begitu di-ACC oleh atasan/owner, angsuran bulanan otomatis memotong uang gaji pada slip gaji periode berikutnya tanpa perlu dicatat manual di Excel.',
    },
    {
      q: 'Bagaimana cara akugawe menghitung THR karyawan?',
      a: 'Perhitungan THR 100% otomatis sesuai aturan resmi pemerintah (Permenaker No. 6/2016). Karyawan yang sudah bekerja 1 tahun atau lebih otomatis mendapat 1 bulan upah penuh. Sedangkan karyawan baru (1 sampai 11 bulan) dihitung proporsional sesuai jumlah bulan kerjanya. Cukup 1 klik, nominal seluruh toko langsung keluar.',
    },
    {
      q: 'Bagaimana cara karyawan mengajukan klaim uang bensin (reimbursement)?',
      a: 'Karyawan cukup memotret nota atau kuitansi (bensin BBM, parkir, tol, konsumsi lembur, atau beli perlengkapan toko) lewat kamera HP di aplikasi. Angka nominal struk otomatis terbaca. Setelah di-ACC atasan, uang penggantian langsung masuk sebagai tambahan di transfer gaji berikutnya.',
    },
    {
      q: 'Apa gunanya Asisten AI & Bot Telegram di akugawe?',
      a: 'Anda bisa mengelola tim semudah chatting di HP. Cukup buka Telegram dan tanya dengan bahasa sehari-hari: "Siapa yang belum absen hari ini?", "Berapa sisa kasbon staf?", atau "Berapa estimasi total THR toko Kemang?". Cuti dan lembur juga bisa langsung disetujui lewat tombol [Setujui] di dalam chat Telegram.',
    },
    {
      q: 'Apakah potongan pajak PPh 21 dan BPJS sudah otomatis?',
      a: 'Ya, sudah otomatis sesuai aturan perpajakan terbaru Indonesia: pajak PPh 21 mekanisme TER (PP 58/2023), BPJS Ketenagakerjaan (JHT, Jaminan Pensiun, JKK, JKM), BPJS Kesehatan, serta hitungan upah lembur resmi Depnaker. Rekap gaji bulanan langsung beres dalam hitungan menit.',
    },
    {
      q: 'Apakah karyawan harus download aplikasi berukuran besar di PlayStore?',
      a: 'Gak perlu sama sekali. akugawe menggunakan teknologi web modern (PWA). Karyawan cukup buka link di browser HP (Chrome di Android atau Safari di iPhone), lalu klik "Tambahkan ke Layar Utama". Aplikasi langsung terpasang ringan tanpa membebani memori HP staf.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#a9484c]/15 selection:text-[#a9484c] antialiased">
      {/* 1. HEADER / NAVBAR (Clean, Minimalist, with scroll progress) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        {/* Subtle reading progress bar */}
        <div
          className="h-[2px] bg-[#a9484c] transition-all duration-150 ease-out absolute top-0 left-0"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center p-1 shadow-xs">
              <Logo className="w-full h-full" />
            </div>
            <span className="font-bold text-lg text-zinc-900 tracking-tight">akugawe</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#hero" className="hover:text-zinc-900 transition-colors">
              Beranda
            </a>
            <a href="#fitur" className="hover:text-zinc-900 transition-colors">
              Fitur App
            </a>
            <a href="#solusi" className="hover:text-zinc-900 transition-colors">
              Skenario
            </a>
            <a href="#harga" className="hover:text-zinc-900 transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-zinc-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={`${dashboardUrl}/login`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-800 transition-colors"
            >
              Masuk Dashboard
            </a>
            <a
              href={`${dashboardUrl}/login`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#a9484c] hover:bg-[#8f3b3f] text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Coba Demo</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-white px-4 pt-3 pb-5 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-zinc-700">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-zinc-50"
              >
                Beranda
              </a>
              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-zinc-50"
              >
                Fitur App
              </a>
              <a
                href="#solusi"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-zinc-50"
              >
                Skenario
              </a>
              <a
                href="#harga"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-zinc-50"
              >
                Harga
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-zinc-50"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-3 border-t border-zinc-100 flex gap-2">
              <a
                href={`${dashboardUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-800"
              >
                Masuk
              </a>
              <a
                href={`${dashboardUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-[#a9484c] text-white"
              >
                Coba Demo
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. HERO SECTION */}
        <section id="hero" className="relative border-b border-zinc-200/80 px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Tagline Pill */}
            <ScrollReveal delayMs={0} yOffset={16}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 text-[11px] sm:text-xs font-medium text-zinc-700 mb-6 shadow-2xs max-w-full">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Absen Selfie GPS Anti-Titip, Kasbon & Gaji Otomatis</span>
              </div>
            </ScrollReveal>

            {/* Main Headline */}
            <ScrollReveal delayMs={70} yOffset={22}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.12] text-balance">
                Bikin Absen<br className="hidden sm:inline" /> Jadi Lebih Mudah
              </h1>
            </ScrollReveal>

            {/* Subtitle tailored to general users */}
            <ScrollReveal delayMs={140} yOffset={24}>
              <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
                Tinggalkan cara absensi manual yang ribet dan bikin pusing. Karyawan cukup absen selfie lewat HP di lokasi toko, kumpulkan poin hadiah, ajukan kasbon & cuti. Gaji, uang lembur, dan slip PDF langsung terhitung rapi tanpa rumus Excel.
              </p>
            </ScrollReveal>

            {/* Action Buttons */}
            <ScrollReveal delayMs={200} yOffset={24}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href={`${dashboardUrl}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#fitur"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-sm transition-all"
                >
                  Lihat Cara Kerja
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Hero Mockup Preview: Desktop Admin Dashboard + Mobile PWA Frame */}
          <ScrollReveal delayMs={280} yOffset={32} className="max-w-5xl mx-auto mt-12 sm:mt-16">
            <div className="relative mx-auto w-full">
              {/* Desktop Frame (Admin & HR Dashboard) */}
              <div className="rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-white shadow-xl overflow-hidden">
                {/* Window top bar */}
                <div className="bg-zinc-50 border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-rose-400" />
                    <span className="size-3 rounded-full bg-amber-400" />
                    <span className="size-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 bg-white px-3 py-1 rounded-md border border-zinc-200/70 shadow-2xs">
                    dash.akugawe.id/overview
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="hidden sm:inline">Realtime Synced</span>
                  </div>
                </div>

                {/* Dashboard Inner Preview matching Akugawe OverviewPage */}
                <div className="p-4 sm:p-6 bg-zinc-50/50">
                  {/* Top Stats Bar: Mobile horizontal scrollable, responsive grid on desktop */}
                  <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto no-scrollbar snap-x gap-2.5 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 mb-4">
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <p className="text-[11px] font-medium text-zinc-500">Total Karyawan</p>
                      <p className="text-lg font-bold text-zinc-900 mt-0.5">42 Orang</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">3 Cabang Toko</p>
                    </div>
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <p className="text-[11px] font-medium text-zinc-500">Hadir Hari Ini</p>
                      <p className="text-lg font-bold text-emerald-600 mt-0.5">97.6%</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">41 Tepat Waktu</p>
                    </div>
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <p className="text-[11px] font-medium text-zinc-500">Menunggu Persetujuan</p>
                      <p className="text-lg font-bold text-zinc-900 mt-0.5">3 Pengajuan</p>
                      <p className="text-[10px] text-amber-600 font-medium mt-0.5">Cuti & Kasbon</p>
                    </div>
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <p className="text-[11px] font-medium text-zinc-500">Gaji & THR Bulanan</p>
                      <p className="text-lg font-bold text-[#a9484c] mt-0.5">Siap Cair</p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Pajak & BPJS Beres</p>
                    </div>
                  </div>

                  {/* Attendance Table Mockup: Strict 1-Line Items, No Badges */}
                  <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-800">
                          Catatan Absen Hari Ini
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">Realtime Log</span>
                    </div>

                    <div className="divide-y divide-zinc-100 text-xs">
                      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="size-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            NP
                          </div>
                          <span className="font-semibold text-zinc-900 truncate">Nadia Putri</span>
                          <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Kasir Tebet</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-600 text-[11px] font-medium hidden sm:inline">Lokasi Valid</span>
                          <span className="text-zinc-500 font-mono text-[11px]">08:11 WIB</span>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="size-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            RD
                          </div>
                          <span className="font-semibold text-zinc-900 truncate">Raka Dirgantara</span>
                          <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Barista Kemang</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-600 text-[11px] font-medium hidden sm:inline">Lokasi Valid</span>
                          <span className="text-zinc-500 font-mono text-[11px]">08:16 WIB</span>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="size-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            SM
                          </div>
                          <span className="font-semibold text-zinc-900 truncate">Salsa Mahardika</span>
                          <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Supervisor Sudirman</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-amber-600 text-[11px] font-medium hidden sm:inline">Dinas Luar</span>
                          <span className="text-zinc-500 font-mono text-[11px]">08:19 WIB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Mobile Phone Mockup matching Akugawe Mobile PWA HomePage */}
              <div className="hidden sm:block absolute -right-4 -bottom-8 w-68 rounded-3xl border-4 border-zinc-900 bg-white shadow-2xl p-3 z-20">
                <div className="flex justify-center mb-1.5">
                  <div className="w-16 h-3 bg-zinc-900 rounded-full" />
                </div>
                
                {/* Employee App Header */}
                <div className="text-center py-1 border-b border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    akugawe Aplikasi Karyawan
                  </p>
                  <p className="text-xs font-bold text-zinc-800">Halo, Nadia Putri! 👋</p>
                  <p className="text-[9px] text-zinc-500">Shift Pagi (08:00 - 17:00)</p>
                </div>

                {/* Gamification Streak & Points Banner */}
                <div className="flex items-center justify-between text-[10px] bg-amber-50/90 border border-amber-200 rounded-xl px-2.5 py-1.5 my-2">
                  <div className="flex items-center gap-1 font-bold text-amber-900">
                    <Flame className="size-3.5 text-rose-500 fill-rose-500" />
                    <span>14 Hari On-Time</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-[#a9484c]">
                    <Gift className="size-3 text-[#a9484c]" />
                    <span>140 Poin Hadiah</span>
                  </div>
                </div>

                {/* Biometric & Geofence Status */}
                <div className="mb-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                  <div className="size-10 rounded-full bg-emerald-50 border-2 border-dashed border-emerald-500 mx-auto flex items-center justify-center text-emerald-600 mb-1">
                    <ScanFace className="size-5" />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-900">Foto Selfie & Lokasi Valid</p>
                  <p className="text-[9px] text-emerald-600 font-semibold">
                    ✓ Pas di Lokasi Toko (Radius 8m)
                  </p>
                </div>

                {/* Quick Service Icons (6 Real App Modules) */}
                <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-center">
                  <div className="p-1 rounded-lg bg-[#fbf2f0] border border-[#f0dbd8]">
                    <Calendar className="size-3 text-[#a9484c] mx-auto" />
                    <span className="text-[8px] font-bold text-[#a9484c] block mt-0.5">Cuti</span>
                  </div>
                  <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-100">
                    <FileText className="size-3 text-emerald-600 mx-auto" />
                    <span className="text-[8px] font-bold text-emerald-700 block mt-0.5">Slip Gaji</span>
                  </div>
                  <div className="p-1 rounded-lg bg-rose-50 border border-rose-100">
                    <CreditCard className="size-3 text-rose-600 mx-auto" />
                    <span className="text-[8px] font-bold text-rose-700 block mt-0.5">Kasbon</span>
                  </div>
                  <div className="p-1 rounded-lg bg-sky-50 border border-sky-100">
                    <Receipt className="size-3 text-sky-600 mx-auto" />
                    <span className="text-[8px] font-bold text-sky-700 block mt-0.5">Reimburse</span>
                  </div>
                  <div className="p-1 rounded-lg bg-amber-50 border border-amber-100">
                    <Gift className="size-3 text-amber-600 mx-auto" />
                    <span className="text-[8px] font-bold text-amber-700 block mt-0.5">Hadiah</span>
                  </div>
                  <div className="p-1 rounded-lg bg-purple-50 border border-purple-100">
                    <Bot className="size-3 text-purple-600 mx-auto" />
                    <span className="text-[8px] font-bold text-purple-700 block mt-0.5">Tanya AI</span>
                  </div>
                </div>

                <a
                  href={`${appUrl}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-2 rounded-xl bg-[#a9484c] text-white font-bold text-[11px] shadow-xs text-center hover:bg-[#8f3b3f] transition-colors"
                >
                  Absen Masuk (+10 Poin)
                </a>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* 3. FITUR UTAMA SECTION (Matching Akugawe App Modules) */}
        <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-b border-zinc-200/80">
          <div className="max-w-6xl mx-auto">
            {/* Section Tagline & Heading with ScrollReveal */}
            <ScrollReveal delayMs={0} yOffset={20} className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-3">
                Fitur lengkap akugawe
              </p>
              <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-tight">
                Semua urusan absensi dan karyawan jadi serba otomatis
              </h2>
              <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
                Mulai dari absen selfie anti-titip di lokasi toko, sistem poin hadiah, kasbon darurat, sampai hitung gaji dan THR yang langsung beres tanpa rumus Excel.
              </p>
            </ScrollReveal>

            {/* Bento Grid Features */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Feature 1: Absen Selfie & GPS (7 cols) */}
              <ScrollReveal delayMs={0} yOffset={24} className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-[#a9484c] uppercase tracking-wider mb-2">
                    Absen Selfie & GPS
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    Wajib selfie & harus di lokasi toko, gak bisa titip absen
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Karyawan hanya bisa absen kalau sudah sampai di radius kantor atau toko. Aplikasi otomatis menolak Fake GPS dan foto dari galeri. Jam absen terkunci ke waktu server resmi, jadi gak ada lagi yang bisa memajukan jam HP.
                  </p>
                </div>

                {/* Simulated Attendance Widget: Direct live indicator, no tabs */}
                <div className="mt-6 rounded-xl border border-zinc-200/80 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Simulasi Presensi
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span>Radius Toko Valid</span>
                    </div>
                  </div>

                  {/* Discipline Stat Bar */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 mb-3">
                    <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                      <span className="font-semibold text-zinc-800">Tingkat Kehadiran Tepat Waktu</span>
                      <span className="font-bold text-emerald-600">97.6%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[97.6%]" />
                    </div>
                  </div>

                  {/* Strict 1-Line Recent Scan Cards */}
                  <div className="space-y-1.5">
                    <div className="px-3 py-2 rounded-lg border border-zinc-200 bg-white flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-zinc-900 truncate">Nadia Putri</span>
                        <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Toko Tebet</span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500 shrink-0 ml-2">08:11 WIB</span>
                    </div>

                    <div className="px-3 py-2 rounded-lg border border-zinc-200 bg-white flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-zinc-900 truncate">Raka Dirgantara</span>
                        <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Toko Kemang</span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500 shrink-0 ml-2">08:16 WIB</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 2: Kunci HP & Sidik Jari (5 cols) */}
              <ScrollReveal delayMs={80} yOffset={24} className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-[#a9484c] uppercase tracking-wider mb-2">
                    Kunci HP & Sidik Jari
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    1 Akun terkunci di 1 HP, login mudah pakai sidik jari
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Mencegah karyawan saling pinjam HP buat titip absen. Saat pertama login, HP karyawan diverifikasi dulu oleh atasan. Buka aplikasi sangat cepat dan aman pakai sensor sidik jari atau Face ID di HP masing-masing.
                  </p>
                </div>

                {/* Strict 1-Line Items */}
                <div className="mt-6 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-2">
                  <div className="px-3.5 py-2.5 bg-white rounded-lg border border-zinc-200 flex items-center gap-2.5 text-xs truncate">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-zinc-900 truncate">1 Karyawan Hanya di 1 HP</span>
                    <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Terkunci di HP terdaftar</span>
                  </div>

                  <div className="px-3.5 py-2.5 bg-white rounded-lg border border-zinc-200 flex items-center gap-2.5 text-xs truncate">
                    <Fingerprint className="size-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-zinc-900 truncate">Login Sidik Jari & Face ID</span>
                    <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Buka instan tanpa kata sandi</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 3: Sistem Poin & Hadiah Kedisiplinan (6 cols) */}
              <ScrollReveal delayMs={100} yOffset={24} className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-[#a9484c] uppercase tracking-wider mb-2">
                    Poin & Hadiah Disiplin
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    Rajin datang tepat waktu dapat poin & hadiah voucher
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Bikin tim semangat datang on-time tanpa perlu diancam denda. Setiap absen tepat waktu dapat poin harian dan lencana streak berturut-turut. Poin yang terkumpul bisa ditukar voucher belanja, saldo e-wallet, atau tambahan jatah libur cuti.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-2">
                  {/* Strict 1-Line Top Streak */}
                  <div className="px-3.5 py-2.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <Flame className="size-4 text-rose-500 fill-rose-500 shrink-0" />
                      <span className="font-semibold text-zinc-900 truncate">14 Hari Masuk Tepat Waktu</span>
                      <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Streak aktif</span>
                    </div>
                    <span className="font-semibold text-[#a9484c] text-[11px] shrink-0 ml-2">+10 Poin/Hari</span>
                  </div>

                  {/* Strict 1-Line Mini Leaderboard & Rewards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="px-3 py-2 bg-white rounded-lg border border-zinc-200 flex items-center justify-between">
                      <span className="font-medium text-zinc-900 truncate">1. Nadia P. (380 Poin)</span>
                      <span className="text-[11px] text-amber-600 font-semibold shrink-0">Juara 1</span>
                    </div>

                    <div className="px-3 py-2 bg-white rounded-lg border border-zinc-200 flex items-center justify-between">
                      <span className="font-medium text-zinc-900 truncate">Tukar Voucher Alfamart</span>
                      <span className="text-[11px] text-[#a9484c] font-semibold shrink-0">200 Poin</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 4: Kasbon Darurat, THR Proporsional & Reimburse (6 cols) */}
              <ScrollReveal delayMs={140} yOffset={24} className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-[#a9484c] uppercase tracking-wider mb-2">
                    Kasbon, THR & Reimburse
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    Bisa kasbon cicilan, hitung THR, & klaim nota instan
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Semua urusan uang karyawan beres dari HP: staf butuh dana darurat bisa ajukan kasbon cicilan yang otomatis memotong slip gaji, klaim uang bensin tinggal foto struk nota, dan hitung THR otomatis sesuai masa kerja saat hari raya.
                  </p>
                </div>

                {/* Strict 1-Line Cards, No Badges */}
                <div className="mt-6 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-2">
                  <div className="px-3.5 py-2.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <Wallet className="size-4 text-rose-600 shrink-0" />
                      <span className="font-semibold text-zinc-900 truncate">Kasbon Cicilan 1–6 Bulan</span>
                      <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Potong slip gaji</span>
                    </div>
                    <span className="text-zinc-500 text-[11px] font-medium shrink-0 ml-2">Potong Slip</span>
                  </div>

                  <div className="px-3.5 py-2.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <Calculator className="size-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-zinc-900 truncate">Kalkulator THR Otomatis</span>
                      <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Sesuai masa kerja</span>
                    </div>
                    <span className="text-zinc-500 text-[11px] font-medium shrink-0 ml-2">1-Klik Beres</span>
                  </div>

                  <div className="px-3.5 py-2.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <Receipt className="size-4 text-sky-600 shrink-0" />
                      <span className="font-semibold text-zinc-900 truncate">Klaim BBM & Parkir</span>
                      <span className="text-zinc-400 text-[11px] truncate hidden xs:inline">— Foto kuitansi nota</span>
                    </div>
                    <span className="text-zinc-500 text-[11px] font-medium shrink-0 ml-2">Instan HP</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 5: Hitung Gaji & Slip Otomatis (6 cols) */}
              <ScrollReveal delayMs={180} yOffset={24} className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-[#a9484c] uppercase tracking-wider mb-2">
                    Gaji & Slip Otomatis
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    Hitung gaji, potongan telat, lembur, BPJS & PPh 21 langsung beres
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Gak perlu lagi begadang rekap absen tiap akhir bulan. Potongan menit telat, uang lembur resmi, BPJS Kesehatan & Ketenagakerjaan, serta pajak PPh 21 dihitung otomatis. Slip gaji PDF siap kirim ke HP staf dan file siap transfer ke bank BCA / Mandiri.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
                  <div className="flex items-center justify-between mb-2.5 text-xs text-zinc-600">
                    <span className="font-bold text-zinc-700">Penggajian Tanpa Ribet Rumus Excel</span>
                    <span className="text-xs text-emerald-600 font-semibold">100% Otomatis</span>
                  </div>

                  {/* Horizontal Scroll on Mobile */}
                  <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto no-scrollbar gap-2 pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
                    <div className="min-w-[130px] flex-1 px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs truncate">
                      <p className="font-bold text-zinc-900 truncate">Pajak PPh 21</p>
                      <p className="text-[11px] text-zinc-500 truncate">TER A, B, C</p>
                    </div>

                    <div className="min-w-[130px] flex-1 px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs truncate">
                      <p className="font-bold text-zinc-900 truncate">BPJS Lengkap</p>
                      <p className="text-[11px] text-zinc-500 truncate">TK & Kesehatan</p>
                    </div>

                    <div className="min-w-[130px] flex-1 px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs truncate">
                      <p className="font-bold text-zinc-900 truncate">Transfer Bank</p>
                      <p className="text-[11px] text-zinc-500 truncate">BCA & Mandiri</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 6: Asisten AI & Bot Telegram (6 cols) */}
              <ScrollReveal delayMs={220} yOffset={24} className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-[#a9484c] uppercase tracking-wider mb-2">
                    Asisten AI & Bot Telegram
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    Tanya rekap absensi & setujui cuti semudah kirim chat
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    Kelola tim semudah kirim pesan chat. Pemilik usaha dan HR cukup tanya ke AI: "Siapa yang telat hari ini?", "Berapa total THR toko cabang?", atau langsung klik tombol [Setujui Cuti] di Telegram tanpa perlu buka-buka menu dashboard.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-2">
                  <div className="p-3 bg-white rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Bot className="size-4 text-purple-600" />
                        <span className="text-xs font-bold text-zinc-900">Asisten AI HR akugawe</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">Telegram Bot</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="px-3 py-2 rounded-lg bg-zinc-50 text-zinc-700 text-[11px] flex items-center gap-2 truncate">
                        <span className="shrink-0">👤</span>
                        <span className="font-medium text-zinc-900 truncate">"Siapa staf yang belum absen hari ini?"</span>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-rose-50/50 border border-rose-100 text-zinc-800 text-[11px] flex items-center gap-2 truncate">
                        <span className="shrink-0">🤖</span>
                        <span className="truncate"><strong className="text-[#a9484c]">AI HR:</strong> Semua hadir di Tebet & Kemang. Salsa izin sakit.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Spill 5 Fitur Unggulan (Detailed Spotlight Section) */}
            <div className="mt-20 pt-16 border-t border-zinc-200/80">
              <ScrollReveal delayMs={0} yOffset={20} className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-3">
                  Keunggulan utama akugawe
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight leading-tight">
                  5 Hal yang bikin karyawan betah & pemilik usaha tenang
                </h3>
                <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
                  Bukan cuma alat catat jam kerja, tapi solusi lengkap untuk memotivasi karyawan dan mempermudah operasional harian usaha Anda.
                </p>
              </ScrollReveal>

              {/* 5 Keunggulan: Mobile horizontal scrollable, responsive grid on desktop */}
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                {/* 1. Sistem Poin & Hadiah */}
                <ScrollReveal delayMs={0} yOffset={24} className="w-[84vw] max-w-[340px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3.5">
                      <Gift className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                      Motivasi Positif
                    </p>
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">
                      Sistem Poin & Hadiah Disiplin
                    </h4>
                    <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                      Karyawan yang konsisten absen tepat waktu dapat reward poin harian (+10 Poin) dan lencana streak berturut-turut. Poin yang terkumpul bisa ditukar hadiah langsung dari HP: voucher belanja Alfamart/Indomaret, saldo e-wallet, atau tambahan hari libur cuti.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Datang On-Time Dapat Poin</span>
                    <span className="font-semibold text-zinc-800">Tukar Voucher & Cuti</span>
                  </div>
                </ScrollReveal>

                {/* 2. Kasbon Darurat */}
                <ScrollReveal delayMs={60} yOffset={24} className="w-[84vw] max-w-[340px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mb-3.5">
                      <Wallet className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                      Bantuan Finansial Staf
                    </p>
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">
                      Kasbon Darurat Cicilan 1–6 Bulan
                    </h4>
                    <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                      Solusi darurat saat staf butuh biaya mendadak (keluarga sakit, perbaikan motor). Staf bisa ajukan kasbon lewat HP tanpa rasa canggung dengan pilihan cicilan 1 sampai 6 bulan. Begitu di-ACC atasan, angsuran otomatis dipotong dari slip gaji bulanan berikutnya.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Pilihan Cicilan 1–6 Bulan</span>
                    <span className="font-semibold text-zinc-800">Auto-Potong Slip Gaji</span>
                  </div>
                </ScrollReveal>

                {/* 3. THR Proporsional */}
                <ScrollReveal delayMs={120} yOffset={24} className="w-[84vw] max-w-[340px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3.5">
                      <Calculator className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                      Sesuai Aturan Pemerintah
                    </p>
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">
                      Kalkulator THR Sesuai Masa Kerja
                    </h4>
                    <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                      Gak perlu bingung hitung tanggal masuk staf satu per satu. Sistem otomatis membedakan: staf yang sudah kerja 1 tahun ke atas berhak 1 bulan gaji penuh, dan staf baru di bawah 1 tahun dihitung proporsional sesuai jumlah bulan kerja. 1 klik langsung keluar nominal siap bagi.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Hitung Masa Kerja Akurat</span>
                    <span className="font-semibold text-zinc-800">1-Klik Seluruh Karyawan</span>
                  </div>
                </ScrollReveal>

                {/* 4. Reimbursement Kuitansi */}
                <ScrollReveal delayMs={180} yOffset={24} className="w-[84vw] max-w-[340px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 mb-3.5">
                      <Receipt className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1.5">
                      Bebas Kuitansi Hilang
                    </p>
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900">
                      Klaim BBM & Parkir Cukup Foto Struk
                    </h4>
                    <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                      Staf lapangan atau operasional toko cukup jepret nota SPBU, karcis parkir, atau struk makan lembur dari kamera HP. Sistem otomatis membaca angka di struk nota. Atasan tinggal klik Setujui, dan uang penggantian langsung masuk ke slip gaji bulan berjalan.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Tinggal Jepret Foto Nota</span>
                    <span className="font-semibold text-zinc-800">Otomatis Masuk Slip Gaji</span>
                  </div>
                </ScrollReveal>

                {/* 5. Asisten AI & Bot Telegram */}
                <ScrollReveal delayMs={240} yOffset={24} className="w-[88vw] max-w-[480px] md:w-auto md:max-w-none md:col-span-2 lg:col-span-2 shrink-0 snap-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-rose-400">
                        <Bot className="size-5" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="size-3" /> Asisten Pintar 24 Jam
                      </span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold text-white">
                      Asisten AI & Bot Telegram (Tanya Jawab & ACC Lewat Chat)
                    </h4>
                    <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      Dilengkapi asisten kecerdasan buatan (AI) yang terhubung ke bot Telegram dan standar terbuka (MCP). Anda bisa tanya ke bot seperti ngobrol dengan staf HR pribadi: <em>"Ada yang belum masuk hari ini?"</em>, <em>"Berapa kasbon staf bulan ini?"</em>, atau langsung klik tombol <strong>[Setujui Cuti]</strong> di chat tanpa perlu buka dashboard.
                    </p>

                    <div className="mt-4 flex sm:grid sm:grid-cols-3 overflow-x-auto no-scrollbar gap-2.5 pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 text-xs text-zinc-300">
                      <div className="min-w-[170px] flex-1 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 shrink-0 sm:shrink">
                        <p className="font-semibold text-white">Tanya Bahasa Sehari-hari</p>
                        <p className="text-[11px] text-zinc-400 mt-1">"Siapa kasir yang telat?"</p>
                      </div>
                      <div className="min-w-[170px] flex-1 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 shrink-0 sm:shrink">
                        <p className="font-semibold text-white">ACC Instan di Chat</p>
                        <p className="text-[11px] text-zinc-400 mt-1">Tombol [✅ Setujui] di Telegram</p>
                      </div>
                      <div className="min-w-[170px] flex-1 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 shrink-0 sm:shrink">
                        <p className="font-semibold text-white">Rekap & Laporan Cepat</p>
                        <p className="text-[11px] text-zinc-400 mt-1">Cek estimasi THR & kasbon staf</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span>Terhubung ke Telegram & AI Assistant</span>
                    <span className="font-semibold text-rose-400">Siap Pakai Kapan Saja</span>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SKENARIO OPERASIONAL (Solusi Sesuai Sektor Tim Akugawe): Horizontal scroll on mobile */}
        <section id="solusi" className="py-16 sm:py-24 px-4 sm:px-6 bg-zinc-50/60 border-b border-zinc-200/80">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal delayMs={0} yOffset={20} className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-3">
                Skenario penggunaan
              </p>
              <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-tight">
                Cocok untuk berbagai jenis usaha di Indonesia
              </h2>
              <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
                Telah dirancang khusus untuk toko ritel, restoran, kafe, kantor cabang, hingga tim lapangan.
              </p>
            </ScrollReveal>

            <div className="flex md:grid md:grid-cols-3 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              <ScrollReveal delayMs={0} yOffset={24} className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs">
                <div className="size-10 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center text-[#a9484c] mb-4">
                  <Building2 className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900">Toko Retail, Kafe, & Restoran</h3>
                <p className="mt-1 text-xs font-semibold text-zinc-500">Shift Pagi, Siang & Malam Lintas Hari</p>
                <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Pergantian shift kasir dan barista tercatat rapi tanpa antrean di mesin fingerprint. Shift malam yang lewat jam 12 malam tetap otomatis tercatat ke hari kerja yang benar.
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={90} yOffset={24} className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs">
                <div className="size-10 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center text-[#a9484c] mb-4">
                  <MapPin className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900">Banyak Cabang Toko & Tim Lapangan</h3>
                <p className="mt-1 text-xs font-semibold text-zinc-500">Multi-Cabang, Gudang, & Teknisi</p>
                <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Pantau kehadiran seluruh cabang toko dari satu layar HP secara langsung. Tim sales atau teknisi yang dinas luar bisa absen dengan foto di tempat tujuan lengkap dengan koordinat lokasi.
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={180} yOffset={24} className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs">
                <div className="size-10 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center text-[#a9484c] mb-4">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900">Hitung Gaji Tanpa Lembur Excel</h3>
                <p className="mt-1 text-xs font-semibold text-zinc-500">Pemilik Usaha, HR & Admin Toko</p>
                <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Rekap absensi akhir bulan selesai dalam 5 menit. Potongan menit telat, uang lembur, cicilan kasbon, BPJS, dan THR terhitung otomatis. Slip gaji PDF siap dibagikan ke HP staf.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* 5. PRICING SECTION */}
        <ScrollReveal delayMs={0} yOffset={20}>
          <PricingSection
            onProceedToOnboarding={(token) => {
              setActiveToken(token);
              setCurrentView('onboarding');
              window.history.pushState({}, '', `/?onboarding=true&token=${token}`);
            }}
          />
        </ScrollReveal>

        {/* 6. FAQ SECTION (Accordion) */}
        <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-t border-zinc-200/80">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal delayMs={0} yOffset={20} className="text-center mb-12">
              <p className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight">
                Pertanyaan yang sering ditanyakan
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                Ringkasan singkat untuk membantu tim Anda memahami cara kerja akugawe sebelum mulai implementasi.
              </p>
            </ScrollReveal>

            <ScrollReveal delayMs={80} yOffset={24}>
              <div className="divide-y divide-zinc-200/80 border-y border-zinc-200/80">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="py-4 sm:py-5">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left gap-4 font-semibold text-base sm:text-lg text-zinc-900 hover:text-[#a9484c] transition-colors"
                      >
                        <span>{item.q}</span>
                        <span className="p-1 rounded-md text-zinc-500 shrink-0">
                          {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                        </span>
                      </button>

                      {isOpen && (
                        <p className="mt-3 text-sm text-zinc-600 leading-relaxed pr-8">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 7. FINAL HIGH-CONTRAST CTA BANNER */}
        <section id="cta" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#8f3b3f] text-white">
          <ScrollReveal delayMs={0} yOffset={20} className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Siap bikin absensi & gaji tim jadi lebih mudah?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-rose-100 max-w-xl mx-auto leading-relaxed">
              Mulai gunakan akugawe hari ini. Pantau kehadiran tim toko dan cabang secara langsung tanpa ribet.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href={`${dashboardUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-[#8f3b3f] font-semibold text-sm hover:bg-rose-50 transition-all shadow-md"
              >
                Coba Demo Sekarang
              </a>
              <a
                href={getWaLink()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* 8. FOOTER */}
      <footer className="border-t border-zinc-200/80 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center p-0.5 shadow-2xs">
              <Logo className="w-full h-full" />
            </div>
            <span className="font-bold text-sm text-zinc-900">akugawe</span>
            <span className="text-zinc-400">|</span>
            <span>Sistem Presensi Biometrik & Payroll Indonesia</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#hero" className="hover:text-zinc-900 transition-colors">
              Beranda
            </a>
            <a href="#fitur" className="hover:text-zinc-900 transition-colors">
              Fitur App
            </a>
            <a href="#solusi" className="hover:text-zinc-900 transition-colors">
              Skenario
            </a>
            <a href="#harga" className="hover:text-zinc-900 transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-zinc-900 transition-colors">
              FAQ
            </a>
            <a
              href="/salesAdmin"
              className="text-zinc-400 hover:text-[#a9484c] flex items-center gap-1 transition-colors"
            >
              <Key className="size-3" /> Area Penjual
            </a>
          </div>

          <p>© 2026 akugawe. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
