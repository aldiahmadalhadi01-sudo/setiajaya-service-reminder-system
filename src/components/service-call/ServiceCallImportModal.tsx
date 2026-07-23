import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Download, 
  ArrowRight, 
  RefreshCw,
  CopyCheck 
} from 'lucide-react';
import { excelService, ParsedFileResult } from '../../services/excelService';
import { ServiceCallRecord, ImportSummaryResult } from '../../types';
import toast from 'react-hot-toast';

interface ServiceCallImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (
    items: ServiceCallRecord[],
    duplicateMode: 'skip' | 'replace' | 'all'
  ) => Promise<ImportSummaryResult>;
}

export const ServiceCallImportModal: React.FC<ServiceCallImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedFileResult | null>(null);
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'replace' | 'all'>('skip');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState<ImportSummaryResult | null>(null);

  if (!isOpen) return null;

  const scTargetFields = [
    { key: 'week', label: 'Week' },
    { key: 'cabang', label: 'Cabang' },
    { key: 'service_advisor', label: 'Service Advisor' },
    { key: 'tanggal_entry', label: 'Tanggal Entry' },
    { key: 'call_id', label: 'Call ID' },
    { key: 'kode_customer', label: 'Kode Customer' },
    { key: 'nama_customer', label: 'Nama Customer' },
    { key: 'no_hp', label: 'Nomor HP' },
    { key: 'no_wa', label: 'Nomor WA' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'kelurahan', label: 'Kelurahan' },
    { key: 'kecamatan', label: 'Kecamatan' },
    { key: 'kota', label: 'Kota' },
    { key: 'kode_pos', label: 'Kode Pos' },
    { key: 'ring_area', label: 'Ring Area' },
    { key: 'tipe_kendaraan', label: 'Tipe Kendaraan' },
    { key: 'vin', label: 'VIN (Nomor Rangka)' },
    { key: 'no_mesin', label: 'Nomor Mesin' },
    { key: 'no_polisi', label: 'Nomor Polisi' },
    { key: 'tahun_rakit', label: 'Tahun Rakit' },
    { key: 'tanggal_do', label: 'Tanggal DO' },
    { key: 'point_of_service', label: 'Point of Service' },
    { key: 'problem_definition', label: 'Problem / Keluhan' },
    { key: 'estimasi_harga', label: 'Estimasi Harga' },
    { key: 'no_voucher', label: 'Nomor Voucher' },
    { key: 'km_service', label: 'KM Service' },
    { key: 'jenis_pekerjaan', label: 'Jenis Pekerjaan' },
    { key: 'tipe_promo', label: 'Tipe Promo' },
    { key: 'ssc', label: 'SSC' },
    { key: 'dealer_penjual', label: 'Dealer Penjual' },
    { key: 'group', label: 'Group' },
    { key: 'area_dealer', label: 'Area Dealer' },
    { key: 't_Care', label: 'T-Care' },
    { key: 'up_selling', label: 'Up Selling' },
    { key: 'cross_selling', label: 'Cross Selling' },
    { key: 'no_so', label: 'Nomor SO' },
    { key: 'tanggal_so', label: 'Tanggal SO' },
    { key: 'no_invoice', label: 'Nomor Invoice' },
    { key: 'tanggal_invoice', label: 'Tanggal Invoice' },
    { key: 'next_service', label: 'Next Service' },
    { key: 'so_key', label: 'SO Key' },
    { key: 'invoice_key', label: 'Invoice Key' },
    { key: 'alamat_domisili', label: 'Alamat Domisili' },
    { key: 'ring_area_domisili', label: 'Ring Area Domisili' },
    { key: 'nama_laporan', label: 'Nama Laporan' },
    { key: 'periode', label: 'Periode' }
  ];

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setImportSummary(null);

    try {
      const res = await excelService.parseFile(selectedFile, 0);
      setParsedResult(res);
      autoMapHeaders(res.headers);
    } catch (err: any) {
      toast.error(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const autoMapHeaders = (fileHeaders: string[]) => {
    const mapping: Record<string, string> = {};
    scTargetFields.forEach((tf) => {
      const match = fileHeaders.find((fh) => {
        const cleanFh = fh.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanKey = tf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLabel = tf.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanFh === cleanKey || cleanFh === cleanLabel || cleanFh.includes(cleanKey);
      });
      mapping[tf.key] = match || '';
    });
    setHeaderMapping(mapping);
  };

  const handleStartImport = async () => {
    if (!parsedResult || parsedResult.data.length === 0) {
      toast.error('Tidak ada data untuk diimpor');
      return;
    }

    setIsImporting(true);

    try {
      const mappedRows = excelService.mapHeaders(parsedResult.data, headerMapping) as ServiceCallRecord[];
      const summary = await onImportSuccess(mappedRows, duplicateMode);
      setImportSummary(summary);
      toast.success(`Batch Import Selesai: ${summary.success} berhasil, ${summary.duplicates} duplikat.`);
    } catch (err) {
      toast.error('Gagal memproses batch import Service Call');
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedResult(null);
    setHeaderMapping({});
    setImportSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 text-emerald-400 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Import Data Service Call (Excel / CSV)</h3>
              <p className="text-xs text-slate-300">Unggah file .xlsx, .xls, .csv dengan deteksi duplikat otomatis</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Step 1: Upload Dropzone */}
          {!parsedResult && !importSummary && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-slate-600 rounded-2xl p-10 text-center bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-emerald-600">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-800 block">
                  Drag & Drop file Excel / CSV Service Call di sini
                </span>
                <span className="text-slate-400 block mt-1">Mendukung format .xlsx, .xls, dan .csv</span>
              </div>

              <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs">
                <span>Pilih File dari Komputer</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Mapping & Duplicate Mode Selection */}
          {parsedResult && !importSummary && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">{file?.name}</span>
                  <span className="text-slate-500">({parsedResult.data.length} baris data)</span>
                </div>
              </div>

              {/* Duplicate Handling Strategy */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
                <label className="font-bold text-amber-900 text-xs flex items-center gap-2">
                  <CopyCheck className="w-4 h-4 text-amber-600" />
                  <span>Strategi Penanganan Data Duplikat (VIN & Invoice yang sama):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('skip')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      duplicateMode === 'skip'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Skip (Lewati)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('replace')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      duplicateMode === 'replace'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Replace (Timpa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('all')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      duplicateMode === 'all'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Import Semua
                  </button>
                </div>
              </div>

              {/* Header Mapping Config */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Header Mapping (Pemetaan Kolom)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {scTargetFields.map((tf) => (
                    <div key={tf.key} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-700">{tf.label}:</span>
                      <select
                        value={headerMapping[tf.key] || ''}
                        onChange={(e) => setHeaderMapping({ ...headerMapping, [tf.key]: e.target.value })}
                        className="p-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 text-xs w-44"
                      >
                        <option value="">-- Abaikan / Blank --</option>
                        {parsedResult.headers.map((fh) => (
                          <option key={fh} value={fh}>{fh}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Import Results */}
          {importSummary && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Import Service Call Selesai!</h4>
                  <p className="text-xs text-emerald-800">
                    Proses batch import data Service Call telah diproses dengan sukses.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-bold">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">TOTAL</span>
                  <span className="text-base text-slate-900">{importSummary.total}</span>
                </div>
                <div className="p-3 bg-white border border-emerald-200 rounded-xl text-emerald-600">
                  <span className="text-emerald-500 block text-[10px]">BERHASIL</span>
                  <span className="text-base">{importSummary.success}</span>
                </div>
                <div className="p-3 bg-white border border-amber-200 rounded-xl text-amber-600">
                  <span className="text-amber-500 block text-[10px]">DUPLIKAT</span>
                  <span className="text-base">{importSummary.duplicates}</span>
                </div>
                <div className="p-3 bg-white border border-rose-200 rounded-xl text-rose-600">
                  <span className="text-rose-500 block text-[10px]">GAGAL</span>
                  <span className="text-base">{importSummary.failed}</span>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <button
                  onClick={() => excelService.downloadErrorLog('ServiceCall_Import', importSummary.errors)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Error Log ({importSummary.errors.length} Baris Error)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {parsedResult && !importSummary ? (
            <button
              onClick={resetModal}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-xs"
            >
              Ganti File
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>

            {parsedResult && !importSummary && (
              <button
                type="button"
                onClick={handleStartImport}
                disabled={isImporting}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isImporting ? 'Mengimpor...' : 'Proses Import Ke SERVICE_CALL'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
