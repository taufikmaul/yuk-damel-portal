# ARCHITECTURE & SPECIFICATIONS: YUK-DAMEL PORTAL

Portal penjualan, lisensi pembeli, payment gateway terintegrasi, dan automated edge deployment engine untuk platform absensi & payroll **Yuk-Damel**.

---

## 🏗️ Diagram Arsitektur Sistem

```
+-----------------------------------------------------------------------------------+
|                                 USER & BROWSER                                    |
+-----------------------------------------------------------------------------------+
       |                                      |                               |
       v (/)                                  v (/?onboarding=true)           v (/?admin=true)
+-----------------------+              +------------------------+      +-----------------------+
|  Sales Landing Page   |              | Client Onboarding Page |      |  Admin Vendor Portal  |
|  - Fitur Showcase     |              | - Token Verification   |      |  - 2FA PIN & Telegram |
|  - ROI Calculator     |              | - Form Cloudflare Acc  |      |  - License Manager    |
|  - Checkout Modal     |              | - 1-Click Deployer     |      |  - Seller Config      |
+-----------------------+              +------------------------+      +-----------------------+
           |                                       |                               |
           +--------------------+------------------+-------------------------------+
                                |
                                v (HTTP API Requests)
+-----------------------------------------------------------------------------------+
|                        CLOUDFLARE PAGES FUNCTIONS (/api/*)                        |
|                                                                                   |
|  /api/checkout           -> Membuat order, kalkulasi harga & QRIS Pakasir/Manual  |
|  /api/orders             -> CRUD pesanan pembeli & token lisensi                  |
|  /api/config             -> Manajemen konfigurasi publik & rahasia seller        |
|  /api/send-otp           -> Mengirimkan kode OTP login 2FA via Telegram Bot       |
|  /api/deploy             -> Dispatcher pipeline ke GitHub Actions                 |
|  /api/webhooks/pakasir   -> Menerima callback status pembayaran otomatis          |
+-----------------------------------------------------------------------------------+
          |                             |                                  |
          v                             v                                  v
+--------------------+        +--------------------+            +--------------------+
|   Cloudflare D1    |        |   Cloudflare KV    |            |   GitHub Actions   |
|   (SQLite DB)      |        |   (CONFIG_KV)      |            | (Workflow Dispatch)|
|  - system_configs  |        |  - Fast Cache      |            |  - Setup D1/Pages  |
|  - orders          |        +--------------------+            |  - Deploy Client   |
+--------------------+                                          +--------------------+
```

---

## 📁 Struktur Direktori

