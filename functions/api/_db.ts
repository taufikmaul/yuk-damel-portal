/**
 * Database Helper & Context Types for Cloudflare D1 & KV
 * Memfasilitasi akses aman ke database D1 SQLite & KV Storage
 */

export interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: any;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result>;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB?: D1Database;
  CONFIG_KV?: KVNamespace;
  TELEGRAM_BOT_TOKEN?: string;
  AUTHORIZED_CHAT_ID?: string;
  GITHUB_DISPATCH_PAT?: string;
  ADMIN_PIN_HASH?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

export const DEFAULT_AUTHORIZED_CHAT_ID = '115334079';
export const DEFAULT_TELEGRAM_BOT_USERNAME = 'AkugawePortalBot';

/**
 * Mengambil konfigurasi dari Database D1 / KV dengan fallback ke Environment Variable & Default
 */
export async function getSystemConfig(env: Env, key: string): Promise<string | null> {
  // 1. Coba dari Cloudflare D1
  if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT value FROM system_configs WHERE key = ? LIMIT 1')
        .bind(key)
        .first<{ value: string }>();
      if (row && row.value) {
        return row.value;
      }
    } catch (_) {}
  }

  // 2. Coba dari Cloudflare KV
  if (env.CONFIG_KV) {
    try {
      const val = await env.CONFIG_KV.get(key);
      if (val) return val;
    } catch (_) {}
  }

  // 3. Fallback ke Environment Variables
  const envKey = key.toUpperCase();
  const envVal = (env as any)[envKey];
  if (envVal) return envVal;

  // 4. Default Fallbacks untuk Telegram
  if (key === 'AUTHORIZED_CHAT_ID') return DEFAULT_AUTHORIZED_CHAT_ID;
  if (key === 'TELEGRAM_BOT_USERNAME') return DEFAULT_TELEGRAM_BOT_USERNAME;

  return null;
}

/**
 * Menyimpan konfigurasi ke Database D1 / KV
 */
