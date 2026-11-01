# AGENTS.md — Portal Guidelines & Anti-Delusion Harness

Dokumen ini merupakan panduan bagi **AI Coding Assistant** yang bekerja pada repositori `akugawe-portal` (Landing page, pitch deck, static assets, dan Cloudflare Workers functions).

> [!IMPORTANT]
> **ANTI-DELUSION & AGENT HARNESS ACTIVE**:
> Rujukan spesifikasi arsitektur monorepo dan tata kelola nol-delusi AI mengacu pada [`HARNESS_AI_WORKFLOW.md`](file:///Users/taufik/Documents/Historycake/Akugawe/HARNESS_AI_WORKFLOW.md).

---

## 1. Aturan Verifikasi & Anti-Delusi Portal
1. **Verifikasi Build Sebelum Selesai**: Jalankan `pnpm build` atau `npm run build` sebelum menyatakan landing page / portal siap.
2. **Tidak Ada Dead Links / Dead Buttons**: Semua anchor (`<a>`) dan tombol (`<button>`) wajib memiliki tujuan yang valid atau fungsionalitas nyata.
3. **Penyelarasan Copywriting & Desain**: Gunakan data dan penawaran nyata sesuai [`SUBSCRIPTION_PLAN.md`](file:///Users/taufik/Documents/Historycake/Akugawe/akugawe-portal/SUBSCRIPTION_PLAN.md) dan [`ARCHITECTURE.md`](file:///Users/taufik/Documents/Historycake/Akugawe/akugawe-portal/ARCHITECTURE.md). Dilarang mengarang klaim sertifikasi atau angka statistik palsu.

---

## 2. Fitur Unggulan Terkini yang Ditampilkan di Landing Page
Landing page dan portal wajib secara akurat merefleksikan fitur-fitur mutakhir yang sudah berjalan di aplikasi produksi:
1. **Presensi Cerdas & Anti-Fraud**:
   - Geofence radius toko & foto selfie geotag resmi, anti-fake GPS.
   - **Maximum Late Alert (3 Mode)**: Deteksi keterlambatan berulang dengan tindakan terukur dan notifikasi instan Telegram bot.
   - **Koreksi Absensi Mandiri (3-Rule Strict)** & Deteksi Anomali Jam Kerja real-time.
   - Penyesuaian Jam Pulang (Model B Point Policy).
2. **Penggajian (Payroll) & Lembur Presisi**:
   - **Perhitungan Lembur Strict**: Durasi kerja aktual vs jam shift terjadwal, rincian badge Menit/Jam presisi.
   - Opsi strict shift overtime otomatis.
   - **BPJS TK & Kesehatan Kustom** dengan catatan keterangan.
   - Pajak PPh 21 TER (PP 58/2023), kalkulator THR proporsional, dan slip gaji PDF.
3. **Finansial Karyawan**:
   - Kasbon darurat cicilan 1-6 bulan dengan **Sinkronisasi Siklus Cutoff Payroll** dan **Tombol Undo Bayar Khusus Owner**.
   - Reimbursement foto nota dengan alasan penolakan transparan dan integrasi ke slip gaji.
4. **Addon Canvasing Sales & Kunjungan Toko** (Paket Business Pro):
   - Beat plan rute harian toko, navigasi rute Google Maps.
   - Taking Order (PO) langsung di toko dan rekonsiliasi inkaso/setoran kasir.
5. **Ergonomi UI/UX & Anti-Slop**:
   - Penggunaan komponen `TextTicker` untuk teks panjang tanpa terpotong kasar.
   - Tampilan bersih, kontras tinggi, mobile-first, dan tanpa AI-cliché copy.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
<!-- antislop:end -->
