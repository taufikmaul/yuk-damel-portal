export interface DurationPrice {
  normalRp: number;
  promoRp: number;
  discountPercent?: number;
  badge?: string;
  label: string;
}

export interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  description: string;
  maxEmployees: number; // Maksimum staf aktif (e.g. 4, 15, 50, atau -1 untuk unlimited)
  isFree?: boolean; // True jika paket gratis / trial
  freeDurationMonths?: number; // Durasi bulan untuk paket gratis (e.g. 4 bulan)
  normalPriceRp: number; // Baseline harga bulanan normal (kompatibilitas)
  promoPriceRp: number; // Baseline harga bulanan promo (kompatibilitas)
  pricing?: {
    [months: string]: DurationPrice; // Pilihan durasi: "1", "3", "6", "12", "24", "60"
  };
  features: string[];
  isPopular?: boolean;
}

export interface SellerConfig {
  // Brand & Sales Settings
  brandName: string;
  whatsappNumber: string;
  defaultSalesMessage: string;
  
  // Pricing Tiers with Promo
  isPromoActive: boolean;
  promoBannerText: string;
  pricingTiers: PricingTier[];

  // Telegram Bot Settings
  telegramBotToken: string;
  telegramBotUsername: string;
  authorizedChatId: string;

  // Cloudflare Pod Fleet & Master Settings
  activePodId?: string;
  cloudflareMasterApiToken?: string;
  defaultCloudflareZoneId?: string;

  // Deployment Automation
  githubRepoUrl: string; // e.g. https://github.com/taufikmaul/ngabsen
  githubWorkflowFile: string; // e.g. deploy.yml
  githubPatToken: string; // Token GitHub untuk trigger otomatis dispatch API

  // Live Demo URLs
  demoDashboardUrl: string;
  demoAppUrl: string;

  // Multi-Layer Security
  adminPin?: string;
  adminPinHash?: string;
  autoLockMinutes?: number;

  // Add-on Monetisasi "Terima Beres"
  managedSetupEnabled: boolean;
  managedSetupPriceRp: number;
  managedSetupTitle: string;
  managedSetupDescription: string;

  // Payment Gateway & Switching (WhatsApp / Pakasir / QRIS Dinamis / Hybrid)
  paymentMode: 'whatsapp' | 'pakasir' | 'qris_manual' | 'hybrid';
  pakasirApiKey: string;
  pakasirProjectSlug: string;
  pakasirApiUrl: string;
  staticQrisString: string;

  // Email Notification & Verification (Resend / MailChannels)
  resendApiKey?: string;
  emailFrom?: string;
}