export async function setSystemConfig(env: Env, key: string, value: string, isSecret: boolean = false): Promise<boolean> {
  let saved = false;

  if (env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS system_configs (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          is_secret INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run().catch(() => {});

      await env.DB.prepare(`
        INSERT INTO system_configs (key, value, is_secret, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, is_secret = excluded.is_secret, updated_at = CURRENT_TIMESTAMP
      `).bind(key, value, isSecret ? 1 : 0).run();
      saved = true;
    } catch (err) {
      console.error('Error saving to D1:', err);
    }
  }

  if (env.CONFIG_KV) {
    try {
      await env.CONFIG_KV.put(key, value);
      saved = true;
    } catch (err) {
      console.error('Error saving to KV:', err);
    }
  }

  return saved;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

/**
 * Mengirim notifikasi pesan Markdown ke Telegram Admin
 */
export async function sendTelegramAlert(env: Env, text: string): Promise<boolean> {
  try {
    const botToken = await getSystemConfig(env, 'TELEGRAM_BOT_TOKEN');
    const chatId = await getSystemConfig(env, 'AUTHORIZED_CHAT_ID');

    if (!botToken || !chatId) return false;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to send Telegram alert:', err);
    return false;
  }
}

export interface CloudflarePod {
  id: string;
  name: string;
  cf_account_id: string;
  cf_account_email: string;
  app_base_url: string;
  dashboard_base_url?: string;
  api_base_url: string;
  max_companies: number;
  current_companies_count: number;
  is_active: number;
  pod_type?: 'shared' | 'dedicated';
  notes?: string;
}

/**
 * ATURAN BAKU ALOKASI POD & CLOUDFLARE ACCOUNT:
 * 1. Demo, Free Tier, dan Starter:
 *    - Masuk ke 1 Pod Shared multi-tenant bersama (max_companies > 1).
 *    - 1 Cloudflare Account memuat banyak tenant dengan isolasi database slug/id.
 * 2. Pro Tier & Enterprise:
 *    - Masuk ke 1 Dedicated Pod (1 Akun Cloudflare = 1 Pod Khusus, max_companies = 1).
 *    - Isolasi infrastruktur penuh (Dedicated Workers, D1 DB, KV, dan R2).
 */
export async function getActivePod(env: Env, tierId?: string): Promise<CloudflarePod | null> {
  const isDedicated = tierId === 'pro' || tierId === 'enterprise';

  const defaultSharedPod: CloudflarePod = {
    id: 'pod-01',
    name: 'Shared Cluster Alpha (Demo, Free & Starter)',
    cf_account_id: '76faefe50a711cb9fd5dccb2c2fb60cf',
    cf_account_email: 'cf+shared@akugawe.web.id',
    app_base_url: 'https://app.akugawe.web.id',
    dashboard_base_url: 'https://hrd.akugawe.web.id',
    api_base_url: 'https://akugawe-api.ngabsen-id.workers.dev',
    max_companies: 50,
    current_companies_count: 0,
    is_active: 1,
    pod_type: 'shared',
    notes: 'Pod Multi-Tenant bersama untuk Demo, Free Tier, dan Starter',
  };

  if (!env.DB) {
    if (isDedicated) {
      return {
        id: `pod-pro-dedicated-${Date.now().toString(36)}`,
        name: 'Dedicated Cloudflare Pod (Pro Tier)',
        cf_account_id: 'dedicated_cf_account_placeholder',
        cf_account_email: 'cf+pro@akugawe.web.id',
        app_base_url: 'https://app.akugawe.web.id',
        dashboard_base_url: 'https://hrd.akugawe.web.id',
        api_base_url: 'https://akugawe-api.ngabsen-id.workers.dev',
        max_companies: 1,
        current_companies_count: 0,
        is_active: 1,
        pod_type: 'dedicated',
        notes: '1 Dedicated Cloudflare Account 1 Pod khusus Klien Pro',
      };
    }
    return defaultSharedPod;
  }

  try {
    if (isDedicated) {
      // 1. Cari Dedicated Pod yang masih kosong (max_companies = 1 & belum ada tenant)
      const dedicatedPod = await env.DB.prepare(`
        SELECT * FROM cloudflare_pods 
        WHERE is_active = 1 AND max_companies = 1 AND current_companies_count = 0
        ORDER BY created_at ASC 
        LIMIT 1
      `).first<CloudflarePod>();

      if (dedicatedPod) {
        return { ...dedicatedPod, pod_type: 'dedicated' };
      }

      // 2. Jika belum ada di tabel, siapkan pod dedicated baru
      return {
        id: `pod-pro-${Date.now().toString(36)}`,
        name: 'Dedicated Pod (Pro 1-Akun-CF)',
        cf_account_id: 'pending_dedicated_cf_account',
        cf_account_email: 'cf+dedicated@akugawe.web.id',
        app_base_url: 'https://app.akugawe.web.id',
        dashboard_base_url: 'https://hrd.akugawe.web.id',
        api_base_url: 'https://akugawe-api.ngabsen-id.workers.dev',
        max_companies: 1,
        current_companies_count: 0,
        is_active: 1,
        pod_type: 'dedicated',
        notes: 'Dedicated Cloudflare Account (1 Tenant Pro per Pod)',
      };
    }

    // Untuk Demo, Free Tier, dan Starter: Alokasikan ke Shared Multi-Tenant Pod
    const sharedPod = await env.DB.prepare(`
      SELECT * FROM cloudflare_pods 
      WHERE is_active = 1 AND max_companies > 1 AND current_companies_count < max_companies 
      ORDER BY current_companies_count ASC 
      LIMIT 1
    `).first<CloudflarePod>();

    if (sharedPod) {
      return { ...sharedPod, pod_type: 'shared' };
    }

    // Fallback pod aktif jika semua shared pod penuh
    const anyPod = await env.DB.prepare(`
      SELECT * FROM cloudflare_pods 
      WHERE is_active = 1 
      ORDER BY current_companies_count ASC 
      LIMIT 1
    `).first<CloudflarePod>();

    return anyPod ? { ...anyPod, pod_type: 'shared' } : defaultSharedPod;
  } catch (err) {
    console.error('Error fetching active pod:', err);
    return defaultSharedPod;
  }
}

