import React, { useState, useMemo } from 'react';
import { 
  FileText, 
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
import { DECRecord } from '../../types';
import { formatDateIndonesian } from '../../lib/dateUtils';
import { excelService } from '../../services/excelService';
import Swal from 'sweetalert2';

interface DECTableProps {
  records: DECRecord[];
  onAdd: () => void;
  onEdit: (record: DECRecord) => void;
  onDelete: (id: string) => Promise<void>;
  onOpenImport: () => void;
  isLoading?: boolean;
}

export const DECTable: React.FC<DECTableProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
  onOpenImport,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof DECRecord>('tanggal_dec');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Search Filter
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase();
      return (
        r.vin?.toLowerCase().includes(q) ||
        r.nama_customer?.toLowerCase().includes(q) ||
        r.model?.toLowerCase().includes(q) ||
        r.sales?.toLowerCase().includes(q) ||
        r.phone_customer?.includes(q) ||
        r.kota?.toLowerCase().includes(q)
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

  const toggleSort = (field: keyof DECRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = (record: DECRecord) => {
    Swal.fire({
      title: 'Hapus Data DEC?',
      text: `Apakah Anda yakin ingin menghapus data DEC customer ${record.nama_customer} (${record.vin})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await onDelete(record.id || record.vin);
        Swal.fire('Terhapus!', 'Data DEC berhasil dihapus.', 'success');
      }
    });
  };

  const handleExportCSV = () => {
    excelService.exportToCSV('Data_DEC_Toyota_Setiajaya', sortedRecords);
  };

  const handleExportExcel = () => {
    excelService.exportToExcel('Data_DEC_Toyota_Setiajaya', sortedRecords, 'DEC');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-800" />
            <span>Manajemen Data DEC (Delivery Order)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar penyerahan unit kendaraan baru Toyota Setiajaya
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
            <span>Tambah DEC</span>
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
            placeholder="Cari VIN, Customer, Model, Sales, Kota..."
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
                  onClick={() => toggleSort('tanggal_dec')}
                  className="p-3.5 pl-5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Tgl DEC / Bulan</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('nama_customer')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Customer</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('model')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Model & VIN</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Sales</th>
                <th className="p-3.5">Kota / Alamat</th>
                <th className="p-3.5 pr-5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Memuat data DEC...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada data DEC. Silakan tambah data baru atau import file.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id || r.vin} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5">
                      <span className="font-bold text-slate-900 block">
                        {formatDateIndonesian(r.tanggal_dec)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{r.bulan}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{r.nama_customer}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{r.phone_customer}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{r.model}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                        {r.vin}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                        {r.payment}
                      </span>
                    </td>

                    <td className="p-3.5 font-medium text-slate-900">{r.sales}</td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900 block">{r.kota}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                        {r.alamat || '-'}
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
            Menampilkan <strong>{paginatedRecords.length}</strong> dari <strong>{sortedRecords.length}</strong> data DEC
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