```
ngabsen-portal/
├── .github/
│   └── workflows/
│       └── deploy-portal.yml       # GitHub Actions CI/CD auto-deploy Cloudflare Pages
├── functions/
│   └── api/
│       ├── _db.ts                  # D1 SQLite helper, KV wrapper, & environment types
│       ├── checkout.ts             # Endpoint inisialisasi order & pembuatan QRIS
│       ├── config.ts               # Endpoint get/set konfigurasi seller (D1/KV)
│       ├── deploy.ts               # Dispatcher trigger ke GitHub Actions client
│       ├── orders.ts               # Endpoint data pesanan dan verifikasi token
│       ├── send-otp.ts             # Pengiriman OTP Telegram untuk otentikasi admin
│       └── webhooks/
│           └── pakasir.ts          # Webhook handler pembayaran otomatis Pakasir
├── migrations/
│   └── 0001_initial_schema.sql     # Skema D1 SQLite untuk tabel `system_configs` & `orders`
├── public/
│   ├── _headers                    # Security headers (CSP, nosniff, iframe policy)
│   ├── _redirects                  # SPA client-side routing fallback rule
│   ├── favicon.png
│   └── favicon.svg
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       └── data.json           # Mock data default untuk demo dashboard
│   ├── assets/
│   │   └── logo.tsx                # Komponen SVG logo resmi Yuk-Damel
│   ├── components/
│   │   ├── reactbits/              # Komponen micro-animation (TrueFocus, DecryptedText, dll.)
│   │   ├── ui/                     # Primitif UI Tailwind / Radix (button, dialog, input, dll.)
│   │   ├── AdminPortalPage.tsx     # Manajemen lisensi, analitik penjualan, dan verifikasi PIN/OTP
│   │   ├── CheckoutModal.tsx       # Alur popup checkout, QRIS Pakasir/Manual, dan WhatsApp
│   │   ├── OnboardingPage.tsx      # Halaman aktivasi pembeli, input Cloudflare API, & progress deploy
│   │   ├── SellerConfigPage.tsx    # Halaman pengaturan harga, payment gateway, bot Telegram, dll.
│   │   ├── pricing-section.tsx     # Tabel komparasi paket & kalkulator ROI biaya absensi
│   │   └── full-width-divider.tsx
│   ├── hooks/
│   │   └── use-mobile.tsx          # Hook responsif breakpoint mobile/desktop
│   ├── lib/
│   │   └── utils.ts                # Helper fungsi Tailwind clsx & twMerge
│   ├── services/
│   │   ├── config.ts               # Default konfigurasi seller, tier paket, & fallback storage
│   │   ├── deployDispatcher.ts     # Pemicu deployment via Edge API /api/deploy
│   │   ├── licenseService.ts       # Validasi token lisensi & status aktivasi
│   │   ├── qris.ts                 # Utilitas generate payload QRIS dinamis
│   │   ├── security.ts             # Hashing SHA-256, enkripsi sesi, rate limiting PIN
│   │   └── telegram.ts             # Service integrasi notifikasi Telegram
│   ├── App.tsx                     # Entry point routing (Landing / Onboarding / Admin)
│   ├── index.css                   # Theme CSS variables & styling Tailwind v4
│   └── main.tsx                    # React DOM Bootstrap
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml                   # Konfigurasi Cloudflare Pages & D1/KV binding
```

---

## 🔌 Detail Endpoint Cloudflare Pages Functions

| Endpoint | Method | Keterangan |
|---|---|---|
| `/api/checkout` | `POST` | Membuat transaksi baru, mendukung payment mode Pakasir (API v2) & QRIS manual. |
| `/api/orders` | `GET`, `POST` | Mengambil daftar pesanan, memverifikasi lisensi, atau membuat order baru. |
| `/api/config` | `GET`, `POST` | Mengambil konfigurasi publik atau menyimpan konfigurasi master seller (dilindungi PIN). |
| `/api/deploy` | `POST` | Menerima payload kredensial Cloudflare pembeli dan mendispatch GitHub Actions. |
| `/api/send-otp` | `POST` | Mengirimkan kode 6 digit OTP ke chat Telegram seller yang terdaftar. |
| `/api/webhooks/pakasir` | `POST` | Menerima notifikasi instan ketika pembeli telah menyelesaikan pembayaran QRIS Pakasir. |

---

## 🗄️ Skema Database Cloudflare D1 (SQLite)

Tersedia di `migrations/0001_initial_schema.sql`:

1. **`system_configs`**:
   - `key TEXT PRIMARY KEY`
   - `value TEXT NOT NULL`
   - `is_secret INTEGER DEFAULT 0` (1 = Kredensial rahasia seperti API token, 0 = Publik)
   - `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`

2. **`orders`**:
   - `id TEXT PRIMARY KEY` (Order ID unik, e.g. `ORD-XXXXXX`)
   - `client_name TEXT NOT NULL`
   - `client_slug TEXT NOT NULL`
   - `package_tier_id TEXT DEFAULT 'business'`
   - `amount_paid_rp INTEGER DEFAULT 0`
   - `payment_status TEXT DEFAULT 'paid'` (`paid`, `pending`, `cancelled`)
   - `license_token TEXT UNIQUE NOT NULL`
   - `activation_status TEXT DEFAULT 'pending'` (`pending`, `active`)
   - `buyer_phone TEXT`
   - `cf_account_id TEXT`
   - `deployed_urls TEXT` (JSON URLs)
   - `custom_domain_dashboard TEXT`
   - `custom_domain_app TEXT`
   - `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
   - `deployed_at DATETIME`
