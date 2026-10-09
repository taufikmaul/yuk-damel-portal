import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Rocket,
  ShieldCheck,
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
  verifySignedSession,
  verifyMasterPin,
  createSignedSession,
} from '../services/security';
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

export interface SavedDeployState {
  dispatched: boolean;
  businessName: string;
  businessSlug: string;
  predictedUrls: {
    dashboard: string;
    app: string;
    api: string;
    customDashboard?: string;
    customApp?: string;
  };
  deployMode?: 'production' | 'seed' | 'demo';
  customDomainDashboard?: string;
  customDomainApp?: string;
  useCustomDomain?: boolean;
  isCompleted?: boolean;
  deployedAt?: string;
}

export function getSavedDeployState(token?: string): SavedDeployState | null {
  if (!token || !token.trim()) return null;
  try {
    const raw = localStorage.getItem(`ngabsen_deploy_state_${token.trim().toUpperCase()}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading saved deploy state:', e);
  }
  return null;
}

export function saveDeployState(token: string, state: SavedDeployState) {
  if (!token || !token.trim()) return;
  try {
    localStorage.setItem(`ngabsen_deploy_state_${token.trim().toUpperCase()}`, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving deploy state:', e);
  }
}

function formatSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function OnboardingPage({ initialToken = '', onBackToLanding }: OnboardingProps) {
  const sellerConfig = loadSellerConfig();

  // Token Verification State
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verification, setVerification] = useState<TokenVerificationResult>(() =>
    verifyLicenseToken(initialToken)
  );

  const initialSaved = getSavedDeployState(initialToken);

  // Form State
  const [businessName, setBusinessName] = useState(() => {
    if (initialSaved?.businessName) return initialSaved.businessName;
    return verification.valid ? verification.client.name : '';
  });
  const [businessSlug, setBusinessSlug] = useState(() => {
    if (initialSaved?.businessSlug) return initialSaved.businessSlug;
    return verification.valid ? formatSlug(verification.client.name) : '';
  });
  const [customDomainDashboard, setCustomDomainDashboard] = useState(
    () => initialSaved?.customDomainDashboard || ''
  );
  const [customDomainApp, setCustomDomainApp] = useState(
    () => initialSaved?.customDomainApp || ''
  );
  const [useCustomDomain, setUseCustomDomain] = useState(
    () => !!initialSaved?.useCustomDomain
  );
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfApiToken, setCfApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [deployMode, setDeployMode] = useState<'production' | 'seed' | 'demo'>(
    () => initialSaved?.deployMode || 'production'
  );

  // Status Konfirmasi: Sudah Selesai vs Belum Selesai
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    if (initialSaved?.isCompleted !== undefined) return initialSaved.isCompleted;
    if (verification.valid && (verification.isAlreadyDeployed || verification.client.status === 'active')) {
      return true;
    }
    return false;
  });

  // Deploy State — keep user on deployed view if already dispatched / active
  const [isDeploying, setIsDeploying] = useState(false);
  const [dispatched, setDispatched] = useState<boolean>(() => {
    if (initialSaved?.dispatched) return true;
    if (
      verification.valid &&
      (verification.isAlreadyDeployed ||
        verification.client.status === 'active' ||
        !!verification.client.deployedUrl)
    ) {
      return true;
    }
    return false;
  });
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [predictedUrls, setPredictedUrls] = useState<{
    dashboard: string;
    app: string;
    api: string;
    customDashboard?: string;
    customApp?: string;
  } | null>(() => {
    if (initialSaved?.predictedUrls) return initialSaved.predictedUrls;
    if (
      verification.valid &&
      (verification.isAlreadyDeployed ||
        verification.client.status === 'active' ||
        !!verification.client.deployedUrl)
    ) {
      const cleanSlug = formatSlug(verification.client.name) || 'usaha-anda';
      const dashUrl = verification.client.deployedUrl || `https://dash-${cleanSlug}.pages.dev`;
      const appUrl = `https://app-${cleanSlug}.pages.dev`;
      const apiUrl = `https://ngabsen-api-${cleanSlug}.workers.dev`;
      return {
        dashboard: dashUrl,
        app: appUrl,
        api: apiUrl,
        customDashboard: verification.client.customDomainDashboard
          ? (verification.client.customDomainDashboard.startsWith('http')
              ? verification.client.customDomainDashboard
              : `https://${verification.client.customDomainDashboard}`)
          : undefined,
        customApp: verification.client.customDomainApp
          ? (verification.client.customDomainApp.startsWith('http')
              ? verification.client.customDomainApp
              : `https://${verification.client.customDomainApp}`)
          : undefined,
      };
    }
    return null;
  });

  // Admin State & Verification for Redeploy Capability
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' && sessionStorage.getItem('ngabsen_admin_mode') === 'true') {
        return true;
      }
      if (sessionStorage.getItem('ngabsen_admin_mode') === 'true') {
        return true;
      }
    }
    return false;
  });
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [isVerifyingAdminPin, setIsVerifyingAdminPin] = useState<boolean>(false);
  const [isRedeployMode, setIsRedeployMode] = useState<boolean>(false);

  // Validate if current session is an authenticated admin session
  useEffect(() => {
    let isMounted = true;
    async function checkAdminAuth() {
      try {
        const raw = localStorage.getItem('ngabsen_admin_session_auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          const valid = await verifySignedSession(parsed);
          if (valid && isMounted) {
            setIsAdmin(true);
            sessionStorage.setItem('ngabsen_admin_mode', 'true');
            return;
          }
        }
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true' && isMounted) {
          setShowAdminPinModal(true);
        }
      } catch (_) {}
    }
    checkAdminAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerifyAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput.trim()) {
      toast.error('Silakan masukkan PIN Admin.');
      return;
    }

    setIsVerifyingAdminPin(true);
    try {
      const valid = await verifyMasterPin(adminPinInput.trim(), sellerConfig.adminPinHash);
      if (valid) {
        const session = await createSignedSession(24 * 60 * 60 * 1000);
        localStorage.setItem('ngabsen_admin_session_auth', JSON.stringify(session));
        sessionStorage.setItem('ngabsen_admin_mode', 'true');
        setIsAdmin(true);
        setShowAdminPinModal(false);
        setAdminPinInput('');
        toast.success('Akses Admin berhasil diverifikasi! Fitur Redeploy kini aktif.');
      } else {
        toast.error('PIN Admin salah. Akses ditolak.');
      }
    } catch (_) {
      toast.error('Terjadi kesalahan saat memverifikasi PIN.');
    } finally {
      setIsVerifyingAdminPin(false);
    }
  };

  const handleStartRedeploy = () => {
    setIsRedeployMode(true);
    setDispatched(false);
    setDispatchError(null);
    toast.info('Mode Redeploy aktif. Silakan tinjau konfigurasi Cloudflare lalu klik tombol Deploy.');
  };

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
            const cleanToken = res.client.token;
            const saved = getSavedDeployState(cleanToken);
            if (saved && saved.dispatched) {
              setDispatched(true);
              if (saved.businessName) setBusinessName(saved.businessName);
              if (saved.businessSlug) setBusinessSlug(saved.businessSlug);
              if (saved.predictedUrls) setPredictedUrls(saved.predictedUrls);
              if (saved.deployMode) setDeployMode(saved.deployMode);
              if (saved.isCompleted !== undefined) setIsCompleted(saved.isCompleted);
              if (saved.customDomainDashboard) setCustomDomainDashboard(saved.customDomainDashboard);
              if (saved.customDomainApp) setCustomDomainApp(saved.customDomainApp);
              if (saved.useCustomDomain !== undefined) setUseCustomDomain(saved.useCustomDomain);
            } else if (res.isAlreadyDeployed || res.client.status === 'active' || res.client.deployedUrl) {
              setDispatched(true);
              const cleanSlug = formatSlug(res.client.name) || 'usaha-anda';
              const dashUrl = res.client.deployedUrl || `https://dash-${cleanSlug}.pages.dev`;
              const appUrl = `https://app-${cleanSlug}.pages.dev`;
              const apiUrl = `https://ngabsen-api-${cleanSlug}.workers.dev`;
              const urls = {
                dashboard: dashUrl,
                app: appUrl,
                api: apiUrl,
                customDashboard: res.client.customDomainDashboard
                  ? (res.client.customDomainDashboard.startsWith('http')
                      ? res.client.customDomainDashboard
                      : `https://${res.client.customDomainDashboard}`)
                  : undefined,
                customApp: res.client.customDomainApp
                  ? (res.client.customDomainApp.startsWith('http')
                      ? res.client.customDomainApp
                      : `https://${res.client.customDomainApp}`)
                  : undefined,
              };
              setBusinessName(res.client.name);
              setBusinessSlug(cleanSlug);
              setPredictedUrls(urls);
              setIsCompleted(true);
            } else {
              setBusinessName(res.client.name);
              setBusinessSlug(formatSlug(res.client.name));
            }
          }
        }
      }
    }
    checkToken();
    return () => {
      isMounted = false;
    };
  }, [initialToken]);

  // Sinkronisasi URL browser agar refresh tetap di onboarding dan membersihkan path /salesAdmin
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      let changed = false;

      // Jika URL masih tertinggal path /salesAdmin dari portal admin, bersihkan ke root
      if (url.pathname.startsWith('/salesAdmin')) {
        url.pathname = '/';
        changed = true;
      }

      if (url.searchParams.get('onboarding') !== 'true') {
        url.searchParams.set('onboarding', 'true');
        changed = true;
      }

      const currentToken = (verification.valid ? verification.client.token : tokenInput) || initialToken;
      if (currentToken && url.searchParams.get('token') !== currentToken) {
        url.searchParams.set('token', currentToken);
        changed = true;
      }

      if (isAdmin && url.searchParams.get('admin') !== 'true') {
        url.searchParams.set('admin', 'true');
        changed = true;
      }

      if (changed) {
        window.history.replaceState({ view: 'onboarding', token: currentToken }, '', url.toString());
      }
    } catch (_) {}
  }, [verification, tokenInput, initialToken, isAdmin]);

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
      const cleanToken = res.client.token;
      const saved = getSavedDeployState(cleanToken);
      if (saved && saved.dispatched) {
        setDispatched(true);
        if (saved.businessName) setBusinessName(saved.businessName);
        if (saved.businessSlug) setBusinessSlug(saved.businessSlug);
        if (saved.predictedUrls) setPredictedUrls(saved.predictedUrls);
        if (saved.deployMode) setDeployMode(saved.deployMode);
        if (saved.isCompleted !== undefined) setIsCompleted(saved.isCompleted);
        if (saved.customDomainDashboard) setCustomDomainDashboard(saved.customDomainDashboard);
        if (saved.customDomainApp) setCustomDomainApp(saved.customDomainApp);
        if (saved.useCustomDomain !== undefined) setUseCustomDomain(saved.useCustomDomain);
      } else if (res.isAlreadyDeployed || res.client.status === 'active' || res.client.deployedUrl) {
        setDispatched(true);
        const cleanSlug = formatSlug(res.client.name) || 'usaha-anda';
        const dashUrl = res.client.deployedUrl || `https://dash-${cleanSlug}.pages.dev`;
        const appUrl = `https://app-${cleanSlug}.pages.dev`;
        const apiUrl = `https://ngabsen-api-${cleanSlug}.workers.dev`;
        const urls = {
          dashboard: dashUrl,
          app: appUrl,
          api: apiUrl,
          customDashboard: res.client.customDomainDashboard
            ? (res.client.customDomainDashboard.startsWith('http')
                ? res.client.customDomainDashboard
                : `https://${res.client.customDomainDashboard}`)
            : undefined,
          customApp: res.client.customDomainApp
            ? (res.client.customDomainApp.startsWith('http')
                ? res.client.customDomainApp
                : `https://${res.client.customDomainApp}`)
            : undefined,
        };
        setBusinessName(res.client.name);
        setBusinessSlug(cleanSlug);
        setPredictedUrls(urls);
        setIsCompleted(true);
      } else {
        setBusinessName(res.client.name);
        setBusinessSlug(formatSlug(res.client.name));
      }

      // Update browser URL query without reload
      const url = new URL(window.location.href);
      if (url.pathname.startsWith('/salesAdmin')) {
        url.pathname = '/';
      }
      url.searchParams.set('onboarding', 'true');
      url.searchParams.set('token', res.client.token);
      window.history.replaceState({ view: 'onboarding', token: res.client.token }, '', url.toString());
      toast.success(`Token sah! Selamat datang, ${res.client.name}.`);
    } else {
      toast.error(res.message);
    }
  };

  // Auto-generate slug from business name
  const handleNameChange = (val: string) => {
    setBusinessName(val);
    setBusinessSlug(formatSlug(val));
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
      const cleanSlug = businessSlug || formatSlug(businessName || verification.client.name) || 'usaha-anda';
      const dashUrl = `https://dash-${cleanSlug}.pages.dev`;
      const appUrl = `https://app-${cleanSlug}.pages.dev`;
      const apiUrl = `https://ngabsen-api-${cleanSlug}.workers.dev`;

      const urls = {
        dashboard: dashUrl,
        app: appUrl,
        api: apiUrl,
        customDashboard: useCustomDomain && customDomainDashboard ? `https://${customDomainDashboard}` : undefined,
        customApp: useCustomDomain && customDomainApp ? `https://${customDomainApp}` : undefined,
      };

      setPredictedUrls(urls);
      setDispatched(true);
      setIsCompleted(false);

      if (isRedeployMode) {
        toast.success('Redeploy berhasil dipicu! Pipeline GitHub Actions sedang berjalan.');
      }
      setIsRedeployMode(false);

      // Simpan state lengkap agar refresh/revisit tetap di halaman ini & data tidak hilang
      const stateToSave: SavedDeployState = {
        dispatched: true,
        businessName: businessName || verification.client.name,
        businessSlug: cleanSlug,
        predictedUrls: urls,
        deployMode,
        customDomainDashboard: useCustomDomain ? customDomainDashboard : undefined,
        customDomainApp: useCustomDomain ? customDomainApp : undefined,
        useCustomDomain,
        isCompleted: false,
        deployedAt: new Date().toISOString(),
      };
      saveDeployState(verification.client.token, stateToSave);

      // Update client status using licenseService
      markClientDeployed(verification.client.token, {
        deployedUrl: dashUrl,
        customDomainDashboard: useCustomDomain && customDomainDashboard ? customDomainDashboard : undefined,
        customDomainApp: useCustomDomain && customDomainApp ? customDomainApp : undefined,
        isCompleted: false,
      });

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else {
      setDispatchError(dispatchRes.message);
    }
  };

  const handleConfirmStatus = (completed: boolean) => {
    setIsCompleted(completed);
    const token = verification.valid ? verification.client.token : tokenInput;
    if (token) {
      const existing = getSavedDeployState(token) || {
        dispatched: true,
        businessName: businessName || (verification.valid ? verification.client.name : ''),
        businessSlug: businessSlug,
        predictedUrls: predictedUrls!,
        deployMode,
        customDomainDashboard: useCustomDomain ? customDomainDashboard : undefined,
        customDomainApp: useCustomDomain ? customDomainApp : undefined,
        useCustomDomain,
      };
      saveDeployState(token, {
        ...existing,
        isCompleted: completed,
      });

      if (predictedUrls) {
        markClientDeployed(token, {
          deployedUrl: predictedUrls.dashboard,
          customDomainDashboard: useCustomDomain ? customDomainDashboard : undefined,
          customDomainApp: useCustomDomain ? customDomainApp : undefined,
          isCompleted: completed,
        });
      }
    }

    if (completed) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Status dikonfirmasi: Deployment Sudah Selesai! 🎉 Sistem siap digunakan.');
    } else {
      toast.info('Status dikonfirmasi: Belum Selesai. Silakan tunggu proses selesai atau hubungi kami via WhatsApp jika ada kendala.');
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

  const getWaConsultationLink = () => {
    const token = verification.valid ? verification.client.token : tokenInput;
    const clientName = businessName || (verification.valid ? verification.client.name : 'Klien');
    const statusText = isCompleted ? 'sudah selesai dicek' : 'belum selesai / butuh panduan teknis';
    const text = `Halo Tim ${sellerConfig.brandName}, saya sedang melakukan proses deployment sistem untuk *${clientName}* (Token: *${token || 'Belum Ada Token'}*).\nStatus saat ini: ${statusText}.\nSaya ingin berkonsultasi / ada kendala terkait proses deployment ini. Mohon panduannya.`;
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
              {dispatched ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="size-3.5 text-emerald-600" /> Deployment Aktif
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Lisensi Resmi Terverifikasi
                </div>
              )}
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#fbf2f0] border border-[#f0dbd8] text-[#8f3b3f] text-xs font-mono font-semibold">
                <Key className="size-3 text-[#a9484c]" /> {client.token}
              </div>
              {isAdmin && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold uppercase tracking-wider">
                  <Lock className="size-3 text-purple-600" /> Mode Admin Aktif
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {dispatched
                ? 'Status & Akses Portal Sistem'
                : isRedeployMode
                ? 'Redeploy Sistem Cloudflare (Mode Admin)'
                : 'Aktivasi & 1-Click Deploy ke Cloudflare Anda'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {dispatched
                ? `Deployment sistem untuk ${businessName || client.name} telah dipicu ke Cloudflare. Data URL dan konfigurasi portal Anda tersimpan di halaman ini.`
                : isRedeployMode
                ? `Perbarui konfigurasi dan picu ulang deployment sistem untuk ${businessName || client.name}. Data lisensi & slug tetap terjaga.`
                : `Selamat datang, ${client.name}! Sistem absensi & payroll akan dibangun dan di-deploy 100% mandiri ke akun Cloudflare milik Anda tanpa biaya server bulanan selamanya.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminPinModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Masuk sebagai Admin untuk mengaktifkan fitur Redeploy"
              >
                <Lock className="size-3.5 text-purple-600" /> Akses Admin
              </button>
            )}
            <button
              onClick={onBackToLanding}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#f0dbd8] hover:bg-[#fbf2f0] rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" /> Kembali ke Depan
            </button>
          </div>
        </div>

        {/* Informative banner if already deployed (only before dispatch) */}
        {!dispatched && verification.isAlreadyDeployed && (
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
              {isRedeployMode && (
                <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <RefreshCw className="size-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-purple-900">Mode Admin: Deploy Ulang (Redeploy)</p>
                      <p className="text-purple-700 text-[11px] mt-0.5 leading-relaxed">
                        Anda sedang meninjau konfigurasi untuk deploy ulang. Periksa token Cloudflare lalu klik tombol deploy di bawah.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRedeployMode(false);
                      setDispatched(true);
                    }}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 font-semibold text-xs transition cursor-pointer shadow-xs shrink-0"
                  >
                    ← Batal & Kembali ke Status
                  </button>
                </div>
              )}

              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-3 border-b border-[#f0dbd8]">
                <Rocket className="size-5 text-[#a9484c]" />
                {isRedeployMode ? 'Form Konfigurasi Deploy Ulang' : 'Form Konfigurasi Sistem'}
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
                    ) : isRedeployMode ? (
                      <>
                        <RefreshCw className="size-4" /> Jalankan Deploy Ulang (Redeploy) Sekarang 🚀
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
          <div className="bg-white border border-emerald-300 rounded-3xl p-6 sm:p-10 text-center shadow-lg relative overflow-hidden">
            <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pipeline Deploy Berhasil Dipicu! 🚀
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto mt-2 text-xs sm:text-sm leading-relaxed">
              Sistem otomatis sedang membangun dan men-deploy portal untuk{' '}
              <strong className="text-slate-900">{businessName}</strong> ke akun Cloudflare Anda.
            </p>

            {/* Status Box */}
            {isCompleted ? (
              <div className="mt-6 max-w-xl mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-left">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-950">Status: Deployment Sudah Selesai! 🎉</p>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Sistem absensi & payroll Anda telah aktif dan siap digunakan. Anda dapat langsung membuka Dashboard Owner atau membagikan link PWA ke karyawan di bawah.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left">
                <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Estimasi proses: 5–10 menit</p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Cloudflare sedang memproses deployment serverless Anda. URL portal di bawah akan aktif secara otomatis setelah pipeline selesai sepenuhnya.
                  </p>
                </div>
              </div>
            )}

            {/* Konfirmasi Status Deployment (Sudah / Belum Selesai) */}
            <div className="mt-6 max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8] text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#a9484c]" />
                    Konfirmasi Status Deployment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Silakan uji URL sistem di bawah dan konfirmasi status deployment Anda:
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 text-[11px] font-semibold self-start sm:self-auto'
                      : 'bg-amber-50 text-amber-700 border-amber-300 text-[11px] font-semibold self-start sm:self-auto'
                  }
                >
                  {isCompleted ? '✅ Sudah Selesai' : '⏳ Belum Selesai'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleConfirmStatus(true)}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-[#f0dbd8]'
                  }`}
                >
                  <CheckCircle2 className="size-4 shrink-0" />
                  Sudah Selesai
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmStatus(false)}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs ${
                    !isCompleted
                      ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-400/20'
                      : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-[#f0dbd8]'
                  }`}
                >
                  <Clock className="size-4 shrink-0" />
                  Belum Selesai
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-3 text-center sm:text-left">
                {isCompleted
                  ? '💡 Status tersimpan: Selesai. Selamat menggunakan sistem absensi & payroll akugawe!'
                  : '💡 Status tersimpan: Belum Selesai. Mohon tunggu proses build atau hubungi kami lewat WhatsApp jika ada kendala.'}
              </p>
            </div>

            {/* Tombol Konsultasi WhatsApp jika ada kendala */}
            <div className="mt-5 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Ada Kendala atau Butuh Bantuan?
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Tim teknis kami siap mendampingi proses deployment & setup custom domain via WhatsApp.
                  </p>
                </div>
              </div>
              <a
                href={getWaConsultationLink()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
              >
                <MessageCircle className="size-3.5" />
                Konsultasi WhatsApp
              </a>
            </div>

            {/* KONTROL ADMIN: TOMBOL REDEPLOY SISTEM */}
            {isAdmin && (
              <div className="mt-5 max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-[#faf5ff] to-purple-50 border-2 border-dashed border-purple-300 text-left shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-700 text-white hover:bg-purple-800 text-[10px] font-bold px-2 py-0.5">
                        KONTROL ADMIN
                      </Badge>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <RefreshCw className="size-4 text-purple-700" /> Butuh Deploy Ulang (Redeploy)?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                      Sebagai administrator, Anda dapat memicu ulang pipeline deployment ke Cloudflare dengan konfigurasi baru atau token baru.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleStartRedeploy}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-purple-700/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 self-stretch sm:self-center"
                  >
                    <RefreshCw className="size-4" />
                    Redeploy Sistem Sekarang 🚀
                  </Button>
                </div>
              </div>
            )}

            {/* Predicted URL Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-6 text-left">
              <div className="p-5 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8]">
                <div className="text-xs font-semibold text-[#a9484c] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>👑 Dashboard Owner & HR</span>
                  {isCompleted && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs sm:text-sm text-slate-900 font-bold truncate mb-1">
                  {predictedUrls?.customDashboard || predictedUrls?.dashboard}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isCompleted ? 'Sistem siap digunakan' : 'Tersedia setelah pipeline selesai'}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(predictedUrls?.customDashboard || predictedUrls?.dashboard || '')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#f0dbd8] text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f] transition text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Salin URL"
                  >
                    <Copy className="size-3" /> Salin URL
                  </button>
                  <a
                    href={predictedUrls?.customDashboard || predictedUrls?.dashboard}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#a9484c] hover:bg-[#8f3b3f] text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    Buka Dashboard <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8]">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>📱 Mobile PWA Karyawan</span>
                  {isCompleted && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs sm:text-sm text-slate-900 font-bold truncate mb-1">
                  {predictedUrls?.customApp || predictedUrls?.app}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isCompleted ? 'Sistem siap digunakan' : 'Tersedia setelah pipeline selesai'}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(predictedUrls?.customApp || predictedUrls?.app || '')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#f0dbd8] text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f] transition text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Salin URL"
                  >
                    <Copy className="size-3" /> Salin URL
                  </button>
                  <a
                    href={predictedUrls?.customApp || predictedUrls?.app}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    Buka PWA App <ExternalLink className="size-3" />
                  </a>
                </div>
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
                  <span>Email: admin@akugawe.com</span>
                  <span>Password: password123</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  💡 Tips: Di dashboard & PWA karyawan juga tersedia tombol <em>1-Click Demo Login</em> tanpa perlu mengetik email/password.
                </p>
              </div>
            )}

            {!isAdmin && (
              <div className="mt-8 pt-4 border-t border-[#f0dbd8] text-center">
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(true)}
                  className="text-[11px] text-slate-400 hover:text-purple-700 font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Lock className="size-3" /> Akses Admin Portal (Login untuk Buka Fitur Redeploy)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL VERIFIKASI MASTER PIN ADMIN */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-purple-200 shadow-2xl rounded-3xl max-w-md w-full p-6 text-left space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner">
                  <Lock className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Verifikasi Master PIN Admin</h3>
                  <p className="text-[11px] text-slate-500">Otorisasi akses kontrol admin & redeploy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminPinModal(false);
                  setAdminPinInput('');
                }}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Masukkan Master PIN Admin
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    autoFocus
                    placeholder="Masukkan PIN (Default: 2468)"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="font-mono text-center tracking-widest text-lg h-12 bg-white border-purple-200 focus-visible:ring-purple-600 text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Setelah diverifikasi, Anda akan mendapatkan akses ke tombol Redeploy untuk token lisensi ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-purple-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdminPinModal(false);
                    setAdminPinInput('');
                  }}
                  className="text-xs h-10 px-4 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifyingAdminPin || !adminPinInput.trim()}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs h-10 px-5 cursor-pointer flex items-center gap-2"
                >
                  {isVerifyingAdminPin ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" />
                      Buka Akses Admin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
