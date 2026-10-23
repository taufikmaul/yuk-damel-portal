import { useState } from 'react';
import {
  Crown,
  Briefcase,
  Users,
  UserCheck,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Coffee,
} from 'lucide-react';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { ShinyText } from './reactbits/ShinyText';

interface RoleDemoItem {
  id: string;
  role: 'owner' | 'admin_hr' | 'manager' | 'employee';
  level: string;
  title: string;
  name: string;
  department: string;
  avatarUrl: string;
  icon: typeof Crown;
  color: string;
  badgeBg: string;
  targetApp: 'dashboard' | 'pwa' | 'both';
  loginRoleParam: string;
  description: string;
  highlights: string[];
  mockStats: { label: string; value: string; detail: string }[];
}

const ROLES_DATA: RoleDemoItem[] = [
  {
    id: 'owner',
    role: 'owner',
    level: 'Pemilik Bisnis',
    title: 'Pemilik Usaha (Owner)',
    name: 'Bpk. Hendrawan Wijaya',
    department: 'Manajemen Puncak',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    icon: Crown,
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    targetApp: 'dashboard',
    loginRoleParam: 'owner',
    description: 'Pemilik usaha memiliki kendali penuh: pantau kehadiran staf di semua toko/cabang, cek total biaya gaji, dan setujui izin tanpa repot buka-buka berkas.',
    highlights: [
      'Pantau Kehadiran Karyawan Seluruh Cabang Toko',
      'Ringkasan Pengeluaran Gaji & Lembur Bulanan',
      'Setujui Pengajuan Penting dalam 1 Sentuhan',
    ],
    mockStats: [
      { label: 'Total Karyawan', value: '42 Orang', detail: '3 Cabang Toko' },
      { label: 'Kehadiran Hari Ini', value: '97.6%', detail: '41 Hadir, 1 Izin' },
      { label: 'Estimasi Gaji Bulan Ini', value: 'Rp 148,5 Jt', detail: 'Termasuk Lembur & BPJS' },
    ],
  },
  {
    id: 'hrd',
    role: 'admin_hr',
    level: 'Pengelola HR',
    title: 'Manajer HR & Admin',
    name: 'Ibu Siti Rahmawati',
    department: 'Administrasi & Staf',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    icon: Briefcase,
    color: '#ec4899',
    badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    targetApp: 'dashboard',
    loginRoleParam: 'hr',
    description: 'Kelola urusan karyawan jadi mudah: atur jam shift, rekap absensi otomatis, hitung potongan telat, dan cetak slip gaji langsung jadi PDF.',
    highlights: [
      'Hitung Gaji & Cetak Slip PDF Otomatis',
      'Verifikasi Izin Sakit & Surat Dokter',
      'Kelola Jadwal Shift Kerja Toko',
    ],
    mockStats: [
      { label: 'Pengajuan Masuk', value: '3 Berkas', detail: '2 Cuti, 1 Lembur' },
      { label: 'Tanggal Gajian', value: 'Tgl 25', detail: 'Slip Siap Dibagikan' },
      { label: 'Status Potongan', value: 'Otomatis', detail: 'Sesuai Menit Telat' },
    ],
  },
  {
    id: 'lead',
    role: 'manager',
    level: 'Kepala Toko',
    title: 'Kepala Toko / Supervisor',
    name: 'Hendra Kusuma',
    department: 'Operasional Lapangan',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    icon: Users,
    color: '#6366f1',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    targetApp: 'both',
    loginRoleParam: 'manager',
    description: 'Pantau kedisiplinan staf gerai langsung dari HP: setujui lembur darurat, cek siapa yang sedang dinas luar, dan bantu tukar shift kerja.',
    highlights: [
      'Setujui Lembur Staf Langsung dari HP',
      'Pantau Kehadiran Anggota Tim Hari Ini',
      'Bantu Pengajuan Tukar Shift Kerja',
    ],
    mockStats: [
      { label: 'Staf Tim Toko', value: '8 Orang', detail: 'Shift Pagi & Sore' },
      { label: 'Total Lembur Tim', value: '12 Jam', detail: 'Ramai Akhir Pekan' },
      { label: 'Kedisiplinan Tim', value: '98.5%', detail: 'Toko Paling Tertib' },
    ],
  },
  {
    id: 'budi',
    role: 'employee',
    level: 'Staf Kantor',
    title: 'Staf Kantor Senior',
    name: 'Budi Santoso',
    department: 'Operasional Kantor',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    icon: UserCheck,
    color: '#3b82f6',
    badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    targetApp: 'pwa',
    loginRoleParam: 'budi',
    description: 'Absen cepat lewat HP sendiri: foto selfie di kantor, langsung tercatat tepat waktu. Bisa cek sisa jatah cuti dan unduh slip gaji kapan saja.',
    highlights: [
      'Absen Selfie 5 Detik di Lokasi Kantor',
      'Cek Rincian Slip Gaji & Saldo Cuti di HP',
      'Ajukan Izin atau Lembur Praktis',
    ],
    mockStats: [
      { label: 'Jam Masuk Hari Ini', value: '08:14 WIB', detail: 'Tepat Waktu (+10 Poin)' },
      { label: 'Sisa Jatah Cuti', value: '8 Hari', detail: 'Dari 12 Hari Tahunan' },
      { label: 'Slip Gaji Bulan Ini', value: 'Sudah Terbit', detail: 'Bisa Diunduh via HP' },
    ],
  },
  {
    id: 'dewi',
    role: 'employee',
    level: 'Sales Canvasing',
    title: 'Staf Sales & Canvasing Toko',
    name: 'Dewi Lestari',
    department: 'Penjualan & Distribusi',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    icon: Sparkles,
    color: '#10b981',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    targetApp: 'pwa',
    loginRoleParam: 'dewi',
    description: 'Kunjungi toko sesuai jadwal Beat Plan harian dengan navigasi Google Maps, check-in/out GPS di toko, input Taking Order (PO), catat tagihan & setoran kasir, hingga klaim uang BBM.',
    highlights: [
      'Jadwal Rute Kunjungan (Beat Plan) & Navigasi Maps',
      'Check-In/Out Toko, Taking Order (PO) & Tagihan Tunai',
      'Mode Offline-First & Klaim Nota BBM Praktis',
    ],
    mockStats: [
      { label: 'Kunjungan Hari Ini', value: '6 / 8 Toko', detail: 'Sesuai Rute Beat Plan' },
      { label: 'Taking Order (PO)', value: 'Rp 12,4 Jt', detail: 'Setoran Tunai Terkumpul' },
      { label: 'Klaim BBM Sales', value: 'Rp 150.000', detail: 'Menunggu Persetujuan' },
    ],
  },
  {
    id: 'reza',
    role: 'employee',
    level: 'Karyawan Toko',
    title: 'Barista / Kasir Gerai',
    name: 'Reza Pratama',
    department: 'Operasional Gerai',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    icon: Coffee,
    color: '#f97316',
    badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    targetApp: 'pwa',
    loginRoleParam: 'reza',
    description: 'Bekerja dengan sistem shift toko: cek jadwal shift harian, isi daftar tugas buka/tutup toko, dan ajukan kasbon mendadak langsung dari HP.',
    highlights: [
      'Cek Jadwal Shift Pagi / Sore di HP',
      'Checklist Tugas Buka Toko & Kebersihan',
      'Ajukan Kasbon Darurat Bebas Ribet',
    ],
    mockStats: [
      { label: 'Shift Kerja', value: 'Shift Pagi', detail: '07:00 – 16:00 WIB' },
      { label: 'Tugas Toko', value: '5/5 Selesai', detail: 'Semua Checklist Rapi' },
      { label: 'Status Kasbon', value: 'Aktif', detail: 'Cicilan Teratur' },
    ],
  },
];

