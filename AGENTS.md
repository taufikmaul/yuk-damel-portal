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
