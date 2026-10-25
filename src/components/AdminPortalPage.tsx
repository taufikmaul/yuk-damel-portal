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
  Building,
  CheckCircle,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Download,
  Upload,
  Server,
  UserCheck,
  CalendarPlus,
  PauseCircle,
  PlayCircle,
  Smartphone,
  Cloud,
} from 'lucide-react';
import {
  generateOtp,
  sendTelegramOtp,
  checkTelegramPairing,
  getLastTelegramError,
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
import { loadSellerConfig, saveSellerConfig, fetchSellerConfig } from '../services/config';
import { generateLicenseToken } from '../services/licenseService';
import { SellerConfigPage } from './SellerConfigPage';
import { AdminLeadsTab } from './AdminLeadsTab';
import { AdminFleetTab } from './AdminFleetTab';
import { SacredConfirmModal } from './SacredConfirmModal';
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
import { cn } from '@/lib/utils';

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
  subscriptionStatus?: 'active' | 'suspended' | 'expired' | 'canceled';
  maxEmployees?: number;
  billingCycleMonths?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  packageTierId?: string;
  amountPaidRp?: number;
  paymentStatus?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  podId?: string;
  customDomainDashboard?: string;
  customDomainApp?: string;
  deployedUrl?: string;
  isSample?: boolean;
}

const SESSION_KEY = 'ngabsen_admin_session_auth';
const CLIENTS_STORAGE_KEY = 'ngabsen_seller_clients';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Jam