const STORAGE_KEY = 'ngabsen_seller_global_config';

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: 'free_trial',
    name: 'Free Trial UMKM',
    badge: 'Gratis 4 Bulan',
    isFree: true,
    freeDurationMonths: 4,
    maxEmployees: 4,
    normalPriceRp: 0,
    promoPriceRp: 0,
    description: 'Uji coba penuh sistem absensi & payroll untuk usaha rintisan mikro tanpa biaya (Shared Pod).',
    pricing: {
      '4': { normalRp: 0, promoRp: 0, discountPercent: 100, badge: 'Rp 0 Selama 4 Bulan', label: '4 Bulan' },
    },
    features: [
      'Maksimal 4 Karyawan Aktif',
      'Masa Aktif 4 Bulan Penuh (Rp 0)',
      'PWA Mobile Absensi GPS & Selfie',
      'Dashboard Owner & Rekap Kehadiran',
      'Subdomain Instan (app.akugawe.web.id/slug & hrd.akugawe.web.id/slug)',
      'Multi-Tenant Shared Pod (Biaya Server Rp 0)',
      'Tanpa Kartu Kredit / Biaya Setup',
    ],
  },
  {
    id: 'starter',
    name: 'Starter UMKM',
    badge: 'Paling Hemat',
    isFree: false,
    maxEmployees: 15,
    normalPriceRp: 15000,
    promoPriceRp: 15000,
    description: 'Pilihan favorit untuk toko, kedai, kafe, atau bengkel dengan s/d 15 staf di Shared Multi-Tenant Pod.',
    isPopular: true,
    pricing: {
      '1': { normalRp: 15000, promoRp: 15000, discountPercent: 0, label: '1 Bulan' },
      '3': { normalRp: 45000, promoRp: 42000, discountPercent: 7, label: '3 Bulan' },
      '6': { normalRp: 90000, promoRp: 78000, discountPercent: 13, label: '6 Bulan' },
      '12': { normalRp: 180000, promoRp: 138000, discountPercent: 23, badge: 'Best Value', label: '1 Tahun' },
      '24': { normalRp: 360000, promoRp: 240000, discountPercent: 33, label: '2 Tahun' },
      '60': { normalRp: 900000, promoRp: 480000, discountPercent: 47, badge: 'Super Saver', label: '5 Tahun' },
    },
    features: [
      'Maksimal 15 Karyawan Aktif',
      'Shared Multi-Tenant Cloudflare Pod',
      'Pilihan Durasi 1 Bulan s/d 5 Tahun',
      'Geofencing Radius GPS & Anti-Fake GPS',
      'Otomasi Payroll & Export Slip Gaji PDF',
      'Pencatatan Lembur, Kasbon, & Izin Cuti',
      'Subdomain Instan (app.akugawe.web.id/[slug])',
      'Prioritas Dukungan Teknis WhatsApp',
    ],
  },
  {
    id: 'pro',
    name: 'Business Pro',
    badge: '1 Akun CF Dedicated',
    isFree: false,
    maxEmployees: 50,
    normalPriceRp: 49000,
    promoPriceRp: 39000,
    description: '1 Dedicated Pod di 1 Akun Cloudflare mandiri dengan custom domain sendiri & Fitur Canvasing Sales / Kunjungan Toko lengkap.',
    isPopular: false,
    pricing: {
      '1': { normalRp: 49000, promoRp: 39000, discountPercent: 20, label: '1 Bulan' },
      '3': { normalRp: 147000, promoRp: 109000, discountPercent: 25, label: '3 Bulan' },
      '6': { normalRp: 294000, promoRp: 199000, discountPercent: 32, label: '6 Bulan' },
      '12': { normalRp: 588000, promoRp: 360000, discountPercent: 38, badge: 'Best Value', label: '1 Tahun' },
      '24': { normalRp: 1176000, promoRp: 649000, discountPercent: 44, label: '2 Tahun' },
      '60': { normalRp: 2940000, promoRp: 1299000, discountPercent: 55, badge: 'Super Saver', label: '5 Tahun' },
    },
    features: [
      '1 Dedicated Pod di 1 Akun Cloudflare Khusus',
      'Bisa Custom Domain Sendiri (misal: absen.perusahaan.com)',
      'Database D1 & Worker Terisolasi Penuh Tanpa Berbagi',
      'Maksimal 50 Karyawan Aktif (Bisa Upgrade)',
      'Fitur Canvasing Sales & Kunjungan Toko (Beat Plan, Peta Sebaran, Live GPS, Taking Order, Tagihan)',
      'Dukungan Multi-Cabang & Multi-Lokasi',
      'Pengaturan Shift Kerja Fleksibel',
      'Laporan Analitik Kehadiran & Rekap PPh 21',
      'Prioritas Dukungan Teknis Dedicated',
    ],
  },
];

/**
 * Sanitasi daftar Pricing Tier untuk memastikan:
 * 1. Menghapus total paket Full White-Label & Source Code.
 * 2. Normalisasi paket Pro menjadi Business Pro dengan Dedicated Pod.
 * 3. Memastikan hanya ada 3 paket baku: Free Trial, Starter UMKM, dan Business Pro.
 */
