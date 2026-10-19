import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  MessageCircle,
  Building2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export interface LeadRecord {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  companyName?: string;
  employeeCount?: string;
  roleExplored?: string;
  source?: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  notes?: string;
  createdAt: string;
}

export function AdminLeadsTab() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.leads)) {
          setLeads(data.leads);
          return;
        }
      }
      // Mock leads fallback jika DB belum siap
      setLeads([
        {
          id: 'lead-1',
          name: 'Budi Santoso',
          email: 'budi@kopisenja.com',
          phone: '081234567890',
          companyName: 'Kedai Kopi Senja',
          employeeCount: '10-20',
          roleExplored: 'owner',
          source: 'app_demo',
          status: 'new',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      toast.error('Gagal memuat data leads: ' + err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const contactedLeads = leads.filter((l) => l.status === 'contacted').length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;

  const handleOpenWa = (lead: LeadRecord) => {
    if (!lead.phone) return;
    const cleanNum = lead.phone.replace(/\D/g, '').replace(/^0/, '62');
    const waText = `Halo Kak ${lead.name || ''} dari *${lead.companyName || 'usaha Anda'}*,\n\nTerima kasih telah mencoba Demo Aplikasi Absensi & Payroll akugawe!\n\nSaat ini kami sedang ada promo *Free Tier 4 Bulan (Gratis s/d 4 Karyawan)* dan *Paket Starter mulai Rp 15.000/bulan (Maks 15 Karyawan)*.\n\nApakah ada pertanyaan atau ingin kami bantu aktivasi akunnya?`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  return (
    <div className="space-y-3.5">
      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Total Prospek Demo
            </span>
            <div className="size-7 rounded-lg bg-[#fbf2f0] flex items-center justify-center text-[#a9484c]">
              <Users className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-900 leading-tight">{totalLeads}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Mengisi form mode demo</p>
          </div>
        </Card>

        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Prospek Baru
            </span>
            <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-amber-600 leading-tight">{newLeads}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Belum dihubungi sales</p>
          </div>
        </Card>

        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Sudah Dihubungi
            </span>
            <div className="size-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-sky-600 leading-tight">{contactedLeads}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Follow-up via WhatsApp</p>
          </div>
        </Card>

        <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl p-3">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-semibold text-[#7d6568] uppercase tracking-wider">
              Konversi / Deal
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-600 leading-tight">{convertedLeads}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Aktifkan Free/Paid</p>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH */}
      <Card className="border-[#f0dbd8] bg-white shadow-xs rounded-xl">
        <CardHeader className="p-3 sm:p-3.5 border-b border-[#f0dbd8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Daftar Prospek Masuk dari Mode Demo
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 mt-0.5">
              Calon pelanggan yang mencoba simulasi absensi mobile & dashboard demo.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-[#faf6f5] p-0.5 rounded-lg border border-[#f0dbd8]">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'new', label: 'Baru' },
                { id: 'contacted', label: 'Dihubungi' },
                { id: 'converted', label: 'Deal' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2 py-0.5 text-[11px] rounded-md transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-white text-[#8f3b3f] shadow-xs font-bold border border-[#f0dbd8]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[160px]">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari nama, usaha, WA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7.5 text-xs h-8 bg-white border-[#f0dbd8] text-slate-800 focus-visible:ring-[#a9484c]"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              disabled={isLoading}
              className="h-8 text-xs border-[#f0dbd8] bg-white hover:bg-slate-50 cursor-pointer px-2.5"
            >
              <RefreshCw className={`size-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#faf6f5] border-b border-[#f0dbd8]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2 pl-3.5">Calon Klien</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2">Nama Usaha & Staf</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2">Kontak</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2">Role Demo</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2">Waktu Masuk</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-600 uppercase py-2 text-right pr-3.5">Aksi Follow-Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                    Belum ada data leads prospek yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-slate-50/70 border-b border-[#f0dbd8]/60 transition-colors">
                    <TableCell className="pl-3.5 py-2 font-semibold text-xs text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <div className="size-6 rounded-full bg-[#fbf2f0] text-[#a9484c] flex items-center justify-center text-[9px] font-black shrink-0">
                          {(lead.name || 'P').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[130px]">{lead.name || 'Prospek Anonim'}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 text-xs text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Building2 className="size-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{lead.companyName || '-'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        👥 {lead.employeeCount ? `${lead.employeeCount} Karyawan` : 'Jumlah staf tidak diisi'}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 text-xs text-slate-600">
                      <div className="font-mono text-[11px] text-slate-800">{lead.phone || '-'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{lead.email}</div>
                    </TableCell>

                    <TableCell className="py-2 text-xs">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold border-slate-200 bg-slate-50 text-slate-700 py-0 px-1.5">
                        {lead.roleExplored || 'Owner'}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2 text-xs">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        lead.status === 'new'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : lead.status === 'contacted'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : lead.status === 'converted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.status === 'new' ? 'Baru' : lead.status === 'contacted' ? 'Dihubungi' : 'Deal'}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 text-[10px] text-slate-500 font-mono">
                      {new Date(lead.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    <TableCell className="py-2 pr-3.5 text-right">
                      {lead.phone ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenWa(lead)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1 px-2.5"
                        >
                          <MessageCircle className="size-3" />
                          Chat WhatsApp
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Tidak ada no WA</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
