# 📜 ATURAN BAKU ALOKASI POD & AKUN CLOUDFLARE
## Pedoman Arsitektur Permanen Sistem Akugawe

Dokumen ini merupakan **aturan baku dan tidak dapat diubah (immutable standard)** yang wajib dipatuhi oleh seluruh pengembang dan **LLM / AI Coding Assistant** dalam merancang, memodifikasi, men-deploy, atau mengelola infrastruktur pod dan akun Cloudflare di platform **Akugawe**.

---

## 1. Aturan Baku Penempatan Tier ke Pod (Pod Tier Placement Rules)

| Tier Paket | Tipe Pod | Alokasi Akun Cloudflare | URL Pola Akses | Keterangan & Karakteristik |
| :--- | :--- | :--- | :--- | :--- |
| **Demo** (`demo`) | **Shared Pod (Pool)** | 1 Akun Cloudflare Bersama | `app.akugawe.web.id/demo`<br>`hrd.akugawe.web.id/demo` | Berbagi pod multi-tenant dengan Free Tier & Starter. Dilengkapi fitur 1-click role switcher. |
| **Free Tier UMKM** (`free_trial`) | **Shared Pod (Pool)** | 1 Akun Cloudflare Bersama | `app.akugawe.web.id/[slug]`<br>`hrd.akugawe.web.id/[slug]` | Berada di **1 pod yang sama persis** dengan Demo & Starter. Isolasi data berbasis `company_id` pada level database SQLite D1. |
| **Starter Tier** (`starter`) | **Shared Pod (Pool)** | 1 Akun Cloudflare Bersama | `app.akugawe.web.id/[slug]`<br>`hrd.akugawe.web.id/[slug]` | Masih berada di **pod yang sama** dengan Free Tier & Demo. Tidak dibuatkan akun Cloudflare baru. |
| **Pro Tier** (`pro`) | **Dedicated Pod** | **1 Akun Cloudflare = 1 Pod Khusus** | `app.akugawe.web.id/[slug]` atau `custom.domain.com` | **Wajib 1 akun Cloudflare tersendiri, 1 Pod dedicated**. Database D1, Worker API, KV, dan R2 terisolasi penuh tanpa berbagi resource. |
| **Enterprise Tier** (`enterprise`) | **Dedicated Pod** | **1 Akun Cloudflare = 1 Pod Khusus** | Custom Domain / Dedicated Zone | Multi-Zone Cloudflare dedicated dengan SLA prioritas dan kuota custom. |

---

## 2. Prinsip Kerja Teknis (Technical Implementation Principles)

### A. Shared Multi-Tenant Pod (Demo, Free Tier, dan Starter)
1. **Multi-Tenancy di Edge**:
   - Seluruh akun Demo, Free Tier (4 bulan), dan Starter berada dalam satu cluster Cloudflare (`is_shared_pod = 1`).
   - Kapasitas: 25 hingga 50 tenant per akun Cloudflare sebelum cluster berikutnya (`pod-02`, dst.) dibuka.
   - Database D1 menggunakan skema terpusat: query dibatasi secara ketat oleh `WHERE company_id = ?` atau `WHERE slug = ?`.
2. **Biaya Hosting Rp 0**:
   - Memaksimalkan batas gratis Cloudflare (100.000 requests/hari per Worker, 10 GB storage D1, dan 1 GB KV).
3. **Penyewa Baru**:
   - Fungsi `getActivePod(env, 'free_trial')` dan `getActivePod(env, 'starter')` akan selalu mengembalikan Pod Shared yang masih memiliki kapasitas (`current_companies_count < max_companies`).

### B. Dedicated Pod (Pro Tier & Enterprise)
1. **Isolasi 1:1**:
   - Setiap klien Pro dialokasikan ke **1 Pod Khusus (`is_shared_pod = 0`, `max_companies = 1`)**.
   - Setiap Pod Pro terhubung ke **1 Akun Cloudflare dedicated** miliknya sendiri.
2. **Keuntungan Klien Pro**:
   - **Zero Noisy Neighbor**: Lonjakan lalu lintas atau absensi massal dari tenant free/starter tidak akan mengganggu klien Pro.
   - **Database D1 Independen**: Memiliki file database D1 dan enkripsi KV tersendiri.
   - **Limit Request Mandiri**: Klien Pro memiliki kuota 100.000 request/hari penuh tanpa terbagi dengan tenant lain.
3. **Penyewa Baru**:
   - Fungsi `getActivePod(env, 'pro')` akan mencari pod dedicated yang kosong atau men-trigger alokasi akun Cloudflare baru.

---

## 3. Implementasi Kode pada Sistem

### A. Backend Helper (`functions/api/_db.ts`)
```typescript
export async function getActivePod(env: Env, tierId?: string): Promise<CloudflarePod | null> {
  const isDedicated = tierId === 'pro' || tierId === 'enterprise';

  if (isDedicated) {
    // Cari Pod Dedicated yang kosong (max_companies = 1)
    const dedicatedPod = await env.DB.prepare(`
      SELECT * FROM cloudflare_pods 
      WHERE is_active = 1 AND max_companies = 1 AND current_companies_count = 0
      ORDER BY created_at ASC LIMIT 1
    `).first<CloudflarePod>();

    return dedicatedPod || defaultDedicatedTemplate;
  }

  // Demo, Free Tier, dan Starter selalu masuk ke Shared Pod
  const sharedPod = await env.DB.prepare(`
    SELECT * FROM cloudflare_pods 
    WHERE is_active = 1 AND max_companies > 1 AND current_companies_count < max_companies 
    ORDER BY current_companies_count ASC LIMIT 1
  `).first<CloudflarePod>();

  return sharedPod || defaultSharedPod;
}
```

### B. Order Placement (`functions/api/checkout.ts` & `functions/api/orders.ts`)
- `is_shared_pod` dihitung otomatis:
  ```typescript
  const isSharedPod = (packageTierId === 'pro' || packageTierId === 'enterprise') ? 0 : 1;
  ```
- Kolom `is_shared_pod` dan `pod_id` disimpan ke tabel `orders` di Cloudflare D1.

### C. Multi-Account Deploy Tooling (`scripts/deploy.sh` di repo `app`)
- **Target `cf 2`**: Cloudflare Akun Pod Shared (`app.akugawe.web.id` & `hrd.akugawe.web.id`) yang menaungi Demo, Free Tier, dan Starter.
- **Target `cf 3`, `cf 4`, dst.**: Akun Cloudflare Dedicated untuk klien Pro / Enterprise.

---

## 4. Instruksi Khusus untuk LLM / AI Assistant

Setiap kali LLM membaca atau memodifikasi kode di repositori ini:
1. **DILARANG** memisahkan Demo, Free Tier, atau Starter ke pod/akun berbeda. Ketiganya **HARUS SELALU** berbagi 1 Pod yang sama.
2. **DILARANG** menggabungkan klien Pro Tier ke dalam Shared Pod. Klien Pro **HARUS SELALU** mendapatkan 1 Dedicated Pod di 1 Akun Cloudflare tersendiri.
3. Saat menampilkan informasi di UI Admin (`/salesAdmin`) atau API response, selalu sertakan badge yang membedakan **Shared Pod** vs **Dedicated CF Pod**.