export type AdminTab = 'overview' | 'leads' | 'fleet' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
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
      <SidebarHeader className="border-b border-[#f0dbd8] p-2 sm:p-2.5 flex flex-row items-center justify-between min-h-[50px]">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#a9484c] text-white p-1 shadow-xs cursor-pointer hover:bg-[#8f3b3f] transition-all"
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
          <div className="flex items-center gap-2 px-1 py-0.5 w-full">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#a9484c] text-white p-1 shadow-xs shrink-0">
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

      <SidebarContent className="px-2 py-2 space-y-3">
        <div className="space-y-0.5">
          {isCollapsed ? (
            <div className="my-1 border-t border-[#f0dbd8]/60 mx-1" />
          ) : (
            <div className="px-2 py-1 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
              Operasional
            </div>
          )}

          <div className="space-y-0.5">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center justify-center size-9 mx-auto rounded-lg transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <LayoutDashboard className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Dashboard & Lisensi (/salesAdmin)
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <LayoutDashboard className="size-4 shrink-0" />
                <span className="truncate">Dashboard & Lisensi</span>
              </button>
            )}

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('leads')}
                    className={`flex items-center justify-center size-9 mx-auto rounded-lg transition-all cursor-pointer ${
                      activeTab === 'leads'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <UserCheck className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Prospek & Leads Demo (/salesAdmin/leads)
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('leads')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="size-4 shrink-0" />
                  <span className="truncate">Prospek & Demo</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                  Leads
                </span>
              </button>
            )}

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fleet')}
                    className={`flex items-center justify-center size-9 mx-auto rounded-lg transition-all cursor-pointer ${
                      activeTab === 'fleet'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <Server className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Cloudflare Pod Fleet (/salesAdmin/fleet)
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'fleet'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <Server className="size-4 shrink-0" />
                <span className="truncate">Cloudflare Pod Fleet</span>
              </button>
            )}

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center justify-center size-9 mx-auto rounded-lg transition-all cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                    }`}
                  >
                    <Settings className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Konfigurasi Seller (/salesAdmin/settings)
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#fbf2f0] text-[#8f3b3f] font-semibold border-r-2 border-[#a9484c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <Settings className="size-4 shrink-0" />
                <span className="truncate">Konfigurasi Seller</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-0.5">
          {isCollapsed ? (
            <div className="my-1 border-t border-[#f0dbd8]/60 mx-1" />
          ) : (
            <div className="px-2 py-1 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
              Navigasi Cepat
            </div>
          )}

          <div className="space-y-0.5">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    className="flex items-center justify-center size-9 mx-auto rounded-lg transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60"
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
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium text-xs text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60 transition-all cursor-pointer"
              >
                <Globe className="size-4 shrink-0" />
                <span className="truncate">Landing Page Publik</span>
              </button>
            )}

            {(() => {
              const demoUrl = loadSellerConfig().demoDashboardUrl || 'https://dash-ngabsen.historycake.com';
              return isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center size-9 mx-auto rounded-lg transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60"
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
                  href={demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium text-xs text-slate-600 hover:text-slate-900 hover:bg-[#fbf2f0]/60 transition-all cursor-pointer"
                >
                  <ExternalLink className="size-4 shrink-0" />
                  <span className="truncate">Live Demo App</span>
                </a>
              );
            })()}
          </div>
        </div>
      </SidebarContent>

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
                <div className="text-[10px] text-slate-600 font-mono">ID: 115334079</div>
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

  // Validate signed session on mount against local tampering
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

  // Map URL pathname to active admin tab
  function getTabFromPathname(pathname: string): AdminTab {
    const clean = pathname.replace(/^\/salesAdmin\/?/, '').split('/')[0].toLowerCase();
    if (clean === 'settings' || clean === 'setting' || clean === 'konfigurasi') return 'settings';
    if (clean === 'leads' || clean === 'lead' || clean === 'prospek') return 'leads';
    if (clean === 'fleet' || clean === 'pods' || clean === 'pod' || clean === 'cloudflare') return 'fleet';
    return 'overview';
  }

  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    return getTabFromPathname(window.location.pathname);
  });

  const setActiveTab = (tab: AdminTab, updateUrl = true) => {
    setActiveTabState(tab);
    if (updateUrl) {
      const targetUrl = tab === 'overview' ? '/salesAdmin' : `/salesAdmin/${tab}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ view: 'admin', tab }, '', targetUrl);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/salesAdmin')) {
        const tab = getTabFromPathname(window.location.pathname);
        setActiveTabState(tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const initialConfig = loadSellerConfig();
  const [displayPin] = useState<string>(() => initialConfig.adminPin || '2468');
  const [isBotConfigured, setIsBotConfigured] = useState<boolean>(() => {
    return Boolean(initialConfig.authorizedChatId && initialConfig.authorizedChatId.trim() !== '');
  });
  const [connectedChatId, setConnectedChatId] = useState<string>(() => initialConfig.authorizedChatId || '');
  const [isCheckingPairing, setIsCheckingPairing] = useState<boolean>(false);
  const [isCopiedPin, setIsCopiedPin] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualChatIdInput, setManualChatIdInput] = useState<string>('');

  useEffect(() => {
    sessionStorage.setItem('ngabsen_admin_pin', displayPin);
    fetchSellerConfig(displayPin).then((cfg) => {
      if (cfg.authorizedChatId && cfg.authorizedChatId.trim() !== '') {
        setConnectedChatId(cfg.authorizedChatId);
        setIsBotConfigured(true);
      }
    });
  }, [displayPin]);

  const [isIdleLocked, setIsIdleLocked] = useState<boolean>(false);
  const [idleUnlockPin, setIdleUnlockPin] = useState('');
  const [showIdlePin, setShowIdlePin] = useState(false);
  const [idleError, setIdleError] = useState<string | null>(null);

  const [activeOtpHashed, setActiveOtpHashed] = useState<string | null>(null);
  const [otpSalt, setOtpSalt] = useState<string>('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [inputOtp, setInputOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() => getLockoutRemaining());
  const [resendCooldown, setResendCooldown] = useState<number>(() => getResendCooldownRemaining());
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);

  useEffect(() => {
    if (lockoutSeconds <= 0 && resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(getLockoutRemaining());
      setResendCooldown(getResendCooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds, resendCooldown]);

  // Lock screen after inactivity threshold
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

  const [isClientsLoaded, setIsClientsLoaded] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadEncryptedClients() {
      try {
        // Attempt fetching orders from remote D1 API first
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

        // Fall back to local encrypted storage if remote endpoint is unavailable
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

  const [newClientName, setNewClientName] = useState('');
  const [selectedTierId, setSelectedTierId] = useState<string>('free_trial');
  const [selectedCycleMonths, setSelectedCycleMonths] = useState<number>(4);
  const [newClientSlug, setNewClientSlug] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientCustomApp, setNewClientCustomApp] = useState<string>('');
  const [newClientCustomDashboard, setNewClientCustomDashboard] = useState<string>('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');
  const [lastGeneratedClient, setLastGeneratedClient] = useState<ClientRecord | null>(null);

  const [sacredModalState, setSacredModalState] = useState<{
    isOpen: boolean;
    client: ClientRecord | null;
    actionType: 'delete_license' | 'suspend_license';
    isLoading: boolean;
  }>({
    isOpen: false,
    client: null,
    actionType: 'delete_license',
    isLoading: false,
  });

  // Poll Telegram updates for initial PIN pairing handshake
  useEffect(() => {
    if (isAuthenticated || isBotConfigured) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (isCheckingPairing) return;
      try {
        const res = await checkTelegramPairing(displayPin, loadSellerConfig().telegramBotToken);
        if (res.success && res.chatId && isMounted) {
          const cfg = loadSellerConfig();
          const updated = { ...cfg, authorizedChatId: res.chatId };
          saveSellerConfig(updated);
          setConnectedChatId(res.chatId);
          setIsBotConfigured(true);
          toast.success(`🎉 Bot Telegram terhubung dengan ${res.senderName || 'akun Anda'}! (ID: ${res.chatId})`);
          handleSendOtp(res.chatId);
        }
      } catch (_) {}
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, isBotConfigured, displayPin, isCheckingPairing]);

  const handleCheckPairingNow = async () => {
    setIsCheckingPairing(true);
    try {
      const res = await checkTelegramPairing(displayPin, loadSellerConfig().telegramBotToken);
      if (res.success && res.chatId) {
        const cfg = loadSellerConfig();
        const updated = { ...cfg, authorizedChatId: res.chatId };
        saveSellerConfig(updated);
        setConnectedChatId(res.chatId);
        setIsBotConfigured(true);
        toast.success(`🎉 Bot Telegram berhasil terhubung! (ID: ${res.chatId})`);
        handleSendOtp(res.chatId);
      } else {
        toast.info(res.error || 'Belum ada pesan dengan PIN terdeteksi. Silakan kirim PIN ke bot Telegram.');
      }
    } catch (err: any) {
      toast.error('Gagal memeriksa pesan: ' + (err?.message || 'Error'));
    } finally {
      setIsCheckingPairing(false);
    }
  };

  const handleSaveManualChatId = () => {
    if (!manualChatIdInput.trim()) return;
    const cfg = loadSellerConfig();
    const updated = { ...cfg, authorizedChatId: manualChatIdInput.trim() };
    saveSellerConfig(updated);
    setConnectedChatId(manualChatIdInput.trim());
    setIsBotConfigured(true);
    toast.success('Chat ID berhasil disimpan!');
    handleSendOtp(manualChatIdInput.trim());
  };

  const handleSendOtp = async (overrideChatId?: string) => {
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

    const currentConfig = loadSellerConfig();
    const targetChat = overrideChatId || connectedChatId || currentConfig.authorizedChatId;

    if (!targetChat || targetChat.trim() === '') {
      setIsBotConfigured(false);
      setErrorMessage('Chat ID bot belum terkonfigurasi. Silakan chat bot dengan PIN terlebih dahulu.');
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

    const ok = await sendTelegramOtp(otp, targetChat, {
      botToken: currentConfig.telegramBotToken,
    });
    setIsSendingOtp(false);

    if (ok) {
      setOtpSentSuccess(true);
      toast.success('Kode OTP 6-digit berhasil dikirimkan ke Telegram Anda!');
    } else {
      const err = getLastTelegramError();
      const msg = err || 'Gagal mengirim pesan ke Telegram. Pastikan bot @AkugawePortalBot aktif.';
      
      if (
        msg.includes('chat not found') ||
        msg.includes('belum dikonfigurasi') ||
        msg.includes('belum terhubung') ||
        msg.includes('Bad Request')
      ) {
        setIsBotConfigured(false);
        setErrorMessage('Bot Telegram belum terhubung ke akun Anda. Silakan chat bot dengan PIN yang tampil di layar.');
        toast.error('Bot Telegram belum terhubung. Chat bot dengan PIN terlebih dahulu.');
      } else {
        setErrorMessage(msg);
        toast.error(msg);
      }
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

    const inputHash = await sha256(inputOtp.trim() + otpSalt);

    if (inputHash === activeOtpHashed) {
      resetFailedAttempts();
      setErrorMessage(null);

      try {
        const signedSession = await createSignedSession(SESSION_TTL_MS);
        localStorage.setItem(SESSION_KEY, JSON.stringify(signedSession));
      } catch (_) {}

      setIsAuthenticated(true);
      toast.success('Verifikasi Berlapis Berhasil! Selamat datang di Sales Admin.');
    } else {
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
    setIsIdleLocked(false);
    setActiveOtpHashed(null);
    setOtpSalt('');
    setInputOtp('');
    setOtpSentSuccess(false);
    toast.info('Sesi login telah berakhir.');
  };

  const configTiers = loadSellerConfig().pricingTiers || [];
  const currentTier = configTiers.find((t) => t.id === selectedTierId) || configTiers[0];

  const handleClientNameChange = (val: string) => {
    setNewClientName(val);
    if (!isSlugManuallyEdited) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setNewClientSlug(generated);
    }
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId);
    const tier = configTiers.find((t) => t.id === tierId);
    if (tier?.isFree || tierId === 'free_trial') {
      setSelectedCycleMonths(tier?.freeDurationMonths || 4);
    } else {
      setSelectedCycleMonths(12);
    }
  };

  const calculateAmountForTier = (tierId: string, months: number): number => {
    const tier = configTiers.find((t) => t.id === tierId);
    if (tier?.isFree || tierId === 'free_trial') return 0;
    if (tier?.pricing && tier.pricing[String(months)]) {
      return tier.pricing[String(months)].promoRp ?? tier.pricing[String(months)].normalRp;
    }
    return (tier?.promoPriceRp || tier?.normalPriceRp || 15000) * months;
  };

  const calculatedAmountRp = calculateAmountForTier(selectedTierId, selectedCycleMonths);
  const calculatedMaxEmployees = currentTier?.maxEmployees ?? 15;

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast.error('Nama Usaha / Klien wajib diisi.');
      return;
    }

    const cleanSlug = (newClientSlug.trim() || newClientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')).replace(/^-+|-+$/g, '');
    const newToken = generateLicenseToken(newClientName);
    const months = Number(selectedCycleMonths) || 1;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const isPro = selectedTierId === 'pro';
    const appUrl = isPro && newClientCustomApp.trim()
      ? (newClientCustomApp.trim().startsWith('http') ? newClientCustomApp.trim() : `https://${newClientCustomApp.trim()}`)
      : `https://app.akugawe.web.id/${cleanSlug}`;
    const dashboardUrl = isPro && newClientCustomDashboard.trim()
      ? (newClientCustomDashboard.trim().startsWith('http') ? newClientCustomDashboard.trim() : `https://${newClientCustomDashboard.trim()}`)
      : `https://hrd.akugawe.web.id/${cleanSlug}`;

    const newRecord: ClientRecord = {
      id: `ord_${Date.now()}`,
      name: newClientName.trim(),
      token: newToken,
      createdAt: now.toISOString().split('T')[0],
      status: 'active',
      subscriptionStatus: 'active',
      packageTierId: selectedTierId,
      billingCycleMonths: months,
      maxEmployees: calculatedMaxEmployees,
      amountPaidRp: calculatedAmountRp,
      paymentStatus: 'paid',
      podId: isPro ? 'pod-pro-dedicated' : 'pod-01',
      customDomainApp: isPro && newClientCustomApp.trim() ? newClientCustomApp.trim() : undefined,
      customDomainDashboard: isPro && newClientCustomDashboard.trim() ? newClientCustomDashboard.trim() : undefined,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      deployedUrl: JSON.stringify({ app: appUrl, dashboard: dashboardUrl }),
      isSample: false,
    };
    (newRecord as any).slug = cleanSlug;

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newRecord.id,
          clientName: newRecord.name,
          clientSlug: cleanSlug,
          licenseToken: newRecord.token,
          packageTierId: selectedTierId,
          amountPaidRp: calculatedAmountRp,
          maxEmployees: calculatedMaxEmployees,
          billingCycleMonths: months,
          buyerPhone: newClientPhone.trim() || null,
        }),
      });
    } catch (_) {}

    const updated = [newRecord, ...clients];
    setClients(updated);
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    setLastGeneratedClient(newRecord);
    setNewClientName('');
    setNewClientSlug('');
    setNewClientPhone('');
    setNewClientCustomApp('');
    setNewClientCustomDashboard('');
    setIsSlugManuallyEdited(false);
    setFilterStatus('all');
    setFilterSearch('');
    toast.success(`Token berhasil dibuat untuk "${newRecord.name}" (${currentTier?.name || selectedTierId})!`);
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

  function resolveClientUrls(client: ClientRecord): { appUrl: string; dashboardUrl: string; displayUrl: string; slug: string } {
    let slug = (client as any).slug;
    if (!slug && client.deployedUrl && client.deployedUrl.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(client.deployedUrl);
        const rawApp = parsed.app || '';
        const parts = rawApp.split('/').filter(Boolean);
        if (parts.length > 0) slug = parts[parts.length - 1];
      } catch (_) {}
    }
    if (!slug) {
      slug = client.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    const appUrl = client.customDomainApp
      ? (client.customDomainApp.startsWith('http') ? client.customDomainApp : `https://${client.customDomainApp}`)
      : `https://app.akugawe.web.id/${slug}`;

    const dashboardUrl = client.customDomainDashboard
      ? (client.customDomainDashboard.startsWith('http') ? client.customDomainDashboard : `https://${client.customDomainDashboard}`)
      : `https://hrd.akugawe.web.id/${slug}`;

    return {
      appUrl,
      dashboardUrl,
      displayUrl: slug,
      slug,
    };
  }

  const copyWhatsAppFormat = (client: ClientRecord) => {
    const { appUrl, dashboardUrl } = resolveClientUrls(client);
    const isFree = client.amountPaidRp === 0 || client.packageTierId === 'free_trial';
    const isPro =
      client.packageTierId === 'pro' ||
      client.packageTierId === 'business_pro' ||
      client.packageTierId === 'business' ||
      Boolean(client.podId?.includes('pro'));
    const tierName = isFree
      ? 'Free Trial UMKM (4 Bulan)'
      : isPro
      ? 'Business Pro (Dedicated Pod + Canvasing Sales)'
      : client.packageTierId || 'Starter UMKM';
    const expireDate = client.currentPeriodEnd
      ? new Date(client.currentPeriodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Aktif';
    const maxStaff = client.maxEmployees ? (client.maxEmployees === -1 ? 'Tanpa Batas' : `${client.maxEmployees} Karyawan`) : isPro ? '50 Karyawan' : '15 Karyawan';

    const text = `Halo Kak dari *${client.name}*! Terima kasih atas aktivasi aplikasi absensi & payroll akugawe.

🚀 *Akses Sistem Anda sudah aktif & siap digunakan:*
📱 *Aplikasi Presensi Karyawan (Mobile PWA):*
👉 ${appUrl}

💻 *Dashboard Manajemen & HRD:*
👉 ${dashboardUrl}

📋 *Detail Lisensi:*
• Paket: *${tierName}*
• Kuota Karyawan: *${maxStaff}*${isPro ? '\n• Fitur Eksklusif: *Canvasing Sales & Kunjungan Toko Aktif*' : ''}
• Masa Aktif: s/d *${expireDate}*
• Token Lisensi Resmi: \`${client.token}\`

Silakan bagikan link Aplikasi Presensi kepada karyawan dan link Dashboard HRD kepada admin/owner. Simpan Token Lisensi di atas sebagai bukti kepemilikan lisensi resmi Anda.`;
    navigator.clipboard.writeText(text);
    toast.success('Pesan WhatsApp aktivasi instan berhasil disalin!');
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

  const handleExtendSubscription = async (orderId: string, monthsToAdd: number) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend_subscription',
          orderId,
          monthsToAdd,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || `Masa aktif diperpanjang +${monthsToAdd} bulan!`);
        setClients((prev) =>
          prev.map((c) =>
            c.id === orderId
              ? {
                  ...c,
                  subscriptionStatus: 'active',
                  currentPeriodEnd: data.newPeriodEnd || c.currentPeriodEnd,
                }
              : c
          )
        );
      } else {
        toast.error(data.error || 'Gagal memperpanjang masa aktif.');
      }
    } catch (err: any) {
      toast.error('Gagal menghubungi server: ' + err?.message);
    }
  };

  const handleToggleSuspend = async (orderId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_suspend',
          orderId,
          newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || `Status diubah ke ${newStatus.toUpperCase()}`);
        setClients((prev) =>
          prev.map((c) => (c.id === orderId ? { ...c, subscriptionStatus: newStatus } : c))
        );
      } else {
        toast.error(data.error || 'Gagal mengubah status lisensi.');
      }
    } catch (err: any) {
      toast.error('Gagal menghubungi server: ' + err?.message);
    }
  };

  const promptDeleteClient = (client: ClientRecord) => {
    setSacredModalState({
      isOpen: true,
      client,
      actionType: 'delete_license',
      isLoading: false,
    });
  };

  const promptSuspendClient = (client: ClientRecord) => {
    setSacredModalState({
      isOpen: true,
      client,
      actionType: 'suspend_license',
      isLoading: false,
    });
  };

  const handleSacredConfirm = async ({ businessName, pin }: { businessName: string; pin: string }) => {
    if (!sacredModalState.client) return;
    const client = sacredModalState.client;

    if (sacredModalState.actionType === 'delete_license') {
      setSacredModalState((prev) => ({ ...prev, isLoading: true }));
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_license',
            orderId: client.id,
            businessName,
            masterPin: pin,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          const updated = clients.filter((c) => c.id !== client.id);
          setClients(updated);
          try {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
          } catch (_) {}

          if (data.podDeleted) {
            toast.success(data.message || `Lisensi "${client.name}" dan data tenant pada Pod berhasil dihapus permanen.`);
          } else {
            toast.success(data.message || `Lisensi "${client.name}" berhasil dihapus.`);
          }

          setSacredModalState({ isOpen: false, client: null, actionType: 'delete_license', isLoading: false });
        } else {
          toast.error(data.error || 'Gagal menghapus lisensi.');
          setSacredModalState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (err: any) {
        toast.error('Gagal menghubungi server: ' + err?.message);
        setSacredModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (sacredModalState.actionType === 'suspend_license') {
      setSacredModalState((prev) => ({ ...prev, isLoading: true }));
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_suspend',
            orderId: client.id,
            newStatus: 'suspended',
          }),
        });
        const data = await res.json();
        if (data.ok) {
          toast.success(data.message || `Lisensi "${client.name}" ditangguhkan (SUSPENDED).`);
          setClients((prev) =>
            prev.map((c) => (c.id === client.id ? { ...c, subscriptionStatus: 'suspended' } : c))
          );
          setSacredModalState({ isOpen: false, client: null, actionType: 'delete_license', isLoading: false });
        } else {
          toast.error(data.error || 'Gagal menangguhkan lisensi.');
          setSacredModalState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (err: any) {
        toast.error('Gagal menghubungi server: ' + err?.message);
        setSacredModalState((prev) => ({ ...prev, isLoading: false }));
      }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf6f5] flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <Card className="max-w-md w-full border-[#f0dbd8] bg-white shadow-xl shadow-rose-950/5 rounded-2xl overflow-hidden">
          {lockoutSeconds > 0 && (
            <div className="m-4 mb-0 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <div className="font-bold text-rose-900">Akses Terkunci Sementara</div>
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Terlalu banyak percobaan salah. Sistem dikunci selama <strong>{lockoutSeconds} detik</strong> demi mencegah brute-force.
                </div>
              </div>
            </div>
          )}

          {!isBotConfigured ? (
            <>
              <CardHeader className="text-center pb-2 pt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border-amber-300 bg-amber-50 text-amber-800 flex items-center gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Belum Terkonfigurasi
                  </Badge>
                </div>

                <div className="size-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Bot className="size-7" />
                </div>

                <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                  Aktivasi Bot Telegram
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Bot belum terhubung ke akun Telegram Anda. Untuk menerima kode OTP, silakan chat duluan ke bot kami dengan mengirimkan PIN di bawah ini.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 space-y-4">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-2.5">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                    PIN Verifikasi Bot:
                  </span>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-slate-900 bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-xs select-all">
                      {displayPin}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(displayPin);
                        setIsCopiedPin(true);
                        toast.success('PIN berhasil disalin!');
                        setTimeout(() => setIsCopiedPin(false), 2000);
                      }}
                      className="text-xs h-11 border-amber-300 bg-white hover:bg-amber-100/60 text-amber-900 font-semibold cursor-pointer"
                    >
                      {isCopiedPin ? <CheckCircle2 className="size-4 text-emerald-600 mr-1" /> : <Copy className="size-4 mr-1" />}
                      {isCopiedPin ? 'Tersalin' : 'Salin'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Chat ke <strong>@{BOT_USERNAME}</strong> dengan mengirimkan angka <strong>{displayPin}</strong> untuk menghubungkan akun secara otomatis.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <a
                  href={`https://t.me/${BOT_USERNAME}?start=${displayPin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold h-11 rounded-lg shadow-sm transition-all active:scale-[0.99] text-sm cursor-pointer"
                >
                  <Send className="size-4" /> Buka Bot Telegram (@{BOT_USERNAME}) <ExternalLink className="size-3.5" />
                </a>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="text-[11px] font-medium">Menunggu pesan masuk dari Telegram...</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isCheckingPairing}
                    onClick={handleCheckPairingNow}
                    className="text-[11px] h-7 px-2 text-[#a9484c] hover:bg-rose-50 font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`size-3 mr-1 ${isCheckingPairing ? 'animate-spin' : ''}`} />
                    Cek Koneksi
                  </Button>
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    {showManualInput ? 'Sembunyikan Pengaturan Manual' : 'Sudah tahu Chat ID Telegram Anda? Hubungkan manual'}
                  </button>

                  {showManualInput && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                        Masukkan Telegram Chat ID
                      </label>
                      <Input
                        type="text"
                        placeholder="Contoh: 115334079"
                        value={manualChatIdInput}
                        onChange={(e) => setManualChatIdInput(e.target.value.replace(/\D/g, ''))}
                        className="text-xs font-mono bg-white border-[#f0dbd8]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveManualChatId}
                        disabled={!manualChatIdInput.trim()}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs h-8 cursor-pointer font-bold"
                      >
                        Simpan Chat ID & Lanjut ke OTP
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2 pt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    2FA Telegram Aktif
                  </Badge>
                </div>

                <div className="size-14 rounded-2xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <ShieldCheck className="size-7 text-[#a9484c]" />
                </div>

                <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                  Portal Keamanan Penjual
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Verifikasi 2FA Telegram Sales Admin. Masukkan kode OTP 6-digit untuk melanjutkan.
                </CardDescription>

                {connectedChatId && (
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                    <span>Chat ID Terhubung: <strong className="font-mono text-slate-800">{connectedChatId}</strong></span>
                    <button
                      type="button"
                      onClick={() => setIsBotConfigured(false)}
                      className="text-[#a9484c] hover:underline cursor-pointer font-semibold ml-1"
                    >
                      (Ganti)
                    </button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-3 space-y-4">
                <Button
                  type="button"
                  onClick={() => handleSendOtp()}
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

                {otpSentSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      Kode OTP terkirim! Silakan cek obrolan dari <strong>@{BOT_USERNAME}</strong> di Telegram.
                    </span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
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
                      ⚠️ Sisa kesempatan: {remainingAttempts}x sebelum akun terkunci 60 detik.
                    </p>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
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
                      onClick={() => handleSendOtp()}
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
                      onClick={() => setIsBotConfigured(false)}
                      className="text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Chat Bot via PIN
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

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

  return (
    <SidebarProvider defaultOpen={true}>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen w-full bg-[#faf6f5] text-slate-900 font-sans">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBackToLanding={onBackToLanding}
          handleLogout={handleLogout}
        />

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#faf6f5] min-h-screen">
          <header className="sticky top-0 z-20 flex h-11 shrink-0 items-center justify-between border-b border-[#f0dbd8] bg-white/90 px-3 sm:px-4 backdrop-blur-md transition-all">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-3.5 bg-[#f0dbd8]" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/salesAdmin"
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
                        : activeTab === 'leads'
                        ? 'Prospek & Leads Demo'
                        : activeTab === 'fleet'
                        ? 'Cloudflare Pod Fleet'
                        : 'Pengaturan Sistem'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-medium hidden sm:flex items-center gap-1.5 px-2 py-0.5"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                2FA Verified
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToLanding}
                className="text-xs h-7.5 px-2.5 cursor-pointer border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f]"
              >
                ← Web Depan
              </Button>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-3.5">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                        Total Lisensi Klien
                      </span>
                      <div className="size-7 rounded-lg bg-[#fbf2f0] flex items-center justify-center text-[#a9484c]">
                        <Users className="size-3.5" />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 leading-tight">
                        {totalClients}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <TrendingUp className="size-3 text-emerald-600" />
                        Terdaftar di database
                      </p>
                    </div>
                  </Card>

                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                        Live Deployed
                      </span>
                      <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle className="size-3.5" />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 leading-tight">
                        {activeClients}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Instance aktif di Cloudflare Pod
                      </p>
                    </div>
                  </Card>

                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                        Menunggu Setup
                      </span>
                      <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock className="size-3.5" />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 leading-tight">
                        {pendingClients}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Token siap digunakan
                      </p>
                    </div>
                  </Card>

                  <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
                        Estimasi Omset
                      </span>
                      <Badge variant="outline" className="text-[9px] text-emerald-700 bg-emerald-50 border-emerald-200 px-1.5 py-0">
                        Lisensi
                      </Badge>
                    </div>
                    <div className="mt-1">
                      <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 leading-tight">
                        Rp {(estimatedRevenue / 1000000).toFixed(1)} Jt
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Dari {activeClients} akun aktif
                      </p>
                    </div>
                  </Card>
                </div>

                <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                  <CardHeader className="p-3 sm:p-3.5 pb-2">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="size-4 text-[#a9484c]" />
                      Buat Lisensi & Token Akses Klien Baru
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                      Generate token lisensi untuk mengalokasikan tenant ke Cloudflare Pod Fleet dan membuat link akses aplikasi instan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-3.5 pt-0">
                    <form onSubmit={handleGenerateToken} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="size-3 text-[#a9484c]" />
                          1. Pilih Paket Lisensi (Tier)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {configTiers.map((tier) => {
                            const isSelected = selectedTierId === tier.id;
                            const isFree = tier.isFree || tier.id === 'free_trial';
                            const isPro = tier.id === 'pro' || tier.id === 'business' || tier.id === 'business_pro' || tier.name.toLowerCase().includes('pro');
                            const isStarter = !isFree && !isPro;

                            return (
                              <button
                                key={tier.id}
                                type="button"
                                onClick={() => handleSelectTier(tier.id)}
                                className={cn(
                                  "p-2.5 rounded-xl border text-left transition-all relative cursor-pointer",
                                  isSelected
                                    ? "border-[#a9484c] bg-[#fff8f7] ring-1 ring-[#a9484c] shadow-xs"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                {tier.badge && (
                                  <span className={cn(
                                    "absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                    isFree
                                      ? "bg-rose-100 text-rose-800"
                                      : isPro
                                      ? "bg-indigo-100 text-indigo-800"
                                      : isSelected
                                      ? "bg-[#a9484c] text-white"
                                      : "bg-emerald-100 text-emerald-800"
                                  )}>
                                    {tier.badge}
                                  </span>
                                )}
                                <div className="font-bold text-xs text-slate-900 pr-14 truncate">
                                  {tier.name}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {tier.maxEmployees === -1 ? 'Unlimited Karyawan' : `Maks ${tier.maxEmployees} Karyawan`}
                                </div>
                                <div className="text-[11px] font-extrabold text-[#a9484c] mt-1">
                                  {isFree ? 'Gratis Rp 0' : `Rp ${(tier.promoPriceRp || tier.normalPriceRp || 15000).toLocaleString('id-ID')}/bln`}
                                </div>
                                <div className="mt-1.5 pt-1 border-t border-slate-100 text-[9px]">
                                  <span className={cn(
                                    "font-semibold flex items-center gap-0.5 truncate",
                                    isPro ? "text-indigo-700" : isStarter ? "text-emerald-700" : "text-slate-700"
                                  )}>
                                    {isPro
                                      ? '🛡️ 1 Akun CF + Canvasing'
                                      : isStarter
                                      ? '🌐 Shared Pod (Multi-Tenant)'
                                      : '🌐 Shared Pod (Free & Demo)'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-2 p-2 rounded-lg bg-[#faf6f5] border border-[#f0dbd8] text-[10px] text-slate-600 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Cloud className="size-3.5 text-[#a9484c] shrink-0" />
                            <span>
                              {(selectedTierId === 'pro' || selectedTierId === 'business' || selectedTierId === 'business_pro') ? (
                                <span><b>Aturan Baku Business Pro:</b> Klien dialokasikan ke <b>1 Dedicated Pod di 1 Akun Cloudflare mandiri</b> (Worker, D1 DB, KV, dan R2 terisolasi penuh, custom domain sendiri) serta membuka akses <b>Fitur Canvasing Sales & Kunjungan Toko</b>.</span>
                              ) : selectedTierId === 'starter' ? (
                                <span><b>Aturan Baku Starter UMKM:</b> Berada di <b>Shared Pod bersama</b> (Multi-tenant Cloudflare: <code className="font-mono">app.akugawe.web.id</code> &amp; <code className="font-mono">hrd.akugawe.web.id</code>, hingga 15 staf aktif).</span>
                              ) : (
                                <span><b>Aturan Baku Free Trial UMKM:</b> Berada di <b>Shared Pod bersama</b> (Multi-tenant Cloudflare: <code className="font-mono">app.akugawe.web.id</code> &amp; <code className="font-mono">hrd.akugawe.web.id</code>, masa aktif 4 bulan gratis, hingga 4 staf).</span>
                              )}
                            </span>
                          </div>
                          <Badge variant="outline" className={cn("text-[8px] font-bold px-1.5 py-0 shrink-0", (selectedTierId === 'pro' || selectedTierId === 'business' || selectedTierId === 'business_pro') ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                            {(selectedTierId === 'pro' || selectedTierId === 'business' || selectedTierId === 'business_pro') ? '🛡️ Dedicated Cloudflare' : '🌐 Shared Multi-Tenant'}
                          </Badge>
                        </div>
                      </div>

                      {selectedTierId !== 'free_trial' && currentTier?.pricing && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                            <Clock className="size-3 text-[#a9484c]" />
                            2. Pilih Durasi Berlangganan
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {Object.entries(currentTier.pricing).map(([mStr, p]) => {
                              const mNum = Number(mStr);
                              const isSelected = selectedCycleMonths === mNum;
                              return (
                                <button
                                  key={mStr}
                                  type="button"
                                  onClick={() => setSelectedCycleMonths(mNum)}
                                  className={cn(
                                    "p-2 rounded-lg border text-center transition-all cursor-pointer",
                                    isSelected
                                      ? "border-[#a9484c] bg-[#a9484c] text-white shadow-xs"
                                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                                  )}
                                >
                                  <div className="font-bold text-[11px]">{p.label}</div>
                                  <div className={cn("text-[10px] mt-0.5 font-medium", isSelected ? "text-white/90" : "text-[#a9484c]")}>
                                    Rp {(p.promoRp || p.normalRp).toLocaleString('id-ID')}
                                  </div>
                                  {p.badge && (
                                    <div className={cn("text-[8px] font-semibold mt-0.5", isSelected ? "text-amber-200" : "text-emerald-600")}>
                                      {p.badge}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <Building className="size-3 text-[#a9484c]" />
                          {selectedTierId === 'free_trial' ? '2. Data Usaha & Link Akses' : '3. Data Usaha & Link Akses'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <Input
                              type="text"
                              required
                              placeholder="Nama Usaha (misal: Toko Kopi Senja)"
                              value={newClientName}
                              onChange={(e) => handleClientNameChange(e.target.value)}
                              className="text-xs h-8.5 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                            />
                          </div>

                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono select-none">
                              slug:
                            </span>
                            <Input
                              type="text"
                              required
                              placeholder="slug-usaha"
                              value={newClientSlug}
                              onChange={(e) => {
                                setNewClientSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                setIsSlugManuallyEdited(true);
                              }}
                              className="pl-12 text-xs h-8.5 bg-white border-[#f0dbd8] text-slate-900 font-mono focus-visible:ring-[#a9484c]"
                            />
                          </div>

                          <div>
                            <Input
                              type="tel"
                              placeholder="WhatsApp Klien (opsional: 0812...)"
                              value={newClientPhone}
                              onChange={(e) => setNewClientPhone(e.target.value)}
                              className="text-xs h-8.5 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                            />
                          </div>
                        </div>

                        {selectedTierId === 'pro' && (
                          <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                                <Globe className="size-3.5 text-indigo-700" />
                                Custom Domain Pro Tier (1 Pod Dedicated Cloudflare)
                              </span>
                              <span className="text-[9px] font-mono bg-indigo-200/70 text-indigo-900 px-1.5 py-0.5 rounded font-semibold">
                                Dedicated Custom URL
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-indigo-900 block mb-1">
                                  Custom Domain Mobile PWA Karyawan
                                </label>
                                <Input
                                  type="text"
                                  placeholder="Contoh: ngabsen.historycake.com"
                                  value={newClientCustomApp}
                                  onChange={(e) => setNewClientCustomApp(e.target.value.toLowerCase().trim())}
                                  className="text-xs h-8 bg-white border-indigo-200 text-slate-900 font-mono focus-visible:ring-indigo-600"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-indigo-900 block mb-1">
                                  Custom Domain Dashboard HRD
                                </label>
                                <Input
                                  type="text"
                                  placeholder="Contoh: dash-ngabsen.historycake.com"
                                  value={newClientCustomDashboard}
                                  onChange={(e) => setNewClientCustomDashboard(e.target.value.toLowerCase().trim())}
                                  className="text-xs h-8 bg-white border-indigo-200 text-slate-900 font-mono focus-visible:ring-indigo-600"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-indigo-800 leading-tight">
                              Jika dikosongkan, akses akan otomatis menggunakan default shared subdomain: <code className="font-mono text-indigo-950">app.akugawe.web.id/{newClientSlug || 'slug'}</code> &amp; <code className="font-mono text-indigo-950">hrd.akugawe.web.id/{newClientSlug || 'slug'}</code>.
                            </p>
                          </div>
                        )}

                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 font-mono text-[11px]">
                            <span className="text-slate-500 font-sans font-semibold text-[10px] uppercase tracking-wider">Live URL Tenant:</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <Smartphone className="size-3 text-emerald-600" />
                              {selectedTierId === 'pro' && newClientCustomApp.trim() ? newClientCustomApp.trim() : `app.akugawe.web.id/${newClientSlug || 'slug-usaha'}`}
                            </span>
                            <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                              <LayoutDashboard className="size-3 text-sky-600" />
                              {selectedTierId === 'pro' && newClientCustomDashboard.trim() ? newClientCustomDashboard.trim() : `hrd.akugawe.web.id/${newClientSlug || 'slug-usaha'}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">Paket:</span> {currentTier?.name || selectedTierId}
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-800">Durasi:</span> {selectedTierId === 'free_trial' ? '4 Bulan (Gratis)' : `${selectedCycleMonths} Bulan`}
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-800">Karyawan:</span> {calculatedMaxEmployees === -1 ? 'Unlimited' : `${calculatedMaxEmployees} Staf`}
                          <span className="text-slate-300">•</span>
                          <span className="font-bold text-[#a9484c]">Total: Rp {calculatedAmountRp.toLocaleString('id-ID')}</span>
                        </div>

                        <Button
                          type="submit"
                          className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold h-8.5 px-4 shadow-xs cursor-pointer whitespace-nowrap text-xs transition-all active:scale-[0.99] w-full sm:w-auto"
                        >
                          <Key className="size-3 mr-1.5" />
                          Terbitkan Lisensi 🚀
                        </Button>
                      </div>
                    </form>

                    {lastGeneratedClient && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div>
                          <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            Lisensi Berhasil Dibuat untuk {lastGeneratedClient.name}:
                          </div>
                          <div className="font-mono text-xs text-slate-900 mt-0.5 font-bold">
                            {lastGeneratedClient.token}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyWhatsAppFormat(lastGeneratedClient)}
                            className="text-xs h-7.5 border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100/50"
                          >
                            <Copy className="size-3 mr-1" />
                            Salin Pesan WA
                          </Button>
                          {(() => {
                            const { appUrl, dashboardUrl } = resolveClientUrls(lastGeneratedClient);
                            return (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={appUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs h-7.5 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium inline-flex items-center gap-1"
                                >
                                  📱 Presensi Mobile <ExternalLink className="size-3" />
                                </a>
                                <a
                                  href={dashboardUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs h-7.5 px-2.5 rounded-md bg-sky-700 hover:bg-sky-800 text-white font-medium inline-flex items-center gap-1"
                                >
                                  💻 Dashboard HRD <ExternalLink className="size-3" />
                                </a>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl overflow-hidden">
                  <CardHeader className="p-3 sm:p-3.5 pb-2.5 border-b border-[#f0dbd8]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Users className="size-4 text-[#a9484c]" />
                          Daftar Pembeli Terdaftar ({filteredClients.length})
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                          Kelola token lisensi, cluster pod, status langganan, dan link akses aplikasi klien.
                        </CardDescription>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative w-full sm:w-52">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                          <Input
                            placeholder="Cari nama / token..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="pl-7.5 text-xs h-7.5 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-[#fbf4f3] p-0.5 rounded-lg border border-[#f0dbd8]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                            className={`text-[10px] h-6.5 px-2 font-medium rounded-md transition-all ${
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
                            className={`text-[10px] h-6.5 px-2 font-medium rounded-md transition-all ${
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
                            className={`text-[10px] h-6.5 px-2 font-medium rounded-md transition-all ${
                              filterStatus === 'pending'
                                ? 'bg-white text-amber-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Pending
                          </Button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportBackup}
                            title="Unduh backup data lisensi klien dalam format JSON terenkripsi"
                            className="text-[10px] h-7 px-2 border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f]"
                          >
                            <Download className="size-3 mr-1" />
                            Backup
                          </Button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImportBackup}
                              className="hidden"
                            />
                            <div className="inline-flex items-center justify-center text-[10px] h-7 px-2 rounded-md font-medium border border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f] transition-colors">
                              <Upload className="size-3 mr-1" />
                              Restore
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <div className="p-2.5 sm:p-3 bg-gradient-to-r from-[#fbf4f3] to-white border-b border-[#f0dbd8] flex items-start gap-2 text-xs">
                    <div className="size-5 rounded-md bg-[#fbf2f0] flex items-center justify-center text-[#a9484c] shrink-0 mt-0.5">
                      <Sparkles className="size-3" />
                    </div>
                    <div className="space-y-0.5 text-slate-700 text-[11px] leading-tight">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Sistem Deploy SaaS Baru: Cloudflare Multi-Tenant Pod (Zero-Touch & Instan ≤3 Detik)</span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold py-0">
                          Auto-Provisioning
                        </Badge>
                      </div>
                      <p className="text-slate-500">
                        Klien tidak perlu lagi onboarding Cloudflare manual. Pesanan langsung aktif di Pod Cluster (<code className="font-mono text-slate-700">pod-01</code>). Token Lisensi berfungsi sebagai <strong>Digital License Key</strong> untuk validasi kuota staf & bukti langganan resmi.
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#f0dbd8] bg-[#fbf4f3]/60 hover:bg-[#fbf4f3]/60">
                            <TableHead className="py-2 px-3 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
                              Nama Bisnis / Klien
                            </TableHead>
                            <TableHead className="py-2 px-3 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
                              Token & Cluster
                            </TableHead>
                            <TableHead className="py-2 px-3 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
                              Paket & Kapasitas
                            </TableHead>
                            <TableHead className="py-2 px-3 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
                              Masa Aktif
                            </TableHead>
                            <TableHead className="py-2 px-3 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider">
                              Akses Aplikasi (URL)
                            </TableHead>
                            <TableHead className="py-2 px-3 text-[10px] font-bold text-[#7d6568] uppercase tracking-wider text-right">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredClients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                <div className="flex flex-col items-center justify-center space-y-1.5">
                                  <div className="size-10 rounded-full bg-[#fbf4f3] border border-[#f0dbd8] flex items-center justify-center text-[#a9484c]">
                                    <Key className="size-4" />
                                  </div>
                                  <p className="text-xs font-semibold text-slate-900">
                                    {clients.length === 0
                                      ? 'Belum ada lisensi klien yang dibuat'
                                      : 'Tidak ada data klien yang cocok dengan filter'}
                                  </p>
                                  <p className="text-[11px] text-slate-500 max-w-sm">
                                    {clients.length === 0
                                      ? 'Gunakan form di atas untuk membuat token lisensi dan link akses instan bagi pembeli Anda.'
                                      : 'Coba ubah kata kunci pencarian atau filter status.'}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredClients.map((client) => {
                              const isFreeTier = client.amountPaidRp === 0 || client.packageTierId === 'free_trial' || client.packageTierId === 'free';
                              const isProTier = client.packageTierId === 'pro' || client.packageTierId === 'business_pro' || client.packageTierId === 'business' || Boolean(client.podId?.includes('pro'));
                              const isStarterTier = !isFreeTier && !isProTier;
                              const isSuspended = client.subscriptionStatus === 'suspended';
                              const { appUrl, dashboardUrl, displayUrl } = resolveClientUrls(client);

                              return (
                                <TableRow key={client.id} className="border-[#f0dbd8] hover:bg-[#fbf4f3]/40 transition-colors">
                                  <TableCell className="py-2 px-3 font-semibold text-xs text-slate-900">
                                    <div className="font-bold">{client.name}</div>
                                    <div className="text-[10px] text-slate-600 font-mono">ID: {client.id.slice(0, 10)} • {client.createdAt}</div>
                                  </TableCell>
                                  <TableCell className="py-2 px-3 font-mono text-xs">
                                    <div className="flex items-center gap-1">
                                      <span className="bg-[#fbf4f3] text-slate-800 px-1.5 py-0.5 rounded border border-[#f0dbd8] text-[10px] font-bold">
                                        {client.token}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          navigator.clipboard.writeText(client.token);
                                          toast.success('Token lisensi disalin!');
                                        }}
                                        className="size-5.5 text-slate-500 hover:text-slate-900 hover:bg-[#fbf2f0]"
                                        title="Salin Token Lisensi"
                                      >
                                        <Copy className="size-2.5" />
                                      </Button>
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-sans mt-0.5 flex items-center gap-1">
                                      <span>Pod: <span className="font-mono text-[#a9484c] font-semibold">{client.podId || (isProTier ? 'pod-pro' : 'pod-01')}</span></span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[8px] px-1 py-0 ${
                                          isProTier
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}
                                      >
                                        {isProTier ? '🛡️ Dedicated CF' : '🌐 Shared Pod'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 px-3">
                                    <div className="space-y-0.5">
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] font-semibold px-1.5 py-0 ${
                                          isFreeTier
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : isStarterTier
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        }`}
                                      >
                                        {isFreeTier
                                          ? 'Free Trial (Rp 0)'
                                          : isStarterTier
                                          ? 'Starter UMKM'
                                          : 'Business Pro'}
                                      </Badge>
                                      <div className="text-[10px] font-medium text-slate-600">
                                        Maks {client.maxEmployees ? (client.maxEmployees === -1 ? 'Unlimited' : `${client.maxEmployees} Staf`) : (isFreeTier ? '4 Staf' : isStarterTier ? '15 Staf' : '50 Staf')} • {isProTier ? 'Dedicated CF + Canvasing' : 'Shared Pod'}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 px-3">
                                    <div className="space-y-0.5">
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] font-semibold px-1.5 py-0 ${
                                          isSuspended
                                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                                            : client.subscriptionStatus === 'expired'
                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}
                                      >
                                        {isSuspended
                                          ? '⛔ Ditangguhkan'
                                          : client.subscriptionStatus === 'expired'
                                          ? '⏱️ Kedaluwarsa'
                                          : '● Aktif'}
                                      </Badge>
                                      {client.currentPeriodEnd && (
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          s/d {new Date(client.currentPeriodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 px-3 text-xs">
                                    <div className="space-y-1">
                                      <a
                                        href={appUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-mono text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold max-w-[200px] truncate"
                                        title={`Presensi Karyawan: ${appUrl}`}
                                      >
                                        <Smartphone className="size-3 text-emerald-600 shrink-0" />
                                        <span className="truncate">app:{displayUrl}</span>
                                        <ExternalLink className="size-2.5 shrink-0" />
                                      </a>
                                      <a
                                        href={dashboardUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-mono text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-semibold max-w-[200px] truncate"
                                        title={`Dashboard HRD: ${dashboardUrl}`}
                                      >
                                        <LayoutDashboard className="size-3 text-sky-600 shrink-0" />
                                        <span className="truncate">hrd:{displayUrl}</span>
                                        <ExternalLink className="size-2.5 shrink-0" />
                                      </a>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 px-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-7 text-slate-500 hover:text-slate-900 hover:bg-[#fbf2f0]">
                                          <MoreHorizontal className="size-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="text-xs bg-white border border-[#f0dbd8] shadow-md rounded-xl w-56">
                                        <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Akses & WhatsApp</DropdownMenuLabel>
                                        
                                        <DropdownMenuItem onClick={() => window.open(appUrl, '_blank')} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <Smartphone className="size-3.5 mr-2 text-emerald-600" />
                                          Buka Presensi (Mobile)
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => window.open(dashboardUrl, '_blank')} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <LayoutDashboard className="size-3.5 mr-2 text-sky-600" />
                                          Buka Dashboard (HRD)
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem onClick={() => {
                                          navigator.clipboard.writeText(`Presensi: ${appUrl}\nDashboard HRD: ${dashboardUrl}`);
                                          toast.success('Link presensi & dashboard tersalin!');
                                        }} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <Copy className="size-3.5 mr-2 text-slate-600" />
                                          Salin Link Akses
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => copyWhatsAppFormat(client)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <Send className="size-3.5 mr-2 text-emerald-600" />
                                          Salin Pesan WA (Aktivasi Baru)
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => {
                                          navigator.clipboard.writeText(client.token);
                                          toast.success('Token lisensi tersalin!');
                                        }} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <Key className="size-3.5 mr-2 text-amber-600" />
                                          Salin Token Lisensi
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => copyLink(client.token, client.name)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <Globe className="size-3.5 mr-2 text-slate-500" />
                                          Salin Link Onboarding Manual (Legacy)
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuSeparator className="bg-[#f0dbd8]" />
                                        <DropdownMenuLabel className="text-slate-600 text-[10px] uppercase font-semibold">Manajemen Langganan</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => handleExtendSubscription(client.id, 1)}
                                          className="hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                                        >
                                          <CalendarPlus className="size-3.5 mr-2 text-emerald-600" />
                                          Perpanjang +1 Bulan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleExtendSubscription(client.id, 12)}
                                          className="hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                                        >
                                          <CalendarPlus className="size-3.5 mr-2 text-emerald-600" />
                                          Perpanjang +1 Tahun
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            if (isSuspended) {
                                              handleToggleSuspend(client.id, client.subscriptionStatus);
                                            } else {
                                              promptSuspendClient(client);
                                            }
                                          }}
                                          className={`cursor-pointer ${isSuspended ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-700 hover:bg-amber-50'}`}
                                        >
                                          {isSuspended ? (
                                            <>
                                              <PlayCircle className="size-3.5 mr-2 text-emerald-600" />
                                              Aktifkan Kembali Akses
                                            </>
                                          ) : (
                                            <>
                                              <PauseCircle className="size-3.5 mr-2 text-amber-600" />
                                              Tangguhkan (Suspend)
                                            </>
                                          )}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="bg-[#f0dbd8]" />
                                        <DropdownMenuLabel className="text-slate-600 text-[10px] uppercase font-semibold">Opsional Enterprise</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onOpenOnboardingWithToken(client.token)} className="hover:bg-[#fbf2f0] cursor-pointer text-slate-600">
                                          <Server className="size-3.5 mr-2 text-slate-500" />
                                          Deploy Dedicated CF Klien
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => toggleClientStatus(client.id)} className="hover:bg-[#fbf2f0] cursor-pointer">
                                          <CheckCircle2 className="size-3.5 mr-2 text-slate-600" />
                                          Tandai Status: {client.status === 'active' ? 'Pending' : 'Live'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => promptDeleteClient(client)}
                                          className="text-rose-600 focus:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                        >
                                          <Trash2 className="size-3.5 mr-2" />
                                          Hapus Lisensi & Pod
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'leads' && <AdminLeadsTab />}

            {activeTab === 'fleet' && <AdminFleetTab />}

            {activeTab === 'settings' && (
              <SellerConfigPage onBack={() => setActiveTab('overview')} adminPin={displayPin} />
            )}
          </main>
        </SidebarInset>
      </div>

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

      <SacredConfirmModal
        isOpen={sacredModalState.isOpen}
        onClose={() => !sacredModalState.isLoading && setSacredModalState((prev) => ({ ...prev, isOpen: false }))}
        title={
          sacredModalState.actionType === 'delete_license'
            ? 'Hapus Lisensi & Data Pod Permanen'
            : 'Tangguhkan (Suspend) Lisensi Klien'
        }
        subtitle={
          sacredModalState.actionType === 'delete_license'
            ? 'Aksi ini akan menghapus lisensi dari database D1 dan menghapus seluruh data tenant pada Cloudflare Pod.'
            : 'Akses karyawan dan dashboard HRD untuk bisnis ini akan diblokir sementara.'
        }
        actionType={sacredModalState.actionType}
        targetBusinessName={sacredModalState.client?.name || ''}
        targetDetails={[
          { label: 'Token Lisensi', value: sacredModalState.client?.token || '-' },
          { label: 'ID Pesanan', value: sacredModalState.client?.id ? sacredModalState.client.id.slice(0, 16) : '-' },
          {
            label: 'Pod Cluster',
            value: sacredModalState.client?.podId || ((sacredModalState.client?.packageTierId === 'pro' || sacredModalState.client?.packageTierId === 'business_pro') ? 'pod-pro' : 'pod-01'),
            badge: (sacredModalState.client?.packageTierId === 'pro' || sacredModalState.client?.packageTierId === 'business_pro' || Boolean(sacredModalState.client?.podId?.includes('pro'))) ? '🛡️ Dedicated Pod' : '🌐 Shared Pod',
          },
        ]}
        warningMessage={
          sacredModalState.actionType === 'delete_license'
            ? 'Penghapusan ini bersifat permanen. Seluruh data absensi, akun karyawan, payroll, shift, dan pengaturan cabang pada Pod cluster akan di-wipe habis tanpa bisa dipulihkan kembali.'
            : 'Karyawan dan HRD tidak akan dapat melakukan presensi atau login ke sistem selama status ditangguhkan.'
        }
        requireBusinessName={true}
        requirePin={true}
        confirmButtonText={
          sacredModalState.actionType === 'delete_license'
            ? 'Hapus Permanen Lisensi & Pod'
            : 'Tangguhkan Lisensi Klien'
        }
        confirmButtonVariant="destructive"
        isLoading={sacredModalState.isLoading}
        onConfirm={handleSacredConfirm}
      />
    </SidebarProvider>
  );
}
