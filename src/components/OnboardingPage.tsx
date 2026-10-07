import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Rocket,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  BookOpen,
  Copy,
  Globe,
  Database,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowLeft,
  Key,
  Server,
  Lock,
  ShieldAlert,
  MessageCircle,
} from 'lucide-react';
import { triggerGitHubDeploy } from '../services/deployDispatcher';
import {
  verifyLicenseToken,
  verifyLicenseTokenRemote,
  markClientDeployed,
  TokenVerificationResult,
} from '../services/licenseService';
import { loadSellerConfig } from '../services/config';
import { Logo } from '../assets/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface OnboardingProps {
  initialToken?: string;
  onBackToLanding: () => void;
}

export function OnboardingPage({ initialToken = '', onBackToLanding }: OnboardingProps) {
  const sellerConfig = loadSellerConfig();

  // Token Verification State
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verification, setVerification] = useState<TokenVerificationResult>(() =>
    verifyLicenseToken(initialToken)
  );

  // Form State
  const [businessName, setBusinessName] = useState(() =>
    verification.valid ? verification.client.name : ''
  );
  const [businessSlug, setBusinessSlug] = useState(() =>
    verification.valid
      ? verification.client.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : ''
  );
  const [customDomainDashboard, setCustomDomainDashboard] = useState('');
  const [customDomainApp, setCustomDomainApp] = useState('');
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfApiToken, setCfApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [deployMode, setDeployMode] = useState<'production' | 'seed' | 'demo'>('production');

  // Deploy State — real results only, no simulation
  const [isDeploying, setIsDeploying] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const [predictedUrls, setPredictedUrls] = useState<{
    dashboard: string;
    app: string;
    api: string;
    customDashboard?: string;
    customApp?: string;
  } | null>(null);

  // Re-verify if initialToken prop changes
  useEffect(() => {
    let isMounted = true;
    async function checkToken() {
      if (initialToken) {
        setTokenInput(initialToken);
        const res = await verifyLicenseTokenRemote(initialToken);
        if (isMounted) {
          setVerification(res);
          if (res.valid) {
            setBusinessName(res.client.name);
            setBusinessSlug(
              res.client.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
            );
          }
        }
      }
    }
    checkToken();
    return () => {
      isMounted = false;
    };
  }, [initialToken]);

  // Handler to verify a manual token input on the security gate
  const handleVerifyManualToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error('Silakan ketik atau tempelkan token lisensi Anda.');
      return;
    }

    const res = await verifyLicenseTokenRemote(tokenInput.trim());
    setVerification(res);

    if (res.valid) {
      setBusinessName(res.client.name);
      setBusinessSlug(
        res.client.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      );
      // Update browser URL query without reload
      const url = new URL(window.location.href);
      url.searchParams.set('onboarding', 'true');
      url.searchParams.set('token', res.client.token);
      window.history.replaceState({}, '', url.toString());
      toast.success(`Token sah! Selamat datang, ${res.client.name}.`);
    } else {
      toast.error(res.message);
    }
  };

  // Auto-generate slug from business name
  const handleNameChange = (val: string) => {
    setBusinessName(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setBusinessSlug(slug);
  };

  const handleStartDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    // Security Gate check
    if (!verification.valid) {
      toast.error('Akses ditolak: token lisensi tidak terdaftar.');
      return;
    }

    if (!cfAccountId.trim() || !cfApiToken.trim()) {
      alert('Mohon isi Cloudflare Account ID dan API Token.');
      return;
    }

    setIsDeploying(true);
    setDispatchError(null);

    const dispatchRes = await triggerGitHubDeploy({
      clientName: businessName || verification.client.name,
      clientSlug: businessSlug,
      cfAccountId: cfAccountId.trim(),
      cfApiToken: cfApiToken.trim(),
      customDomainDashboard: useCustomDomain ? customDomainDashboard : undefined,
      customDomainApp: useCustomDomain ? customDomainApp : undefined,
      deployMode: deployMode,
      seedDemoData: deployMode === 'demo',
    });

    setIsDeploying(false);

    if (dispatchRes.success) {
      const cleanSlug = businessSlug || 'usaha-anda';
      const dashUrl = `https://dash-${cleanSlug}.pages.dev`;
      const appUrl = `https://app-${cleanSlug}.pages.dev`;
      const apiUrl = `https://ngabsen-api-${cleanSlug}.workers.dev`;

      setPredictedUrls({
        dashboard: dashUrl,
        app: appUrl,
        api: apiUrl,
        customDashboard: useCustomDomain && customDomainDashboard ? `https://${customDomainDashboard}` : undefined,
        customApp: useCustomDomain && customDomainApp ? `https://${customDomainApp}` : undefined,
      });

      // Update client status using licenseService
      markClientDeployed(verification.client.token, {
        deployedUrl: dashUrl,
        customDomainDashboard: useCustomDomain && customDomainDashboard ? customDomainDashboard : undefined,
        customDomainApp: useCustomDomain && customDomainApp ? customDomainApp : undefined,
      });

      setRunUrl(dispatchRes.runUrl || null);
      setDispatched(true);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else {
      setDispatchError(dispatchRes.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Tersalin ke clipboard!');
  };

  const getWaHelpLink = (tokenValue: string) => {
    const text = `Halo Tim ${sellerConfig.brandName}, saya mengalami kendala saat aktivasi token lisensi di portal onboarding. Token: *${tokenValue || 'Belum Ada Token'}*. Mohon bantuan verifikasinya.`;
    return `https://wa.me/${sellerConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  // ─── SECURITY GATE: ACCESS DENIED IF TOKEN IS NOT REGISTERED ───────────────
  if (!verification.valid) {
    return (
      <div className="min-h-screen bg-[#faf6f5] text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-lg w-full bg-white border border-[#f0dbd8] shadow-xl shadow-rose-950/5 rounded-3xl p-6 sm:p-8 text-center space-y-6">
          <div className="size-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="size-9 text-rose-600" />
          </div>

          <div className="space-y-2">
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-700 border-rose-200 text-xs px-3 py-1 font-semibold uppercase tracking-wider"
            >
              Akses Ditolak (403 Unauthorized)
            </Badge>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Token Lisensi Tidak Terdaftar
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Halaman onboarding ini dilindungi sistem verifikasi hak milik. Akses 1-Click Deploy ke Cloudflare hanya diperuntukkan bagi pembeli resmi dengan token lisensi aktif.
            </p>
          </div>

          {/* Error Notice Box */}
          <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] text-left space-y-1.5 text-xs">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-rose-600 shrink-0" />
              Detail Pemeriksaan Keamanan:
            </div>
            <p className="text-slate-600 leading-relaxed">
              {verification.message}
            </p>
            {verification.token && (
              <div className="mt-2 pt-2 border-t border-[#f0dbd8] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Token Diperiksa:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {verification.token}
                </span>
              </div>
            )}
          </div>

          {/* Form to enter a valid token */}
          <form onSubmit={handleVerifyManualToken} className="space-y-3 pt-1 text-left">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Masukkan Token Lisensi Resmi Anda:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Contoh: NGABSEN-KOPISENO-7281"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="pl-9 font-mono text-xs h-10 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                />
              </div>
              <Button
                type="submit"
                className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold text-xs h-10 px-4 cursor-pointer"
              >
                Cek Token 🔍
              </Button>
            </div>
          </form>

          {/* Actions & WhatsApp Support */}
          <div className="space-y-2.5 pt-2 border-t border-[#f0dbd8]">
            <a
              href={getWaHelpLink(tokenInput || initialToken)}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <MessageCircle className="size-4 text-emerald-600" />
              Hubungi Tim Penjual via WhatsApp
            </a>

            <button
              onClick={onBackToLanding}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              ← Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── AUTHENTICATED ONBOARDING PAGE (TOKEN VALID & REGISTERED) ───────────────
  const client = verification.client;

  return (
    <div className="min-h-screen bg-[#faf6f5] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation Bar */}
        <div className="bg-white border border-[#f0dbd8] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-[#a9484c] text-white p-1 shadow-xs">
                <Logo className="size-full" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="size-3.5 text-emerald-600" /> Lisensi Resmi Terverifikasi
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#fbf2f0] border border-[#f0dbd8] text-[#8f3b3f] text-xs font-mono font-semibold">
                <Key className="size-3 text-[#a9484c]" /> {client.token}
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Aktivasi & 1-Click Deploy ke Cloudflare Anda
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Selamat datang, <strong>{client.name}</strong>! Sistem absensi & payroll akan dibangun dan di-deploy 100% mandiri ke akun Cloudflare milik Anda tanpa biaya server bulanan selamanya.
            </p>
          </div>

          <button
            onClick={onBackToLanding}
            className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#f0dbd8] hover:bg-[#fbf2f0] rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke Depan
          </button>
        </div>

        {/* Informative banner if already deployed */}
        {verification.isAlreadyDeployed && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
            <Clock className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                Pemberitahuan: Lisensi ini sudah pernah di-deploy sebelumnya.
              </p>
              <p className="mt-0.5 text-amber-800">
                URL aktif terakhir:{' '}
                <a
                  href={client.deployedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono underline font-medium text-amber-950"
                >
                  {client.deployedUrl}
                </a>
                . Menjalankan deploy ulang akan memperbarui kode sistem ke versi terbaru.
              </p>
            </div>
          </div>
        )}

        {!dispatched ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Setup Kiri */}
            <div className="lg:col-span-7 bg-white border border-[#f0dbd8] rounded-2xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-3 border-b border-[#f0dbd8]">
                <Rocket className="size-5 text-[#a9484c]" />
                Form Konfigurasi Sistem
              </h2>

              <form onSubmit={handleStartDeploy} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Nama Bisnis / Toko / Perusahaan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Kenangan Senopati"
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-[#f0dbd8] rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#a9484c] focus:ring-2 focus:ring-[#a9484c]/20 transition shadow-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Terdaftar sesuai lisensi: <strong>{client.name}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Slug URL Sistem
                  </label>
                  <div className="flex items-center bg-white border border-[#f0dbd8] rounded-xl px-4 py-3 text-sm text-slate-500 focus-within:border-[#a9484c] focus-within:ring-2 focus-within:ring-[#a9484c]/20 transition shadow-xs">
                    <span className="text-slate-400 mr-1 font-mono text-xs">https://dash-</span>
                    <input
                      type="text"
                      required
                      placeholder="kopi-kenangan"
                      value={businessSlug}
                      onChange={(e) => setBusinessSlug(e.target.value)}
                      className="bg-transparent text-slate-900 focus:outline-none flex-1 font-mono text-sm"
                    />
                    <span className="text-slate-400 font-mono text-xs">.pages.dev</span>
                  </div>
                </div>

                {/* Custom Domain Section */}
                <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Globe className="size-3.5 text-sky-600" /> Gunakan Custom Domain Sendiri?
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Misal: <code>dash.bisnisanda.com</code> & <code>absen.bisnisanda.com</code>
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomDomain}
                        onChange={(e) => setUseCustomDomain(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a9484c]"></div>
                    </label>
                  </div>

                  {useCustomDomain && (
                    <div className="space-y-3 pt-3 border-t border-[#f0dbd8]">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Domain Dashboard Owner (Admin HR)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: dash.kopikenangan.id"
                          value={customDomainDashboard}
                          onChange={(e) => setCustomDomainDashboard(e.target.value)}
                          className="w-full bg-white border border-[#f0dbd8] rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Domain Absensi Karyawan (Mobile PWA)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: absen.kopikenangan.id"
                          value={customDomainApp}
                          onChange={(e) => setCustomDomainApp(e.target.value)}
                          className="w-full bg-white border border-[#f0dbd8] rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        💡 Catatan DNS: Cukup arahkan CNAME domain Anda ke Cloudflare Pages setelah proses deploy selesai.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pilihan Mode Deployment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Mode Inisialisasi Database
                    </label>
                    <span className="text-[11px] text-slate-500">Pilih salah satu</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Production (Polos) */}
                    <div
                      onClick={() => setDeployMode('production')}
                      className={`relative p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        deployMode === 'production'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-[#f0dbd8] hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${deployMode === 'production' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#fbf4f3] text-slate-500'}`}>
                            <ShieldCheck className="size-4" />
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            deployMode === 'production'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            Live Siap Pakai
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">Production (Polos)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Database bersih 100% tanpa dummy data. Langsung siap dipakai operasional bisnis asli.
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle2 className={`size-3.5 ${deployMode === 'production' ? 'opacity-100' : 'opacity-0'}`} />
                        <span>{deployMode === 'production' ? 'Terpilih' : 'Pilih Mode'}</span>
                      </div>
                    </div>

                    {/* Seed Data */}
                    <div
                      onClick={() => setDeployMode('seed')}
                      className={`relative p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        deployMode === 'seed'
                          ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                          : 'bg-white border-[#f0dbd8] hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${deployMode === 'seed' ? 'bg-sky-100 text-sky-800' : 'bg-[#fbf4f3] text-slate-500'}`}>
                            <Database className="size-4" />
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            deployMode === 'seed'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            Data Awal
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">Seed Data (Awal)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Profil usaha & akun admin utama dibuat otomatis, tanpa karyawan atau presensi palsu.
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-sky-700">
                        <CheckCircle2 className={`size-3.5 ${deployMode === 'seed' ? 'opacity-100' : 'opacity-0'}`} />
                        <span>{deployMode === 'seed' ? 'Terpilih' : 'Pilih Mode'}</span>
                      </div>
                    </div>

                    {/* Mode Demo */}
                    <div
                      onClick={() => setDeployMode('demo')}
                      className={`relative p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        deployMode === 'demo'
                          ? 'bg-[#fbf2f0] border-[#a9484c] ring-2 ring-[#a9484c]/20 shadow-xs'
                          : 'bg-white border-[#f0dbd8] hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${deployMode === 'demo' ? 'bg-[#f7e5e3] text-[#a9484c]' : 'bg-[#fbf4f3] text-slate-500'}`}>
                            <Sparkles className="size-4" />
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            deployMode === 'demo'
                              ? 'bg-[#f7e5e3] text-[#8f3b3f] border border-[#f0dbd8]'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            Interactive Demo
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">Mode Demo (Trial)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Lengkap akun demo, simulasi staf (Budi & Siti), dan data presensi. Cocok untuk uji coba.
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-[#8f3b3f]">
                        <CheckCircle2 className={`size-3.5 ${deployMode === 'demo' ? 'opacity-100' : 'opacity-0'}`} />
                        <span>{deployMode === 'demo' ? 'Terpilih' : 'Pilih Mode'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Cloudflare Account ID Anda
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="32 karakter hex (misal: ae5d7e2415967c0b8e8e73770a05de48)"
                    value={cfAccountId}
                    onChange={(e) => setCfAccountId(e.target.value)}
                    className="w-full bg-white border border-[#f0dbd8] rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#a9484c] focus:ring-2 focus:ring-[#a9484c]/20 transition shadow-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dapat dilihat di dashboard kanan bawah akun Cloudflare Anda.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Cloudflare API Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      required
                      placeholder="Token dengan izin Workers, Pages, & D1"
                      value={cfApiToken}
                      onChange={(e) => setCfApiToken(e.target.value)}
                      className="w-full bg-white border border-[#f0dbd8] rounded-xl px-4 py-3 pr-11 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#a9484c] focus:ring-2 focus:ring-[#a9484c]/20 transition shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Token ini hanya dipakai sekali saat deploy dan tidak disimpan di server pihak ketiga.
                  </p>
                </div>

                {/* Error Banner */}
                {dispatchError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <AlertCircle className="size-4 mt-0.5 shrink-0 text-rose-600" />
                    <span>{dispatchError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isDeploying}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-[#a9484c] hover:bg-[#8f3b3f] shadow-md shadow-[#a9484c]/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    {isDeploying ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" /> Mengirim ke GitHub Actions...
                      </>
                    ) : (
                      <>
                        <Rocket className="size-4" /> 1-Click Deploy ke Cloudflare Saya Sekarang 🚀
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Panduan Langkah Kanan */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#f0dbd8] rounded-2xl p-6 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[#f0dbd8]">
                  <BookOpen className="size-4 text-[#a9484c]" /> Panduan Singkat (Bagi Pemula)
                </h3>
                <ol className="space-y-4 text-xs text-slate-600">
                  <li className="flex gap-3">
                    <span className="size-6 rounded-full bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center text-xs font-bold text-[#8f3b3f] shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">Daftar Akun Cloudflare</p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Buka{' '}
                        <a
                          href="https://dash.cloudflare.com/sign-up"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#a9484c] font-semibold underline inline-flex items-center gap-0.5 hover:text-[#8f3b3f]"
                        >
                          dash.cloudflare.com/sign-up <ExternalLink className="size-2.5" />
                        </a>
                        . 100% Gratis selamanya (Free Tier mencakup 100k request/hari).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="size-6 rounded-full bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center text-xs font-bold text-[#8f3b3f] shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">Salin Account ID</p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Di dashboard utama akun Cloudflare Anda, lihat kolom sebelah kanan bawah pada bagian <strong>Account ID</strong>.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="size-6 rounded-full bg-[#fbf2f0] border border-[#f0dbd8] flex items-center justify-center text-xs font-bold text-[#8f3b3f] shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">Buat API Token</p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Buka menu profil ➜ <strong>API Tokens</strong> ➜ <strong>Create Token</strong>. Pilih izin Workers, Pages, dan D1 (Edit).
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="p-4 rounded-xl bg-[#fdf7f1] border border-[#f0dbd8] text-xs space-y-2 text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Server className="size-3.5 text-[#a9484c]" />
                    Gratis Serverless Hosting:
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Dengan Cloudflare D1 & Workers, Anda tidak perlu membayar tagihan server VPS atau biaya langganan SaaS per kepala selamanya.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5 text-emerald-900">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Lock className="size-3.5 text-emerald-700" />
                    Privasi Data & Hak Milik 100%:
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    Seluruh data presensi selfie, rekaman GPS, dan slip gaji karyawan tersimpan di akun Cloudflare privat milik Anda sendiri.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAMPILAN SUKSES — WORKFLOW DISPATCHED */
          <div className="bg-white border border-emerald-300 rounded-3xl p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
            <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pipeline Deploy Berhasil Dipicu! 🚀
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto mt-2 text-sm sm:text-base leading-relaxed">
              GitHub Actions sedang membangun dan men-deploy sistem untuk{' '}
              <strong className="text-slate-900">{businessName}</strong> ke akun Cloudflare Anda.
            </p>

            {/* Status Box */}
            <div className="mt-6 max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left">
              <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Estimasi selesai: 5–10 menit</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Pantau progres deployment secara real-time di GitHub Actions. URL sistem baru aktif setelah pipeline selesai sepenuhnya.
                </p>
              </div>
            </div>

            {/* GitHub Actions Run Link */}
            {runUrl && (
              <div className="mt-5">
                <a
                  href={runUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#f0dbd8] text-slate-800 font-semibold text-sm transition shadow-xs"
                >
                  <Terminal className="size-4 text-[#a9484c]" />
                  Lihat Live Log di GitHub Actions
                  <ExternalLink className="size-3.5 text-slate-400" />
                </a>
              </div>
            )}

            {/* Predicted URL Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8 text-left">
              <div className="p-5 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8]">
                <div className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>👑 Dashboard Owner & HR</span>
                </div>
                <div className="font-mono text-xs sm:text-sm text-slate-900 font-bold truncate mb-1">
                  {predictedUrls?.dashboard}
                </div>
                <p className="text-[11px] text-slate-500">Tersedia setelah pipeline selesai</p>
                <button
                  onClick={() => copyToClipboard(predictedUrls?.dashboard || '')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-[#f0dbd8] text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f] transition text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Salin URL"
                >
                  <Copy className="size-3" /> Salin URL
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8]">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>📱 Mobile PWA Karyawan</span>
                </div>
                <div className="font-mono text-xs sm:text-sm text-slate-900 font-bold truncate mb-1">
                  {predictedUrls?.app}
                </div>
                <p className="text-[11px] text-slate-500">Tersedia setelah pipeline selesai</p>
                <button
                  onClick={() => copyToClipboard(predictedUrls?.app || '')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-[#f0dbd8] text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f] transition text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Salin URL"
                >
                  <Copy className="size-3" /> Salin URL
                </button>
              </div>
            </div>

            {/* Custom Domain DNS Guide */}
            {predictedUrls?.customDashboard && (
              <div className="mt-6 max-w-2xl mx-auto bg-sky-50 border border-sky-200 rounded-2xl p-5 text-left text-xs">
                <div className="font-bold text-sky-900 flex items-center gap-2 mb-2">
                  <Globe className="size-4 text-sky-600" /> Setup DNS Custom Domain Anda:
                </div>
                <p className="text-slate-700 mb-3">
                  Di dashboard registrar domain Anda (Niagahoster, Domainesia, dsb.), tambahkan 2 record CNAME berikut:
                </p>
                <div className="space-y-2 font-mono bg-white p-3 rounded-xl border border-sky-200 text-[11px]">
                  <div className="flex justify-between items-center text-slate-800">
                    <span>{customDomainDashboard} ➔ CNAME ➔ {predictedUrls.dashboard.replace('https://', '')}</span>
                  </div>
                  {customDomainApp && (
                    <div className="flex justify-between items-center text-slate-800">
                      <span>{customDomainApp} ➔ CNAME ➔ {predictedUrls.app.replace('https://', '')}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-sky-800 font-medium mt-2">
                  ✨ Cloudflare akan otomatis mengaktifkan SSL HTTPS gratis untuk domain Anda dalam hitungan menit!
                </p>
              </div>
            )}

            {/* Mode Info */}
            {deployMode === 'production' ? (
              <div className="mt-8 max-w-xl mx-auto bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-left text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="size-4 text-emerald-600" /> Mode Production (Polos) Aktif
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-medium">
                    Clean Slate
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Setelah pipeline selesai, buka <strong>Dashboard Owner</strong> dan ikuti <em>Setup Wizard</em> untuk mendaftarkan akun Owner & profil toko pertama kali.
                </p>
              </div>
            ) : deployMode === 'seed' ? (
              <div className="mt-8 max-w-xl mx-auto bg-sky-50 border border-sky-200 p-4 rounded-xl text-left text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sky-800">
                    <Database className="size-4 text-sky-600" /> Akun Admin Utama (Mode Seed Data):
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-medium">
                    Ganti password setelah login!
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-slate-800 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-sky-200">
                  <span>Email: admin@{businessSlug || 'app'}.pages.dev</span>
                  <span>Password: password123</span>
                </div>
              </div>
            ) : (
              <div className="mt-8 max-w-xl mx-auto bg-[#fbf2f0] border border-[#f0dbd8] p-4 rounded-xl text-left text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#8f3b3f]">
                    <Sparkles className="size-4 text-[#a9484c]" /> Akun Demo Lengkap (Mode Demo):
                  </span>
                  <span className="text-[10px] text-[#8f3b3f] bg-white px-2 py-0.5 rounded border border-[#f0dbd8] font-medium">
                    Akun Trial Siap Pakai
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-slate-800 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-[#f0dbd8]">
                  <span>Email: admin@yuk-damel.com</span>
                  <span>Password: password123</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  💡 Tips: Di dashboard & PWA karyawan juga tersedia tombol <em>1-Click Demo Login</em> tanpa perlu mengetik email/password.
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => { setDispatched(false); setDispatchError(null); }}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-[#fbf2f0] border border-[#f0dbd8] transition shadow-xs cursor-pointer"
              >
                Deploy Toko / Cabang Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
