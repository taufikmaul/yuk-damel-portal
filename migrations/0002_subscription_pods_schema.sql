-- Migration 0002: Schema Subscription Engine, Cloudflare Pods & Leads Sync
-- Kompatibel dengan Cloudflare D1 (SQLite)

-- 1. Tabel Cloudflare Pods (Cluster Multi-Tenant Hosting 20-25 Tenant per Akun)
CREATE TABLE IF NOT EXISTS cloudflare_pods (
    id TEXT PRIMARY KEY,                       -- e.g. 'pod-01'
    name TEXT NOT NULL,                        -- e.g. 'Cluster Alpha'
    cf_account_id TEXT NOT NULL,               -- 32 hex characters Cloudflare Account ID
    cf_account_email TEXT NOT NULL,            -- Email akun CF (e.g. cf+pod1@akugawe.id)
    app_base_url TEXT NOT NULL,                -- e.g. 'https://app.akugawe.id'
    api_base_url TEXT NOT NULL,                -- e.g. 'https://api-pod1.akugawe.id'
    max_companies INTEGER DEFAULT 25,          -- Batas aman tenant per akun
    current_companies_count INTEGER DEFAULT 0, -- Jumlah perusahaan yang terisi
    is_active INTEGER DEFAULT 1,               -- 1 = Menerima tenant baru, 0 = Penuh/Maintenance
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default Pod 01 (Cluster Alpha Awal)
INSERT OR IGNORE INTO cloudflare_pods (id, name, cf_account_id, cf_account_email, app_base_url, api_base_url, max_companies, current_companies_count, is_active, notes)
VALUES (
    'pod-01',
    'Cluster Alpha (Primary)',
    'default_cf_account_id_placeholder',
    'cf+pod1@akugawe.id',
    'https://app.akugawe.id',
    'https://api.akugawe.id',
    25,
    0,
    1,
    'Pod utama untuk UMKM Free Tier dan Starter'
);

-- 2. Perluasan Kolom Tabel Orders untuk Manajemen Subscription Bulanan & Karyawan
ALTER TABLE orders ADD COLUMN billing_cycle_months INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN subscription_status TEXT DEFAULT 'active'; -- 'active', 'grace_period', 'suspended', 'cancelled'
ALTER TABLE orders ADD COLUMN current_period_start DATETIME;
ALTER TABLE orders ADD COLUMN current_period_end DATETIME;
ALTER TABLE orders ADD COLUMN max_employees INTEGER DEFAULT 15;
ALTER TABLE orders ADD COLUMN pod_id TEXT REFERENCES cloudflare_pods(id);
ALTER TABLE orders ADD COLUMN is_shared_pod INTEGER DEFAULT 1; -- 1: Grouping Pod, 0: Dedicated
ALTER TABLE orders ADD COLUMN last_payment_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN last_payment_date DATETIME;
ALTER TABLE orders ADD COLUMN buyer_email TEXT;

-- 3. Tabel Riwayat Invoice & Perpanjangan Langganan
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,                       -- e.g. 'INV-202610-001'
    order_id TEXT NOT NULL REFERENCES orders(id),
    client_slug TEXT NOT NULL,
    package_tier_id TEXT NOT NULL,
    cycle_months INTEGER NOT NULL,
    amount_rp INTEGER NOT NULL,
    payment_status TEXT DEFAULT 'pending',     -- 'pending', 'paid', 'expired'
    payment_method TEXT DEFAULT 'pakasir_qris',
    payment_ref TEXT,
    due_date DATETIME NOT NULL,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Prospek & Leads Hasil Sinkronisasi Mode Demo
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,                       -- UUID string
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    company_name TEXT,
    employee_count TEXT,
    role_explored TEXT DEFAULT 'owner',
    source TEXT DEFAULT 'app_demo',
    status TEXT DEFAULT 'new',                 -- 'new', 'contacted', 'converted', 'closed'
    notes TEXT,
    last_contacted_at DATETIME,
    converted_order_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexing Cepat
CREATE INDEX IF NOT EXISTS idx_orders_subscription_status ON orders(subscription_status);
CREATE INDEX IF NOT EXISTS idx_orders_current_period_end ON orders(current_period_end);
CREATE INDEX IF NOT EXISTS idx_orders_pod_id ON orders(pod_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_cloudflare_pods_active ON cloudflare_pods(is_active);
