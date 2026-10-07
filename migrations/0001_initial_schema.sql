-- Migration 0001: Schema Database untuk Ngabsen Portal
-- Kompatibel dengan Cloudflare D1 (SQLite)

-- 1. Tabel Konfigurasi Global & Kredensial Sensitif (Key-Value)
CREATE TABLE IF NOT EXISTS system_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    is_secret INTEGER DEFAULT 0, -- 1: Kredensial rahasia (tidak boleh direturn ke publik), 0: Konfigurasi publik
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pesanan & Lisensi Pembeli (Orders & Licenses)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_slug TEXT NOT NULL,
    package_tier_id TEXT DEFAULT 'business',
    amount_paid_rp INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'paid', -- 'paid', 'pending', 'cancelled'
    license_token TEXT UNIQUE NOT NULL,
    activation_status TEXT DEFAULT 'pending', -- 'pending' (siap deploy), 'active' (sudah live)
    buyer_phone TEXT,
    cf_account_id TEXT,
    deployed_urls TEXT, -- JSON string berisi url dashboard, pwa app, api worker
    custom_domain_dashboard TEXT,
    custom_domain_app TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deployed_at DATETIME
);

-- Index pencarian cepat
CREATE INDEX IF NOT EXISTS idx_orders_license_token ON orders(license_token);
CREATE INDEX IF NOT EXISTS idx_orders_client_slug ON orders(client_slug);
CREATE INDEX IF NOT EXISTS idx_orders_activation_status ON orders(activation_status);
