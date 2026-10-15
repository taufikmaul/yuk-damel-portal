import { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { ShinyText } from './reactbits/ShinyText';

interface AiQuerySample {
  id: string;
  query: string;
  badge: string;
  toolUsed: string;
  responseHeadline: string;
  responseBody: string;
  structuredData?: {
    type: 'attendance' | 'approval' | 'payroll' | 'task';
    items: { label: string; value: string; status?: 'success' | 'warning' | 'info' }[];
  };
}

const AI_SAMPLES: AiQuerySample[] = [
  {
    id: 'attendance',
    query: 'Siapa staf yang belum hadir atau telat jam 9 pagi ini?',
    badge: 'Cek Kehadiran Hari Ini',
    toolUsed: 'Periksa Absensi Hari Ini',
    responseHeadline: 'Laporan Kehadiran Hari Ini (Pukul 09:00 WIB)',
    responseBody: 'Dari total 42 staf, sebanyak 40 orang hadir tepat waktu di lokasi:',
    structuredData: {
      type: 'attendance',
      items: [
        { label: 'Reza Pratama (Barista)', value: 'Terlambat 18 Menit (Masuk 08:48)', status: 'warning' },
        { label: 'Dewi Lestari (Marketing)', value: 'Dinas Luar (Lokasi Terverifikasi)', status: 'info' },
        { label: '40 Staf Lainnya', value: 'Hadir Tepat Waktu di Toko / Kantor', status: 'success' },
      ],
    },
  },
  {
    id: 'approval',
    query: 'Ada pengajuan izin atau lembur yang belum disetujui?',
    badge: 'Izin & Lembur Tertunda',
    toolUsed: 'Cek Pengajuan Masuk',
    responseHeadline: '3 Pengajuan Menunggu Persetujuan Anda',
    responseBody: 'Berikut pengajuan staf yang siap Anda setujui langsung:',
    structuredData: {
      type: 'approval',
      items: [
        { label: 'Budi Santoso (Teknisi)', value: 'Lembur 2.5 Jam (Perbaikan Mesin)', status: 'warning' },
        { label: 'Siti Rahma (Kasir)', value: 'Cuti Tahunan 2 Hari (18–19 Okt)', status: 'info' },
        { label: 'Dani Gunawan (Staf)', value: 'Kasbon Darurat Rp 500.000', status: 'info' },
      ],
    },
  },
  {
    id: 'payroll',
    query: 'Berapa perkiraan total gaji dan lembur staf bulan ini?',
    badge: 'Estimasi Pengeluaran Gaji',
    toolUsed: 'Hitung Rekap Gaji Berjalan',
    responseHeadline: 'Estimasi Anggaran Gaji Bulan Ini',
    responseBody: 'Berdasarkan rekap jam kerja dan kehadiran sampai hari ini:',
    structuredData: {
      type: 'payroll',
      items: [
        { label: 'Gaji Pokok & Tunjangan Tetap', value: 'Rp 142.500.000 (42 Karyawan)', status: 'info' },
        { label: 'Total Uang Lembur Berjalan', value: 'Rp 6.850.000 (54 Jam Lembur)', status: 'success' },
        { label: 'Potongan Keterlambatan', value: '- Rp 420.000 (Dipotong Otomatis)', status: 'warning' },
      ],
    },
  },
  {
    id: 'task',
    query: 'Buatkan daftar tugas rutin buka toko untuk staf shift pagi',
    badge: 'Bikin Tugas Otomatis',
    toolUsed: 'Buat Checklist Toko',
    responseHeadline: 'Daftar Tugas Buka Toko Berhasil Dibuat',
    responseBody: 'Checklist otomatis dikirim ke HP karyawan shift pagi hari ini:',
    structuredData: {
      type: 'task',
      items: [
        { label: 'Buka Toko & Nyalakan Lampu', value: 'Wajib Foto Depan Toko', status: 'info' },
        { label: 'Cek Suhu Chiller / Kulkas', value: 'Pastikan di Bawah 4°C', status: 'info' },
        { label: 'Hitung Uang Kas Kasir', value: 'Modal Awal Rp 500.000', status: 'success' },
      ],
    },
  },
];

export function AiAgentShowcase() {
  const [activeSample, setActiveSample] = useState<AiQuerySample>(AI_SAMPLES[0]);

  return (
    <section id="ai-agent" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#faf6f5] relative overflow-hidden border-t border-[#f0dbd8]">
      {/* Decorative gradient orb */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-gradient-to-tr from-[#f7e5e3]/60 via-[#fbf2f0]/60 to-transparent blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbf2f0] text-[#a9484c] text-xs font-semibold mb-3 border border-[#f0dbd8] shadow-xs">
            <Bot className="size-3.5 text-[#a9484c]" />
            <ShinyText text="Asisten Pintar untuk Pemilik Usaha & HR" speed={3.5} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tanya Data Absensi & Gaji Semudah Kirim Chat
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 max-w-2xl mx-auto leading-relaxed">
            Gak perlu bingung cari-cari menu laporan. Cukup ketik pertanyaan seperti chat biasa, asisten AI langsung rekap data kehadiran, hitung lembur, dan siapkan jawaban rapi.
          </p>
        </div>

        {/* QUERY PROMPTS SELECTOR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {AI_SAMPLES.map((sample) => {
            const isActive = activeSample.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => setActiveSample(sample)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#fbf2f0] border-[#a9484c] shadow-md ring-1 ring-[#a9484c]'
                    : 'bg-white border-[#f0dbd8] hover:bg-[#fbf2f0]/60 hover:border-[#cf807c]'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#a9484c] font-mono block mb-1.5">
                    {sample.badge}
                  </span>
                  <p className="text-xs text-slate-900 font-semibold line-clamp-2">
                    "{sample.query}"
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-3 pt-2 border-t border-[#f0dbd8]">
                  <Sparkles className="size-3 text-[#a9484c] shrink-0" />
                  <span className="truncate">{sample.toolUsed}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* INTERACTIVE CHAT MOCKUP */}
        <SpotlightCard
          spotlightColor="rgba(169, 72, 76, 0.08)"
          className="p-6 sm:p-8 rounded-3xl bg-white border border-[#f0dbd8] shadow-xl space-y-6"
        >
          {/* Chat Window Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f0dbd8] text-xs">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center font-bold">
                <Bot className="size-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  Asisten Pintar akugawe
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Siap bantu rekap data & operasional usaha Anda
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                Terhubung Otomatis
              </span>
            </div>
          </div>

          {/* User Prompt Bubble */}
          <div className="flex items-start gap-3 justify-end">
            <div className="max-w-xl p-4 rounded-2xl rounded-tr-sm bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 shadow-xs">
              <div className="text-[10px] text-slate-500 mb-1">Pertanyaan Anda:</div>
              "{activeSample.query}"
            </div>
            <div className="size-8 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center text-xs font-bold shrink-0">
              Bos
            </div>
          </div>

          {/* Assistant Processing Trace */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#faf6f5] border border-[#f0dbd8] text-[11px] text-slate-600">
            <Zap className="size-3.5 text-[#a9484c] animate-pulse shrink-0" />
            <span className="font-semibold text-slate-800">Membaca data:</span>
            <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-[#f0dbd8] truncate font-medium">
              {activeSample.toolUsed}
            </span>
            <span className="text-slate-400 hidden sm:inline ml-auto">Data selesai diproses</span>
          </div>

          {/* AI Response Bubble */}
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-xl bg-[#fbf2f0] border border-[#f0dbd8] text-[#a9484c] flex items-center justify-center font-bold text-xs shrink-0">
              AI
            </div>
            <div className="flex-1 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl rounded-tl-sm bg-[#faf6f5] border border-[#f0dbd8] text-xs sm:text-sm text-slate-700 shadow-xs space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{activeSample.responseHeadline}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {activeSample.responseBody}
                </p>

                {/* Structured Data Snapshot */}
                {activeSample.structuredData && (
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {activeSample.structuredData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-[#f0dbd8] flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            item.status === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.status === 'info'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Input Bar */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#faf6f5] border border-[#f0dbd8]">
            <input
              type="text"
              readOnly
              value={activeSample.query}
              aria-label="Contoh Pertanyaan"
              className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-500 outline-none cursor-default"
            />
            <button
              type="button"
              disabled
              aria-label="Kirim Pertanyaan"
              className="px-4 py-2 rounded-xl bg-[#a9484c] text-white font-bold text-xs flex items-center gap-1.5 opacity-90"
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
