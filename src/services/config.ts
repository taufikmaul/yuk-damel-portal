export interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  normalPriceRp: number;
  promoPriceRp: number;
  description: string;
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

  // Cloudflare & Automated Deployment Automation
  githubRepoUrl: string; // e.g. https://github.com/taufikmaul/ngabsen
  githubWorkflowFile: string; // e.g. deploy.yml
  githubPatToken: string; // Token GitHub untuk trigger otomatis dispatch API
  defaultCloudflareZoneId?: string;

  // Live Demo URLs
  demoDashboardUrl: string;
  demoAppUrl: string;

  // Multi-Layer Security
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
}

const STORAGE_KEY = 'ngabsen_seller_global_config';

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter UMKM',
    badge: 'Paling Hemat',
    normalPriceRp: 2500000,
    promoPriceRp: 1499000,
    description: 'Cocok untuk 1 toko, kafe, atau rintisan usaha mandiri (1–20 karyawan).',
    features: [
      'Lisensi Penuh Beli Putus 1 Cabang',
      'PWA Mobile Absensi GPS Karyawan',
      'Dashboard Owner & Penggajian',
      'Database D1 Terisolasi di Cloudflare Anda',
      'Free Hosting Selamanya (Cloudflare Free Tier)',
      'Panduan Setup Mandiri 1-Click',
    ],
  },
  {
    id: 'business',
    name: 'Business Pro',
    badge: 'Terlaris (Best Value)',
    normalPriceRp: 4999000,
    promoPriceRp: 2999000,
    description: 'Pilihan favorit untuk usaha berkembang dengan multi-cabang & payroll otomatis.',
    isPopular: true,
    features: [
      'Semua fitur paket Starter UMKM',
      'Mendukung Multi-Cabang & Shift Fleksibel',
      'Custom Domain Sendiri (dash & absen)',
      'Otomasi Payroll THR, Kasbon, & Slip Gaji PDF',
      'Bot Telegram Reminder Absen & Lupa Clock-Out',
      'Bantuan Panduan Deployment Remote via WhatsApp',
    ],
  },
  {
    id: 'enterprise',
    name: 'Full Source Code & White-Label',
    badge: 'Hak Cipta Penuh',
    normalPriceRp: 9500000,
    promoPriceRp: 5999000,
    description: 'Akses penuh seluruh source code GitHub untuk rebranding atau software house.',
    features: [
      'Semua fitur paket Business Pro',
      'Full Source Code Monorepo (Hono, React 19, Cloudflare)',
      'Bebas Rebranding Logo, Warna, & Nama Aplikasi',
      'Tanpa Batas Karyawan & Tanpa Batas Cabang',
      'Bebas Dijual Kembali ke Klien Lain',
      'Konsultasi Arsitektur Serverless & CI/CD',
    ],
  },
];

export const DEFAULT_SELLER_CONFIG: SellerConfig = {
  brandName: 'Ngabsen (Beli Putus)',
  whatsappNumber: '6281234567890',
  defaultSalesMessage: 'Halo Tim Ngabsen, saya tertarik dengan paket Beli Putus Aplikasi Absensi & Payroll. Bisa info lebih lanjut?',
  
  isPromoActive: true,
  promoBannerText: '🔥 PROMO KHUSUS BULAN INI: DISKON HINGGA 45% UNTUK PAKET BELI PUTUS!',
  pricingTiers: DEFAULT_PRICING_TIERS,

  telegramBotToken: '',
  telegramBotUsername: 'YukDamelPortalBot',
  authorizedChatId: '115334079',

  githubRepoUrl: 'https://github.com/taufikmaul/ngabsen',
  githubWorkflowFile: 'deploy.yml',
  githubPatToken: '',
  defaultCloudflareZoneId: '',

  demoDashboardUrl: 'https://dash-ngabsen.historycake.com',
  demoAppUrl: 'https://ngabsen.historycake.com',

  // Multi-Layer Security (Default PIN: 2468)
  adminPinHash: 'a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972',
  autoLockMinutes: 15,

  // Add-on Monetisasi "Terima Beres"
  managedSetupEnabled: true,
  managedSetupPriceRp: 350000,
  managedSetupTitle: 'VIP Setup Terima Beres (+ Rp 350.000)',
  managedSetupDescription:
    'Owner terima akun jadi! Tim kami yang siapkan akun Cloudflare, custom domain, hingga sistem absensi siap pakai dalam 15 menit.',

  // Payment Gateway & Switching (Default: hybrid untuk fleksibilitas maksimal)
  paymentMode: 'hybrid',
  pakasirApiKey: '',
  pakasirProjectSlug: '',
  pakasirApiUrl: 'https://api.pakasir.com',
  staticQrisString: '',
};

export function loadSellerConfig(): SellerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SELLER_CONFIG,
        ...parsed,
        pricingTiers: parsed.pricingTiers && parsed.pricingTiers.length > 0 ? parsed.pricingTiers : DEFAULT_PRICING_TIERS,
      };
    }
  } catch (err) {
    console.error('Error loading seller config:', err);
  }
  return DEFAULT_SELLER_CONFIG;
}

export function saveSellerConfig(config: SellerConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Error saving seller config:', err);
    return false;
  }
}
