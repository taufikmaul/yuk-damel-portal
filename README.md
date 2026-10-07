# YUK-DAMEL PORTAL — ETALASE PENJUALAN, LISENSI & 1-CLICK ONBOARDING

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/taufikmaul/yuk-damel-portal)

Portal mandiri (*standalone portal*) untuk sistem absensi & payroll **Yuk-Damel**. Bertindak sebagai etalase penjualan publik, checkout pembayaran otomatis, manajemen lisensi penjual, serta portal onboarding mandiri bagi pembeli untuk melakukan deployment ke akun Cloudflare mereka sendiri hanya dalam 1 klik.

---

## 🌟 Arsitektur & Fitur Utama

### 1. Public Sales Landing Page (`/`)
- **Showcase Fitur Lengkap**: Presentasi fitur Yuk-Damel (Biometrik GPS PWA, Smart Attendance, Multi-cabang & Shift, Otomasi Payroll THR/PPH21, Bot Telegram).
- **Interactive ROI Calculator**: Simulasi penghematan biaya riil sistem beli putus vs SaaS langganan bulanan.
- **Tabel Perbandingan Paket**: Paket Starter UMKM, Business Pro (Best Value), dan Enterprise White-Label.
- **Checkout Modal Terintegrasi**:
  - Pilihan pembayaran: **Pakasir Payment Gateway** (QRIS Dinamis real-time), **QRIS Manual**, atau direct **WhatsApp**.
  - Add-on opsional "Setup Terima Beres".
  - Notifikasi instan via Telegram saat transaksi baru masuk.

### 2. Vendor Operations & Admin License Management (`/?admin=true`)
- **Keamanan Berlapis**:
  - Master Security PIN (Default awal: `8899`, dapat diubah via config).
  - 2FA via **Telegram Bot OTP** langsung ke chat ID pemilik.
  - Rate-limiting percobaan login & perlindungan brute force.
- **Manajemen Pesanan & Lisensi**:
  - Menampilkan daftar pembeli, nominal transfer, tanggal pembelian, dan status aktivasi.
  - Generate Token Lisensi unik secara manual atau otomatis.
  - 1-Klik Salin Tautan Onboarding Rahasia untuk dikirimkan ke pembeli via WhatsApp.
- **Pengaturan Global Seller (`SellerConfigPage`)**:
  - Konfigurasi WhatsApp penjual, custom pesan closing, dan link demo aplikasi.
  - Atur harga normal & harga promo untuk setiap paket.
  - Konfigurasi kredensial Payment Gateway Pakasir (API Key, Project Slug).
  - Konfigurasi GitHub Dispatch (Personal Access Token, Repo Target) untuk automasi deployment pembeli.
  - Sinkronisasi otomatis ke Cloudflare D1 & KV.

### 3. Secret Client Onboarding & 1-Click Cloudflare Deployer (`/?onboarding=true&token=...`)
- **Aktivasi Khusus Pembeli**: Halaman aktivasi berbasis token unik tanpa perlu registrasi rumit.
- **Wizard Ramah Pemula**: Panduan langkah demi langkah mendapatkan Cloudflare Account ID & API Token gratis.
- **Input Usaha**: Nama Brand/Usaha, Slug Domain, serta Custom Domain (opsional).
- **1-Click Deploy ke Cloudflare**:
  - Memicu GitHub Actions Workflow di repository core Yuk-Damel melalui serverless Edge API (`/api/deploy`).
  - Progress terminal live status deployment.
  - Serah terima instan tautan Dashboard Owner, PWA Mobile Absensi, dan akun kredensial default admin perusahaan.

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat:
- Node.js versi 20+
- Package Manager `pnpm`

```bash
# Clone repository
git clone git@github.com:taufikmaul/yuk-damel-portal.git
cd yuk-damel-portal

# Install dependensi
pnpm install

# Jalankan dev server lokal (Port 3000)
pnpm dev
```

Buka di browser:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Portal Penjual / Admin**: [http://localhost:3000/?admin=true](http://localhost:3000/?admin=true)
- **Portal Onboarding Pembeli**: [http://localhost:3000/?onboarding=true](http://localhost:3000/?onboarding=true)

---

## ⚡ 1-Click Deploy ke Cloudflare Pages

### Metode 1: Hubungkan ke Cloudflare Pages via Dashboard (Direkomendasikan)
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Pilih repository `taufikmaul/yuk-damel-portal`.
3. Gunakan konfigurasi build berikut:
   - **Framework Preset**: `Vite` (atau `None`)
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
4. Klik **Save and Deploy**. Cloudflare Pages Functions (`/api/*`) akan aktif secara otomatis tanpa konfigurasi server tambahan.

### Metode 2: Deploy Otomatis via GitHub Actions CI/CD
Repository ini sudah dilengkapi workflow CI/CD di `.github/workflows/deploy-portal.yml`. Setiap push ke branch `main`, build dan deployment akan otomatis dijalankan.

Cukup tambahkan 2 Secrets di **GitHub Settings > Secrets and variables > Actions**:
1. `CLOUDFLARE_API_TOKEN`: API Token Cloudflare dengan izin *Cloudflare Pages: Edit*.
2. `CLOUDFLARE_ACCOUNT_ID`: 32-karakter Cloudflare Account ID Anda.

---

## 🗄️ Konfigurasi Cloudflare D1 Database & KV Storage

Agar data lisensi tersimpan secara permanen di database edge:

1. **Buat Database D1**:
   ```bash
   npx wrangler d1 create yuk-damel-portal-db
   ```
2. **Jalankan Skema Database**:
   ```bash
   npx wrangler d1 execute yuk-damel-portal-db --remote --file=./migrations/0001_initial_schema.sql
   ```
3. **Bind ke Cloudflare Pages**:
   - Di dashboard Cloudflare Pages: Masuk ke **Settings > Functions > D1 Database Bindings**.
   - Tambahkan variable binding:
     - Variable name: `DB`
     - D1 database: `yuk-damel-portal-db`
4. **(Opsional) KV Binding**:
   - Variable name: `CONFIG_KV`

---

## 📚 Dokumentasi Lanjutan

- Detail arsitektur, daftar endpoint API, dan skema database lengkap dapat dilihat di [ARCHITECTURE.md](file:///Users/taufik/Documents/Historycake/ngabsen-portal/ARCHITECTURE.md).

---

## 📄 Lisensi
Hak cipta dilindungi. Project ini diperuntukkan untuk operasional portal penjualan & onboarding Yuk-Damel.
