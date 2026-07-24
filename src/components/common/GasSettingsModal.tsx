import React, { useState } from 'react';
import { X, Check, Copy, Link, ExternalLink, ShieldAlert, Sparkles, FileSpreadsheet, Download } from 'lucide-react';
import { GasConfig } from '../../types';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { excelService } from '../../services/excelService';

interface GasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onSaveConfig: (newConfig: GasConfig) => void;
}

export const GasSettingsModal: React.FC<GasSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [isLive, setIsLive] = useState(config.isLive);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      toast.error('Masukkan Web App URL Google Apps Script terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    try {
      const res = await apiService.testGasUrl(webAppUrl.trim());
      if (res.success) {
        toast.success(res.message || 'Koneksi Google Apps Script Berhasil!');
        setIsLive(true);
      } else {
        toast.error(res.message || 'Gagal terhubung ke Web App URL.');
      }
    } catch (err: any) {
      toast.error('Gagal terhubung ke Web App URL. Pastikan akses diset ke "Siapa Saja / Anyone"');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const updated: GasConfig = {
      ...config,
      webAppUrl: webAppUrl.trim(),
      isLive: isLive && !!webAppUrl.trim()
    };

    try {
      await apiService.updateConfig(updated);
      onSaveConfig(updated);
      toast.success('Pengaturan Google Apps Script tersimpan!');
      onClose();
    } catch (err) {
      toast.error('Gagal menyimpan konfigurasi');
    }
  };

  const copyGASCode = async () => {
    try {
      const gasCode = `/**
 * TOYOTA SETIAJAYA SERVICE ANALYTICS & REMINDER SYSTEM
 * Google Apps Script Web App REST API Backend Engine
 */
const SHEET_DEC_NAME = 'DEC';
const SHEET_SERVICE_CALL_NAME = 'SERVICE_CALL';

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    let params = e.parameter || {};
    let postData = {};
    if (e.postData && e.postData.contents) {
      try { postData = JSON.parse(e.postData.contents); } catch (err) {}
    }
    const action = params.action || postData.action || 'getDashboard';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let result = { success: false, message: 'Invalid action' };

    switch (action) {
      case 'getDEC': result = getDECData(spreadsheet, params.search); break;
      case 'saveDEC': result = saveDECData(spreadsheet, postData.data || postData); break;
      case 'deleteDEC': result = deleteDECData(spreadsheet, params.vin || postData.vin); break;
      case 'getServiceCall': result = getServiceCallData(spreadsheet, params.search); break;
      case 'saveServiceCall': result = saveServiceCallData(spreadsheet, postData.data || postData); break;
      case 'deleteServiceCall': result = deleteServiceCallData(spreadsheet, params.id || postData.id); break;
      case 'batchImportDEC': result = batchImportDEC(spreadsheet, postData.items || []); break;
      case 'batchImportServiceCall': result = batchImportServiceCall(spreadsheet, postData.items || [], postData.duplicateMode || 'skip'); break;
      case 'getDashboard': result = getDashboardAnalytics(spreadsheet); break;
      default: result = { success: false, message: 'Unknown action: ' + action }; break;
    }
    return responseJSON(result);
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  } finally { lock.releaseLock(); }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getSheetRecords(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\\s+/g, '_'));
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1] && !row[2]) continue;
    const record = {};
    headers.forEach((h, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) val = Utilities.formatDate(val, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
      record[h] = val;
    });
    record.rowIndex = i + 1;
    records.push(record);
  }
  return records;
}

function getDECData(spreadsheet, search) {
  const records = getSheetRecords(spreadsheet, SHEET_DEC_NAME);
  return { success: true, count: records.length, data: records };
}

function saveDECData(spreadsheet, record) {
  let sheet = spreadsheet.getSheetByName(SHEET_DEC_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_DEC_NAME);
  const cleanVin = String(record.vin || '').trim().toUpperCase();
  if (!cleanVin) return { success: false, message: 'VIN wajib diisi' };
  const rowValues = [
    record.bulan || '', record.tanggal_dec || '', record.nama_customer || '',
    record.payment || '', record.phone_customer || '', record.model || '',
    cleanVin, record.sales || '', record.alamat || '', record.kota || ''
  ];
  sheet.appendRow(rowValues);
  return { success: true, message: 'Data DEC berhasil disimpan' };
}

function getServiceCallData(spreadsheet, search) {
  const records = getSheetRecords(spreadsheet, SHEET_SERVICE_CALL_NAME);
  return { success: true, count: records.length, data: records };
}

function saveServiceCallData(spreadsheet, record) {
  let sheet = spreadsheet.getSheetByName(SHEET_SERVICE_CALL_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_SERVICE_CALL_NAME);
  const cleanVin = String(record.vin || '').trim().toUpperCase();
  if (!cleanVin) return { success: false, message: 'VIN wajib diisi' };
  const rowValues = [
    record.week || '', record.cabang || '', record.service_advisor || '', record.tanggal_entry || '',
    record.call_id || '', record.kode_customer || '', record.nama_customer || '', record.no_hp || '',
    record.no_wa || '', record.alamat || '', record.kelurahan || '', record.kecamatan || '',
    record.kota || '', record.kode_pos || '', record.ring_area || '', record.tipe_kendaraan || '',
    cleanVin, record.no_mesin || '', record.no_polisi || '', record.tahun_rakit || '',
    record.tanggal_do || '', record.point_of_service || '', record.problem_definition || '',
    record.estimasi_harga || 0, record.no_voucher || '', record.km_service || 0,
    record.jenis_pekerjaan || '', record.tipe_promo || '', record.ssc || '', record.dealer_penjual || '',
    record.group || '', record.area_dealer || '', record.t_Care || '', record.up_selling || '',
    record.cross_selling || '', record.no_so || '', record.tanggal_so || '', record.no_invoice || '',
    record.tanggal_invoice || '', record.next_service || '', record.so_key || '', record.invoice_key || '',
    record.alamat_domisili || '', record.ring_area_domisili || '', record.nama_laporan || '', record.periode || ''
  ];
  sheet.appendRow(rowValues);
  return { success: true, message: 'Data Service Call berhasil disimpan' };
}

function batchImportDEC(spreadsheet, items) {
  let sheet = spreadsheet.getSheetByName(SHEET_DEC_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_DEC_NAME);
  if (!items || items.length === 0) return { success: false };
  const rowsToAdd = items.map(record => [
    record.bulan || '', record.tanggal_dec || '', record.nama_customer || '',
    record.payment || '', record.phone_customer || '', record.model || '',
    String(record.vin || '').toUpperCase().trim(), record.sales || '', record.alamat || '', record.kota || ''
  ]);
  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }
  return { success: true, imported: rowsToAdd.length };
}

function batchImportServiceCall(spreadsheet, items, duplicateMode) {
  let sheet = spreadsheet.getSheetByName(SHEET_SERVICE_CALL_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_SERVICE_CALL_NAME);
  if (!items || items.length === 0) return { success: false };
  const rowsToAdd = items.map(record => [
    record.week || '', record.cabang || '', record.service_advisor || '', record.tanggal_entry || '',
    record.call_id || '', record.kode_customer || '', record.nama_customer || '', record.no_hp || '',
    record.no_wa || '', record.alamat || '', record.kelurahan || '', record.kecamatan || '',
    record.kota || '', record.kode_pos || '', record.ring_area || '', record.tipe_kendaraan || '',
    String(record.vin || '').toUpperCase().trim(), record.no_mesin || '', record.no_polisi || '', record.tahun_rakit || '',
    record.tanggal_do || '', record.point_of_service || '', record.problem_definition || '',
    record.estimasi_harga || 0, record.no_voucher || '', record.km_service || 0,
    record.jenis_pekerjaan || '', record.tipe_promo || '', record.ssc || '', record.dealer_penjual || '',
    record.group || '', record.area_dealer || '', record.t_Care || '', record.up_selling || '',
    record.cross_selling || '', record.no_so || '', record.tanggal_so || '', record.no_invoice || '',
    record.tanggal_invoice || '', record.next_service || '', record.so_key || '', record.invoice_key || '',
    record.alamat_domisili || '', record.ring_area_domisili || '', record.nama_laporan || '', record.periode || ''
  ]);
  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }
  return { success: true, imported: rowsToAdd.length };
}

function getDashboardAnalytics(spreadsheet) {
  const decRecords = getSheetRecords(spreadsheet, SHEET_DEC_NAME);
  const scRecords = getSheetRecords(spreadsheet, SHEET_SERVICE_CALL_NAME);
  return { success: true, totalDEC: decRecords.length, totalServiceCall: scRecords.length, decData: decRecords, serviceCallData: scRecords };
}`;

      await navigator.clipboard.writeText(gasCode);
      setCopiedScript(true);
      toast.success('Kode Google Apps Script disalin ke clipboard!');
      setTimeout(() => setCopiedScript(false), 3000);
    } catch (err) {
      toast.error('Gagal menyalin kode script');
    }
  };

  const handleDownloadDECTemplate = () => {
    const template = [
      {
        bulan: 'Januari',
        tanggal_dec: '2025-01-10',
        nama_customer: 'Budi Santoso',
        payment: 'Cash',
        phone_customer: '081234567890',
        model: 'Innova Zenix Q Hybrid',
        vin: 'MHKSJ100120250001',
        sales: 'Agus Setiawan',
        alamat: 'Jl. Margonda Raya No. 45',
        kota: 'Depok'
      }
    ];
    excelService.exportToExcel('Template_Sheet_DEC_Toyota', template, 'DEC');
    toast.success('Template Sheet DEC diunduh!');
  };

  const handleDownloadSCTemplate = () => {
    const template = [
      {
        week: 'W1',
        cabang: 'Toyota Setiajaya Depok',
        service_advisor: 'Rudi Hermawan',
        tanggal_entry: '2025-02-12',
        call_id: 'CALL-2025-001',
        kode_customer: 'CUST-001',
        nama_customer: 'Budi Santoso',
        no_hp: '081234567890',
        no_wa: '081234567890',
        alamat: 'Jl. Margonda Raya No. 45',
        kelurahan: 'Pondok Cina',
        kecamatan: 'Beji',
        kota: 'Depok',
        kode_pos: '16424',
        ring_area: 'Ring 1',
        tipe_kendaraan: 'Innova Zenix Q Hybrid',
        vin: 'MHKSJ100120250001',
        no_mesin: 'M15A-FXE-991',
        no_polisi: 'B 1001 SJ',
        tahun_rakit: '2025',
        tanggal_do: '2025-01-10',
        point_of_service: 'Bengkel Resmi',
        problem_definition: 'Service Berkala 1.000 KM',
        estimasi_harga: 0,
        no_voucher: 'VOUCHER-FREE-1K',
        km_service: 1000,
        jenis_pekerjaan: 'Service Berkala',
        tipe_promo: 'Free Service T-Care',
        ssc: 'Tidak',
        dealer_penjual: 'Setiajaya Depok',
        group: 'Setiajaya Group',
        area_dealer: 'Jabodetabek',
        t_Care: 'Aktif',
        up_selling: '-',
        cross_selling: '-',
        no_so: 'SO-2025-00101',
        tanggal_so: '2025-02-12',
        no_invoice: 'INV-2025-00101',
        tanggal_invoice: '2025-02-12',
        next_service: '2025-07-10',
        so_key: 'SOKEY-00101',
        invoice_key: 'INVKEY-00101',
        alamat_domisili: 'Jl. Margonda Raya No. 45',
        ring_area_domisili: 'Ring 1',
        nama_laporan: 'Laporan Service Harian',
        periode: '2025-02'
      }
    ];
    excelService.exportToExcel('Template_Sheet_SERVICE_CALL_Toyota', template, 'SERVICE_CALL');
    toast.success('Template Sheet SERVICE_CALL diunduh!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Pengaturan Google Apps Script REST API</h3>
              <p className="text-xs text-slate-300">Integrasi Google Spreadsheet Toyota Setiajaya</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Mode Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-sm font-bold text-slate-900 block mb-2">Mode Operasional Sistem</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsLive(false)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  !isLive
                    ? 'border-red-600 bg-red-50/50 text-red-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">Demo Mode (In-Memory)</span>
                <span className="text-[11px] text-slate-500">
                  Menggunakan database reaktif dalam memori server untuk demonstrasi instan.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsLive(true)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  isLive
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">Live Google Spreadsheet</span>
                <span className="text-[11px] text-slate-500">
                  Menghubungkan langsung ke Google Spreadsheet via REST API Web App.
                </span>
              </button>
            </div>
          </div>

          {/* Web App URL / Google Sheet Link Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Link Google Sheet / Web App URL</span>
              <span className="text-xs text-red-600 font-normal">*Diperlukan untuk Live Mode</span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="Paste Link Google Sheet (https://docs.google.com/spreadsheets/d/...) atau Web App URL"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-50"
              >
                {isTesting ? 'Menguji...' : 'Uji Koneksi'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1">
              Bisa langsung memasukkan <strong>Link Google Spreadsheet</strong> (Akses: "Siapa saja yang memiliki link") atau <strong>Web App URL Apps Script</strong>.
            </p>
          </div>

          {/* Template Download Section */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Unduh Template Google Spreadsheet / Excel</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadDECTemplate}
                className="flex items-center justify-center gap-2 p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Template Sheet DEC</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSCTemplate}
                className="flex items-center justify-center gap-2 p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Template Sheet SERVICE_CALL</span>
              </button>
            </div>
          </div>

          {/* Setup Guide Instructions */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm">Panduan Pasang Apps Script Backend:</span>
              <button
                type="button"
                onClick={copyGASCode}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Tersalin!' : 'Salin Kode GS'}</span>
              </button>
            </div>

            <ol className="list-decimal pl-4 space-y-1 text-slate-300 leading-relaxed">
              <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
              <li>Buat 2 tab worksheet bernama: <strong className="text-white">DEC</strong> dan <strong className="text-white">SERVICE_CALL</strong>.</li>
              <li>Buka menu <strong className="text-white">Ekstensi &gt; Apps Script</strong>.</li>
              <li>Hapus semua kode lama, lalu <strong className="text-white">Paste (Tempel)</strong> kode GS yang sudah disalin di atas.</li>
              <li>Klik tombol <strong className="text-white">Deploy &gt; New Deployment</strong>. Pilih jenis <strong className="text-white">Web App</strong>.</li>
              <li>Set <strong className="text-white">Execute as</strong> = <em>Me</em> dan <strong className="text-white">Who has access</strong> = <em>Siapa Saja (Anyone)</em>.</li>
              <li>Klik Deploy, lalu salin Web App URL ke kolom input di atas!</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-900/20"
          >
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
};
