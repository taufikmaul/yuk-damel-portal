import { useState, useEffect } from 'react';
import {
  Users,
  Key,
  Plus,
  ExternalLink,
  Copy,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  Clock,
  TrendingUp,
  Search,
  MoreHorizontal,
  Trash2,
  Globe,
  LogOut,
  Bot,
  Database,
  Cloud,
  Building,
  CheckCircle,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Download,
  Upload,
} from 'lucide-react';
import {
  generateOtp,
  sendTelegramOtp,
  BOT_USERNAME,
} from '../services/telegram';
import {
  sha256,
  createSignedSession,
  verifySignedSession,
  recordFailedAttempt,
  recordFailedPinAttempt,
  resetFailedAttempts,
  recordOtpRequest,
  getResendCooldownRemaining,
  getLockoutRemaining,
  verifyMasterPin,
  encryptData,
  decryptData,
} from '../services/security';
import { loadSellerConfig } from '../services/config';
import { generateLicenseToken } from '../services/licenseService';
import { SellerConfigPage } from './SellerConfigPage';
import { Logo } from '../assets/logo';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface AdminPortalProps {
  onBackToLanding: () => void;
  onOpenOnboardingWithToken: (token: string) => void;
}

export interface ClientRecord {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  status: 'active' | 'pending';
  customDomainDashboard?: string;
  customDomainApp?: string;
  deployedUrl?: string;
  isSample?: boolean;
}

const SESSION_KEY = 'ngabsen_admin_session_auth';
const CLIENTS_STORAGE_KEY = 'ngabsen_seller_clients';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Jam

interface AdminSidebarProps {
  activeTab: 'overview' | 'settings' | 'infrastructure';
  setActiveTab: (tab: 'overview' | 'settings' | 'infrastructure') => void;
  onBackToLanding: () => void;
  handleLogout: () => void;
}