export function sanitizePricingTiers(tiers?: any[]): PricingTier[] {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return DEFAULT_PRICING_TIERS;
  }

  // 1. Filter out White-Label / Source Code tier apapun
  const filtered = tiers.filter((t) => {
    const id = String(t?.id || '').toLowerCase();
    const name = String(t?.name || '').toLowerCase();
    const isWhiteLabel =
      id.includes('white') ||
      id.includes('enterprise') ||
      name.includes('white') ||
      name.includes('source code') ||
      name.includes('hak cipta');
    return !isWhiteLabel;
  });

  // 2. Normalisasi Pro tier & Starter tier
  const normalized = filtered.map((t) => {
    const id = String(t?.id || '').toLowerCase();
    const name = String(t?.name || '').toLowerCase();

    if (id === 'pro' || id === 'business' || id === 'business_pro' || name.includes('pro')) {
      const existingFeatures: string[] = Array.isArray(t.features) ? [...t.features] : [...DEFAULT_PRICING_TIERS[2].features];
      const hasCanvasing = existingFeatures.some((f) => {
        const lower = String(f || '').toLowerCase();
        return lower.includes('canvasing') || lower.includes('kunjungan toko');
      });
      if (!hasCanvasing) {
        const insertIndex = Math.min(4, existingFeatures.length);
        existingFeatures.splice(
          insertIndex,
          0,
          'Fitur Canvasing Sales & Kunjungan Toko (Beat Plan, Peta Sebaran, Live GPS, Taking Order, Tagihan)'
        );
      }

      return {
        ...t,
        id: 'pro',
        name: 'Business Pro',
        badge: '1 Akun CF Dedicated',
        maxEmployees: t.maxEmployees && t.maxEmployees > 15 ? t.maxEmployees : 50,
        features: existingFeatures,
      };
    }
    if (id === 'starter' || name.includes('starter')) {
      return {
        ...t,
        id: 'starter',
        name: 'Starter UMKM',
        badge: 'Paling Hemat',
        maxEmployees: 15,
      };
    }
    if (id === 'free_trial' || id === 'free' || t.isFree) {
      return {
        ...t,
        id: 'free_trial',
        name: 'Free Trial UMKM',
        badge: 'Gratis 4 Bulan',
        isFree: true,
        maxEmployees: 4,
      };
    }
    return t;
  });

  // 3. Pastikan ketiga paket baku ada
  const hasFree = normalized.some((t) => t.isFree || t.id === 'free_trial');
  const hasStarter = normalized.some((t) => t.id === 'starter');
  const hasPro = normalized.some((t) => t.id === 'pro');

  if (!hasFree || !hasStarter || !hasPro) {
    return DEFAULT_PRICING_TIERS;
  }

  return normalized;
}

export const DEFAULT_SELLER_CONFIG: SellerConfig = {
  brandName: 'akugawe',
  whatsappNumber: '6281234567890',
  defaultSalesMessage: 'Halo Tim akugawe, saya tertarik dengan paket langganan Aplikasi Absensi & Payroll. Bisa info lebih lanjut?',
  
  isPromoActive: true,
  promoBannerText: '🔥 PROMO KHUSUS HARI INI: FREE TIER 4 BULAN & STARTER HANYA RP 15.000/BULAN!',
  pricingTiers: DEFAULT_PRICING_TIERS,

  telegramBotToken: '8609932923:AAEj3YmFlhwaQLhZOSe8oBqz1ZkwmVkmg3U',
  telegramBotUsername: 'AkugawePortalBot',
  authorizedChatId: '',

  activePodId: 'pod-01',
  cloudflareMasterApiToken: '',
  defaultCloudflareZoneId: '',

  githubRepoUrl: 'https://github.com/taufikmaul/ngabsen',
  githubWorkflowFile: 'deploy.yml',
  githubPatToken: '',

  demoDashboardUrl: 'https://hrd.akugawe.web.id/demo',
  demoAppUrl: 'https://app.akugawe.web.id/demo',

  // Multi-Layer Security (Default PIN: 2468)
  adminPin: '2468',
  adminPinHash: 'a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972',
  autoLockMinutes: 15,

  // Add-on Monetisasi "Terima Beres"
  managedSetupEnabled: false,
  managedSetupPriceRp: 150000,
  managedSetupTitle: 'VIP Setup & Import Data Karyawan (+ Rp 150.000)',
  managedSetupDescription:
    'Tim kami yang bantu input data seluruh karyawan, setup shift kerja, dan set geofencing lokasi kantor sampai tuntas.',

  // Payment Gateway & Switching (Default: hybrid untuk fleksibilitas maksimal)
  paymentMode: 'hybrid',
  pakasirApiKey: '',
  pakasirProjectSlug: '',
  pakasirApiUrl: 'https://api.pakasir.com',
  staticQrisString: '',

  // Email Notification & Verification
  resendApiKey: '',
  emailFrom: 'akugawe <onboarding@resend.dev>',
};

export function loadSellerConfig(): SellerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleanBrandName = parsed.brandName && parsed.brandName.includes('Beli Putus')
        ? 'akugawe'
        : (parsed.brandName || DEFAULT_SELLER_CONFIG.brandName);

      // Jika emailFrom masih domain placeholder dummy yang belum diverifikasi, arahkan ke onboarding@resend.dev
      const cleanEmailFrom = parsed.emailFrom && parsed.emailFrom.includes('noreply@akugawe.id')
        ? 'akugawe <onboarding@resend.dev>'
        : (parsed.emailFrom || DEFAULT_SELLER_CONFIG.emailFrom);

      // Sanitasi tiers dari localStorage browser pembeli/admin
      const cleanPricingTiers = sanitizePricingTiers(parsed.pricingTiers);

      const loadedConfig: SellerConfig = {
        ...DEFAULT_SELLER_CONFIG,
        ...parsed,
        brandName: cleanBrandName,
        emailFrom: cleanEmailFrom,
        pricingTiers: cleanPricingTiers,
      };

      // Jika ada perubahan setelah sanitasi (misal whitelabel terhapus), simpan balik ke localStorage
      if (
        parsed.pricingTiers &&
        JSON.stringify(parsed.pricingTiers) !== JSON.stringify(cleanPricingTiers)
      ) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
        } catch (_) {}
      }

      return loadedConfig;
    }
  } catch (err) {
    console.error('Error loading seller config:', err);
  }
  return DEFAULT_SELLER_CONFIG;
}

