import { useState, useEffect, lazy, Suspense } from 'react';
import { Logo } from './assets/logo';
import {
  MessageCircle,
  Key,
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
  Calculator,
  Wallet,
  Store,
  Navigation,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { PricingSection } from './components/pricing-section';
import { ScrollReveal } from './components/ScrollReveal';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { loadSellerConfig, fetchSellerConfig, type SellerConfig } from './services/config';

const OnboardingPage = lazy(() =>
  import('./components/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const AdminPortalPage = lazy(() =>
  import('./components/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage }))
);

export function App() {
  const [sellerConfig, setSellerConfig] = useState<SellerConfig>(loadSellerConfig);
  const dashboardUrl =
    sellerConfig.demoDashboardUrl ||
    import.meta.env.VITE_DASHBOARD_URL ||
    'https://hrd.akugawe.web.id/demo';
  const appUrl =
    sellerConfig.demoAppUrl ||
    import.meta.env.VITE_APP_URL ||
    'https://app.akugawe.web.id/demo';

  useEffect(() => {
    fetchSellerConfig().then((cfg) => setSellerConfig(cfg));
    const handleUpdate = (e: any) => {
      if (e.detail) setSellerConfig(e.detail);
    };
    window.addEventListener('seller-config-updated', handleUpdate);
    return () => window.removeEventListener('seller-config-updated', handleUpdate);
  }, []);

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setActiveToken(token);
      sessionStorage.setItem('ngabsen_active_token', token);
    }
  }, []);

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
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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

  const faqItems = [
    {
      q: 'Bagaimana akugawe mencegah karyawan titip absen atau curang lokasi?',
      a: 'akugawe menerapkan validasi berlapis: karyawan wajib selfie langsung lewat kamera aktif dan berada di dalam radius geofence kantor atau cabang toko. Sistem mendeteksi serta menolak Fake GPS dan foto galeri. Fitur kunci perangkat memastikan 1 akun hanya dapat mencatatkan kehadiran pada 1 ponsel resmi terverifikasi.',
    },
    {
      q: 'Apa saja kelengkapan Fitur Canvasing Sales & Kunjungan Toko (Business Pro)?',
      a: 'Tim sales lapangan memiliki tab Kunjungan terintegrasi: panduan Beat Plan harian dengan navigasi Google Maps, check-in dan check-out berbasis GPS beserta foto toko, pencatatan pesanan (Taking Order PO), rekonsiliasi setoran kasir (Tunai, Transfer, Giro), serta mode offline-first untuk area minim sinyal.',
    },
    {
      q: 'Bagaimana mekanisme Sistem Poin Hadiah dan streak kedisiplinan?',
      a: 'Karyawan yang hadir tepat waktu sebelum batas toleransi memperoleh poin harian dan lencana streak berturut-turut. Poin yang terakumulasi dapat ditukarkan langsung dari ponsel menjadi voucher belanja ritel, saldo dompet digital, atau insentif cuti tambahan.',
    },
    {
      q: 'Bagaimana aturan cicilan Kasbon Darurat dan pemotongan gajinya?',
      a: 'Karyawan dapat mengajukan kasbon darurat langsung melalui aplikasi ponsel dengan tenor cicilan 1 hingga 6 bulan. Begitu permohonan disetujui atasan, nominal angsuran otomatis dipotongkan pada perhitungan slip gaji bulan bersangkutan tanpa perlu rekap Excel terpisah.',
    },
    {
      q: 'Bagaimana akugawe menghitung THR karyawan?',
      a: 'Perhitungan THR berjalan otomatis sesuai regulasi resmi Permenaker No. 6/2016. Karyawan dengan masa kerja 12 bulan atau lebih menerima 1 bulan upah penuh, sedangkan masa kerja di bawah 12 bulan dihitung proporsional berdasarkan bulan kerja aktif.',
    },
    {
      q: 'Bagaimana cara karyawan mengajukan klaim reimbursement operasional?',
      a: 'Karyawan cukup mengambil foto kuitansi atau nota (BBM, parkir, tol, atau perlengkapan toko) melalui kamera aplikasi. Setelah diverifikasi dan disetujui atasan, nominal klaim otomatis terakumulasi dalam transfer gaji periode berikutnya.',
    },
    {
      q: 'Apa manfaat Asisten HR dan Bot Telegram di akugawe?',
      a: 'Atasan dan pemilik usaha dapat memantau operasional tim secara instan via chat Telegram: menanyakan kehadiran harian cabang, status kasbon staf, hingga menyetujui pengajuan cuti dan lembur langsung melalui tombol tindakan di obrolan.',
    },
    {
      q: 'Apakah pemotongan pajak PPh 21 dan iuran BPJS sudah otomatis?',
      a: 'Ya, seluruh perhitungan mengikuti tarif efektif rata-rata (TER PPh 21 PP 58/2023), skema lengkap BPJS Ketenagakerjaan (JHT, JP, JKK, JKM), BPJS Kesehatan, serta formula resmi perhitungan upah lembur pemerintah.',
    },
    {
      q: 'Apakah karyawan harus mengunduh aplikasi berukuran besar dari toko aplikasi?',
      a: 'Tidak perlu. akugawe mengusung teknologi Progressive Web App (PWA). Karyawan cukup mengakses tautan melalui peramban ponsel lalu memilih "Tambahkan ke Layar Utama". Aplikasi langsung aktif ringan tanpa menghabiskan ruang penyimpanan ponsel.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/15 selection:text-primary antialiased">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <ScrollProgressBar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-white border border-border flex items-center justify-center p-1 shadow-xs">
              <Logo className="w-full h-full" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">akugawe</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#hero" className="hover:text-slate-900 transition-colors">
              Beranda
            </a>
            <a href="#fitur" className="hover:text-slate-900 transition-colors">
              Fitur App
            </a>
            <a href="#solusi" className="hover:text-slate-900 transition-colors">
              Skenario
            </a>
            <a href="#harga" className="hover:text-slate-900 transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href={`${dashboardUrl}/login`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-border hover:bg-slate-50 text-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Masuk Dashboard
            </a>
            <a
              href={`${dashboardUrl}/login`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Coba Demo
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-border text-slate-700 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Buka navigasi menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-white px-4 pt-3 pb-5 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Beranda
              </a>
              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Fitur App
              </a>
              <a
                href="#solusi"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Skenario
              </a>
              <a
                href="#harga"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Harga
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <a
                href={`${dashboardUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg border border-border text-slate-800"
              >
                Masuk
              </a>
              <a
                href={`${dashboardUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-primary text-white"
              >
                Coba Demo
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section id="hero" className="relative border-b border-border px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal delayMs={0} yOffset={20}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12] text-balance">
                Satu Aplikasi untuk Presensi Toko, Sales Lapangan, dan Penggajian
              </h1>
            </ScrollReveal>

            <ScrollReveal delayMs={70} yOffset={22}>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Presensi selfie GPS di radius toko kerja, pemetaan rute kunjungan sales, pengajuan kasbon darurat, serta kalkulasi gaji dan THR otomatis tanpa rumus Excel rumit.
              </p>
            </ScrollReveal>

            <ScrollReveal delayMs={140} yOffset={24}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href={`${dashboardUrl}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Coba Demo Langsung
                </a>
                <a
                  href="#fitur"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Pelajari Fitur Lengkap
                </a>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delayMs={240} yOffset={32} className="max-w-5xl mx-auto mt-12 sm:mt-16">
            <div className="relative mx-auto w-full">
              <div className="rounded-xl sm:rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
                <div className="bg-slate-50/80 border-b border-border px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-rose-400" />
                    <span className="size-3 rounded-full bg-amber-400" />
                    <span className="size-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 bg-white px-3 py-1 rounded-md border border-border shadow-2xs">
                    dash.akugawe.id/overview
                  </div>
                  <div className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Pratinjau Antarmuka
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-slate-50/50">
                  <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto no-scrollbar snap-x gap-2.5 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 mb-4">
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3.5 rounded-xl border border-border shadow-2xs">
                      <p className="text-[11px] font-medium text-slate-500">Total Karyawan</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">42 Orang</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">3 Cabang Toko</p>
                    </div>
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3.5 rounded-xl border border-border shadow-2xs">
                      <p className="text-[11px] font-medium text-slate-500">Presensi Hari Ini</p>
                      <p className="text-lg font-bold text-emerald-600 mt-0.5">97.6%</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">41 Tepat Waktu</p>
                    </div>
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3.5 rounded-xl border border-border shadow-2xs">
                      <p className="text-[11px] font-medium text-slate-500">Menunggu Persetujuan</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">3 Pengajuan</p>
                      <p className="text-[10px] text-amber-600 font-medium mt-0.5">Cuti & Kasbon</p>
                    </div>
                    <div className="min-w-[145px] shrink-0 snap-start bg-white p-3.5 rounded-xl border border-border shadow-2xs">
                      <p className="text-[11px] font-medium text-slate-500">Gaji & THR Bulanan</p>
                      <p className="text-lg font-bold text-primary mt-0.5">Siap Cair</p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Pajak & BPJS Beres</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-800">
                          Catatan Presensi Hari Ini
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Log Presensi</span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="size-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            NP
                          </div>
                          <span className="font-semibold text-slate-900 truncate">Nadia Putri</span>
                          <span className="text-slate-500 text-[11px] truncate hidden xs:inline">(Kasir Toko Tebet)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-600 text-[11px] font-medium hidden sm:inline">Lokasi Valid</span>
                          <span className="text-slate-500 font-mono text-[11px]">08:11 WIB</span>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="size-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            RD
                          </div>
                          <span className="font-semibold text-slate-900 truncate">Raka Dirgantara</span>
                          <span className="text-slate-500 text-[11px] truncate hidden xs:inline">(Barista Toko Kemang)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-600 text-[11px] font-medium hidden sm:inline">Lokasi Valid</span>
                          <span className="text-slate-500 font-mono text-[11px]">08:16 WIB</span>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="size-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            SM
                          </div>
                          <span className="font-semibold text-slate-900 truncate">Salsa Mahardika</span>
                          <span className="text-slate-500 text-[11px] truncate hidden xs:inline">(Sales Canvasing Beat Plan)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-amber-600 text-[11px] font-medium hidden sm:inline">Kunjungan Toko</span>
                          <span className="text-slate-500 font-mono text-[11px]">08:19 WIB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block absolute -right-4 -bottom-8 w-68 rounded-3xl border-4 border-slate-900 bg-white shadow-2xl p-3.5 z-20">
                <div className="flex justify-center mb-1.5">
                  <div className="w-16 h-3 bg-slate-900 rounded-full" />
                </div>
                
                <div className="text-center py-1 border-b border-slate-100">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    akugawe Aplikasi Karyawan
                  </p>
                  <p className="text-xs font-bold text-slate-800">Nadia Putri</p>
                  <p className="text-[9px] text-slate-500">Shift Pagi (08:00 - 17:00)</p>
                </div>

                <div className="flex items-center justify-between text-[10px] bg-amber-50/90 border border-amber-200 rounded-xl px-2.5 py-1.5 my-2">
                  <div className="flex items-center gap-1 font-bold text-amber-900">
                    <Flame className="size-3.5 text-rose-500 fill-rose-500" />
                    <span>14 Hari On-Time</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-primary">
                    <Gift className="size-3 text-primary" />
                    <span>140 Poin Disiplin</span>
                  </div>
                </div>

                <div className="mb-2 p-2 rounded-xl bg-slate-50 border border-border text-center">
                  <div className="size-10 rounded-full bg-emerald-50 border-2 border-dashed border-emerald-500 mx-auto flex items-center justify-center text-emerald-600 mb-1">
                    <ScanFace className="size-5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-900">Foto Selfie & Lokasi Valid</p>
                  <p className="text-[9px] text-emerald-600 font-semibold">
                    Radius Toko Valid (8m)
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-center">
                  <div className="p-1 rounded-lg bg-secondary border border-border">
                    <Calendar className="size-3 text-primary mx-auto" />
                    <span className="text-[8px] font-bold text-primary block mt-0.5">Cuti</span>
                  </div>
                  <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-100">
                    <Store className="size-3 text-indigo-600 mx-auto" />
                    <span className="text-[8px] font-bold text-indigo-700 block mt-0.5">Kunjungan</span>
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
                  <div className="p-1 rounded-lg bg-purple-50 border border-purple-100">
                    <Bot className="size-3 text-purple-600 mx-auto" />
                    <span className="text-[8px] font-bold text-purple-700 block mt-0.5">Telegram</span>
                  </div>
                </div>

                <a
                  href={`${appUrl}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-2 rounded-xl bg-primary text-white font-bold text-[11px] shadow-xs text-center hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Absen Masuk (+10 Poin)
                </a>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Fitur utama */}
        <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal delayMs={0} yOffset={20} className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                Fitur Utama
              </p>
              <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Empat Pilar Operasional untuk Usaha yang Terus Tumbuh
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                Menyelesaikan kebutuhan riil di lapangan: dari pencegahan kecurangan presensi, pengawalan rute sales, kebutuhan finansial darurat karyawan, hingga perhitungan gaji resmi.
              </p>
            </ScrollReveal>

            <div className="space-y-8">
              {/* Presensi & geofence */}
              <ScrollReveal delayMs={0} yOffset={24} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Pilar 01 • Presensi Akurat
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Wajib selfie kamera langsung dan verifikasi radius geofence toko
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Karyawan hanya dapat mencatatkan kehadiran ketika posisi GPS ponsel berada di dalam radius resmi kantor atau cabang toko. Sistem secara aktif menolak Fake GPS dan foto unggahan galeri. Jam presensi disinkronkan langsung ke waktu server resmi untuk mencegah manipulasi jam ponsel.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">1 Akun Terkunci di 1 HP</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                            Perangkat diverifikasi atasan saat pertama kali login. Karyawan tidak dapat saling titip absen.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <Fingerprint className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Sensor Biometrik Cepat</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                            Buka aplikasi secara instan dan aman menggunakan sidik jari atau Face ID di ponsel masing-masing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Simulation Card */}
                  <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-800">
                        Simulasi Validasi Presensi
                      </p>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Radius Toko Valid
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span className="font-semibold text-slate-800">Tingkat Kehadiran Tepat Waktu</span>
                        <span className="font-bold text-emerald-600">97.6%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[97.6%]" />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="px-3 py-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-900 truncate">Nadia Putri</span>
                          <span className="text-slate-500 text-[11px] truncate hidden xs:inline">(Toko Tebet)</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 shrink-0">08:11 WIB</span>
                      </div>

                      <div className="px-3 py-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-900 truncate">Raka Dirgantara</span>
                          <span className="text-slate-500 text-[11px] truncate hidden xs:inline">(Toko Kemang)</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 shrink-0">08:16 WIB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Canvasing sales */}
              <ScrollReveal delayMs={40} yOffset={24} className="rounded-2xl border border-border bg-gradient-to-br from-brand-50/50 via-white to-background p-6 sm:p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Pilar 02 • Canvasing Sales & Distribusi
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Paket Business Pro
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Jadwal Beat Plan, navigasi Google Maps, taking order PO, dan serah terima setoran
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      Kelola dan pantau aktivitas tim sales lapangan secara transparan langsung dari tab <strong>Kunjungan</strong> di aplikasi ponsel. Supervisor dapat menyusun master direktori toko dan rute harian (Beat Plan). Sales wajib melakukan check-in dan check-out di setiap lokasi toko dengan foto bukti, koordinat GPS, serta durasi kunjungan tercatat otomatis. Aktivitas terkunci otomatis setelah sales melakukan clock-out harian.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-2xs">
                        <Navigation className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Beat Plan & Peta</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                            Navigasi rute langsung ke Google Maps
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-2xs">
                        <ShoppingBag className="size-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Taking Order (PO)</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                            Catat pesanan barang di depan pemilik toko
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-2xs">
                        <Wallet className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Inkaso & Setoran</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                            Rekonsiliasi tunai, transfer, dan giro ke kasir
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Store className="size-4 text-primary" />
                        <span className="text-xs font-bold text-slate-900">Pantauan Kunjungan Toko Sales</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Mode Offline-First
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">Toko Sumber Makmur</span>
                        <span className="text-slate-500 text-[11px] truncate hidden sm:inline">(42 Menit)</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 shrink-0">PO Rp 4,2 Jt</span>
                    </div>

                    <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">Grosir Berkah Jaya</span>
                        <span className="text-slate-500 text-[11px] truncate hidden sm:inline">(Setor Tunai)</span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 shrink-0">Tagihan Lunas</span>
                    </div>

                    <div className="px-3 py-2 rounded-lg bg-secondary border border-border flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">Minimarket Sentosa (Jadwal #3)</span>
                      </div>
                      <span className="text-[10px] font-bold text-primary shrink-0">Buka Rute Maps</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScrollReveal delayMs={80} yOffset={24} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mb-3.5">
                      <Wallet className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                      Pilar 03A • Finansial Staf
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">
                      Kasbon darurat cicilan dan klaim reimbursement foto nota
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Bantu kebutuhan darurat karyawan tanpa prosedur birokrasi yang rumit. Karyawan dapat mengajukan kasbon darurat langsung dari ponsel dengan opsi cicilan 1 sampai 6 bulan. Setelah disetujui atasan, potongan angsuran langsung tercatat rapi di slip gaji. Karyawan lapangan juga dapat mengklaim uang BBM dan operasional cukup dengan memotret kuitansi nota.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Kasbon Cicilan 1–6 Bulan</span>
                      <span className="text-[11px] font-semibold text-primary">Auto-Potong Slip</span>
                    </div>
                    <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Klaim BBM & Operasional Toko</span>
                      <span className="text-[11px] font-semibold text-emerald-700">Foto Kuitansi Nota</span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={120} yOffset={24} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3.5">
                      <Gift className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                      Pilar 03B • Motivasi Positif
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">
                      Sistem poin hadiah dan streak kehadiran tepat waktu
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Dorong kedisiplinan kerja melalui pendekatan apresiasi positif. Setiap kali karyawan hadir tepat waktu sebelum batas toleransi habis, mereka mendapatkan tambahan poin harian dan lencana streak berturut-turut. Poin yang terkumpul dapat ditukar dengan voucher belanja atau tambahan insentif.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Streak 14 Hari On-Time</span>
                      <span className="text-[11px] font-semibold text-amber-700">+10 Poin / Hari</span>
                    </div>
                    <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Katalog Hadiah di HP</span>
                      <span className="text-[11px] font-semibold text-primary">Voucher & Saldo Dompet Digital</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Penggajian & bot Telegram */}
              <ScrollReveal delayMs={160} yOffset={24} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Pilar 04 • Penggajian & Otomasi HR
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Hitung gaji, lembur, BPJS, pajak PPh 21 TER, dan THR tanpa rumus manual
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      Selesaikan proses penggajian bulanan dalam hitungan menit. Seluruh komponen diperhitungkan secara otomatis: potongan keterlambatan, uang lembur resmi Depnaker, pajak PPh 21 skema TER (PP 58/2023), iuran BPJS Ketenagakerjaan dan Kesehatan, serta kalkulator THR proporsional sesuai Permenaker No. 6/2016. Slip gaji PDF siap dibagikan ke ponsel karyawan bersama berkas transfer bank massal.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <FileText className="size-4 text-primary mb-1.5" />
                        <p className="font-bold text-slate-900">Pajak PPh 21 TER</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">Sesuai Kategori A, B, C</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <ShieldCheck className="size-4 text-emerald-600 mb-1.5" />
                        <p className="font-bold text-slate-900">BPJS Lengkap</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">JHT, JP, JKK, JKM & Kesehatan</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <Calculator className="size-4 text-amber-600 mb-1.5" />
                        <p className="font-bold text-slate-900">Kalkulator THR</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">Proporsional Masa Kerja</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-900 text-white p-5 space-y-3.5 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400">
                          <Bot className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Bot Asisten HR Telegram</p>
                          <p className="text-[10px] text-slate-400">Notifikasi & Persetujuan Instan</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Online
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-800/80 text-slate-200 text-[11px] leading-relaxed">
                        <p className="font-semibold text-slate-400 text-[10px] uppercase mb-0.5">Pesan Masuk Admin:</p>
                        "Siapa staf toko cabang yang belum absen hari ini?"
                      </div>
                      <div className="p-2.5 rounded-lg bg-primary/20 border border-primary/40 text-rose-100 text-[11px] leading-relaxed">
                        <p className="font-semibold text-rose-300 text-[10px] uppercase mb-0.5">Balasan Bot:</p>
                        Semua staf cabang Tebet dan Kemang sudah hadir tepat waktu. Staf Salsa Mahardika mengajukan izin sakit (1 hari).
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Persetujuan Cuti Langsung</span>
                      <span className="font-semibold text-rose-300">1 Klik di Telegram</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Skenario operasional */}
        <section id="solusi" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/60 border-b border-slate-200">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal delayMs={0} yOffset={20} className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                Skenario Penggunaan
              </p>
              <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Cocok untuk Berbagai Sektor Usaha di Indonesia
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                Dirancang untuk kebutuhan nyata: toko ritel, restoran dan kafe, distributor grosir, kantor cabang, hingga tim sales canvasing lapangan.
              </p>
            </ScrollReveal>

            <div className="flex md:grid md:grid-cols-3 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              <ScrollReveal delayMs={0} yOffset={24} className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
                <div className="size-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary mb-4">
                  <Building2 className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Toko Retail, Kafe, dan Restoran</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Shift Pagi, Siang & Malam Lintas Hari</p>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pergantian shift kasir dan barista tercatat rapi tanpa antrean di mesin fingerprint fisik. Shift malam yang melewati pergantian hari tetap otomatis tercatat pada tanggal kerja yang tepat.
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={90} yOffset={24} className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
                <div className="size-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary mb-4">
                  <MapPin className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Distributor, Cabang & Sales Canvasing</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Beat Plan Toko, Taking Order PO, & Inkaso</p>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pantau kehadiran seluruh cabang dan sebaran kunjungan tim sales dari satu layar. Sales mengikuti rute Beat Plan, check-in GPS di toko tujuan, input pesanan PO, hingga serah terima setoran kasir.
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={180} yOffset={24} className="w-[82vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
                <div className="size-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary mb-4">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Hitung Gaji Tanpa Lembur Excel</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Pemilik Usaha, HR & Admin Toko</p>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Rekap absensi akhir bulan selesai dalam hitungan menit. Potongan menit telat, uang lembur resmi, cicilan kasbon, BPJS, dan kalkulator THR terhitung otomatis dalam slip gaji PDF.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Paket harga */}
        <ScrollReveal delayMs={0} yOffset={20}>
          <PricingSection
            sellerConfig={sellerConfig}
            onProceedToOnboarding={(token) => {
              setActiveToken(token);
              setCurrentView('onboarding');
              window.history.pushState({}, '', `/?onboarding=true&token=${token}`);
            }}
          />
        </ScrollReveal>

        {/* Tanya jawab (FAQ) */}
        <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal delayMs={0} yOffset={20} className="text-center mb-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                Pertanyaan yang Sering Ditanyakan
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Jawaban praktis untuk membantu tim Anda memahami cara kerja akugawe sebelum mulai implementasi.
              </p>
            </ScrollReveal>

            <ScrollReveal delayMs={80} yOffset={24}>
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="py-4 sm:py-5">
                      <button
                        type="button"
                        id={`faq-btn-${idx}`}
                        aria-controls={`faq-panel-${idx}`}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between text-left gap-4 font-semibold text-base sm:text-lg text-slate-900 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg p-1"
                      >
                        <span>{item.q}</span>
                        <span className="p-1 rounded-md text-slate-500 shrink-0">
                          {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                        </span>
                      </button>

                      <p
                        id={`faq-panel-${idx}`}
                        aria-labelledby={`faq-btn-${idx}`}
                        className={
                          isOpen
                            ? 'mt-3 text-sm text-slate-600 leading-relaxed pr-8 pl-1'
                            : 'sr-only'
                        }
                      >
                        {item.a}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Ajakan bertindak (CTA) */}
        <section id="cta" className="py-16 sm:py-20 px-4 sm:px-6 bg-brand-700 text-white">
          <ScrollReveal delayMs={0} yOffset={20} className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Siap mengelola presensi dan gaji tim secara lebih rapi?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-rose-100 max-w-xl mx-auto leading-relaxed">
              Mulai gunakan akugawe hari ini. Pantau kehadiran tim toko, sales canvasing lapangan, dan cabang secara transparan tanpa kerumitan administrasi manual.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href={`${dashboardUrl}/login`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                Coba Demo Sekarang
              </a>
              <a
                href={getWaLink()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <MessageCircle className="size-4" />
                <span>Konsultasi via WhatsApp</span>
              </a>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-2xs">
                <Logo className="w-full h-full" />
              </div>
              <span className="font-bold text-sm text-slate-900">akugawe</span>
              <span className="text-slate-400">|</span>
              <span>Aplikasi Presensi Selfie GPS, Canvasing Sales, dan Payroll Indonesia</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#hero" className="hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">
                Beranda
              </a>
              <a href="#fitur" className="hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">
                Fitur App
              </a>
              <a href="#solusi" className="hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">
                Skenario
              </a>
              <a href="#harga" className="hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">
                Harga
              </a>
              <a href="#faq" className="hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">
                FAQ
              </a>
              <a
                href="/llms.txt"
                className="text-slate-600 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
                title="Ringkasan Produk untuk AI & LLM"
              >
                AI / LLMs
              </a>
              <a
                href="/salesAdmin"
                className="text-slate-600 hover:text-primary flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
              >
                <Key className="size-3" /> Area Penjual
              </a>
            </div>

            <p>© 2026 akugawe. Hak cipta dilindungi.</p>
          </div>

          {/* Local SEO & Google Maps Service Coverage Footnote */}
          <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p>
              <strong className="text-slate-600 font-medium">Jangkauan Layanan Seluruh Indonesia:</strong>{' '}
              Jakarta, Bogor, Depok, Tangerang, Bekasi (Jabodetabek), Surabaya, Bandung, Medan, Semarang, Makassar, Yogyakarta, Denpasar (Bali), Malang, Palembang, Balikpapan, Pekanbaru, Solo, Banjarmasin, Batam, dan kota lainnya.
            </p>
            <p className="shrink-0 text-slate-500">
              Terintegrasi Titik Geofence & Navigasi Google Maps
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
