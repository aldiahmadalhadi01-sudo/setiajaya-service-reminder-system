import React, { useState, useMemo } from 'react';
import { 
  BellRing, 
  Search, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  PhoneCall
} from 'lucide-react';
import { ReminderItem, ReminderStatus } from '../../types';
import { formatDateIndonesian, formatKM } from '../../lib/dateUtils';
import { buildWhatsAppReminderUrl } from '../../lib/reminderUtils';
import { excelService } from '../../services/excelService';

interface ReminderTableProps {
  reminders: ReminderItem[];
  isLoading?: boolean;
}

export const ReminderTable: React.FC<ReminderTableProps> = ({ reminders, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'selisih_hari' | 'nama_customer' | 'model'>('selisih_hari');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Search Logic
  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      const matchSearch =
        item.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_polisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_wa.includes(searchTerm);

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [reminders, searchTerm, statusFilter]);

  // Sort Logic
  const sortedReminders = useMemo(() => {
    return [...filteredReminders].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredReminders, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedReminders.length / pageSize) || 1;
  const paginatedReminders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedReminders.slice(start, start + pageSize);
  }, [sortedReminders, currentPage]);

  const toggleSort = (field: 'selisih_hari' | 'nama_customer' | 'model') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const exportData = sortedReminders.map((r) => ({
      VIN: r.vin,
      'No. Polisi': r.no_polisi,
      'Nama Customer': r.nama_customer,
      'No. WhatsApp': r.no_wa,
      Model: r.model,
      'KM Terakhir': r.km_terakhir,
      'Service Terakhir': r.service_terakhir,
      'Jadwal Service Berikutnya': r.jadwal_berikutnya,
      'Selisih Hari': r.selisih_hari,
      Status: r.status,
      'Jenis Service': r.nextServiceType
    }));
    excelService.exportToCSV('Reminder_Service_Toyota_Setiajaya', exportData);
  };

  const getStatusBadge = (status: ReminderStatus, selisih: number) => {
    switch (status) {
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>OVERDUE ({Math.abs(selisih)} hr lalu)</span>
          </span>
        );
      case 'HARI INI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>HARI INI</span>
          </span>
        );
      case 'H-7':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>H-{selisih} ({selisih} hari lagi)</span>
          </span>
        );
      case 'AMAN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>AMAN ({selisih} hari)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-400" />
            <span>Reminder Service Berkala Kendaraan</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Sistem otomatis menghitung jadwal service berikutnya secara realtime berdasarkan tanggal DEC (+1 bulan service 1, +6 bulan service 2, dan setiap +6 bulan selanjutnya).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Data Reminder</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari VIN, No. Polisi, Customer, Model, No. WA..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'Semua Status' },
            { key: 'OVERDUE', label: 'Overdue' },
            { key: 'HARI INI', label: 'Hari Ini' },
            { key: 'H-7', label: 'H-7' },
            { key: 'AMAN', label: 'Aman' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setStatusFilter(f.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                statusFilter === f.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-200 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3.5 pl-5">Identitas Unit</th>
                <th
                  onClick={() => toggleSort('nama_customer')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer & Kontak</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('model')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Model Kendaraan</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Service Terakhir</th>
                <th
                  onClick={() => toggleSort('selisih_hari')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Jadwal Berikutnya</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Status Reminder</th>
                <th className="p-3.5 pr-5 text-center">Aksi Follow Up</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Memuat data reminder service...
                  </td>
                </tr>
              ) : paginatedReminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data reminder yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedReminders.map((item) => {
                  const waUrl = buildWhatsAppReminderUrl(item);

                  return (
                    <tr key={item.vin} className="hover:bg-slate-50/80 transition-colors">
                      {/* Identitas Unit */}
                      <td className="p-3.5 pl-5">
                        <span className="font-bold text-slate-900 text-sm block">
                          {item.no_polisi}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 uppercase block tracking-wider">
                          VIN: {item.vin}
                        </span>
                      </td>

                      {/* Customer & Kontak */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{item.nama_customer}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.no_wa || item.no_hp || '-'}</span>
                        </div>
                      </td>

                      {/* Model */}
                      <td className="p-3.5 font-medium text-slate-900">
                        <span>{item.model}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {item.nextServiceType}
                        </span>
                      </td>

                      {/* Service Terakhir */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {formatDateIndonesian(item.service_terakhir)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatKM(item.km_terakhir)}
                        </span>
                      </td>

                      {/* Jadwal Berikutnya */}
                      <td className="p-3.5 font-bold text-slate-900">
                        <span>{formatDateIndonesian(item.jadwal_berikutnya)}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        {getStatusBadge(item.status, item.selisih_hari)}
                      </td>

                      {/* WA Action Button */}
                      <td className="p-3.5 pr-5 text-center">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95"
                          title="Kirim Pesan Pengingat Service via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            Menampilkan <strong>{paginatedReminders.length}</strong> dari <strong>{sortedReminders.length}</strong> unit
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-slate-800">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
