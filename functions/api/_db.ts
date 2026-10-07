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
}

/**
 * Mengambil konfigurasi dari Database D1 / KV dengan fallback ke Environment Variable
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
  return (env as any)[envKey] || null;
}

/**
 * Menyimpan konfigurasi ke Database D1 / KV
 */
export async function setSystemConfig(env: Env, key: string, value: string, isSecret: boolean = false): Promise<boolean> {
  let saved = false;

  if (env.DB) {
    try {
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
