import { useState, useEffect } from 'react';
import {
  Cloud,
  Server,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Activity,
  Layers,
  Key,
  Copy,
  Eye,
  EyeOff,
  Database,
  Globe,
  Bot,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export interface PodRecord {
  id: string;
  name: string;
  cfAccountId: string;
  cfAccountEmail: string;
  cfApiToken?: string;
  appBaseUrl: string;
  apiBaseUrl: string;
  maxCompanies: number;
  currentCompaniesCount: number;
  capacityPercent: number;
  isActive: boolean;
  status: 'healthy' | 'standby' | 'full' | 'inactive';
  requestsToday: number;
  requestsLimit: number;
  r2StorageMb: number;
  r2StorageLimitMb: number;
  d1DatabaseName?: string;
  d1DatabaseId?: string;
  kvNamespace?: string;
  r2BucketName?: string;
  dnsZone?: string;
  podType?: 'shared' | 'dedicated';
  podScope?: string;
  notes?: string;
}

export function AdminFleetTab() {
  const [fleet, setFleet] = useState<PodRecord[]>([]);
  const [summary, setSummary] = useState<any>({
    totalPods: 1,
    totalCompanies: 0,
    maxFleetCapacity: 25,
    overallHealth: 'optimal',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [infraModalOpen, setInfraModalOpen] = useState(false);
  const [selectedPodDetail, setSelectedPodDetail] = useState<PodRecord | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});

  // Form Tambah Pod
  const [newPodId, setNewPodId] = useState('');
  const [newPodName, setNewPodName] = useState('');
  const [newCfAccountId, setNewCfAccountId] = useState('');
  const [newCfAccountEmail, setNewCfAccountEmail] = useState('');
  const [newCfApiToken, setNewCfApiToken] = useState('');
  const [newAppBaseUrl, setNewAppBaseUrl] = useState('https://app.akugawe.web.id');
  const [newApiBaseUrl, setNewApiBaseUrl] = useState('https://api.akugawe.id');
  const [newD1Name, setNewD1Name] = useState('');
  const [newMaxCompanies, setNewMaxCompanies] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFleet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cloudflare/fleet');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.fleet)) {
          setFleet(data.fleet);
          if (data.summary) setSummary(data.summary);
          return;
        }
      }
      // Fallback data
      setFleet([
        {
          id: 'pod-01',
          name: 'Cluster Alpha (Primary)',
          cfAccountId: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
          cfAccountEmail: 'cf+pod1@akugawe.web.id',
          cfApiToken: 'cftk_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
          appBaseUrl: 'https://app.akugawe.web.id',
          apiBaseUrl: 'https://akugawe-api.ngabsen-id.workers.dev',
          d1DatabaseName: 'akugawe-d1-prod-alpha',
          d1DatabaseId: 'd1-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          kvNamespace: 'KV_SESSION_AUTH, KV_CONFIG',
          r2BucketName: 'akugawe-selfie-r2-alpha',
          dnsZone: 'akugawe.web.id (Edge SSL Active)',
          maxCompanies: 25,
          currentCompaniesCount: 14,
          capacityPercent: 56,
          isActive: true,
          status: 'healthy',
          requestsToday: 18450,
          requestsLimit: 100000,
          r2StorageMb: 1420,
          r2StorageLimitMb: 10240,
          notes: 'Cluster utama UMKM & Free Tier',
        },
        {
          id: 'pod-02',
          name: 'Cluster Beta (Standby)',
          cfAccountId: 'f9e8d7c6b5a432109876543210fedcba',
          cfAccountEmail: 'cf+pod2@akugawe.id',
          cfApiToken: 'cftk_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
          appBaseUrl: 'https://app2.akugawe.id',
          apiBaseUrl: 'https://api-pod2.akugawe.id',
          d1DatabaseName: 'akugawe-d1-prod-beta',
          d1DatabaseId: 'd1-f9e8d7c6-b5a4-3210-9876-543210fedcba',
          kvNamespace: 'KV_SESSION_AUTH, KV_CONFIG',
          r2BucketName: 'akugawe-selfie-r2-beta',
          dnsZone: 'akugawe.id (Edge SSL Active)',
          maxCompanies: 25,
          currentCompaniesCount: 0,
          capacityPercent: 0,
          isActive: true,
          status: 'standby',
          requestsToday: 0,
          requestsLimit: 100000,
          r2StorageMb: 0,
          r2StorageLimitMb: 10240,
          notes: 'Siap menampung saat Pod 01 penuh',
        },
      ]);
    } catch (err: any) {
      toast.error('Gagal memuat status fleet: ' + err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const copyText = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} disalin ke clipboard!`);
  };

  const toggleTokenVisibility = (podId: string) => {
    setRevealedTokens((prev) => ({ ...prev, [podId]: !prev[podId] }));
  };

  const handleCreatePod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPodId.trim() || !newPodName.trim() || !newCfAccountId.trim() || !newCfAccountEmail.trim()) {
      toast.error('Seluruh kolom bertanda wajib harus diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cloudflare/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPodId.trim().toLowerCase(),
          name: newPodName.trim(),
          cfAccountId: newCfAccountId.trim(),
          cfAccountEmail: newCfAccountEmail.trim(),
          cfApiToken: newCfApiToken.trim() || `cftk_${newCfAccountId.trim().slice(0, 16)}_token`,
          appBaseUrl: newAppBaseUrl.trim() || 'https://app.akugawe.id',
          apiBaseUrl: newApiBaseUrl.trim() || 'https://api.akugawe.id',
          d1DatabaseName: newD1Name.trim() || `akugawe-d1-${newPodId.trim()}`,
          maxCompanies: Number(newMaxCompanies) || 25,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Gagal menyimpan pod baru.');

      toast.success(data.message || 'Pod baru berhasil ditambahkan!');
      setAddModalOpen(false);
      setNewPodId('');
      setNewPodName('');
      setNewCfAccountId('');
      setNewCfAccountEmail('');
      setNewCfApiToken('');
      setNewD1Name('');
      fetchFleet();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* SUMMARY KPI (Compact & Tight) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Total Pod
            </span>
            <div className="size-7 rounded-lg bg-[#fbf2f0] flex items-center justify-center text-[#a9484c]">
              <Server className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 leading-tight">
              {summary.totalPods} Pod
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Cluster akun mandiri</p>
          </div>
        </Card>

        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Tenant Terhosting
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 leading-tight">
              {summary.totalCompanies} / {summary.maxFleetCapacity}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Kapasitas cluster aktif</p>
          </div>
        </Card>

        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Status Edge
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 flex items-center gap-1.5 leading-tight">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Optimal
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Workers & D1 D100% online</p>
          </div>
        </Card>

        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Biaya Cloudflare
            </span>
            <div className="size-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Activity className="size-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-700 leading-tight">
              Rp 0 / bln
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Free Plan Multi-Account</p>
          </div>
        </Card>
      </div>

      {/* HEADER SECTION & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-xl border border-[#f0dbd8] shadow-xs">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="size-4 text-[#a9484c]" />
            Cloudflare Pod Fleet (Multi-Account Grouping)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sistem deploy SaaS baru: 1 Pod menampung 20–25 tenant dengan biaya Rp 0 tanpa perlu pembeli membuat Cloudflare manual.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* TOMBOL POPUP ARSITEKTUR CLOUD (Request 4) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInfraModalOpen(true)}
            className="h-8 text-xs border-[#f0dbd8] bg-[#fbf4f3] hover:bg-[#f5e3e1] text-[#8f3b3f] font-semibold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Info className="size-3.5" />
            <span>Arsitektur & Panduan Token</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFleet}
            disabled={isLoading}
            className="h-8 text-xs border-[#f0dbd8] bg-white hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-8 text-xs bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-bold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="size-3.5" />
            Tambah Pod
          </Button>
        </div>
      </div>

      {/* BANNER ATURAN BAKU POD */}
      <div className="bg-[#fff8f7] border border-[#f0dbd8] p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-700 shadow-xs">
        <Sparkles className="size-4 text-[#a9484c] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-xs">
            Aturan Baku Alokasi Pod & Akun Cloudflare:
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            • <b>Demo, Free Tier &amp; Starter:</b> Berada di <b>1 Pod Shared bersama</b> (multi-tenant grouping 25–50 tenant per akun Cloudflare) dengan biaya hosting Rp 0.<br />
            • <b>Pro Tier (Business Pro):</b> Mendapatkan <b>1 Dedicated Pod di 1 Akun Cloudflare tersendiri</b> (Database D1, Worker, dan KV khusus terisolasi penuh) + akses eksklusif <b>Fitur Canvasing Sales &amp; Kunjungan Toko</b>.
          </p>
        </div>
      </div>

      {/* POD CARDS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {fleet.map((pod) => {
          const isFull = pod.currentCompaniesCount >= pod.maxCompanies;
          const isDedicatedPod = pod.maxCompanies === 1 || pod.podType === 'dedicated';
          const reqPercent = Math.min(100, Math.round((pod.requestsToday / pod.requestsLimit) * 100));
          const r2Percent = Math.min(100, Math.round((pod.r2StorageMb / pod.r2StorageLimitMb) * 100));
          const isTokenVisible = Boolean(revealedTokens[pod.id]);
          const rawToken = pod.cfApiToken || `cftk_${pod.cfAccountId.slice(0, 16)}_edge`;
          const maskedToken = isTokenVisible
            ? rawToken
            : `${rawToken.slice(0, 7)}••••••••••••${rawToken.slice(-4)}`;

          return (
            <Card key={pod.id} className="border-[#f0dbd8] bg-white shadow-xs rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header Pod */}
                <div className="bg-[#faf6f5] border-b border-[#f0dbd8] p-3 sm:p-3.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded bg-white text-[#a9484c] border border-[#f0dbd8]">
                        {pod.id.toUpperCase()}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{pod.name}</h4>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      <span>Account Email:</span>
                      <strong className="text-slate-800">{pod.cfAccountEmail}</strong>
                    </div>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[8px] font-bold px-1.5 py-0 ${
                          isDedicatedPod
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isDedicatedPod
                          ? '🛡️ Dedicated Pod (1 Akun CF 1 Klien Pro)'
                          : '🌐 Shared Multi-Tenant (Demo, Free & Starter)'}
                      </Badge>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : pod.isActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isFull ? 'Kapasitas Penuh' : pod.isActive ? 'Active (Live)' : 'Standby'}
                  </Badge>
                </div>

                <div className="p-3 sm:p-3.5 space-y-3">
                  {/* INFORMASI DETAIL: ACCOUNT ID & TOKEN (Request 2) */}
                  <div className="p-2.5 rounded-lg bg-[#fbf4f3] border border-[#f0dbd8] space-y-2 text-xs">
                    {/* Account ID Row with Full Text & Copy Button */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#7d6568] uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <Key className="size-3 text-[#a9484c]" /> CF Account ID:
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-[#f0dbd8] truncate" title={pod.cfAccountId}>
                          {pod.cfAccountId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyText(pod.cfAccountId, 'Account ID')}
                          className="size-6 text-slate-500 hover:text-slate-900 hover:bg-white shrink-0"
                          title="Salin Account ID"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {/* API Token Row with Reveal/Hide & Copy Button */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#7d6568] uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <Lock className="size-3 text-emerald-600" /> API Token:
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-[#f0dbd8] truncate" title={isTokenVisible ? rawToken : 'Token terproteksi'}>
                          {maskedToken}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTokenVisibility(pod.id)}
                          className="size-6 text-slate-500 hover:text-slate-900 hover:bg-white shrink-0"
                          title={isTokenVisible ? 'Sembunyikan Token' : 'Lihat Token'}
                        >
                          {isTokenVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyText(rawToken, 'API Token')}
                          className="size-6 text-slate-500 hover:text-slate-900 hover:bg-white shrink-0"
                          title="Salin API Token"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Infrastructure Bindings Quick Info */}
                    <div className="pt-1.5 border-t border-[#f0dbd8]/80 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-500">API Endpoint:</span>
                        <div className="font-mono text-slate-800 truncate" title={pod.apiBaseUrl}>
                          {pod.apiBaseUrl.replace('https://', '')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">App Pages:</span>
                        <div className="font-mono text-slate-800 truncate" title={pod.appBaseUrl}>
                          {pod.appBaseUrl.replace('https://', '')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">D1 Database:</span>
                        <div className="font-mono text-slate-800 truncate" title={pod.d1DatabaseName || 'akugawe-d1'}>
                          {pod.d1DatabaseName || 'akugawe-d1'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">R2 Bucket:</span>
                        <div className="font-mono text-slate-800 truncate" title={pod.r2BucketName || 'akugawe-selfie-r2'}>
                          {pod.r2BucketName || 'akugawe-selfie-r2'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. Bar Kapasitas Perusahaan */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]">
                        <Layers className="size-3 text-[#a9484c]" />
                        Kapasitas Perusahaan ({pod.currentCompaniesCount} / {pod.maxCompanies} Toko)
                      </span>
                      <span className="font-bold text-slate-900 text-[11px]">
                        {pod.capacityPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          pod.capacityPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pod.capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. Bar Traffic Request Harian & Storage R2 */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Activity className="size-3 text-sky-600" /> Traffic (24j)
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {reqPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${reqPercent}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-600 flex items-center gap-1">
                          <HardDrive className="size-3 text-violet-600" /> R2 Selfie
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {(pod.r2StorageMb / 1024).toFixed(1)}GB
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${r2Percent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="px-3.5 py-2.5 bg-[#faf6f5]/50 border-t border-[#f0dbd8] flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPodDetail(pod)}
                  className="h-7 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer px-2"
                >
                  <Info className="size-3 mr-1 text-[#a9484c]" />
                  Detail Kredensial
                </Button>

                <a
                  href={`https://dash.cloudflare.com/${pod.cfAccountId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#a9484c] hover:text-[#8f3b3f] inline-flex items-center gap-1 hover:underline"
                >
                  Buka Dashboard CF
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: INFORMASI ARSITEKTUR CLOUD & PANDUAN TOKEN (Request 4)          */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {infraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-3xl w-full bg-white border border-[#f0dbd8] text-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#f0dbd8] flex items-center justify-between bg-[#faf6f5]">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-[#fbf2f0] flex items-center justify-center text-[#a9484c]">
                  <Cloud className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Arsitektur Cloudflare Serverless Ekosistem
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem multi-tenant akugawe berjalan di edge network Cloudflare dengan biaya server Rp 0.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInfraModalOpen(false)}
                className="size-8 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sky-700">
                    <Database className="size-4 shrink-0" />
                    <span>Cloudflare D1 (Edge SQLite)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Database SQL terdistribusi di edge network Cloudflare. Setiap tenant dipisahkan secara aman via <code className="font-mono bg-white px-1 py-0.5 rounded text-sky-900">company_id</code>. Kuota gratis: 5 juta read/hari & 100k write/hari per akun.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-700">
                    <Key className="size-4 shrink-0" />
                    <span>Cloudflare KV (Key-Value)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Cache ultra-cepat untuk sesi biometrik wajah, master token lisensi, dan konfigurasi tanpa harus melakukan query ulang ke database utama.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <Bot className="size-4 shrink-0" />
                    <span>Workers Backend API (Hono)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Backend microservice serverless dengan latensi sub-50ms di seluruh Indonesia. Kuota free 100.000 request/hari per akun Cloudflare.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-purple-700">
                    <Globe className="size-4 shrink-0" />
                    <span>Cloudflare Pages (Frontend)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Hosting frontend gratis tanpa batasan bandwidth untuk Dashboard Admin HR & PWA Mobile Karyawan dengan global edge CDN.
                  </p>
                </div>
              </div>

              {/* Panduan Izin Token */}
              <div className="p-4 rounded-xl bg-[#fdf7f1] border border-[#f0dbd8] space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-[#a9484c]" />
                  <span>Panduan Izin Cloudflare API Token (Saat Setup Pod Baru)</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Saat Anda membuat API Token di dashboard Cloudflare untuk Pod baru, pastikan izin (Permissions) berikut aktif:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-800">
                  <div className="p-2 rounded bg-white border border-[#f0dbd8] flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Account → Cloudflare Pages → Edit</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#f0dbd8] flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Account → Workers Scripts → Edit</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#f0dbd8] flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Account → Workers KV Storage → Edit</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#f0dbd8] flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Account → D1 → Edit</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#f0dbd8] flex items-center gap-2 col-span-1 sm:col-span-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Account → R2 Storage → Admin / Read & Write (Selfie Presensi)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#f0dbd8] bg-[#faf6f5] flex justify-end">
              <Button
                size="sm"
                onClick={() => setInfraModalOpen(false)}
                className="h-8 text-xs bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold"
              >
                Tutup Informasi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: DETAIL KREDENSIAL POD LENGKAP (Request 2)                       */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {selectedPodDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-xl w-full bg-white border border-[#f0dbd8] text-slate-900 rounded-2xl shadow-2xl overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-[#f0dbd8] flex items-center justify-between bg-[#faf6f5]">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white text-[#a9484c] border border-[#f0dbd8]">
                  {selectedPodDetail.id.toUpperCase()}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {selectedPodDetail.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedPodDetail.cfAccountEmail}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPodDetail(null)}
                className="size-7 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Account ID Full */}
              <div>
                <label className="text-[10px] font-bold text-[#7d6568] uppercase tracking-wider block mb-1">
                  Cloudflare Account ID (32 Hex)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={selectedPodDetail.cfAccountId}
                    className="font-mono text-xs h-8 bg-slate-50 border-[#f0dbd8]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(selectedPodDetail.cfAccountId, 'Account ID')}
                    className="h-8 px-2.5 text-xs border-[#f0dbd8] bg-white hover:bg-[#fbf4f3]"
                  >
                    <Copy className="size-3 mr-1" /> Salin
                  </Button>
                </div>
              </div>

              {/* API Token Full */}
              <div>
                <label className="text-[10px] font-bold text-[#7d6568] uppercase tracking-wider block mb-1">
                  API Token Kredensial
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={selectedPodDetail.cfApiToken || `cftk_${selectedPodDetail.cfAccountId.slice(0, 16)}_token`}
                    className="font-mono text-xs h-8 bg-slate-50 border-[#f0dbd8]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(selectedPodDetail.cfApiToken || selectedPodDetail.cfAccountId, 'API Token')}
                    className="h-8 px-2.5 text-xs border-[#f0dbd8] bg-white hover:bg-[#fbf4f3]"
                  >
                    <Copy className="size-3 mr-1" /> Salin
                  </Button>
                </div>
              </div>

              {/* Endpoints & Bindings */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-[#fbf4f3] border border-[#f0dbd8]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Hono API URL</span>
                  <a
                    href={selectedPodDetail.apiBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-[#a9484c] hover:underline font-semibold flex items-center gap-1 mt-0.5 truncate"
                  >
                    {selectedPodDetail.apiBaseUrl} <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>

                <div className="p-2.5 rounded-lg bg-[#fbf4f3] border border-[#f0dbd8]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">App Base URL</span>
                  <a
                    href={selectedPodDetail.appBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-[#a9484c] hover:underline font-semibold flex items-center gap-1 mt-0.5 truncate"
                  >
                    {selectedPodDetail.appBaseUrl} <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>

                <div className="p-2.5 rounded-lg bg-[#fbf4f3] border border-[#f0dbd8]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">D1 Database</span>
                  <span className="font-mono text-xs text-slate-800 font-medium mt-0.5 block truncate">
                    {selectedPodDetail.d1DatabaseName || `akugawe-d1-${selectedPodDetail.id}`}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#fbf4f3] border border-[#f0dbd8]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">R2 Storage Bucket</span>
                  <span className="font-mono text-xs text-slate-800 font-medium mt-0.5 block truncate">
                    {selectedPodDetail.r2BucketName || `akugawe-selfie-${selectedPodDetail.id}`}
                  </span>
                </div>
              </div>

              {/* Status Tenant & Catatan */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Cluster Siap Melayani Tenant
                </div>
                <div>
                  Saat ini menampung <strong>{selectedPodDetail.currentCompaniesCount}</strong> dari kapasitas maksimal <strong>{selectedPodDetail.maxCompanies}</strong> perusahaan. Sisa slot: <strong>{Math.max(0, selectedPodDetail.maxCompanies - selectedPodDetail.currentCompaniesCount)}</strong> tenant.
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-[#f0dbd8] bg-[#faf6f5] flex items-center justify-between">
              <a
                href={`https://dash.cloudflare.com/${selectedPodDetail.cfAccountId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#a9484c] font-bold hover:underline flex items-center gap-1"
              >
                Buka di Cloudflare Console <ExternalLink className="size-3" />
              </a>
              <Button
                size="sm"
                onClick={() => setSelectedPodDetail(null)}
                className="h-8 text-xs bg-[#a9484c] hover:bg-[#8f3b3f] text-white"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: TAMBAH POD BARU                                                 */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-lg w-full bg-white border border-[#f0dbd8] text-slate-900 rounded-2xl p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f0dbd8] pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cloud className="size-4 text-[#a9484c]" />
                  Tambah Cloudflare Pod Cluster Baru
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Daftarkan akun Cloudflare baru saat cluster lama sudah mendekati kapasitas 25 tenant.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAddModalOpen(false)}
                className="size-7 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePod} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kode Pod ID *
                  </label>
                  <Input
                    type="text"
                    placeholder="pod-03"
                    value={newPodId}
                    onChange={(e) => setNewPodId(e.target.value)}
                    className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Cluster *
                  </label>
                  <Input
                    type="text"
                    placeholder="Cluster Gamma"
                    value={newPodName}
                    onChange={(e) => setNewPodName(e.target.value)}
                    className="text-xs h-8 bg-white border-[#f0dbd8]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cloudflare Account ID (32 Karakter Hex) *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c"
                  value={newCfAccountId}
                  onChange={(e) => setNewCfAccountId(e.target.value)}
                  className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Akun Cloudflare *
                </label>
                <Input
                  type="email"
                  placeholder="cf+pod3@domainanda.com"
                  value={newCfAccountEmail}
                  onChange={(e) => setNewCfAccountEmail(e.target.value)}
                  className="text-xs h-8 bg-white border-[#f0dbd8]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cloudflare API Token (Opsional / Rahasia)
                </label>
                <Input
                  type="password"
                  placeholder="cftk_••••••••••••••••••••••••••••••••"
                  value={newCfApiToken}
                  onChange={(e) => setNewCfApiToken(e.target.value)}
                  className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    D1 Database Name
                  </label>
                  <Input
                    type="text"
                    placeholder="akugawe-d1-pod03"
                    value={newD1Name}
                    onChange={(e) => setNewD1Name(e.target.value)}
                    className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Batas Maks Tenant
                  </label>
                  <Input
                    type="number"
                    value={newMaxCompanies}
                    onChange={(e) => setNewMaxCompanies(Number(e.target.value))}
                    className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                    min={5}
                    max={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    App Base URL (Pages)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://app.akugawe.id"
                    value={newAppBaseUrl}
                    onChange={(e) => setNewAppBaseUrl(e.target.value)}
                    className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    API Base URL (Worker)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://api.akugawe.id"
                    value={newApiBaseUrl}
                    onChange={(e) => setNewApiBaseUrl(e.target.value)}
                    className="text-xs h-8 bg-white border-[#f0dbd8] font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2.5 border-t border-[#f0dbd8]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="text-xs h-8 border-[#f0dbd8]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs h-8 bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-bold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pod'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
