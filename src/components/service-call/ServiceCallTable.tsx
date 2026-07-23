import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  ArrowUpDown 
} from 'lucide-react';
import { ServiceCallRecord } from '../../types';
import { formatDateIndonesian, formatKM, formatCurrencyIDR } from '../../lib/dateUtils';
import { excelService } from '../../services/excelService';
import Swal from 'sweetalert2';

interface ServiceCallTableProps {
  records: ServiceCallRecord[];
  onAdd: () => void;
  onEdit: (record: ServiceCallRecord) => void;
  onDelete: (id: string) => Promise<void>;
  onOpenImport: () => void;
  isLoading?: boolean;
}

export const ServiceCallTable: React.FC<ServiceCallTableProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
  onOpenImport,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ServiceCallRecord>('tanggal_invoice');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Search Filter
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase();
      return (
        r.vin?.toLowerCase().includes(q) ||
        r.no_polisi?.toLowerCase().includes(q) ||
        r.nama_customer?.toLowerCase().includes(q) ||
        r.no_invoice?.toLowerCase().includes(q) ||
        r.service_advisor?.toLowerCase().includes(q) ||
        r.tipe_kendaraan?.toLowerCase().includes(q) ||
        r.cabang?.toLowerCase().includes(q)
      );
    });
  }, [records, searchTerm]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage]);

  const toggleSort = (field: keyof ServiceCallRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = (record: ServiceCallRecord) => {
    Swal.fire({
      title: 'Hapus Service Call?',
      text: `Apakah Anda yakin ingin menghapus catatan service No. Invoice ${record.no_invoice} (${record.no_polisi})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await onDelete(record.id || record.no_invoice);
        Swal.fire('Terhapus!', 'Catatan Service Call berhasil dihapus.', 'success');
      }
    });
  };

  const handleExportExcel = () => {
    excelService.exportToExcel('Data_Service_Call_Toyota_Setiajaya', sortedRecords, 'SERVICE_CALL');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-800" />
            <span>Manajemen Data Service Call</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan aktivitas service bengkel resmi Toyota Setiajaya
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImport}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onAdd}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Service Call</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari No. Invoice, No. Polisi, Customer, VIN, SA..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-200 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th
                  onClick={() => toggleSort('tanggal_invoice')}
                  className="p-3.5 pl-5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Tgl Invoice / Entry</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Unit & No. Polisi</th>
                <th className="p-3.5">Customer & Kontak</th>
                <th className="p-3.5">Problem / Keluhan</th>
                <th className="p-3.5">Advisor & Cabang</th>
                <th className="p-3.5">No. Invoice & SO</th>
                <th className="p-3.5 pr-5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Memuat data Service Call...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada data Service Call. Silakan tambah data baru atau import file.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id || r.no_invoice} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5">
                      <span className="font-bold text-slate-900 block">
                        {formatDateIndonesian(r.tanggal_invoice || r.tanggal_entry)}
                      </span>
                      <span className="text-[10px] font-mono text-red-600 font-bold block">
                        {formatKM(r.km_service)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 text-sm block">{r.no_polisi}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">{r.vin}</span>
                      <span className="text-[11px] text-slate-700 block">{r.tipe_kendaraan}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{r.nama_customer}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{r.no_hp || r.no_wa}</span>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <span className="font-semibold text-slate-900 block line-clamp-1">{r.problem_definition}</span>
                      <span className="text-[10px] text-slate-400 block">{r.jenis_pekerjaan}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{r.service_advisor}</span>
                      <span className="text-[10px] text-slate-500 block">{r.cabang}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 font-mono block">INV: {r.no_invoice}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">SO: {r.no_so}</span>
                      <span className="text-[10px] font-bold text-slate-700 block mt-0.5">
                        {formatCurrencyIDR(r.estimasi_harga)}
                      </span>
                    </td>

                    <td className="p-3.5 pr-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Data"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(r)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            Menampilkan <strong>{paginatedRecords.length}</strong> dari <strong>{sortedRecords.length}</strong> data Service Call
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
