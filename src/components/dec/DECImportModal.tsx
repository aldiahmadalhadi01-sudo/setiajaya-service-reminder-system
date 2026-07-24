import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { excelService, ParsedFileResult } from '../../services/excelService';
import { DECRecord, ImportSummaryResult } from '../../types';
import toast from 'react-hot-toast';

interface DECImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (items: DECRecord[]) => Promise<ImportSummaryResult>;
}

export const DECImportModal: React.FC<DECImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedFileResult | null>(null);
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState<ImportSummaryResult | null>(null);

  if (!isOpen) return null;

  const decTargetFields = [
    { key: 'bulan', label: 'Bulan' },
    { key: 'tanggal_dec', label: 'Tanggal DEC' },
    { key: 'nama_customer', label: 'Nama Customer' },
    { key: 'payment', label: 'Payment' },
    { key: 'phone_customer', label: 'Nomor HP / WA' },
    { key: 'model', label: 'Model Kendaraan' },
    { key: 'vin', label: 'VIN (Nomor Rangka)' },
    { key: 'sales', label: 'Sales Name' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'kota', label: 'Kota' }
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

  const handleSheetChange = async (sheetIdx: number) => {
    if (!file) return;
    setSelectedSheetIdx(sheetIdx);
    setIsParsing(true);

    try {
      const res = await excelService.parseFile(file, sheetIdx);
      setParsedResult(res);
      autoMapHeaders(res.headers);
    } catch (err: any) {
      toast.error('Gagal membaca sheet pilihan');
    } finally {
      setIsParsing(false);
    }
  };

  const autoMapHeaders = (fileHeaders: string[]) => {
    const mapping: Record<string, string> = {};
    decTargetFields.forEach((tf) => {
      const match = fileHeaders.find((fh) => {
        const cleanFh = fh.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanKey = tf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLabel = tf.label.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (cleanFh === cleanKey || cleanFh === cleanLabel) return true;
        if (tf.key === 'vin' && (cleanFh.includes('rangka') || cleanFh.includes('vin') || cleanFh.includes('chassis') || cleanFh.includes('frame'))) return true;
        if (tf.key === 'nama_customer' && (cleanFh.includes('customer') || cleanFh.includes('nama') || cleanFh.includes('pelanggan') || cleanFh.includes('cust'))) return true;
        if (tf.key === 'phone_customer' && (cleanFh.includes('phone') || cleanFh.includes('hp') || cleanFh.includes('wa') || cleanFh.includes('telp') || cleanFh.includes('kontak'))) return true;
        if (tf.key === 'tanggal_dec' && (cleanFh.includes('tanggal') || cleanFh.includes('tgl') || cleanFh.includes('date'))) return true;
        if (tf.key === 'sales' && (cleanFh.includes('sales') || cleanFh.includes('salesman') || cleanFh.includes('person'))) return true;
        if (tf.key === 'model' && (cleanFh.includes('model') || cleanFh.includes('tipe') || cleanFh.includes('kendaraan') || cleanFh.includes('unit'))) return true;
        return cleanFh.includes(cleanKey);
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
      // Map rows using selected header mapping
      const mappedRows = excelService.mapHeaders(parsedResult.data, headerMapping) as DECRecord[];
      
      const summary = await onImportSuccess(mappedRows);
      if (summary) {
        setImportSummary(summary);
        if (summary.success > 0) {
          toast.success(`Berhasil mengimpor ${summary.success} data DEC!`);
        } else {
          toast.error(`Import selesai tetapi 0 data berhasil. Alasan: ${summary.errors[0]?.reason || 'VIN tidak ditemukan'}`);
        }
      } else {
        toast.error('Gagal memproses batch import: respon server kosong');
      }
    } catch (err: any) {
      toast.error(`Gagal memproses batch import DEC: ${err.message || 'Error server/koneksi'}`);
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 text-emerald-400 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Import Data DEC (Excel / CSV)</h3>
              <p className="text-xs text-slate-300">Unggah file .xlsx, .xls, atau .csv untuk append data ke sheet DEC</p>
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
          {/* Step 1: Upload File if no file parsed */}
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
                  Drag & Drop file Excel / CSV di sini
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

          {/* Step 2: Worksheet selection & Mapping Preview */}
          {parsedResult && !importSummary && (
            <div className="space-y-4">
              {/* File details & Worksheet Picker */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">{file?.name}</span>
                  <span className="text-slate-500">({parsedResult.data.length} baris ditemukan)</span>
                </div>

                {parsedResult.sheetNames.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Pilih Sheet:</span>
                    <select
                      value={selectedSheetIdx}
                      onChange={(e) => handleSheetChange(Number(e.target.value))}
                      className="p-1 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      {parsedResult.sheetNames.map((sName, idx) => (
                        <option key={idx} value={idx}>{sName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Header Mapping Configuration */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Header Mapping (Pemetaan Kolom)</h4>
                <p className="text-slate-500">Sesuaikan nama kolom di file Anda dengan kolom target sheet DEC:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {decTargetFields.map((tf) => (
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

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-900 text-white font-bold flex justify-between items-center">
                  <span>Pratinjau 5 Baris Pertama</span>
                  <span className="text-slate-400 font-normal">Total {parsedResult.data.length} Baris</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                      <tr>
                        {decTargetFields.map((tf) => (
                          <th key={tf.key} className="p-2.5">{tf.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.data.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {decTargetFields.map((tf) => {
                            const colName = headerMapping[tf.key];
                            return (
                              <td key={tf.key} className="p-2.5 text-slate-800">
                                {colName ? String(row[colName] || '-') : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Import Results Summary */}
          {importSummary && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Import Batch Selesai!</h4>
                  <p className="text-xs text-emerald-800">
                    Proses import data DEC telah selesai diproses.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center font-bold">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">TOTAL DATA</span>
                  <span className="text-lg text-slate-900">{importSummary.total}</span>
                </div>
                <div className="p-3 bg-white border border-emerald-200 rounded-xl text-emerald-600">
                  <span className="text-emerald-500 block text-[10px]">BERHASIL</span>
                  <span className="text-lg">{importSummary.success}</span>
                </div>
                <div className="p-3 bg-white border border-rose-200 rounded-xl text-rose-600">
                  <span className="text-rose-500 block text-[10px]">GAGAL</span>
                  <span className="text-lg">{importSummary.failed}</span>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => excelService.downloadErrorLog('DEC_Import', importSummary.errors)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Error Log ({importSummary.errors.length} Baris Error)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
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
                <span>{isImporting ? 'Mengimpor...' : 'Proses Import Ke DEC'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
