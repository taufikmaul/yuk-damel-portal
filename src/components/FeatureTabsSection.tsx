import { useState } from 'react';
import {
  MapPin,
  Receipt,
  Users,
  Trophy,
  Smartphone,
  Server,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Fingerprint,
  Calculator,
  Coins,
  TrendingUp,
  Workflow,
  Sparkles,
  Layers,
  Clock,
  Store,
  Navigation,
  ShoppingBag,
} from 'lucide-react';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { ShinyText } from './reactbits/ShinyText';

interface FeatureCategory {
  id: string;
  label: string;
  icon: typeof MapPin;
  color: string;
  badge: string;
  headline: string;
  subheadline: string;
  cards: {
    title: string;
    description: string;
    icon: typeof ShieldCheck;
    tag: string;
  }[];
  statBox: {
    value: string;
    label: string;
    sublabel: string;
  };
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'attendance',
    label: 'Absen Selfie & Lokasi',
    icon: MapPin,
    color: '#e57f8e',
    badge: 'Anti Titip Absen & Anti Palsu',
    headline: 'Karyawan Wajib di Lokasi Kantor & Foto Selfie Asli',
    subheadline: 'Sistem memastikan karyawan benar-benar hadir di toko atau kantor Anda. Gak bisa manipulasi lokasi, gak bisa titip absen ke teman.',
    cards: [
      {
        title: 'Deteksi Lokasi GPS Kantor',
        description: 'Hanya bisa absen jika HP karyawan terdeteksi berada di dalam area kantor atau toko Anda.',
        icon: MapPin,
        tag: 'Radius Toko',
      },
      {
        title: 'Wajib Foto Selfie Langsung',
        description: 'Kamera langsung mengambil foto wajah saat absen dengan stempel jam dan lokasi asli, bukan ambil dari galeri.',
        icon: Camera,
        tag: 'Selfie Asli',
      },
      {
        title: '1 Akun Terkunci di 1 HP',
        description: 'Setiap karyawan absen menggunakan HP-nya sendiri dengan sidik jari atau PIN layar. Tidak bisa dipinjamkan ke rekan kerja.',
        icon: Fingerprint,
        tag: '1 HP 1 Akun',
      },
    ],
    statBox: {
      value: '100% Jujur',
      label: 'Bebas Titip Absen',
      sublabel: 'Lokasi dan foto diverifikasi otomatis',
    },
  },
  {
    id: 'canvasing',
    label: 'Canvasing & Kunjungan',
    icon: Store,
    color: '#4f46e5',
    badge: 'Eksklusif Business Pro',
    headline: 'Kawal Rute Kunjungan Sales, Taking Order PO, & Setoran Tagihan Toko',
    subheadline: 'Pantau staf sales lapangan secara akurat: atur jadwal Beat Plan & direktori master toko, lihat peta sebaran kunjungan interaktif, catat order PO, hingga rekonsiliasi uang setoran ke kasir.',
    cards: [
      {
        title: 'Beat Plan & Navigasi Google Maps',
        description: 'Supervisor menyusun jadwal kunjungan toko harian untuk staf sales dilengkapi titik peta & tombol navigasi langsung ke Google Maps.',
        icon: Navigation,
        tag: 'Rute Harian',
      },
      {
        title: 'Check-In/Out Toko & Mode Offline',
        description: 'Sales wajib check-in & check-out di tiap toko dengan foto bukti, GPS & durasi kunjungan. Tetap tersimpan meski sinyal susah (Offline-First).',
        icon: Store,
        tag: 'Live GPS & Durasi',
      },
      {
        title: 'Taking Order (PO) & Setoran Kasir',
        description: 'Catat pesanan barang (PO), penagihan pembayaran (Tunai/Transfer/Giro), serah terima setoran ke kasir kantor, dan klaim BBM dari HP.',
        icon: ShoppingBag,
        tag: 'Order & Inkaso',
      },
    ],
    statBox: {
      value: 'Realtime',
      label: 'Peta Sebaran Kunjungan',
      sublabel: 'Order PO & setoran tagihan tercatat rapi',
    },
  },
  {
    id: 'payroll',
    label: 'Gaji, Lembur & BPJS',
    icon: Receipt,
    color: '#10b981',
    badge: 'Hitung Gaji Tanpa Pusing',
    headline: 'Gaji Bulanan & Uang Lembur Beres dalam 1 Klik',
    subheadline: 'Tinggalkan rumus Excel yang rumit. Sistem menghitung gaji pokok, uang lembur, potongan telat, serta potongan BPJS & pajak secara otomatis.',
    cards: [
      {
        title: 'Slip Gaji Digital Otomatis',
        description: 'Di akhir bulan, rekap kehadiran langsung diubah menjadi slip gaji rapi berformat PDF yang bisa langsung dikirim ke staf.',
        icon: Calculator,
        tag: 'Slip PDF',
      },
      {
        title: 'Hitung Lembur & Potongan Telat',
        description: 'Lembur yang disetujui otomatis menambah gaji, sedangkan menit keterlambatan otomatis memotong uang kehadiran secara adil.',
        icon: Clock,
        tag: 'Otomatis & Adil',
      },
      {
        title: 'BPJS & Pajak PPh 21 Standar',
        description: 'Sudah mengikuti tarif pajak terbaru (PPh 21 TER) dan persentase BPJS resmi, siap pakai tanpa perlu hitung manual.',
        icon: ShieldCheck,
        tag: 'Standar Resmi',
      },
    ],
    statBox: {
      value: '5 Menit',
      label: 'Waktu Rekap Gaji Bulanan',
      sublabel: 'Tinggal klik, slip gaji langsung tercetak',
    },
  },
  {
    id: 'hierarchy',
    label: 'Izin, Cuti & Lembur',
    icon: Users,
    color: '#6366f1',
    badge: 'Alur Persetujuan Mudah',
    headline: 'Pengajuan Cuti & Izin Langsung dari HP Karyawan',
    subheadline: 'Staf ajukan izin atau lembur lewat HP, atasan atau pemilik usaha langsung dapat notifikasi untuk menyetujui dengan sekali sentuh.',
    cards: [
      {
        title: 'Ajukan Izin & Sakit Praktis',
        description: 'Karyawan yang berhalangan atau sakit tinggal unggah foto surat dokter dari HP. Data tersimpan rapi tanpa kertas formulir.',
        icon: Workflow,
        tag: 'Tanpa Kertas',
      },
      {
        title: 'Persetujuan Cepat oleh Atasan',
        description: 'Supervisor atau manajer toko bisa langsung klik [Setuju] atau [Tolak] dari HP masing-masing dalam hitungan detik.',
        icon: CheckCircle2,
        tag: '1 Sentuhan',
      },
      {
        title: 'Tukar Shift Kerja Mudah',
        description: 'Staf yang berhalangan bisa saling bertukar jadwal shift kerja dengan persetujuan atasan, tanpa takut kena potongan telat.',
        icon: Clock,
        tag: 'Tukar Shift',
      },
    ],
    statBox: {
      value: '3 Detik',
      label: 'Persetujuan Lewat HP',
      sublabel: 'Notifikasi langsung masuk ke atasan',
    },
  },
  {
    id: 'gamification',
    label: 'Poin Disiplin & Ranking',
    icon: Trophy,
    color: '#f59e0b',
    badge: 'Bikin Karyawan Rajin',
    headline: 'Karyawan Tepat Waktu Dapat Poin, Telat Kena Pengurangan',
    subheadline: 'Dorong disiplin karyawan dengan cara yang positif. Yang rajin dan tepat waktu kumpulkan poin untuk ditukar bonus atau penghargaan bulanan.',
    cards: [
      {
        title: 'Poin Hadir Tepat Waktu',
        description: 'Tiap datang tepat waktu sebelum jam kerja dimulai, karyawan otomatis mendapat poin kedisiplinan yang tercatat transparan.',
        icon: Coins,
        tag: 'Poin Rajin',
      },
      {
        title: 'Pengingat untuk yang Sering Telat',
        description: 'Keterlambatan mengurangi poin disiplin secara adil, memotivasi staf untuk lebih menghargai jam kerja usaha Anda.',
        icon: TrendingUp,
        tag: 'Adil & Transparan',
      },
      {
        title: 'Papan Peringkat Karyawan Teladan',
        description: 'Tampilkan siapa karyawan paling rajin bulan ini sebagai dasar pertimbangan penilaian performa atau bonus insentif.',
        icon: Trophy,
        tag: 'Juara Bulanan',
      },
    ],
    statBox: {
      value: 'Lebih Tertib',
      label: 'Motivasi Karyawan Naik',
      sublabel: 'Budaya kerja lebih disiplin & tepat waktu',
    },
  },
  {
    id: 'pwa',
    label: 'Aplikasi HP Ringan',
    icon: Smartphone,
    color: '#a855f7',
    badge: 'Tanpa Download PlayStore',
    headline: 'Cukup Buka Link di HP, Siap Absen dalam 5 Detik',
    subheadline: 'Karyawan tidak perlu download aplikasi bergiga-giga yang menghabiskan memori HP. Bisa dibuka di semua merk Android maupun iPhone.',
    cards: [
      {
        title: 'Tidak Makan Memori HP',
        description: 'Hanya perlu simpan link ke layar utama HP ("Add to Home Screen"). Sangat ringan, bahkan untuk HP dengan memori terbatas.',
        icon: Smartphone,
        tag: 'Super Ringan',
      },
      {
        title: 'Bisa Buka Saat Sinyal Lemah',
        description: 'Jadwal shift, riwayat absen, dan slip gaji tetap bisa dibuka dengan cepat meski koneksi internet sedang tidak stabil.',
        icon: ShieldCheck,
        tag: 'Tetap Lancar',
      },
      {
        title: 'Checklist Tugas Harian Toko',
        description: 'Karyawan toko bisa langsung cek daftar tugas rutin (misal: cek kebersihan, stok barang, lampu toko) sebelum pulang.',
        icon: CheckCircle2,
        tag: 'Tugas Toko',
      },
    ],
    statBox: {
      value: '5 Detik',
      label: 'Waktu yang Dibutuhkan untuk Absen',
      sublabel: 'Buka HP, senyum selfie, langsung tercatat',
    },
  },
  {
    id: 'selfhost',
    label: 'akugawe (Rp 0 Server)',
    icon: Server,
    color: '#a9484c',
    badge: 'Milik Sendiri Selamanya',
    headline: 'Beli Sekali Jadi Milik Usaha Anda, Tanpa Biaya Bulanan',
    subheadline: 'Berbeda dengan aplikasi sewa (SaaS) yang minta iuran tiap bulan per kepala karyawan. akugawe jadi aset milik usaha Anda selamanya.',
    cards: [
      {
        title: 'Server Gratis Rp 0 / Bulan',
        description: 'Aplikasi berjalan di kuota gratis Serverless Edge yang sangat besar (100.000 akses/hari), lebih dari cukup untuk usaha UMKM tanpa bayar server.',
        icon: Sparkles,
        tag: 'Server Rp 0',
      },
      {
        title: 'Bebas Tambah Karyawan',
        description: 'Punya 10, 50, atau 100 karyawan, biaya tetap sama karena Anda tidak perlu bayar iuran bulanan per kepala.',
        icon: Users,
        tag: 'Bebas Tambah Staf',
      },
      {
        title: 'Data Usaha & Gaji Aman Milik Anda',
        description: 'Data privasi absensi dan besaran gaji karyawan tersimpan aman di database milik Anda sendiri, tidak dicampur dengan toko lain.',
        icon: Server,
        tag: '100% Milik Anda',
      },
    ],
    statBox: {
      value: 'Rp 0',
      label: 'Biaya Iuran Bulanan',
      sublabel: 'Hemat jutaan rupiah tiap tahun untuk kas usaha',
    },
  },
];

