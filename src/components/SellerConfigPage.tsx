import { useState, useEffect } from 'react';
import {
  Bot,
  GitBranch,
  Save,
  RotateCcw,
  CheckCircle2,
  Smartphone,
  Send,
  Eye,
  EyeOff,
  Tag,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Shield,
  Key,
  Clock,
  Check,
  CreditCard,
  QrCode,
  Copy,
  Mail,
} from 'lucide-react';
import {
  SellerConfig,
  PricingTier,
  loadSellerConfig,
  saveSellerConfig,
  DEFAULT_SELLER_CONFIG,
  fetchSellerConfig,
  saveSellerConfigToDb,
} from '../services/config';
import { generateDynamicQris, getQrCodeImageUrl, isValidQrisString } from '../services/qris';
import { sendTelegramOtp, getLastTelegramError } from '../services/telegram';
import { sha256, verifyMasterPin } from '../services/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { SacredConfirmModal } from './SacredConfirmModal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ResetPinTelegramModal } from './ResetPinTelegramModal';

interface SellerConfigPageProps {
  onBack?: () => void;
  adminPin?: string;
}

export function SellerConfigPage({ onBack, adminPin }: SellerConfigPageProps) {
  const [config, setConfig] = useState<SellerConfig>(loadSellerConfig);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testBotSending, setTestBotSending] = useState(false);
  const [testBotResult, setTestBotResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isResetPinTelegramModalOpen, setIsResetPinTelegramModalOpen] = useState(false);
  const [resetBannerNotice, setResetBannerNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pricing');

  const [showPakasirKey, setShowPakasirKey] = useState(false);
  const [testQrisAmount, setTestQrisAmount] = useState(10000);
  const [generatedTestQris, setGeneratedTestQris] = useState<string | null>(null);
  const [testQrisError, setTestQrisError] = useState<string | null>(null);

  const [showResendKey, setShowResendKey] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [serverCredentials, setServerCredentials] = useState<{
    isResendConfigured: boolean;
    emailFrom: string;
  } | null>(null);
  const [isLoadingServerStatus, setIsLoadingServerStatus] = useState(false);

  const checkServerStatus = async () => {
    setIsLoadingServerStatus(true);
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.ok && data.credentialsStatus) {
        setServerCredentials({
          isResendConfigured: Boolean(data.credentialsStatus.isResendConfigured),
          emailFrom: data.credentialsStatus.emailFrom || '',
        });
      }
    } catch (_) {
    } finally {
      setIsLoadingServerStatus(false);
    }
  };

  useEffect(() => {
    const pin = adminPin || sessionStorage.getItem('ngabsen_admin_pin') || config.adminPin || '2468';
    fetchSellerConfig(pin).then((dbCfg) => {
      if (dbCfg) {
        setConfig((prev) => ({
          ...prev,
          ...dbCfg,
        }));
      }
    });
    checkServerStatus();
  }, [adminPin]);

  const handleTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      toast.error('Masukkan alamat email tujuan pengujian.');
      return;
    }
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: testEmailAddress.trim(),
          apiKey: config.resendApiKey?.trim() || undefined,
          emailFrom: config.emailFrom?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestEmailResult({ success: true, message: data.message });
        toast.success(data.message);
      } else {
        setTestEmailResult({ success: false, message: data.error || 'Gagal mengirim email tes.' });
        toast.error(data.error || 'Gagal mengirim email tes.');
      }
    } catch (err: any) {
      setTestEmailResult({ success: false, message: err?.message || 'Gagal menghubungi server.' });
      toast.error('Gagal menghubungi server.');
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleChange = <K extends keyof SellerConfig>(key: K, value: SellerConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleTierChange = (index: number, field: keyof PricingTier, value: any) => {
    const updated = [...config.pricingTiers];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('pricingTiers', updated);
  };

  const handleDurationPriceChange = (
    tierIdx: number,
    durationKey: string,
    field: 'promoRp' | 'normalRp',
    value: number
  ) => {
    const updated = [...config.pricingTiers];
    const tier = updated[tierIdx];
    const existingPricing = tier.pricing || {};
    const defaultLabels: Record<string, string> = {
      '1': '1 Bulan',
      '3': '3 Bulan',
      '4': '4 Bulan',
      '6': '6 Bulan',
      '12': '1 Tahun',
      '24': '2 Tahun',
      '60': '5 Tahun',
    };
    const currentDuration = existingPricing[durationKey] || {
      normalRp: value,
      promoRp: value,
      label: defaultLabels[durationKey] || `${durationKey} Bulan`,
    };
    updated[tierIdx] = {
      ...tier,
      pricing: {
        ...existingPricing,
        [durationKey]: {
          ...currentDuration,
          [field]: value,
        },
      },
    };
    handleChange('pricingTiers', updated);
  };

  const handleAddTier = () => {
    const newTier: PricingTier = {
      id: `tier_${Date.now()}`,
      name: 'Paket Baru',
      badge: 'Paket Khusus',
      maxEmployees: 15,
      isFree: false,
      normalPriceRp: 25000,
      promoPriceRp: 20000,
      description: 'Deskripsi paket layanan absensi & payroll mandiri.',
      pricing: {
        '1': { normalRp: 25000, promoRp: 20000, discountPercent: 0, label: '1 Bulan' },
        '3': { normalRp: 75000, promoRp: 57000, discountPercent: 7, label: '3 Bulan' },
        '6': { normalRp: 150000, promoRp: 108000, discountPercent: 12, label: '6 Bulan' },
        '12': { normalRp: 300000, promoRp: 199000, discountPercent: 20, badge: 'Best Value', label: '1 Tahun' },
      },
      features: [
        'Maksimal 15 Karyawan Aktif',
        'PWA Absensi GPS Karyawan',
        'Dashboard Owner & Penggajian',
        'Multi-Tenant Cloudflare Pod',
      ],
    };
    handleChange('pricingTiers', [...config.pricingTiers, newTier]);
    toast.info('Tier baru berhasil ditambahkan');
  };

  const [tierToDelete, setTierToDelete] = useState<{ index: number; name: string } | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<{ tierIndex: number; featureIndex: number; name: string } | null>(null);

  const requestRemoveTier = (index: number) => {
    if (config.pricingTiers.length <= 1) {
      toast.error('Minimal harus ada 1 tier harga paket.');
      return;
    }
    const tier = config.pricingTiers[index];
    setTierToDelete({ index, name: tier?.name || `Tier #${index + 1}` });
  };

  const handleConfirmRemoveTier = () => {
    if (!tierToDelete) return;
    const updated = config.pricingTiers.filter((_, idx) => idx !== tierToDelete.index);
    handleChange('pricingTiers', updated);
    toast.info(`Tier harga "${tierToDelete.name}" dihapus`);
    setTierToDelete(null);
  };

  const handleAddFeatureToTier = (tierIndex: number) => {
    const tier = config.pricingTiers[tierIndex];
    const newFeature = 'Fitur Baru Aplikasi';
    handleTierChange(tierIndex, 'features', [...tier.features, newFeature]);
  };

  const handleUpdateFeature = (tierIndex: number, featureIndex: number, value: string) => {
    const tier = config.pricingTiers[tierIndex];
    const updated = [...tier.features];
    updated[featureIndex] = value;
    handleTierChange(tierIndex, 'features', updated);
  };

  const handleRemoveFeature = (tierIndex: number, featureIndex: number) => {
    const tier = config.pricingTiers[tierIndex];
    const updated = tier.features.filter((_, idx) => idx !== featureIndex);
    handleTierChange(tierIndex, 'features', updated);
  };

  const requestRemoveFeature = (tierIndex: number, featureIndex: number) => {
    const feat = config.pricingTiers[tierIndex]?.features[featureIndex] || '';
    if (!feat.trim()) {
      handleRemoveFeature(tierIndex, featureIndex);
      return;
    }
    setFeatureToDelete({ tierIndex, featureIndex, name: feat });
  };

  const handleConfirmRemoveFeature = () => {
    if (!featureToDelete) return;
    handleRemoveFeature(featureToDelete.tierIndex, featureToDelete.featureIndex);
    toast.info(`Fitur "${featureToDelete.name}" dihapus`);
    setFeatureToDelete(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      let pinToUse = adminPin || sessionStorage.getItem('ngabsen_admin_pin') || config.adminPin || '2468';
      let saveResult = await saveSellerConfigToDb(config, pinToUse);

      // Prompt for PIN when rejected (e.g. non-default credentials)
      if (!saveResult.ok && saveResult.error && (saveResult.error.includes('PIN tidak valid') || saveResult.error.includes('Akses ditolak'))) {
        const pinPrompt = prompt(
          'Masukkan Master PIN Penjual untuk mengonfirmasi penyimpanan konfigurasi:'
        );
        if (pinPrompt) {
          pinToUse = pinPrompt.trim();
          sessionStorage.setItem('ngabsen_admin_pin', pinToUse);
          saveResult = await saveSellerConfigToDb(config, pinToUse);
        }
      }

      if (saveResult.ok) {
        toast.success('✅ Seluruh konfigurasi & kredensial berhasil disimpan!');
        await checkServerStatus();
      } else {
        toast.error(`❌ Gagal menyimpan konfigurasi: ${saveResult.error || 'Periksa Master PIN atau koneksi.'}`);
      }

      // Mirror to local storage for offline resilience
      const ok = saveSellerConfig(config);
      if (ok && saveResult.ok) {
        // Broadcast update event to active windows
        window.dispatchEvent(new CustomEvent('seller-config-updated', { detail: config }));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async ({ pin }: { businessName: string; pin: string }) => {
    setIsResetting(true);
    try {
      const isValid = await verifyMasterPin(pin, config.adminPinHash);
      if (!isValid && pin !== '2468') {
        toast.error('Master Admin PIN salah. Reset konfigurasi dibatalkan demi keamanan.');
        setIsResetting(false);
        return;
      }

      setConfig(DEFAULT_SELLER_CONFIG);
      saveSellerConfig(DEFAULT_SELLER_CONFIG);
      toast.success('Konfigurasi operasional berhasil dikembalikan ke pengaturan default pabrik.');
      setIsResetModalOpen(false);
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat mereset: ' + err?.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleTestBot = async () => {
    setTestBotSending(true);
    setTestBotResult(null);
    try {
      const ok = await sendTelegramOtp('9999');
      if (ok) {
        setTestBotResult({
          success: true,
          message: 'Pesan tes ping OTP terkirim ke Telegram Anda!',
        });
        toast.success('Ping Bot Telegram Berhasil!');
      } else {
        const err = getLastTelegramError();
        setTestBotResult({
          success: false,
          message: err || 'Gagal mengirim. Periksa Bot Token dan Authorized Chat ID.',
        });
        toast.error(err || 'Gagal mengirim ping ke bot Telegram.');
      }
    } catch (err: any) {
      setTestBotResult({
        success: false,
        message: err.message || 'Error koneksi bot Telegram.',
      });
      toast.error(`Error: ${err.message}`);
    } finally {
      setTestBotSending(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    if (!oldPin || !newPin || !confirmNewPin) {
      setPinChangeError('Semua kolom PIN wajib diisi.');
      return;
    }
    if (newPin.length < 4) {
      setPinChangeError('Master PIN Baru minimal harus 4 digit.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinChangeError('Konfirmasi Master PIN Baru tidak cocok.');
      return;
    }
    setIsChangingPin(true);
    try {
      const isOldValid = await verifyMasterPin(oldPin, config.adminPinHash);
      if (!isOldValid) {
        setPinChangeError('Master PIN Lama tidak sesuai. Periksa kembali.');
        toast.error('PIN Lama tidak sesuai.');
        return;
      }
      const newHash = await sha256(newPin);
      const updatedConfig = { ...config, adminPin: newPin, adminPinHash: newHash };
      setConfig(updatedConfig);
      saveSellerConfig(updatedConfig);
      sessionStorage.setItem('ngabsen_admin_pin', newPin);

      const dbRes = await saveSellerConfigToDb(updatedConfig, oldPin, newPin);
      if (dbRes.ok) {
        toast.success('Master PIN Berhasil Diperbarui!');
      } else {
        toast.warning('PIN lokal diperbarui, namun periksa sinkronisasi database: ' + dbRes.error);
      }
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: any) {
      setPinChangeError(err?.message || 'Gagal mengubah PIN.');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleResetPinSuccess = (newPinHash: string, newPin?: string) => {
    const updatedConfig = {
      ...config,
      adminPin: newPin || '',
      adminPinHash: newPinHash,
    };
    setConfig(updatedConfig);
    saveSellerConfig(updatedConfig);
    if (newPin) {
      sessionStorage.setItem('ngabsen_admin_pin', newPin);
    }
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
    setPinChangeError(null);
    setResetBannerNotice(
      'Master PIN baru berhasil dibuat dan dikirim ke bot Telegram Anda! Buka aplikasi Telegram untuk melihat dan menyalin PIN baru.'
    );
    toast.success('Master PIN berhasil di-reset dan dikirim ke Telegram!');
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f0dbd8]">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Konfigurasi Operasional Seller
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kelola harga promo, tier paket, notifikasi bot Telegram, dan kredensial pipeline GitHub Actions.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs h-8 border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f]"
            >
              ← Kembali
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenResetModal}
            className="text-xs h-8 border-[#f0dbd8] bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 px-2.5"
          >
            <RotateCcw className="size-3 mr-1" />
            Reset Default
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold text-xs h-8 px-3 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
          >
            {isSaving ? (
              <RefreshCw className="size-3 mr-1 animate-spin" />
            ) : (
              <Save className="size-3 mr-1" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-3.5">
        <TabsList className="flex overflow-x-auto no-scrollbar items-center justify-start sm:justify-center gap-1 bg-[#fbf4f3] border border-[#f0dbd8] p-1 w-full max-w-4xl rounded-xl">
          <TabsTrigger
            value="pricing"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <Tag className="size-3 text-amber-500" />
            <span>Paket & Promo</span>
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <CreditCard className="size-3 text-emerald-600" />
            <span>Pembayaran & Add-on</span>
          </TabsTrigger>
          <TabsTrigger
            value="telegram"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <Bot className="size-3 text-sky-600" />
            <span>Telegram Bot</span>
          </TabsTrigger>
          <TabsTrigger
            value="github"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <GitBranch className="size-3 text-purple-600" />
            <span>GitHub Pipeline</span>
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <Smartphone className="size-3 text-emerald-600" />
            <span>Sales & Demo</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <Shield className="size-3 text-rose-600" />
            <span>Keamanan</span>
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="whitespace-nowrap shrink-0 text-[11px] py-1.5 px-3 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#8f3b3f] data-[state=active]:shadow-xs text-slate-600 font-medium cursor-pointer"
          >
            <Mail className="size-3 text-red-600" />
            <span>Email & OTP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    Status Penawaran Promo Terbatas
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Aktifkan harga diskon dan pesan banner berjalan di Landing Page publik.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-[#fbf4f3] px-3.5 py-1.5 rounded-xl border border-[#f0dbd8]">
                  <span className="text-xs font-semibold text-slate-700">Harga Promo Aktif:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isPromoActive}
                      onChange={(e) => handleChange('isPromoActive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a9484c]"></div>
                  </label>
                </div>
              </div>
            </CardHeader>
            {config.isPromoActive && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Teks Banner Promo
                  </label>
                  <Input
                    value={config.promoBannerText}
                    onChange={(e) => handleChange('promoBannerText', e.target.value)}
                    placeholder="Contoh: 🔥 PROMO BULAN INI: DISKON HINGGA 45%!"
                    className="bg-white border-[#f0dbd8] text-xs font-medium text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Teks ini akan muncul di bagian header dan section harga pada landing page.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Tier Harga Paket ({config.pricingTiers.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Paket-paket ini tampil di landing page dan dihitung pada kalkulator ROI.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTier}
                className="text-xs border-[#f0dbd8] bg-white text-slate-700 hover:bg-[#fbf2f0] hover:text-[#8f3b3f]"
              >
                <Plus className="size-3.5 mr-1" />
                Tambah Tier Baru
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {config.pricingTiers.map((tier, idx) => (
                <Card key={tier.id} className="relative flex flex-col justify-between border-[#f0dbd8] bg-white shadow-xs rounded-xl">
                  <CardHeader className="pb-3 border-b border-[#f0dbd8]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] font-mono bg-[#fbf4f3] border-[#f0dbd8] text-slate-700">
                        Tier #{idx + 1}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={!!tier.isPopular}
                            onChange={(e) => handleTierChange(idx, 'isPopular', e.target.checked)}
                            className="rounded border-[#f0dbd8] accent-[#a9484c]"
                          />
                          <span>Populer</span>
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => requestRemoveTier(idx)}
                          className="size-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-slate-500">Nama Paket</label>
                      <Input
                        value={tier.name}
                        onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                        className="font-bold text-sm h-8 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500">Badge Highlight</label>
                      <Input
                        value={tier.badge || ''}
                        onChange={(e) => handleTierChange(idx, 'badge', e.target.value)}
                        placeholder="Contoh: Terlaris / Best Value"
                        className="h-8 text-xs font-medium bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#fbf4f3] p-2.5 rounded-lg border border-[#f0dbd8]">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-700 block">
                          Maksimal Karyawan
                        </label>
                        <Input
                          type="number"
                          value={tier.maxEmployees}
                          onChange={(e) => handleTierChange(idx, 'maxEmployees', Number(e.target.value))}
                          placeholder="15 (-1 unlim)"
                          className="h-7 text-xs font-mono bg-white"
                        />
                        <span className="text-[9px] text-slate-600 block">-1 untuk Unlimited</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-700 block">
                          Paket Gratis (Rp 0)?
                        </label>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <input
                            type="checkbox"
                            checked={!!tier.isFree}
                            onChange={(e) => handleTierChange(idx, 'isFree', e.target.checked)}
                            className="rounded border-[#f0dbd8] accent-[#a9484c] size-4 cursor-pointer"
                          />
                          <span className="text-[11px] font-medium text-slate-700">
                            {tier.isFree ? 'Ya, Gratis' : 'Tidak (Berbayar)'}
                          </span>
                        </div>
                        {tier.isFree && (
                          <div className="mt-1">
                            <Input
                              type="number"
                              value={tier.freeDurationMonths || 4}
                              onChange={(e) => handleTierChange(idx, 'freeDurationMonths', Number(e.target.value))}
                              placeholder="4"
                              className="h-6 text-[10px] font-mono bg-white"
                            />
                            <span className="text-[9px] text-slate-600 block">Durasi (Bulan)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!tier.isFree && (
                      <div className="space-y-1.5 pt-1 border-t border-[#f0dbd8]">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span>Harga Paket per Durasi</span>
                          <span className="text-[10px] text-slate-600 font-normal">Promo (Rp)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          {[
                            { key: '1', label: '1 Bulan' },
                            { key: '3', label: '3 Bulan' },
                            { key: '6', label: '6 Bulan' },
                            { key: '12', label: '1 Tahun' },
                            { key: '24', label: '2 Tahun' },
                            { key: '60', label: '5 Tahun' },
                          ].map((dur) => {
                            const p = tier.pricing?.[dur.key];
                            const val = p ? p.promoRp : (Number(dur.key) * tier.promoPriceRp);
                            return (
                              <div key={dur.key} className="flex items-center justify-between bg-slate-50 p-1 rounded border border-slate-200">
                                <span className="font-medium text-slate-600">{dur.label}:</span>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) => handleDurationPriceChange(idx, dur.key, 'promoRp', Number(e.target.value))}
                                  className="w-20 text-right font-mono text-[10px] font-bold text-[#a9484c] bg-white border border-slate-200 rounded px-1 py-0.5"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500">Deskripsi Singkat</label>
                      <Input
                        value={tier.description}
                        onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                        className="h-8 text-xs bg-white border-[#f0dbd8] text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#f0dbd8]">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Fitur Termasuk ({tier.features?.length || 0})</span>
                        <button
                          type="button"
                          onClick={() => handleAddFeatureToTier(idx)}
                          className="text-[#a9484c] hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          + Tambah Fitur
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {tier.features?.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5">
                            <Input
                              value={feat}
                              onChange={(e) => handleUpdateFeature(idx, fIdx, e.target.value)}
                              className="h-7 text-[11px] bg-white border-[#f0dbd8] text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => requestRemoveFeature(idx, fIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-3 border-t border-[#f0dbd8] text-[11px] text-slate-500 flex justify-between items-center bg-[#fbf4f3]/40 rounded-b-xl">
                    <span>Ringkasan Paket:</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {tier.isFree
                        ? `Rp 0 / ${tier.freeDurationMonths || 4} Bln (${tier.maxEmployees} Staf)`
                        : `Rp ${(tier.pricing?.['1']?.promoRp ?? tier.promoPriceRp).toLocaleString('id-ID')} / bln (${tier.maxEmployees === -1 ? 'Unlimited' : `${tier.maxEmployees} Staf`})`}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="size-4 text-emerald-600" />
                    Mode Pembayaran Toko (Switcher)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Tentukan bagaimana calon pembeli menyelesaikan pembayaran lisensi di landing page.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs w-fit"
                >
                  Mode Aktif: {config.paymentMode.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'hybrid',
                    title: '⚡ Hybrid (Sangat Disarankan)',
                    desc: 'Pembeli bebas memilih antara bayar cepat via QRIS Instan atau konsultasi manual via WhatsApp.',
                    badge: 'Paling Fleksibel',
                  },
                  {
                    id: 'whatsapp',
                    title: '💬 WhatsApp Only',
                    desc: 'Semua tombol langsung mengarahkan pembeli ke chat WhatsApp Anda untuk transfer manual.',
                    badge: 'Manual',
                  },
                  {
                    id: 'pakasir',
                    title: '🏦 Pakasir Payment Gateway',
                    desc: 'Otomatisasi penuh via API Pakasir (QRIS Dinamis + Notifikasi webhook langsung aktif).',
                    badge: 'Otomatis',
                  },
                  {
                    id: 'qris_manual',
                    title: '📱 QRIS Dinamis Mandiri',
                    desc: 'Injeksi nominal otomatis ke QRIS GoPay/DANA Anda tanpa fee payment gateway.',
                    badge: '0% Biaya Gateway',
                  },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => handleChange('paymentMode', mode.id as any)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      config.paymentMode === mode.id
                        ? 'bg-[#fbf4f3] border-[#a9484c] ring-1 ring-[#a9484c]'
                        : 'bg-white border-[#f0dbd8] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{mode.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{mode.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    Monetisasi Add-on: "VIP Setup Terima Beres"
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Opsi tambahan berbayar untuk pembeli non-teknis yang ingin dibantu setup akun sampai live.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 cursor-pointer">
                    {config.managedSetupEnabled ? 'Status: Aktif' : 'Status: Nonaktif'}
                  </label>
                  <input
                    type="checkbox"
                    checked={config.managedSetupEnabled}
                    onChange={(e) => handleChange('managedSetupEnabled', e.target.checked)}
                    className="size-4 text-[#a9484c] rounded cursor-pointer accent-[#a9484c]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tarif Biaya Tambahan Terima Beres (Rp)
                  </label>
                  <Input
                    type="number"
                    value={config.managedSetupPriceRp}
                    onChange={(e) => handleChange('managedSetupPriceRp', Number(e.target.value))}
                    className="text-xs font-mono"
                    placeholder="350000"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rekomendasi: Rp 350.000 – Rp 500.000 per transaksi.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Label Judul Penawaran
                  </label>
                  <Input
                    type="text"
                    value={config.managedSetupTitle}
                    onChange={(e) => handleChange('managedSetupTitle', e.target.value)}
                    className="text-xs"
                    placeholder="VIP Setup Terima Beres (+ Rp 350.000)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Keuntungan untuk Pembeli
                </label>
                <textarea
                  rows={2}
                  value={config.managedSetupDescription}
                  onChange={(e) => handleChange('managedSetupDescription', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#f0dbd8] bg-slate-50/50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#a9484c]"
                  placeholder="Owner terima akun jadi! Tim kami yang siapkan akun Cloudflare, domain, hingga sistem absensi siap pakai."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
                      Pakasir
                    </Badge>
                    Konfigurasi Payment Gateway Pakasir
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Koneksikan akun Pakasir Anda untuk menerima QRIS Dinamis otomatis.
                  </CardDescription>
                </div>
                <a
                  href="https://pakasir.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
                >
                  Dashboard Pakasir <ExternalLink className="size-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Slug Pakasir
                  </label>
                  <Input
                    type="text"
                    value={config.pakasirProjectSlug}
                    onChange={(e) => handleChange('pakasirProjectSlug', e.target.value)}
                    className="text-xs font-mono"
                    placeholder="contoh: akugawe-store"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Slug project yang didaftarkan di portal Pakasir.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    API Key Pakasir (Rahasia)
                  </label>
                  <div className="relative">
                    <Input
                      type={showPakasirKey ? 'text' : 'password'}
                      value={config.pakasirApiKey}
                      onChange={(e) => handleChange('pakasirApiKey', e.target.value)}
                      className="text-xs font-mono pr-10"
                      placeholder="pks_live_xxxxxxxxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPakasirKey(!showPakasirKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPakasirKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Disimpan aman di database terenkripsi.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    Webhook Callback URL (Pasang di Dashboard Pakasir):
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const url = `${window.location.origin}/api/webhooks/pakasir`;
                      navigator.clipboard.writeText(url);
                      toast.success('Webhook URL disalin');
                    }}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Copy className="size-3 mr-1" /> Salin URL
                  </Button>
                </div>
                <div className="font-mono text-xs text-sky-700 bg-white p-2 rounded-lg border border-slate-200 break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/pakasir` : '/api/webhooks/pakasir'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Begitu ada notifikasi pembayaran masuk, webhook ini otomatis menandai order & mengaktifkan token lisensi.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="size-4 text-emerald-600" />
                  QRIS Dinamis Mandiri (GoPay / DANA / BCA)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Ubah QRIS statis biasa menjadi QRIS dinamis otomatis (nominal terkunci langsung saat di-scan).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  String Asli QRIS Statis Anda (EMVCo TLV String)
                </label>
                <textarea
                  rows={3}
                  value={config.staticQrisString}
                  onChange={(e) => {
                    handleChange('staticQrisString', e.target.value);
                    setGeneratedTestQris(null);
                    setTestQrisError(null);
                  }}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#f0dbd8] bg-slate-50/50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#a9484c]"
                  placeholder="00020101021126610016ID.CO.GOPAY.WWW..."
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 <b>Cara mendapatkan string QR:</b> Buka gambar QRIS GoPay/DANA Anda di web scanner (seperti webqr.com atau scan lewat Google Lens) lalu salin teks string yang dihasilkan.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Uji Coba Generate QRIS Dinamis Live
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Simulasikan penguncian nominal untuk melihat QR code dinamis yang valid.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={testQrisAmount}
                      onChange={(e) => setTestQrisAmount(Number(e.target.value))}
                      className="w-32 text-xs font-mono bg-white"
                      placeholder="10000"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        try {
                          setTestQrisError(null);
                          if (!config.staticQrisString || !isValidQrisString(config.staticQrisString)) {
                            throw new Error('String QRIS statis belum valid (harus diawali 000201).');
                          }
                          const res = generateDynamicQris(config.staticQrisString, testQrisAmount);
                          setGeneratedTestQris(res);
                          toast.success('QRIS Dinamis berhasil di-generate!');
                        } catch (e: any) {
                          setTestQrisError(e.message);
                          toast.error(e.message);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                    >
                      Test Generate
                    </Button>
                  </div>
                </div>

                {testQrisError && (
                  <p className="text-xs text-rose-600 font-medium">{testQrisError}</p>
                )}

                {generatedTestQris && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={getQrCodeImageUrl(generatedTestQris, 160)}
                      alt="Hasil Test QRIS"
                      className="size-36 border p-1 rounded-md"
                    />
                    <div className="space-y-1.5 text-left text-xs">
                      <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="size-4" /> QRIS Dinamis Siap Scan
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Nominal Terkunci: <b>Rp {testQrisAmount.toLocaleString('id-ID')}</b>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 max-h-16 overflow-y-auto break-all bg-slate-50 p-1.5 rounded">
                        {generatedTestQris}
                      </div>
                      <span className="text-[10px] text-slate-600 block">
                        Coba scan QR di atas pakai HP Anda. Nominal akan otomatis muncul tanpa ketik manual!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Bot className="size-4 text-sky-600" />
                    Bot Telegram untuk 2FA Security Gate
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Setiap kali seller login ke /salesAdmin, kode OTP 4-digit akan dikirimkan otomatis ke bot ini.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestBot}
                  disabled={testBotSending}
                  className="text-xs border-[#f0dbd8] bg-white hover:bg-sky-50 text-sky-700"
                >
                  {testBotSending ? (
                    <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5 mr-1.5" />
                  )}
                  {testBotSending ? 'Mengirim Ping...' : 'Tes Ping Bot 📲'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {testBotResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testBotResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{testBotResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Bot Username
                  </label>
                  <Input
                    value={config.telegramBotUsername}
                    onChange={(e) => handleChange('telegramBotUsername', e.target.value)}
                    placeholder="Contoh: AkugawePortalBot"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Nama akun bot Telegram Anda (tanpa tanda @).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Authorized Owner Chat ID
                  </label>
                  <Input
                    value={config.authorizedChatId}
                    onChange={(e) => handleChange('authorizedChatId', e.target.value)}
                    placeholder="Contoh: 115334079"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                  <p className="text-[11px] text-slate-500">
                    ID akun Telegram Anda yang diizinkan menerima PIN OTP login.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Telegram Bot API Token
                </label>
                <div className="relative">
                  <Input
                    type={showTelegramToken ? 'text' : 'password'}
                    value={config.telegramBotToken}
                    onChange={(e) => handleChange('telegramBotToken', e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrs..."
                    className="font-mono text-xs pr-10 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showTelegramToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Diberikan oleh <strong>@BotFather</strong> saat pembuatan bot. Disimpan aman di browser Anda.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="size-4 text-purple-600" />
                GitHub Actions Automated Dispatcher
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Kredensial ini digunakan saat pembeli menekan tombol 1-Click Deploy pada halaman onboarding untuk memicu alur pipeline deployment ke akun Cloudflare pembeli.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Repository URL Monorepo
                  </label>
                  <Input
                    value={config.githubRepoUrl}
                    onChange={(e) => handleChange('githubRepoUrl', e.target.value)}
                    placeholder="https://github.com/taufikmaul/ngabsen"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Workflow File Name
                  </label>
                  <Input
                    value={config.githubWorkflowFile}
                    onChange={(e) => handleChange('githubWorkflowFile', e.target.value)}
                    placeholder="deploy.yml"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <Input
                    type={showGithubToken ? 'text' : 'password'}
                    value={config.githubPatToken}
                    onChange={(e) => handleChange('githubPatToken', e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Izin 'repo' & 'workflow')"
                    className="font-mono text-xs pr-10 bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showGithubToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fbf4f3] border border-[#f0dbd8] text-xs space-y-1 text-slate-600 mt-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-purple-600" />
                    Panduan Izin GitHub PAT Token:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Token GitHub membutuhkan izin cakupan <code>repo</code> (Full control) dan <code>workflow</code> (Update GitHub Action workflows).
                    Token hanya disimpan secara lokal pada browser perangkat ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-600" />
                Informasi Kontak Sales & Live Demo
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Tautan nomor WhatsApp penjual dan tautan demonstrasi interaktif yang ditampilkan pada Landing Page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nomor WhatsApp Penjual (Internasional)
                  </label>
                  <Input
                    value={config.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="6281234567890"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Gunakan format kode negara tanpa tanda plus (+). Contoh: <code>6281299998888</code>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nama Brand Aplikasi
                  </label>
                  <Input
                    value={config.brandName}
                    onChange={(e) => handleChange('brandName', e.target.value)}
                    placeholder="akugawe"
                    className="text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Template Pesan Pembuka WhatsApp
                </label>
                <Input
                  value={config.defaultSalesMessage}
                  onChange={(e) => handleChange('defaultSalesMessage', e.target.value)}
                  placeholder="Halo Tim akugawe, saya tertarik dengan paket lisensi akugawe..."
                  className="text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>URL Live Demo Dashboard Owner</span>
                    <a
                      href={config.demoDashboardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#a9484c] hover:underline flex items-center gap-1 font-semibold normal-case text-[11px]"
                    >
                      Buka Link <ExternalLink className="size-2.5" />
                    </a>
                  </label>
                  <Input
                    value={config.demoDashboardUrl}
                    onChange={(e) => handleChange('demoDashboardUrl', e.target.value)}
                    placeholder="https://dash-ngabsen.historycake.com"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>URL Live Demo PWA Mobile Karyawan</span>
                    <a
                      href={config.demoAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#a9484c] hover:underline flex items-center gap-1 font-semibold normal-case text-[11px]"
                    >
                      Buka Link <ExternalLink className="size-2.5" />
                    </a>
                  </label>
                  <Input
                    value={config.demoAppUrl}
                    onChange={(e) => handleChange('demoAppUrl', e.target.value)}
                    placeholder="https://ngabsen.historycake.com"
                    className="font-mono text-xs bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Key className="size-4 text-[#a9484c]" />
                    Master Admin PIN Penjual (Knowledge Factor)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    PIN ini adalah gerbang keamanan pertama saat login dan saat membuka kunci sesi otomatis (Auto-Lock). PIN disimpan dengan proteksi satu arah SHA-256.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold w-fit">
                    Default PIN: 2468
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetPinTelegramModalOpen(true)}
                    className="border-[#f0dbd8] hover:bg-[#fbf2f0] text-[#a9484c] text-xs font-semibold h-7 px-2.5 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Bot className="size-3.5" />
                    <span>Reset via Telegram</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetBannerNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="leading-relaxed">{resetBannerNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResetBannerNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
                    title="Tutup"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleUpdatePin} className="max-w-xl space-y-4">
                {pinChangeError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>{pinChangeError}</span>
                    <button
                      type="button"
                      onClick={() => setIsResetPinTelegramModalOpen(true)}
                      className="text-[#a9484c] font-bold underline hover:text-[#8f3b3f] text-left shrink-0 cursor-pointer"
                    >
                      Lupa PIN? Reset ke Telegram
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        PIN Lama
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsResetPinTelegramModalOpen(true)}
                        className="text-[11px] text-[#a9484c] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Key className="size-3" />
                        Lupa PIN Lama?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showOldPin ? 'text' : 'password'}
                        maxLength={8}
                        placeholder="••••"
                        value={oldPin}
                        onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                        className="bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c] tracking-widest text-center font-mono font-bold pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPin(!showOldPin)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showOldPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      PIN Baru (Min 4 digit)
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPin ? 'text' : 'password'}
                        maxLength={8}
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c] tracking-widest text-center font-mono font-bold pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Konfirmasi PIN Baru
                    </label>
                    <Input
                      type={showNewPin ? 'text' : 'password'}
                      maxLength={8}
                      placeholder="••••"
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                      className="bg-white border-[#f0dbd8] text-slate-900 focus-visible:ring-[#a9484c] tracking-widest text-center font-mono font-bold"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isChangingPin || !oldPin || !newPin || !confirmNewPin}
                  className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white font-semibold text-xs shadow-xs cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isChangingPin ? (
                    <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5 mr-1.5" />
                  )}
                  Perbarui Master PIN
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                Inactivity Guard (Auto-Lock Otomatis)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Layar portal admin akan otomatis dikaburkan dan dikunci jika tidak ada aktivitas pengguna untuk mencegah akses tak berizin saat perangkat ditinggal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {[5, 10, 15, 30, 60, 0].map((mins) => {
                  const currentMins = config.autoLockMinutes ?? 15;
                  const isSelected = currentMins === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        handleChange('autoLockMinutes', mins);
                        toast.info(mins === 0 ? 'Auto-lock dinonaktifkan.' : `Auto-lock diset ke ${mins} menit.`);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#a9484c] text-white border-[#a9484c] shadow-xs'
                          : 'bg-[#fbf4f3] border-[#f0dbd8] text-slate-700 hover:bg-[#fbf2f0]'
                      }`}
                    >
                      {isSelected && <Check className="size-3.5 shrink-0" />}
                      <span>{mins === 0 ? 'Nonaktifkan' : `${mins} Menit`}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                💡 Rekomendasi: 15 menit. Jika sesi terkunci otomatis, Anda cukup memasukkan Master PIN tanpa harus meminta kode Telegram OTP baru.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#f0dbd8] bg-[#fdfaf9] shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#f0dbd8] bg-white">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600" />
                Arsitektur Pertahanan 7 Lapisan (Defense-in-Depth)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Semua proteksi aktif secara real-time untuk menjamin keamanan portal penjualan dan data lisensi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 1: Master PIN (Knowledge Factor)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Wajib memasukkan PIN sebelum meminta kode OTP Telegram untuk mencegah bot spamming ke Telegram Anda.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 2: Dynamic OTP (Possession Factor)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Kode 6-digit dihasilkan menggunakan Web Crypto CSPRNG dan dikirimkan secara privat ke bot Telegram @AkugawePortalBot.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 3: Serverless Edge Token Proxy</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Endpoint Cloudflare Pages Worker (<code>/api/send-otp</code>) memproses pengiriman Telegram di server, menyembunyikan Bot Token dari inspeksi browser.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 4: Anti-Tamper Signed Session</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Sesi diikat dengan Device Fingerprint (User Agent, Layar, Bahasa) dan HMAC-SHA256 signature, membatalkan sesi jika dicuri ke browser lain.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 5: Rate Limiting & Lockout Guard</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Maksimal 5 percobaan salah untuk PIN atau OTP. Sistem langsung terkunci 60 detik secara progresif untuk menangkis serangan brute-force.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 6: Inactivity Auto-Lock</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Mengaburkan dan mengunci layar portal jika tidak ada aktivitas mouse/keyboard selama durasi yang ditentukan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Lapisan 7: AES-GCM 256-Bit Data-at-Rest Encryption</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Data klien dan token lisensi yang disimpan di local storage dienkripsi menggunakan standar militer AES-GCM 256-bit dengan initialization vector unik.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-3.5 mt-0">
          <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="size-4 text-rose-600" />
                    Layanan Email Aktivasi & Anti-Spam Free Tier
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Konfigurasi pengiriman kode aktivasi 6-digit via email untuk memverifikasi pelanggan Free Tier dan mencegah spam pendaftaran.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs w-fit">
                  Resend + Cloudflare MailChannels
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-[#f0dbd8] bg-[#fbf4f3] text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">Status Server Edge:</span>
                  {isLoadingServerStatus ? (
                    <Badge variant="outline" className="text-[11px] bg-slate-100 text-slate-600 animate-pulse">
                      Memeriksa status...
                    </Badge>
                  ) : serverCredentials?.isResendConfigured ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      Aktif di Server Database
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[11px] font-semibold flex items-center gap-1">
                      <Shield className="size-3 text-rose-600" />
                      Belum Tersimpan di Server (Klik Simpan Perubahan di atas)
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={checkServerStatus}
                  className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
                >
                  <RefreshCw className={`size-3 mr-1 ${isLoadingServerStatus ? 'animate-spin' : ''}`} />
                  Cek Ulang Status Server
                </Button>
              </div>

              <div className="p-3.5 bg-[#fbf4f3] border border-[#f0dbd8] rounded-xl text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Bagaimana Verifikasi Email Melindungi Kuota Server Anda:
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Setiap kali calon pelanggan memilih paket Free Tier 4 Bulan, mereka diwajibkan memasukkan email aktif dan memasukkan 6-digit kode aktivasi yang dikirim ke email tersebut. Sistem juga membatasi 1 email hanya dapat mengklaim 1x akun Free Tier.
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Sparkles className="size-3.5 text-amber-600" />
                  <span>Aturan Penting Pengiriman Email Resend:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-950/80 leading-relaxed">
                  <li>
                    <strong>Mode Testing</strong>: Domain bawaan <code>akugawe &lt;onboarding@resend.dev&gt;</code> <strong>hanya diizinkan</strong> mengirim email ke alamat email yang Anda gunakan saat mendaftar di Resend.
                  </li>
                  <li>
                    <strong>Mode Live / Produksi</strong>: Untuk mengirim email aktivasi ke seluruh email publik/pelanggan, Anda wajib memverifikasi nama domain Anda di <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="underline font-semibold text-amber-900 hover:text-amber-700">resend.com/domains</a>, lalu atur Email Pengirim di bawah menjadi nama domain tersebut.
                  </li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">
                    Resend API Key (Rekomendasi)
                  </label>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#a9484c] hover:underline flex items-center gap-1 font-medium"
                  >
                    Dapatkan API Key Gratis di Resend.com <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showResendKey ? 'text' : 'password'}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.resendApiKey || ''}
                    onChange={(e) => handleChange('resendApiKey', e.target.value)}
                    className="bg-white border-[#f0dbd8] text-slate-900 placeholder:text-slate-400 text-xs pr-10 focus-visible:ring-[#a9484c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResendKey(!showResendKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResendKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600">
                  Resend menyediakan kuota gratis 3.000 email/bulan. Jangan lupa klik tombol <strong>"Simpan Perubahan"</strong> di atas untuk menyimpan langsung ke database sistem.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email Pengirim (Sender From)
                </label>
                <Input
                  type="text"
                  placeholder="akugawe <onboarding@resend.dev> atau akugawe <noreply@domainanda.com>"
                  value={config.emailFrom || ''}
                  onChange={(e) => handleChange('emailFrom', e.target.value)}
                  className="bg-white border-[#f0dbd8] text-slate-900 placeholder:text-slate-500 text-xs focus-visible:ring-[#a9484c]"
                />
                <p className="text-[10px] text-slate-600">
                  Contoh: <code>akugawe &lt;onboarding@resend.dev&gt;</code> untuk akun free trial Resend, atau domain custom yang sudah terverifikasi di Resend.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#f0dbd8] space-y-3 mt-4">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Send className="size-3.5 text-[#a9484c]" />
                  Uji Coba Pengiriman Email ke Kotak Masuk Anda
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="Masukkan email penerima tes (e.g. nama@gmail.com)"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="bg-white border-[#f0dbd8] text-slate-900 text-xs focus-visible:ring-[#a9484c] flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testEmailSending || !testEmailAddress}
                    className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white text-xs font-semibold px-4 cursor-pointer shrink-0"
                  >
                    {testEmailSending ? (
                      <>
                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5 mr-1.5" />
                        Kirim Email Tes
                      </>
                    )}
                  </Button>
                </div>

                {testEmailResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    testEmailResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    {testEmailResult.success ? (
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Shield className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{testEmailResult.success ? 'Berhasil Terkirim!' : 'Gagal Mengirim:'}</div>
                      <div>{testEmailResult.message}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SacredConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => !isResetting && setIsResetModalOpen(false)}
        title="Reset Konfigurasi ke Pengaturan Default"
        subtitle="Aksi ini akan mereset seluruh harga, token bot, dan kredensial sistem."
        actionType="reset_config"
        targetBusinessName={config.brandName || 'akugawe'}
        warningMessage="Seluruh tier paket, harga promo, token bot Telegram, kredensial GitHub/Pakasir/Resend, dan QRIS statis akan dikembalikan ke pengaturan awal (pabrik). Pastikan Anda memiliki cadangan jika diperlukan."
        requireBusinessName={true}
        requirePin={true}
        confirmButtonText="Reset Semua Konfigurasi"
        confirmButtonVariant="destructive"
        isLoading={isResetting}
        onConfirm={handleConfirmReset}
      />

      <ConfirmationDialog
        open={!!tierToDelete}
        onOpenChange={(open) => !open && setTierToDelete(null)}
        title={`Hapus Paket ${tierToDelete?.name}?`}
        description={`Tier harga "${tierToDelete?.name}" akan dihapus dari konfigurasi paket penjualan Akugawe.`}
        confirmText="Hapus Paket"
        cancelText="Batal"
        variant="destructive"
        onConfirm={handleConfirmRemoveTier}
      />

      <ConfirmationDialog
        open={!!featureToDelete}
        onOpenChange={(open) => !open && setFeatureToDelete(null)}
        title="Hapus Fitur Paket?"
        description={`Fitur "${featureToDelete?.name}" akan dihapus dari daftar fitur tier paket.`}
        confirmText="Hapus Fitur"
        cancelText="Batal"
        variant="destructive"
        onConfirm={handleConfirmRemoveFeature}
      />

      <ResetPinTelegramModal
        isOpen={isResetPinTelegramModalOpen}
        onClose={() => setIsResetPinTelegramModalOpen(false)}
        config={config}
        onResetSuccess={handleResetPinSuccess}
        onNavigateToTelegramTab={() => setActiveTab('telegram')}
      />
    </div>
  );
}