export function saveSellerConfig(config: SellerConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seller-config-updated', { detail: config }));
    }
    return true;
  } catch (err) {
    console.error('Error saving seller config:', err);
    return false;
  }
}

/**
 * Mengambil konfigurasi TERBARU langsung dari Database Cloudflare D1 (/api/config)
 * Jika adminPin disertakan, server akan mengembalikan konfigurasi lengkap beserta kredensial sensitif
 */
export async function fetchSellerConfig(adminPin?: string): Promise<SellerConfig> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminPin && adminPin.trim()) {
      headers['x-admin-pin'] = adminPin.trim();
    }

    const res = await fetch('/api/config', { method: 'GET', headers });
    const data = await res.json();

    if (data.ok && data.config) {
      const current = loadSellerConfig();
      const dbConfig = data.config;

      const merged: SellerConfig = {
        ...current,
        ...dbConfig,
        brandName: dbConfig.brandName || current.brandName || DEFAULT_SELLER_CONFIG.brandName,
        pricingTiers: sanitizePricingTiers(
          Array.isArray(dbConfig.pricingTiers) && dbConfig.pricingTiers.length > 0
            ? dbConfig.pricingTiers
            : current.pricingTiers
        ),
      };

      // Sinkronkan ke cache lokal dan beri tahu komponen
      saveSellerConfig(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Notice: Failed fetching seller config from DB, using cached fallback:', err);
  }
  return loadSellerConfig();
}

/**
 * Menyimpan seluruh konfigurasi operasional dan kredensial langsung ke Cloudflare Database D1
 */
export async function saveSellerConfigToDb(
  config: SellerConfig,
  masterPin: string,
  newAdminPin?: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterPin: masterPin.trim(),
        publicConfig: {
          brandName: config.brandName,
          whatsappNumber: config.whatsappNumber,
          defaultSalesMessage: config.defaultSalesMessage,
          isPromoActive: config.isPromoActive,
          promoBannerText: config.promoBannerText,
          pricingTiers: config.pricingTiers,
          demoDashboardUrl: config.demoDashboardUrl,
          demoAppUrl: config.demoAppUrl,
          managedSetupEnabled: config.managedSetupEnabled,
          managedSetupPriceRp: config.managedSetupPriceRp,
          managedSetupTitle: config.managedSetupTitle,
          managedSetupDescription: config.managedSetupDescription,
          paymentMode: config.paymentMode,
          pakasirProjectSlug: config.pakasirProjectSlug,
          pakasirApiUrl: config.pakasirApiUrl,
          staticQrisString: config.staticQrisString,
          autoLockMinutes: config.autoLockMinutes,
          githubRepoUrl: config.githubRepoUrl,
          githubWorkflowFile: config.githubWorkflowFile,
          activePodId: config.activePodId,
          defaultCloudflareZoneId: config.defaultCloudflareZoneId,
          emailFrom: config.emailFrom,
        },
        sensitiveSecrets: {
          telegramBotToken: config.telegramBotToken || '',
          telegramBotUsername: config.telegramBotUsername || '',
          authorizedChatId: config.authorizedChatId || '',
          githubPatToken: config.githubPatToken || '',
          pakasirApiKey: config.pakasirApiKey || '',
          resendApiKey: config.resendApiKey || '',
          emailFrom: config.emailFrom || '',
          staticQrisString: config.staticQrisString || '',
          newAdminPin: newAdminPin && newAdminPin.trim().length >= 4 ? newAdminPin.trim() : undefined,
        },
      }),
    });

    const data = await res.json();
    if (data.ok) {
      saveSellerConfig(config);
      return { ok: true, message: data.message };
    }
    return { ok: false, error: data.error || 'Gagal menyimpan ke Database D1.' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal menghubungi server database.' };
  }
}
