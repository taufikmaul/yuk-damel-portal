# NGABSEN - PORTAL PENJUALAN & CLIENT ONBOARDING
> Project mandiri khusus etalase penjualan, manajemen lisensi pembeli, dan portal aktivasi 1-Click Deploy ke Cloudflare pembeli.

---

## 🌟 Arsitektur & Fitur Utama

1. **Public Sales Landing Page (`/`)**:
   - Showcase fitur lengkap yuk-damel (Biometrik GPS PWA, Smart Attendance, Multi-cabang, Otomasi Payroll THR/PPH21).
   - Interactive ROI & Cost-Savings Calculator (Menghitung penghematan biaya dibanding SaaS).
   - Live demo redirection ke aplikasi live.
   - WhatsApp lead generator.

2. **Vendor Operations & License Management (`/?admin=true`)**:
   - Dilindungi **PIN Master Keamanan Penjual** (Default: `8899`).
   - Fitur generate kode token aktivasi unik untuk pembeli baru yang telah transfer pembayaran.
   - Manajemen status pembeli (Pending / Live Deployed).
   - Fitur 1-klik salin tautan onboarding rahasia untuk langsung dikirimkan ke pembeli via WhatsApp.

3. **Secret Client Onboarding & 1-Click Deployer (`/?onboarding=true&token=...`)**:
   - Halaman khusus pembeli tanpa perlu memahami teknis backend/koding.
   - Panduan visual langkah demi langkah cara mendaftar akun Cloudflare gratis & mendapatkan API Token.
   - Form input ramah pemula: Nama Toko/Usaha, Slug Domain, Cloudflare Account ID & API Token.
   - Tombol **1-Click Deploy ke Cloudflare**: Menjalankan alokasi database SQLite D1, KV cache, Workers API, dan 2 frontend Pages secara otomatis.
   - Console terminal live progress deployment.
   - Serah terima instan dengan kartu link Dashboard Owner, PWA Karyawan, dan kredensial default admin perusahaan.

---

## 🚀 Menjalankan Secara Lokal

```bash
cd /Users/taufik/Documents/Historycake/ngabsen-portal

# Jalankan dev server (Port 3000)
pnpm dev
```

Buka di browser:
- **Landing Page Publik**: `http://localhost:3000`
- **Portal Penjual (Admin Token)**: `http://localhost:3000/?admin=true`
- **Portal Rahasia Pembeli**: `http://localhost:3000/?onboarding=true`

---

## 📦 1-Click Deploy ke Cloudflare Pages

### Opsi 1: Cloudflare Deploy Button (Instan via Browser)

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/taufikmaul/yuk-damel-portal)

Atau langsung sambungkan repository GitHub `taufikmaul/yuk-damel-portal` di **Cloudflare Dashboard > Workers & Pages > Create application > Pages > Connect to Git**:
- **Project Name**: `yuk-damel-portal`
- **Framework Preset**: `Vite` (atau `None`)
- **Build Command**: `pnpm build`
- **Build Output Directory**: `dist`

### Opsi 2: Deploy Otomatis via GitHub Actions (CI/CD)

Repository ini telah dilengkapi workflow CI/CD otomatis di `.github/workflows/deploy-portal.yml`. Setiap ada `git push` ke branch `main`, Cloudflare Pages akan otomatis ter-build dan ter-deploy.

Cukup tambahkan 2 Secrets di **GitHub Repository Settings > Secrets and variables > Actions**:
1. `CLOUDFLARE_API_TOKEN`: API Token Cloudflare dengan izin *Cloudflare Pages: Edit*.
2. `CLOUDFLARE_ACCOUNT_ID`: Account ID Cloudflare (32 digit hex di URL dashboard).

---

## 🛠️ Konfigurasi Cloudflare D1 & KV (Opsional / Recommended)

Untuk fitur penyimpanan lisensi dan konfigurasi serverless:
1. Buat database D1 di Cloudflare Dashboard: `yuk-damel-portal-db`
2. Jalankan schema SQL dari `migrations/0001_initial_schema.sql`
3. Bind database di settings Cloudflare Pages dengan nama binding: `DB`
4. Buat KV Namespace `CONFIG_KV` dan bind dengan nama: `CONFIG_KV`