interface InteractiveDemoShowcaseProps {
  dashboardUrl: string;
  appUrl: string;
}

export function InteractiveDemoShowcase({ dashboardUrl, appUrl }: InteractiveDemoShowcaseProps) {
  const [selectedRole, setSelectedRole] = useState<RoleDemoItem>(ROLES_DATA[0]);

  const getDemoLaunchUrl = (role: RoleDemoItem) => {
    if (role.targetApp === 'dashboard') {
      const base = dashboardUrl || 'https://hrd.akugawe.web.id/demo';
      const roleParam = role.loginRoleParam || role.role;
      return base.includes('/demo') ? `${base}?role=${roleParam}&auto=1` : `${base}/demo?role=${roleParam}&auto=1`;
    }
    const base = appUrl || 'https://app.akugawe.web.id/demo';
    return base.includes('/demo') ? base : `${base}/demo`;
  };

  const getTargetBadgeLabel = (targetApp: RoleDemoItem['targetApp']) => {
    if (targetApp === 'dashboard') return 'Tampilan Komputer / Laptop';
    if (targetApp === 'pwa') return 'Tampilan HP Karyawan';
    return 'Komputer & HP';
  };

  return (
    <section id="demo-roles" className="py-20 sm:py-28 px-4 sm:px-6 bg-white/70 border-t border-[#f0dbd8] relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-[#f7e5e3]/60 via-[#fbf2f0]/60 to-transparent blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbf2f0] text-[#a9484c] text-xs font-semibold mb-3 border border-[#f0dbd8] shadow-xs">
            <Sparkles className="size-3.5 text-[#a9484c]" />
            <ShinyText text="Coba Demo Langsung Sesuai Posisi" speed={3.5} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Satu Aplikasi, Pas untuk Semua Posisi Kerja
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 max-w-2xl mx-auto leading-relaxed">
            Klik profil di bawah ini untuk melihat bagaimana akugawe memberikan tampilan yang pas bagi Pemilik Usaha, Manajer, hingga Karyawan toko:
          </p>
        </div>

        {/* ROLE SELECTOR BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-8">
          {ROLES_DATA.map((role) => {
            const isSelected = selectedRole.id === role.id;
            const IconComponent = role.icon;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#fbf2f0] border-[#a9484c] shadow-md shadow-[#a9484c]/10 ring-1 ring-[#a9484c]'
                    : 'bg-white border-[#f0dbd8] hover:bg-[#fbf2f0]/60 hover:border-[#cf807c]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${role.color}15`, color: role.color }}
                  >
                    <IconComponent className="size-4" />
                  </div>
                  {isSelected && (
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 tracking-tight truncate">
                    {role.level}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {role.title.split('(')[0].trim()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTIVE ROLE DETAIL PREVIEW CARD */}
        <SpotlightCard
          spotlightColor="rgba(169, 72, 76, 0.08)"
          className="p-6 sm:p-10 rounded-3xl bg-white border border-[#f0dbd8] shadow-xl relative overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Role Info & Persona */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedRole.avatarUrl}
                  alt={selectedRole.name}
                  className="size-16 sm:size-20 rounded-2xl object-cover border-2 border-[#f0dbd8] shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${selectedRole.badgeBg}`}>
                      {selectedRole.level}
                    </span>
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {getTargetBadgeLabel(selectedRole.targetApp)}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {selectedRole.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    {selectedRole.title} • {selectedRole.department}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#faf6f5] p-4 rounded-2xl border border-[#f0dbd8]">
                {selectedRole.description}
              </p>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>Kemudahan untuk Peran Ini:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {selectedRole.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-[#a9484c] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <a
                  href={getDemoLaunchUrl(selectedRole)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#a9484c] to-[#8f3b3f] text-white text-xs font-bold shadow-lg shadow-[#a9484c]/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>Coba Masuk Sebagai {selectedRole.level}</span>
                  <ExternalLink className="size-3 ml-0.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Right: Role Mock Dashboard / App Screen Preview */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#f0dbd8] bg-[#faf6f5] p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0dbd8]">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-900">
                      Ringkasan Aktivitas ({selectedRole.level})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Live Demo Ready
                  </span>
                </div>

                {/* KPI Metrics Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedRole.mockStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-[#f0dbd8] shadow-xs space-y-1"
                    >
                      <div className="text-[11px] font-medium text-slate-500 truncate">
                        {stat.label}
                      </div>
                      <div
                        className="text-lg sm:text-xl font-extrabold tracking-tight truncate"
                        style={{ color: selectedRole.color }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {stat.detail}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated Screen Card */}
                <div className="p-4 rounded-xl bg-white border border-[#f0dbd8] shadow-xs text-xs space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="size-3 text-emerald-600" />
                      Status Sistem Terkini
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Normal & Berjalan
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#faf6f5] border border-[#f0dbd8] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-white border border-[#f0dbd8] flex items-center justify-center text-slate-600">
                        <MapPin className="size-4 text-[#a9484c]" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          {selectedRole.targetApp === 'dashboard' ? 'Semua Toko Terhubung' : 'Presensi Hari Ini'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedRole.targetApp === 'dashboard' ? '3 Toko aktif dalam radius aman' : 'Foto selfie & lokasi sudah terverifikasi'}
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  </div>
                </div>

                {/* Quick Hint */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>💡 Ingin mencoba langsung fitur aslinya?</span>
                  <a
                    href={getDemoLaunchUrl(selectedRole)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#a9484c] hover:underline font-semibold flex items-center gap-1"
                  >
                    Buka Aplikasi Sekarang <ArrowRight className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