export function FeatureTabsSection() {
  const [activeTab, setActiveTab] = useState<FeatureCategory>(FEATURE_CATEGORIES[0]);

  return (
    <section id="fitur" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#faf6f5] border-y border-[#f0dbd8] relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbf2f0] text-[#a9484c] text-xs font-semibold mb-3 border border-[#f0dbd8] shadow-xs">
            <Layers className="size-3.5 text-[#a9484c]" />
            <ShinyText text="Fitur Lengkap untuk Toko & Kantor UMKM" speed={3.5} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Semua yang Dibutuhkan Usaha Anda Ada di Sini
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 max-w-2xl mx-auto leading-relaxed">
            Mulai dari absen anti-titip, hitung gaji bulanan otomatis, hingga izin lewat HP — semua mudah dipahami tanpa perlu belajar lama.
          </p>
        </div>

        {/* HORIZONTAL CATEGORY PILL SELECTOR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
          {FEATURE_CATEGORIES.map((cat) => {
            const isSelected = activeTab.id === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-[#a9484c] text-white border-[#a9484c] shadow-md ring-1 ring-[#8f3b3f]'
                    : 'bg-white text-slate-700 border-[#f0dbd8] hover:text-slate-900 hover:bg-[#fbf2f0]/60'
                }`}
              >
                <div
                  className="size-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}20`,
                    color: isSelected ? '#ffffff' : cat.color,
                  }}
                >
                  <Icon className="size-3" />
                </div>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE CATEGORY SHOWCASE CARD */}
        <SpotlightCard
          spotlightColor="rgba(169, 72, 76, 0.08)"
          className="p-6 sm:p-10 rounded-3xl bg-white border border-[#f0dbd8] shadow-xl space-y-8"
        >
          {/* Header of Active Tab */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#f0dbd8]">
            <div className="space-y-2 max-w-2xl">
              <span
                className="text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border"
                style={{
                  color: activeTab.color,
                  borderColor: `${activeTab.color}40`,
                  backgroundColor: `${activeTab.color}15`,
                }}
              >
                {activeTab.badge}
              </span>
              <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeTab.headline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeTab.subheadline}
              </p>
            </div>

            {/* Stat Box Highlight */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8] text-left lg:text-right shrink-0">
              <div
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: activeTab.color }}
              >
                {activeTab.statBox.value}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {activeTab.statBox.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeTab.statBox.sublabel}
              </div>
            </div>
          </div>

          {/* 3 Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {activeTab.cards.map((card, idx) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8] hover:border-[#cf807c] shadow-xs transition-all flex flex-col justify-between space-y-4 text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="size-9 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${activeTab.color}15`,
                          color: activeTab.color,
                        }}
                      >
                        <CardIcon className="size-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-[#f0dbd8]">
                        {card.tag}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {card.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-2 border-t border-[#f0dbd8]">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>Sudah Siap Pakai</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
