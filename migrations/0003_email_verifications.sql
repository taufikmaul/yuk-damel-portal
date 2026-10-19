-- Migration 0003: Tabel Verifikasi Kode Aktivasi Email & Perlindungan Anti-Spam Free Tier
-- Kompatibel dengan Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY,                       -- e.g. 'EV-xxxxxxxx'
    email TEXT NOT NULL,                       -- Email tujuan verifikasi (lowercase)
    code TEXT NOT NULL,                        -- 6-digit kode OTP aktivasi
    client_name TEXT NOT NULL,                 -- Nama usaha / toko
    phone TEXT,                                -- WhatsApp aktif
    package_tier_id TEXT DEFAULT 'free_trial', -- Paket yang diminta
    attempts INTEGER DEFAULT 0,                -- Jumlah kesalahan input kode
    expires_at DATETIME NOT NULL,              -- Waktu kedaluwarsa kode (misal +15 menit)
    verified_at DATETIME,                      -- Waktu sukses diverifikasi
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