function AdminSidebar({
  activeTab,
  setActiveTab,
  onBackToLanding,
  handleLogout,
}: AdminSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-[#f0dbd8] bg-white">
      {/* Header Brand */}
      <SidebarHeader className="border-b border-[#f0dbd8] p-3 flex flex-row items-center justify-between min-h-[57px]">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#a9484c] text-white p-1.5 shadow-xs cursor-pointer hover:bg-[#8f3b3f] transition-all"
                  title="akugawe Sales Admin"
                >
                  <Logo className="size-full" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs">
                akugawe Sales Admin
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-1 py-0.5 w-full">
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#a9484c] text-white p-1.5 shadow-xs shrink-0">
              <Logo className="size-full" />
            </div>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-bold text-slate-900 text-sm">akugawe</span>
              <span className="truncate text-[10px] text-[#7d6568] font-medium">
                Sales & License Admin
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="px-2.5 py-3 space-y-4">
        {/* Section: Operasional */}
        <div className="space-y-1">
          {isCollapsed ? (
            <div className="my-1 border-t border-[#f0dbd8]/60 mx-1" />
          ) : (
            <div className="px-2 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
              Operasional
            </div>
          )}

          <div className="space-y-1">
            {/* Dashboard & Lisensi */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center justify-center size-10 mx-auto rounded-xl transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <LayoutDashboard className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Dashboard & Lisensi
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <LayoutDashboard className="size-4 shrink-0" />
                <span className="truncate">Dashboard & Lisensi</span>
              </button>
            )}

            {/* Konfigurasi Seller */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center justify-center size-10 mx-auto rounded-xl transition-all cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <Settings className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Konfigurasi Seller
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <Settings className="size-4 shrink-0" />
                <span className="truncate">Konfigurasi Seller</span>
              </button>
            )}

            {/* Infrastruktur Cloud */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('infrastructure')}
                    className={`flex items-center justify-center size-10 mx-auto rounded-xl transition-all cursor-pointer ${
                      activeTab === 'infrastructure'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <Cloud className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Infrastruktur Cloud
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('infrastructure')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'infrastructure'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <Cloud className="size-4 shrink-0" />
                <span className="truncate">Infrastruktur Cloud</span>
              </button>
            )}
          </div>
        </div>

        {/* Section: Navigasi Cepat */}
        <div className="space-y-1">
          {isCollapsed ? (
            <div className="my-1 border-t border-[#f0dbd8]/60 mx-1" />
          ) : (
            <div className="px-2 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
              Navigasi Cepat
            </div>
          )}

          <div className="space-y-1">
            {/* Landing Page Publik */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    className="flex items-center justify-center size-10 mx-auto rounded-xl transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60"
                  >
                    <Globe className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Landing Page Publik
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={onBackToLanding}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60 transition-all cursor-pointer"
              >
                <Globe className="size-4 shrink-0" />
                <span className="truncate">Landing Page Publik</span>
              </button>
            )}

            {/* Live Demo App */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://dash-ngabsen.historycake.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center size-10 mx-auto rounded-xl transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60"
                  >
                    <ExternalLink className="size-4 shrink-0" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Live Demo App (Eksternal)
                </TooltipContent>
              </Tooltip>
            ) : (
              <a
                href="https://dash-ngabsen.historycake.com"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60 transition-all cursor-pointer"
              >
                <ExternalLink className="size-4 shrink-0" />
                <span className="truncate">Live Demo App</span>
              </a>
            )}
          </div>
        </div>
      </SidebarContent>

      {/* Footer User Profile */}
      <SidebarFooter className="border-t border-[#f0dbd8] p-2.5">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-9 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-xs font-bold shadow-xs cursor-default">
                  ID
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="text-xs">
                <div className="font-bold">Owner Authorized</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: 115334079</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="size-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer rounded-lg"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="text-xs">
                Keluar / Logout
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8]">
            <div className="flex items-center gap-2 truncate">
              <div className="size-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                ID
              </div>
              <div className="truncate">
                <div className="text-xs font-bold leading-none text-slate-900 truncate">
                  Owner Authorized
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ID: 115334079
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="size-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminPortalPage({
  onBackToLanding,
  onOpenOnboardingWithToken,
}: AdminPortalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Validate session cryptographically on mount (Anti-Tamper localStorage verification)
  useEffect(() => {
    let isMounted = true;
    async function validateSession() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const valid = await verifySignedSession(parsed);
          if (valid) {
            if (isMounted) setIsAuthenticated(true);
            return;
          } else {
            // Tampered or expired session detected
            localStorage.removeItem(SESSION_KEY);
            if (isMounted) setIsAuthenticated(false);
          }
        }
      } catch (_) {
        localStorage.removeItem(SESSION_KEY);
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }
    validateSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'infrastructure'>('overview');

  // Multi-Step Authentication: Stage 1 = Master PIN, Stage 2 = Telegram OTP
  const [authStage, setAuthStage] = useState<'pin' | 'otp'>('pin');
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null);
  const [pinAttemptsLeft, setPinAttemptsLeft] = useState<number>(5);

  // Inactivity Guard (Auto-Lock on Idle)
  const [isIdleLocked, setIsIdleLocked] = useState<boolean>(false);
  const [idleUnlockPin, setIdleUnlockPin] = useState('');
  const [showIdlePin, setShowIdlePin] = useState(false);
  const [idleError, setIdleError] = useState<string | null>(null);

  // OTP State for 2FA Gate (Stores SHA-256 Hash of OTP + Salt, NEVER plaintext)
  const [activeOtpHashed, setActiveOtpHashed] = useState<string | null>(null);
  const [otpSalt, setOtpSalt] = useState<string>('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [inputOtp, setInputOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rate Limiting & Lockout
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() => getLockoutRemaining());
  const [resendCooldown, setResendCooldown] = useState<number>(() => getResendCooldownRemaining());
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);

  // Countdown timer for lockout and resend cooldown
  useEffect(() => {
    if (lockoutSeconds <= 0 && resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(getLockoutRemaining());
      setResendCooldown(getResendCooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds, resendCooldown]);

  // Inactivity Auto-Lock Timer (monitors user interaction)
  useEffect(() => {
    if (!isAuthenticated || isIdleLocked) return;
    const config = loadSellerConfig();
    const timeoutMinutes = config.autoLockMinutes ?? 15;
    if (timeoutMinutes <= 0) return; // 0 = disabled
    const timeoutMs = timeoutMinutes * 60 * 1000;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsIdleLocked(true);
        setIdleUnlockPin('');
        setIdleError(null);
      }, timeoutMs);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, isIdleLocked]);

  // Clients State with AES-GCM 256-bit Encryption at Rest
  const [isClientsLoaded, setIsClientsLoaded] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);

  // Load and decrypt clients from localStorage
  useEffect(() => {
    let isMounted = true;
    async function loadEncryptedClients() {
      try {
        // 1. Coba ambil pesanan terbaru dari Cloudflare D1 (/api/orders)
        try {
          const res = await fetch('/api/orders');
          if (res.ok) {
            const data = await res.json();
            if (data.ok && Array.isArray(data.orders) && data.orders.length > 0 && isMounted) {
              setClients(data.orders);
              setIsClientsLoaded(true);
              return;
            }
          }
        } catch (_) {}

        // 2. Fallback ke penyimpanan lokal jika server D1 belum di-setup
        const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (raw) {
          let jsonStr = raw;
          if (raw.startsWith('ENC:')) {
            jsonStr = await decryptData(raw.slice(4));
          }
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && isMounted) {
            setClients(
              parsed.filter(
                (c: ClientRecord) => !c.isSample && c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3'
              )
            );
          }
        }
      } catch (err) {
        console.error('Failed to load encrypted clients:', err);
      } finally {
        if (isMounted) setIsClientsLoaded(true);
      }
    }
    loadEncryptedClients();
    return () => {
      isMounted = false;
    };
  }, []);

  // Encrypt and persist clients to localStorage on state change
  useEffect(() => {
    if (!isClientsLoaded) return;
    let isMounted = true;
    async function saveEncryptedClients() {
      try {
        const json = JSON.stringify(clients);
        const encrypted = await encryptData(json);
        if (isMounted) {
          localStorage.setItem(CLIENTS_STORAGE_KEY, `ENC:${encrypted}`);
        }
      } catch (_) {
        if (isMounted) {
          localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
        }
      }
    }
    saveEncryptedClients();
    return () => {
      isMounted = false;
    };
  }, [clients, isClientsLoaded]);

  // Client generation form state
  const [newClientName, setNewClientName] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');
  const [lastGeneratedClient, setLastGeneratedClient] = useState<ClientRecord | null>(null);

  // Step 1: Master PIN Verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPin.trim()) return;

    const lockRem = getLockoutRemaining();
    if (lockRem > 0) {
      setPinErrorMessage(`Sistem sementara terkunci demi keamanan. Coba lagi dalam ${lockRem} detik.`);
      toast.error('Akses sistem sedang terkunci.');
      return;
    }

    const currentConfig = loadSellerConfig();
    const isValid = await verifyMasterPin(inputPin.trim(), currentConfig.adminPinHash);

    if (isValid) {
      setPinErrorMessage(null);
      setInputPin('');
      setAuthStage('otp');
      toast.success('Master PIN valid! Mengirimkan 6-digit OTP Telegram...');
      // Automatically send OTP code
      handleSendOtp();
    } else {
      const res = recordFailedPinAttempt();
      if (res.isLocked) {
        setLockoutSeconds(res.lockTimeSeconds);
        setPinErrorMessage(`Terlalu banyak kesalahan PIN (5/5). Akses terkunci selama ${res.lockTimeSeconds} detik.`);
        toast.error('Batas percobaan PIN terlampaui. Akun terkunci.');
      } else {
        setPinAttemptsLeft(res.remainingAttempts);
        setPinErrorMessage(`Master PIN tidak valid. Sisa kesempatan: ${res.remainingAttempts}x.`);
        toast.error(`PIN salah (${res.remainingAttempts}x kesempatan tersisa)`);
      }
    }
  };

  // Step 2: 2FA Telegram OTP Actions
  const handleSendOtp = async () => {
    const lockRem = getLockoutRemaining();
    if (lockRem > 0) {
      setErrorMessage(`Akun sementara terkunci demi keamanan. Coba lagi dalam ${lockRem} detik.`);
      return;
    }

    const cdRem = getResendCooldownRemaining();
    if (cdRem > 0) {
      setErrorMessage(`Mohon tunggu ${cdRem} detik sebelum meminta kode baru.`);
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage(null);

    const otp = generateOtp(); // 6-digit CSPRNG
    const salt = `${Date.now()}_${Math.random()}`;
    const hashed = await sha256(otp + salt);

    const expires = Date.now() + 5 * 60 * 1000; // 5 menit
    setActiveOtpHashed(hashed);
    setOtpSalt(salt);
    setOtpExpiresAt(expires);
    recordOtpRequest();
    setResendCooldown(60);

    const ok = await sendTelegramOtp(otp);
    setIsSendingOtp(false);

    if (ok) {
      setOtpSentSuccess(true);
      toast.success('Kode OTP 6-digit berhasil dikirimkan ke Telegram Anda!');
    } else {
      setErrorMessage('Gagal mengirim pesan ke Telegram. Pastikan bot @AkugawePortalBot aktif.');
      toast.error('Gagal mengirim OTP ke Telegram.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOtp.trim()) return;

    const lockRem = getLockoutRemaining();
    if (lockRem > 0) {
      setErrorMessage(`Akun terkunci karena percobaan berulang. Tunggu ${lockRem} detik.`);
      toast.error('Akun sedang terkunci.');
      return;
    }

    if (!activeOtpHashed || Date.now() > otpExpiresAt) {
      setErrorMessage('Kode OTP telah kedaluwarsa atau belum diminta. Silakan minta kode baru.');
      toast.error('Kode OTP sudah kedaluwarsa.');
      return;
    }

    // Verify via cryptographic hash comparison
    const inputHash = await sha256(inputOtp.trim() + otpSalt);

    if (inputHash === activeOtpHashed) {
      resetFailedAttempts();
      setErrorMessage(null);

      // Create cryptographically signed session
      try {
        const signedSession = await createSignedSession(SESSION_TTL_MS);
        localStorage.setItem(SESSION_KEY, JSON.stringify(signedSession));
      } catch (_) {}

      setIsAuthenticated(true);
      toast.success('Verifikasi Berlapis Berhasil! Selamat datang di Sales Admin.');
    } else {
      // Record failed attempt for brute-force mitigation
      const result = recordFailedAttempt();
      if (result.isLocked) {
        setLockoutSeconds(result.lockTimeSeconds);
        setActiveOtpHashed(null); // Invalidate OTP immediately upon lockout
        setErrorMessage(`Terlalu banyak percobaan salah (5/5). Akun terkunci selama ${result.lockTimeSeconds} detik demi keamanan.`);
        toast.error('Batas percobaan terlampaui. Akun terkunci.');
      } else {
        setRemainingAttempts(result.remainingAttempts);
        setErrorMessage(`Kode OTP salah. Sisa kesempatan: ${result.remainingAttempts}x sebelum akun terkunci.`);
        toast.error(`Kode OTP tidak sesuai (${result.remainingAttempts}x kesempatan tersisa).`);
      }
    }
  };

  // Inactivity Idle Unlock
  const handleUnlockIdle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idleUnlockPin.trim()) return;

    const lockRem = getLockoutRemaining();
    if (lockRem > 0) {
      setIdleError(`Sistem terkunci sementara (${lockRem}s).`);
      return;
    }

    const currentConfig = loadSellerConfig();
    const isValid = await verifyMasterPin(idleUnlockPin.trim(), currentConfig.adminPinHash);

    if (isValid) {
      setIsIdleLocked(false);
      setIdleUnlockPin('');
      setIdleError(null);
      toast.success('Sesi berhasil dibuka kembali!');
    } else {
      const res = recordFailedPinAttempt();
      if (res.isLocked) {
        setLockoutSeconds(res.lockTimeSeconds);
        setIdleError(`Terlalu banyak kesalahan. Terkunci ${res.lockTimeSeconds}s.`);
      } else {
        setIdleError(`PIN salah! (${res.remainingAttempts}x kesempatan tersisa).`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setAuthStage('pin');
    setIsIdleLocked(false);
    setActiveOtpHashed(null);
    setOtpSalt('');
    setInputOtp('');
    setInputPin('');
    toast.info('Sesi login telah berakhir.');
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newToken = generateLicenseToken(newClientName);

    const newRecord: ClientRecord = {
      id: `c_${Date.now()}`,
      name: newClientName,
      token: newToken,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      isSample: false,
    };

    // 1. Simpan ke database Cloudflare D1 (/api/orders)
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newRecord.id,
          clientName: newRecord.name,
          licenseToken: newRecord.token,
          packageTierId: 'business',
          amountPaidRp: 2999000,
        }),
      });
    } catch (_) {}

    // 2. Simpan lokal & update state
    const updated = [newRecord, ...clients];
    setClients(updated);
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    setLastGeneratedClient(newRecord);
    setNewClientName('');
    setFilterStatus('all');
    setFilterSearch('');
    toast.success(`Token berhasil dibuat & disimpan ke Database: ${newToken}`);
  };

  const copyLink = (token: string, clientName?: string) => {
    const link = `${window.location.origin}/?onboarding=true&token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success(
      clientName
        ? `Link onboarding untuk "${clientName}" tersalin ke clipboard!`
        : 'Link onboarding tersalin!'
    );
  };

  const copyWhatsAppFormat = (client: ClientRecord) => {
    const link = `${window.location.origin}/?onboarding=true&token=${client.token}`;
    const text = `Halo Kak dari *${client.name}*! Terima kasih atas pembelian Lisensi Aplikasi Absensi & Payroll akugawe (Beli Putus).

Berikut tautan aktivasi 1-Click Deploy ke Cloudflare milik Anda:
👉 ${link}

*Token Lisensi Anda:* \`${client.token}\`

Silakan buka tautan di atas untuk mengatur nama toko & mengaktifkan sistem secara mandiri.`;
    navigator.clipboard.writeText(text);
    toast.success('Format pesan WhatsApp tersalin ke clipboard!');
  };

  const toggleClientStatus = (clientId: string) => {
    setClients(
      clients.map((c) =>
        c.id === clientId
          ? { ...c, status: c.status === 'active' ? 'pending' : 'active' }
          : c
      )
    );
    toast.info('Status pembeli diperbarui');
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Hapus data lisensi klien ini dari daftar?')) {
      setClients(clients.filter((c) => c.id !== clientId));
      toast.info('Data lisensi dihapus');
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        clients: clients,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `akugawe-licenses-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup data lisensi berhasil diunduh!');
    } catch (err: any) {
      toast.error('Gagal mengekspor data lisensi: ' + err?.message);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const importedClients = Array.isArray(parsed) ? parsed : parsed.clients;
        if (Array.isArray(importedClients)) {
          // Merge clients without duplicates
          const existingIds = new Set(clients.map((c) => c.id));
          const newEntries = importedClients.filter((c: any) => c.id && c.token && !existingIds.has(c.id));
          const merged = [...clients, ...newEntries];
          setClients(merged);
          toast.success(`Berhasil memulihkan ${newEntries.length} data lisensi baru!`);
        } else {
          toast.error('Format berkas backup tidak valid.');
        }
      } catch (err: any) {
        toast.error('Gagal membaca berkas JSON backup: ' + err?.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      c.token.toLowerCase().includes(filterSearch.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const pendingClients = clients.filter((c) => c.status === 'pending').length;
  const estimatedRevenue = activeClients * 2999000;

  // ─── SESSION CHECKING LOADER ────────────────────────────────────────────────
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#faf6f5] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 text-[#a9484c] animate-spin" />
          <p className="text-xs text-slate-600 font-medium">Memverifikasi integritas keamanan sesi...</p>
        </div>
      </div>
    );
  }

  // ─── MULTI-LAYERED LOGIN SCREEN (PIN -> OTP) ────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf6f5] flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <Card className="max-w-md w-full border-[#f0dbd8] bg-white shadow-xl shadow-rose-950/5 rounded-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="text-center pb-2 pt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  authStage === 'pin'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {authStage === 'pin' ? 'Langkah 1 dari 2: Master PIN' : 'Langkah 2 dari 2: Dynamic Telegram OTP'}
              </Badge>
            </div>

            <div className="size-14 rounded-2xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center mx-auto mb-3 shadow-inner">
              {authStage === 'pin' ? (
                <Lock className="size-7 text-[#a9484c]" />
              ) : (
                <ShieldCheck className="size-7 text-[#a9484c]" />
              )}
            </div>

            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
              {authStage === 'pin' ? 'Portal Keamanan Penjual' : 'Verifikasi 2FA Telegram'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {authStage === 'pin' ? (
                'Lapisan 1 (Knowledge Factor): Masukkan Master PIN Anda untuk mengotorisasi akses sales admin.'
              ) : (
                <>
                  Lapisan 2 (Possession Factor): Masukkan kode dinamis yang dikirim ke bot{' '}
                  <a
                    href={`https://t.me/${BOT_USERNAME}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#a9484c] font-semibold underline inline-flex items-center gap-0.5 hover:text-[#8f3b3f]"
                  >
                    @{BOT_USERNAME} <ExternalLink className="size-2.5" />
                  </a>
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Lockout Notice */}
            {lockoutSeconds > 0 && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <div className="font-bold text-rose-900">Akses Terkunci Sementara</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Terlalu banyak percobaan salah. Sistem dikunci selama <strong>{lockoutSeconds} detik</strong> demi mencegah brute-force.
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 1: MASTER PIN */}
            {authStage === 'pin' && (
              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block text-center">
                    Masukkan Master Admin PIN
                  </label>
                  <div className="relative">
                    <Input
                      type={showPin ? 'text' : 'password'}
                      maxLength={8}
                      required
                      autoFocus
                      disabled={lockoutSeconds > 0}
                      placeholder="••••"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-2xl font-bold h-13 bg-white font-mono border-[#f0dbd8] focus-visible:ring-[#a9484c] text-slate-900 disabled:opacity-50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="text-slate-500">Default PIN Master:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    2468
                  </span>
                </div>

                {pinAttemptsLeft < 5 && pinAttemptsLeft > 0 && lockoutSeconds === 0 && (
                  <p className="text-[11px] text-amber-600 text-center font-medium">
                    ⚠️ Sisa kesempatan PIN: {pinAttemptsLeft}x sebelum terkunci 60 detik.
                  </p>
                )}

                {pinErrorMessage && (
                  <p className="text-xs text-rose-600 text-center font-medium">{pinErrorMessage}</p>
                )}

                <Button
                  type="submit"
                  disabled={lockoutSeconds > 0 || inputPin.length < 4}
                  className="w-full bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-bold h-11 shadow-sm cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  Lanjut ke OTP Telegram →
                </Button>
              </form>
            )}

            {/* STAGE 2: TELEGRAM OTP */}
            {authStage === 'otp' && (
              <div>
                {!otpSentSuccess ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] text-center">
                      <div className="text-xs font-medium text-slate-500">
                        Akun Telegram Penjual Terdaftar:
                      </div>
                      <div className="font-mono text-sm text-slate-900 font-bold mt-0.5">
                        Owner ID: 115334079
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Kode 6-digit CSPRNG terenkripsi SHA-256 siap dikirimkan ke obrolan bot Telegram Anda.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <Button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || lockoutSeconds > 0 || resendCooldown > 0}
                      className="w-full bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold h-11 shadow-sm cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="size-4 mr-2 animate-spin" /> Mengirim ke Telegram...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <Clock className="size-4 mr-2" /> Tunggu {resendCooldown}s untuk kirim ulang
                        </>
                      ) : (
                        <>
                          <Send className="size-4 mr-2" /> Kirim Kode OTP ke Telegram 📲
                        </>
                      )}
                    </Button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStage('pin');
                          setInputPin('');
                          setPinErrorMessage(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 transition font-medium cursor-pointer"
                      >
                        ← Kembali ke Validasi PIN
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                      <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                      <span>
                        Kode OTP terkirim! Silakan cek pesan dari <strong>@{BOT_USERNAME}</strong>.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block text-center">
                        Masukkan 6 Digit Kode OTP
                      </label>
                      <Input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        disabled={lockoutSeconds > 0}
                        placeholder="000000"
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.4em] text-2xl font-extrabold h-14 bg-white font-mono border-[#f0dbd8] focus-visible:ring-[#a9484c] text-slate-900 disabled:opacity-50"
                      />
                    </div>

                    {remainingAttempts < 5 && remainingAttempts > 0 && lockoutSeconds === 0 && (
                      <p className="text-[11px] text-amber-600 text-center font-medium">
                        ⚠️ Sisa kesempatan: {remainingAttempts}x sebelum terkunci 60 detik.
                      </p>
                    )}

                    {errorMessage && (
                      <p className="text-xs text-rose-600 text-center font-medium">{errorMessage}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={lockoutSeconds > 0 || inputOtp.length !== 6}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-sm cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      Verifikasi & Masuk Dashboard 🚀
                    </Button>

                    <div className="flex justify-between items-center text-xs pt-2">
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || lockoutSeconds > 0}
                        onClick={() => {
                          if (resendCooldown <= 0 && lockoutSeconds <= 0) {
                            setOtpSentSuccess(false);
                            setInputOtp('');
                          }
                        }}
                        className={`text-xs transition ${
                          resendCooldown > 0 || lockoutSeconds > 0
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-500 hover:text-slate-900 underline cursor-pointer'
                        }`}
                      >
                        {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Kode'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStage('pin');
                          setInputPin('');
                          setInputOtp('');
                          setOtpSentSuccess(false);
                        }}
                        className="text-slate-500 hover:text-slate-900 underline cursor-pointer"
                      >
                        Ubah PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-5 border-t border-[#f0dbd8] justify-center bg-slate-50/50">
            <button
              onClick={onBackToLanding}
              className="text-xs text-slate-500 hover:text-slate-900 transition font-medium cursor-pointer"
            >
              ← Kembali ke Landing Page
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ─── AUTHENTICATED SALES ADMIN PORTAL ───────────────────────────────────────
  return (
    <SidebarProvider defaultOpen={true}>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen w-full bg-[#faf6f5] text-slate-900 font-sans">
        {/* SIDEBAR NAVIGATION (Dashboard Style) */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBackToLanding={onBackToLanding}
          handleLogout={handleLogout}
        />

        {/* MAIN CONTENT AREA */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#faf6f5] min-h-screen">
          {/* Site Header */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#f0dbd8] bg-white/90 px-4 sm:px-6 backdrop-blur-md transition-all">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4 bg-[#f0dbd8]" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('overview');
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Sales Portal
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-semibold text-slate-900">
                      {activeTab === 'overview'
                        ? 'Dashboard & Lisensi'
                        : activeTab === 'settings'
                        ? 'Pengaturan Sistem'
                        : 'Infrastruktur Cloudflare'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-medium hidden sm:flex items-center gap-1.5 px-2.5 py-0.5"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                2FA Verified
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToLanding}
                className="text-xs h-8 cursor-pointer border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f]"
              >
                ← Web Depan
              </Button>
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* METRICS ROW (Dashboard Style Section Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-[#7d6568] uppercase tracking-wider">
                        Total Lisensi Klien
                      </CardTitle>
                      <div className="size-8 rounded-lg bg-[#fbf2f0] flex items-center justify-center text-[#a9484c]">
                        <Users className="size-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {totalClients}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="size-3 text-emerald-600" />
                        Terdaftar di sistem lokal
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-[#7d6568] uppercase tracking-wider">
                        Live Deployed
                      </CardTitle>
                      <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle className="size-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono text-emerald-600">
                        {activeClients}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Instance aktif di Cloudflare
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-[#7d6568] uppercase tracking-wider">
                        Menunggu Deploy
                      </CardTitle>
                      <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock className="size-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono text-amber-600">
                        {pendingClients}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Token siap aktivasi pembeli
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-[#7d6568] uppercase tracking-wider">
                        Estimasi Omset
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                        Beli Putus
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        Rp {(estimatedRevenue / 1000000).toFixed(1)} Jt
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Berdasarkan {activeClients} paket lunas
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* GENERATE TOKEN CARD */}
                <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="size-4 text-[#a9484c]" />
                      Buat Token Onboarding untuk Klien Baru
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Generate link aktivasi rahasia khusus untuk pembeli yang baru saja menyelesaikan transfer pembayaran.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerateToken} className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                          type="text"
                          required
                          placeholder="Nama Usaha / Klien (misal: Kopi Kenangan Senopati)"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="pl-9 text-xs h-10 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold h-10 px-5 shadow-xs cursor-pointer whitespace-nowrap transition-all active:scale-[0.99]"
                      >
                        <Key className="size-3.5 mr-1.5" />
                        Generate Link Rahasia 🚀
                      </Button>
                    </form>

                    {lastGeneratedClient && (
                      <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            Token Berhasil Dibuat untuk {lastGeneratedClient.name}:
                          </div>
                          <div className="font-mono text-xs text-slate-900 mt-1 font-bold">
                            {lastGeneratedClient.token}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyWhatsAppFormat(lastGeneratedClient)}
                            className="text-xs h-8 border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100/50"
                          >
                            <Copy className="size-3 mr-1" />
                            Salin Pesan WA
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onOpenOnboardingWithToken(lastGeneratedClient.token)}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Buka Onboarding <ExternalLink className="size-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CLIENTS DATA TABLE */}
                <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                  <CardHeader className="pb-3 border-b border-[#f0dbd8]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Users className="size-4 text-[#a9484c]" />
                          Daftar Pembeli Terdaftar ({filteredClients.length})
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          Kelola token lisensi, status deployment, dan tautan akses setiap klien pembeli.
                        </CardDescription>
                      </div>

                      {/* Filter & Search Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative w-full sm:w-60">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                          <Input
                            placeholder="Cari nama / token..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="pl-8 text-xs h-8 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-[#fbf4f3] p-0.5 rounded-lg border border-[#f0dbd8]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                            className={`text-[11px] h-7 px-2.5 font-medium rounded-md transition-all ${
                              filterStatus === 'all'
                                ? 'bg-white text-[#8f3b3f] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Semua
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus('active')}
                            className={`text-[11px] h-7 px-2.5 font-medium rounded-md transition-all ${
                              filterStatus === 'active'
                                ? 'bg-white text-emerald-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Live
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus('pending')}
                            className={`text-[11px] h-7 px-2.5 font-medium rounded-md transition-all ${
                              filterStatus === 'pending'
                                ? 'bg-white text-amber-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Pending
                          </Button>
                        </div>

                        {/* Backup & Restore Tools */}
                        <div className="flex items-center gap-1.5 pl-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportBackup}
                            title="Unduh backup data lisensi klien dalam format JSON terenkripsi"
                            className="text-[11px] h-8 px-2.5 border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f]"
                          >
                            <Download className="size-3.5 mr-1" />
                            Backup
                          </Button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImportBackup}
                              className="hidden"
                            />
                            <div className="inline-flex items-center justify-center text-[11px] h-8 px-2.5 rounded-md font-medium border border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f] transition-colors">
                              <Upload className="size-3.5 mr-1" />
                              Restore
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#f0dbd8] bg-[#fbf4f3]/60 hover:bg-[#fbf4f3]/60">
                            <TableHead className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                              Nama Bisnis / Klien
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                              Token Lisensi
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                              Status
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                              Domain / URL Target
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                              Tanggal
                            </TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider text-right">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredClients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <div className="size-12 rounded-full bg-[#fbf4f3] border border-[#f0dbd8] flex items-center justify-center text-[#a9484c]">
                                    <Key className="size-5" />
                                  </div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {clients.length === 0
                                      ? 'Belum ada lisensi klien yang dibuat'
                                      : 'Tidak ada data klien yang cocok dengan filter'}
                                  </p>
                                  <p className="text-xs text-slate-500 max-w-sm">
                                    {clients.length === 0
                                      ? 'Gunakan form di atas untuk membuat token lisensi dan link onboarding pertama bagi pembeli Anda.'
                                      : 'Coba ubah kata kunci pencarian atau ubah filter status.'}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredClients.map((client) => (
                              <TableRow key={client.id} className="border-[#f0dbd8] hover:bg-[#fbf4f3]/40 transition-colors">
                                <TableCell className="font-semibold text-xs text-slate-900">
                                  {client.name}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-[#fbf4f3] text-slate-700 px-2 py-0.5 rounded border border-[#f0dbd8] text-[11px] font-medium">
                                      {client.token}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copyLink(client.token, client.name)}
                                      className="size-6 text-slate-400 hover:text-slate-900 hover:bg-[#fbf2f0]"
                                      title="Salin Link Onboarding"
                                    >
                                      <Copy className="size-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-semibold cursor-pointer transition-all ${
                                      client.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    }`}
                                    onClick={() => toggleClientStatus(client.id)}
                                    title="Klik untuk ubah status"
                                  >
                                    {client.status === 'active' ? '● Live Deployed' : '○ Menunggu Setup'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {client.customDomainDashboard ? (
                                    <span className="font-mono text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                      {client.customDomainDashboard}
                                    </span>
                                  ) : client.deployedUrl ? (
                                    <a
                                      href={client.deployedUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-mono text-[11px] text-[#a9484c] hover:underline flex items-center gap-1 font-medium"
                                    >
                                      {client.deployedUrl.replace('https://', '')}
                                      <ExternalLink className="size-2.5" />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">
                                      Belum di-deploy
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-[11px] text-slate-500 font-mono">
                                  {client.createdAt}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-slate-900 hover:bg-[#fbf2f0]">
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="text-xs bg-white border border-[#f0dbd8] shadow-md rounded-xl">
                                      <DropdownMenuLabel className="text-slate-500 text-[11px]">Aksi Klien</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => copyWhatsAppFormat(client)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                        <Send className="size-3.5 mr-2 text-emerald-600" />
                                        Salin Format WhatsApp
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => copyLink(client.token, client.name)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                        <Copy className="size-3.5 mr-2 text-slate-600" />
                                        Salin Tautan Onboarding
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onOpenOnboardingWithToken(client.token)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                        <ExternalLink className="size-3.5 mr-2 text-[#a9484c]" />
                                        Buka Portal Onboarding
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-[#f0dbd8]" />
                                      <DropdownMenuItem onClick={() => toggleClientStatus(client.id)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                        <CheckCircle2 className="size-3.5 mr-2 text-emerald-600" />
                                        Tandai sebagai {client.status === 'active' ? 'Pending' : 'Live'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="text-rose-600 focus:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="size-3.5 mr-2" />
                                        Hapus Lisensi
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'settings' && (
              <SellerConfigPage onBack={() => setActiveTab('overview')} />
            )}

            {activeTab === 'infrastructure' && (
              <div className="space-y-6">
                <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Cloud className="size-5 text-[#a9484c]" />
                      Arsitektur Cloudflare Serverless Ekosistem
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Setiap instance klien akugawe di-deploy mandiri ke akun Cloudflare klien secara terisolasi tanpa server VPS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
                          <Database className="size-4" /> Cloudflare D1
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Database SQL terdistribusi di edge network. Kuota Free Tier: 5 Juta read / hari dan 100k write / hari per akun.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                          <Key className="size-4" /> Cloudflare KV
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Key-value cache ultra-cepat untuk sesi login biometrik dan cache pengaturan instan tanpa query database berulang.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                          <Bot className="size-4" /> Workers Backend API
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Hono API micro-backend dengan latensi sub-50ms di seluruh Indonesia. Kuota Free Tier: 100.000 request/hari.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                          <Globe className="size-4" /> Cloudflare Pages
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Hosting frontend gratis tanpa batas bandwidth untuk Dashboard Owner (Admin HR) dan PWA Mobile Karyawan.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#fdf7f1] border border-[#f0dbd8] text-xs space-y-2 text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="size-4 text-[#a9484c]" />
                        Panduan Token Izin Cloudflare Klien:
                      </div>
                      <p>
                        Saat klien membuat API Token di Cloudflare dashboard, pastikan izin berikut diaktifkan:
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-2 text-[11px] font-mono text-slate-800">
                        <li>Account → Cloudflare Pages → Edit</li>
                        <li>Account → Workers Scripts → Edit</li>
                        <li>Account → Workers KV Storage → Edit</li>
                        <li>Account → D1 → Edit</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* ─── INACTIVITY AUTO-LOCK MODAL OVERLAY ───────────────────────────────── */}
      {isIdleLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border-[#f0dbd8] bg-white shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-6">
              <div className="size-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="size-7" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Sesi Terkunci Otomatis
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Inactivity Guard mendeteksi ketiadaan aktivitas. Masukkan Master PIN Penjual untuk melanjutkan pekerjaan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleUnlockIdle} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block text-center">
                    Master Admin PIN
                  </label>
                  <div className="relative">
                    <Input
                      type={showIdlePin ? 'text' : 'password'}
                      maxLength={8}
                      required
                      autoFocus
                      placeholder="••••"
                      value={idleUnlockPin}
                      onChange={(e) => setIdleUnlockPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-2xl font-bold h-12 bg-white font-mono border-[#f0dbd8] focus-visible:ring-[#a9484c] text-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowIdlePin(!showIdlePin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showIdlePin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {idleError && (
                  <p className="text-xs text-rose-600 text-center font-medium">{idleError}</p>
                )}

                <Button
                  type="submit"
                  disabled={!idleUnlockPin}
                  className="w-full bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-bold h-10 shadow-sm cursor-pointer"
                >
                  Buka Kunci Sesi 🔓
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-slate-500 hover:text-rose-600 transition font-medium cursor-pointer"
                  >
                    Keluar / Logout Sesi
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </SidebarProvider>
  );
}
