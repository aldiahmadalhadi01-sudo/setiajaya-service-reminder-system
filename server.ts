import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DEC_RECORDS, INITIAL_SERVICE_CALL_RECORDS } from './src/data/mockData';
import { DECRecord, ServiceCallRecord, DashboardKPI, TrendDataPoint, DealerDistData, RingAreaData, LeaderboardSAItem, ImportSummaryResult } from './src/types';
import { calculateReminders } from './src/lib/reminderUtils';
import { normalizeDateToISO } from './src/lib/dateUtils';

// In-Memory Database State for fallback/demo mode
let decDatabase: DECRecord[] = [...INITIAL_DEC_RECORDS];
let serviceCallDatabase: ServiceCallRecord[] = [...INITIAL_SERVICE_CALL_RECORDS];

// User Config State for Google Spreadsheet Link
const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1TAryGER_qTCumZ0xza-WGm3StAQSTepK5SlXOItz8ZU/edit?usp=drive_link';

let gasConfig = {
  webAppUrl: process.env.GAS_WEB_APP_URL || DEFAULT_SPREADSHEET_URL,
  apiKey: process.env.GAS_API_KEY || 'TOYOTA_SETIAJAYA_SECRET_KEY',
  isLive: true
};

/**
 * Helper to parse CSV data from a string
 */
function parseCSV(csvText: string): Record<string, any>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inside = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inside && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inside = !inside;
        }
      } else if (c === ',' && !inside) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map(h =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '')
  );

  const results: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.every(v => !v)) continue;
    const obj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      obj[h] = values[colIdx] !== undefined ? values[colIdx] : '';
    });
    results.push(obj);
  }

  return results;
}

/**
 * Helper to call Google Apps Script Web App Endpoint OR fetch Google Sheet CSV Link directly
 */
async function callGAS(action: string, payload: any = {}, method: 'GET' | 'POST' = 'GET') {
  if (!gasConfig.isLive || !gasConfig.webAppUrl) return null;

  try {
    const rawUrl = gasConfig.webAppUrl.trim();

    // Check if user provided a direct Google Sheet URL (docs.google.com/spreadsheets/d/ID/...)
    const sheetIdMatch = rawUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetIdMatch) {
      const sheetId = sheetIdMatch[1];
      if (action === 'getDEC' || action === 'getDashboard') {
        const decUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DEC`;
        const resDEC = await fetch(decUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resDEC.ok) {
          const csvDEC = await resDEC.text();
          const decRecords = parseCSV(csvDEC);
          if (action === 'getDEC') {
            return { success: true, count: decRecords.length, data: decRecords };
          }
          // If dashboard action, also fetch SERVICE_CALL
          const scUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=SERVICE_CALL`;
          const resSC = await fetch(scUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const scRecords = resSC.ok ? parseCSV(await resSC.text()) : [];
          return {
            success: true,
            totalDEC: decRecords.length,
            totalServiceCall: scRecords.length,
            decData: decRecords,
            serviceCallData: scRecords
          };
        }
      } else if (action === 'getServiceCall') {
        const scUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=SERVICE_CALL`;
        const resSC = await fetch(scUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resSC.ok) {
          const csvSC = await resSC.text();
          const scRecords = parseCSV(csvSC);
          return { success: true, count: scRecords.length, data: scRecords };
        }
      }
      return null;
    }

    // Standard Google Apps Script Web App (script.google.com)
    const url = new URL(rawUrl);
    if (method === 'GET') {
      url.searchParams.set('action', action);
      if (payload) {
        Object.keys(payload).forEach(k => {
          if (payload[k] !== undefined && payload[k] !== null) {
            url.searchParams.set(k, String(payload[k]));
          }
        });
      }
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow'
      });
      if (!response.ok) return null;
      return await response.json();
    } else {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
        redirect: 'follow'
      });
      if (!response.ok) return null;
      return await response.json();
    }
  } catch (err) {
    console.error(`[GAS Proxy Error - ${action}]:`, err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS Middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health Check Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      system: 'TOYOTA SETIAJAYA SERVICE ANALYTICS & REMINDER SYSTEM',
      timestamp: new Date().toISOString(),
      gasConfigured: !!gasConfig.webAppUrl,
      isLiveMode: gasConfig.isLive,
      counts: {
        dec: decDatabase.length,
        serviceCall: serviceCallDatabase.length
      }
    });
  });

  // CONFIG ENDPOINTS
  app.get('/api/config', (req: Request, res: Response) => {
    res.json({ success: true, config: gasConfig });
  });

  app.post('/api/config', (req: Request, res: Response) => {
    const { webAppUrl, apiKey, isLive } = req.body;
    if (webAppUrl !== undefined) gasConfig.webAppUrl = webAppUrl;
    if (apiKey !== undefined) gasConfig.apiKey = apiKey;
    if (isLive !== undefined) gasConfig.isLive = !!isLive;
    res.json({ success: true, message: 'Google Apps Script config updated', config: gasConfig });
  });

  app.post('/api/config/test', async (req: Request, res: Response) => {
    const { webAppUrl } = req.body;
    if (!webAppUrl || typeof webAppUrl !== 'string') {
      res.status(400).json({ success: false, message: 'URL Google Sheet atau Web App tidak boleh kosong' });
      return;
    }

    try {
      const rawUrl = webAppUrl.trim();
      const sheetIdMatch = rawUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);

      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1];
        const decUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DEC`;
        const testRes = await fetch(decUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (testRes.ok) {
          res.json({
            success: true,
            message: 'Koneksi Google Sheet Berhasil! Data dapat dibaca secara otomatis.'
          });
          return;
        } else {
          res.status(400).json({
            success: false,
            message: 'Gagal membaca Google Sheet. Pastikan akses Google Sheet diatur ke "Siapa saja yang memiliki link" (Anyone with link).'
          });
          return;
        }
      }

      const url = new URL(rawUrl);
      url.searchParams.set('action', 'getDashboard');
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow'
      });

      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        // Not JSON
      }

      if (json && (json.success !== undefined || json.totalDEC !== undefined || json.data !== undefined)) {
        res.json({ success: true, message: 'Koneksi Google Apps Script Berhasil!' });
      } else if (response.ok) {
        res.json({ success: true, message: 'Google Apps Script merespons. Siap digunakan!' });
      } else {
        res.status(400).json({ success: false, message: `Web App memberikan status HTTP ${response.status}` });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `Gagal terhubung: ${err.message || 'Network error'}. Pastikan URL Google Sheet atau Web App benar.`
      });
    }
  });

  // DEC CRUD ENDPOINTS
  app.get('/api/dec', async (req: Request, res: Response) => {
    const search = (req.query.search as string || '').toLowerCase();

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      const gasRes = await callGAS('getDEC', { search }, 'GET');
      if (gasRes && gasRes.data && Array.isArray(gasRes.data)) {
        decDatabase = gasRes.data.map((r: any, idx: number) => ({
          id: r.id || r.vin || `dec-gas-${idx}`,
          bulan: r.bulan || 'Januari',
          tanggal_dec: normalizeDateToISO(r.tanggal_dec),
          nama_customer: r.nama_customer || '',
          payment: r.payment || 'Cash',
          phone_customer: String(r.phone_customer || ''),
          model: r.model || '',
          vin: String(r.vin || '').toUpperCase().trim(),
          sales: r.sales || '',
          alamat: r.alamat || '',
          kota: r.kota || ''
        }));
      }
    }

    let records = decDatabase;
    if (search) {
      records = records.filter(r =>
        r.vin?.toLowerCase().includes(search) ||
        r.nama_customer?.toLowerCase().includes(search) ||
        r.model?.toLowerCase().includes(search) ||
        r.phone_customer?.includes(search)
      );
    }

    res.json({ success: true, count: records.length, data: records });
  });

  app.post('/api/dec', async (req: Request, res: Response) => {
    const newRecord: DECRecord = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bulan: req.body.bulan || 'Januari',
      tanggal_dec: normalizeDateToISO(req.body.tanggal_dec),
      nama_customer: req.body.nama_customer || '',
      payment: req.body.payment || 'Cash',
      phone_customer: req.body.phone_customer || '',
      model: req.body.model || '',
      vin: (req.body.vin || '').toUpperCase().trim(),
      sales: req.body.sales || '',
      alamat: req.body.alamat || '',
      kota: req.body.kota || ''
    };

    if (!newRecord.vin) {
      res.status(400).json({ success: false, message: 'VIN wajib diisi' });
      return;
    }

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      await callGAS('saveDEC', { data: newRecord }, 'POST');
    }

    decDatabase.unshift(newRecord);
    res.json({ success: true, message: 'Data DEC berhasil ditambahkan', data: newRecord });
  });

  app.put('/api/dec/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const index = decDatabase.findIndex(r => r.id === id || r.vin === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Data DEC tidak ditemukan' });
      return;
    }

    decDatabase[index] = {
      ...decDatabase[index],
      ...req.body,
      vin: (req.body.vin || decDatabase[index].vin).toUpperCase().trim()
    };

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      await callGAS('saveDEC', { data: decDatabase[index] }, 'POST');
    }

    res.json({ success: true, message: 'Data DEC berhasil diperbarui', data: decDatabase[index] });
  });

  app.delete('/api/dec/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = decDatabase.find(r => r.id === id || r.vin === id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Data DEC tidak ditemukan' });
      return;
    }

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      await callGAS('deleteDEC', { vin: item.vin }, 'POST');
    }

    decDatabase = decDatabase.filter(r => r.id !== id && r.vin !== id);
    res.json({ success: true, message: 'Data DEC berhasil dihapus' });
  });

  // BATCH IMPORT DEC
  app.post('/api/import/dec', async (req: Request, res: Response) => {
    try {
      const items: DECRecord[] = req.body.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Payload items kosong atau format tidak sesuai' });
        return;
      }

      if (gasConfig.isLive && gasConfig.webAppUrl) {
        try {
          await callGAS('batchImportDEC', { items }, 'POST');
        } catch (gasErr) {
          console.warn('[Sync Batch Import DEC to GAS Warning]:', gasErr);
        }
      }

      const result: ImportSummaryResult = {
        total: items.length,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: []
      };

      const extractVin = (item: any): string => {
        if (item.vin && String(item.vin).trim()) return String(item.vin).trim().toUpperCase();
        for (const k of Object.keys(item)) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanK.includes('rangka') || cleanK.includes('chassis') || cleanK.includes('vin') || cleanK.includes('frame')) {
            const val = String(item[k] || '').trim();
            if (val && val !== '-' && val !== 'undefined' && val !== 'null') return val.toUpperCase();
          }
        }
        return '';
      };

      items.forEach((item, idx) => {
        const cleanVin = extractVin(item);
        if (!cleanVin) {
          result.failed++;
          result.errors.push({ row: idx + 1, reason: 'VIN (Nomor Rangka) tidak boleh kosong atau tidak ditemukan', data: item });
          return;
        }

        const newRecord: DECRecord = {
          id: `dec-${Date.now()}-${idx}`,
          bulan: item.bulan || 'Januari',
          tanggal_dec: normalizeDateToISO(item.tanggal_dec),
          nama_customer: item.nama_customer || '',
          payment: item.payment || 'Cash',
          phone_customer: String(item.phone_customer || ''),
          model: item.model || '',
          vin: cleanVin,
          sales: item.sales || '',
          alamat: item.alamat || '',
          kota: item.kota || ''
        };

        decDatabase.push(newRecord);
        result.success++;
      });

      res.json({ success: true, summary: result });
    } catch (err: any) {
      console.error('[Batch Import DEC Server Error]:', err);
      res.status(500).json({
        success: false,
        message: `Gagal memproses import DEC: ${err.message || 'Server error'}`
      });
    }
  });

  // SERVICE CALL CRUD ENDPOINTS
  app.get('/api/service-call', async (req: Request, res: Response) => {
    const search = (req.query.search as string || '').toLowerCase();

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      const gasRes = await callGAS('getServiceCall', { search }, 'GET');
      if (gasRes && gasRes.data && Array.isArray(gasRes.data)) {
        serviceCallDatabase = gasRes.data.map((r: any, idx: number) => ({
          id: r.id || r.no_invoice || `sc-gas-${idx}`,
          week: r.week || 'W1',
          cabang: r.cabang || 'Toyota Setiajaya Depok',
          service_advisor: r.service_advisor || 'Unassigned',
          tanggal_entry: normalizeDateToISO(r.tanggal_entry),
          call_id: r.call_id || `CALL-${idx}`,
          kode_customer: r.kode_customer || 'CUST',
          nama_customer: r.nama_customer || '',
          no_hp: String(r.no_hp || ''),
          no_wa: String(r.no_wa || r.no_hp || ''),
          alamat: r.alamat || '',
          kelurahan: r.kelurahan || '',
          kecamatan: r.kecamatan || '',
          kota: r.kota || '',
          kode_pos: String(r.kode_pos || ''),
          ring_area: r.ring_area || 'Ring 1',
          tipe_kendaraan: r.tipe_kendaraan || '',
          vin: String(r.vin || '').toUpperCase().trim(),
          no_mesin: r.no_mesin || '',
          no_polisi: String(r.no_polisi || '').toUpperCase().trim(),
          tahun_rakit: Number(r.tahun_rakit) || new Date().getFullYear(),
          tanggal_do: normalizeDateToISO(r.tanggal_do),
          point_of_service: r.point_of_service || 'Bengkel Resmi',
          problem_definition: r.problem_definition || 'Service Berkala',
          estimasi_harga: Number(r.estimasi_harga) || 0,
          no_voucher: r.no_voucher || '-',
          km_service: Number(r.km_service) || 0,
          jenis_pekerjaan: r.jenis_pekerjaan || 'Service Berkala',
          tipe_promo: r.tipe_promo || '-',
          ssc: r.ssc || 'Tidak',
          dealer_penjual: r.dealer_penjual || 'Setiajaya Depok',
          group: r.group || 'Setiajaya Group',
          area_dealer: r.area_dealer || 'Jabodetabek',
          t_Care: r.t_Care || 'Aktif',
          up_selling: r.up_selling || '-',
          cross_selling: r.cross_selling || '-',
          no_so: r.no_so || `SO-${idx}`,
          tanggal_so: normalizeDateToISO(r.tanggal_so),
          no_invoice: r.no_invoice || `INV-${idx}`,
          tanggal_invoice: normalizeDateToISO(r.tanggal_invoice),
          next_service: normalizeDateToISO(r.next_service),
          so_key: r.so_key || `SOKEY-${idx}`,
          invoice_key: r.invoice_key || `INVKEY-${idx}`,
          alamat_domisili: r.alamat_domisili || r.alamat || '',
          ring_area_domisili: r.ring_area_domisili || r.ring_area || 'Ring 1',
          nama_laporan: r.nama_laporan || 'Laporan Service Harian',
          periode: r.periode || new Date().toISOString().slice(0, 7)
        }));
      }
    }

    let records = serviceCallDatabase;
    if (search) {
      records = records.filter(r =>
        r.vin?.toLowerCase().includes(search) ||
        r.no_polisi?.toLowerCase().includes(search) ||
        r.nama_customer?.toLowerCase().includes(search) ||
        r.no_invoice?.toLowerCase().includes(search) ||
        r.service_advisor?.toLowerCase().includes(search)
      );
    }

    res.json({ success: true, count: records.length, data: records });
  });

  app.post('/api/service-call', async (req: Request, res: Response) => {
    const newRecord: ServiceCallRecord = {
      id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      week: req.body.week || 'W1',
      cabang: req.body.cabang || 'Toyota Setiajaya Depok',
      service_advisor: req.body.service_advisor || 'Unassigned',
      tanggal_entry: normalizeDateToISO(req.body.tanggal_entry),
      call_id: req.body.call_id || `CALL-${Date.now().toString().slice(-4)}`,
      kode_customer: req.body.kode_customer || 'CUST-NEW',
      nama_customer: req.body.nama_customer || '',
      no_hp: req.body.no_hp || '',
      no_wa: req.body.no_wa || req.body.no_hp || '',
      alamat: req.body.alamat || '',
      kelurahan: req.body.kelurahan || '',
      kecamatan: req.body.kecamatan || '',
      kota: req.body.kota || '',
      kode_pos: req.body.kode_pos || '',
      ring_area: req.body.ring_area || 'Ring 1',
      tipe_kendaraan: req.body.tipe_kendaraan || '',
      vin: (req.body.vin || '').toUpperCase().trim(),
      no_mesin: req.body.no_mesin || '',
      no_polisi: (req.body.no_polisi || '').toUpperCase().trim(),
      tahun_rakit: req.body.tahun_rakit || new Date().getFullYear(),
      tanggal_do: normalizeDateToISO(req.body.tanggal_do),
      point_of_service: req.body.point_of_service || 'Bengkel Resmi',
      problem_definition: req.body.problem_definition || 'Service Berkala',
      estimasi_harga: Number(req.body.estimasi_harga) || 0,
      no_voucher: req.body.no_voucher || '-',
      km_service: Number(req.body.km_service) || 0,
      jenis_pekerjaan: req.body.jenis_pekerjaan || 'Service Berkala',
      tipe_promo: req.body.tipe_promo || '-',
      ssc: req.body.ssc || 'Tidak',
      dealer_penjual: req.body.dealer_penjual || 'Setiajaya Depok',
      group: req.body.group || 'Setiajaya Group',
      area_dealer: req.body.area_dealer || 'Jabodetabek',
      t_Care: req.body.t_Care || 'Aktif',
      up_selling: req.body.up_selling || '-',
      cross_selling: req.body.cross_selling || '-',
      no_so: req.body.no_so || `SO-${Date.now().toString().slice(-5)}`,
      tanggal_so: normalizeDateToISO(req.body.tanggal_so),
      no_invoice: req.body.no_invoice || `INV-${Date.now().toString().slice(-5)}`,
      tanggal_invoice: normalizeDateToISO(req.body.tanggal_invoice),
      next_service: normalizeDateToISO(req.body.next_service),
      so_key: req.body.so_key || `SOKEY-${Date.now().toString().slice(-5)}`,
      invoice_key: req.body.invoice_key || `INVKEY-${Date.now().toString().slice(-5)}`,
      alamat_domisili: req.body.alamat_domisili || req.body.alamat || '',
      ring_area_domisili: req.body.ring_area_domisili || req.body.ring_area || 'Ring 1',
      nama_laporan: req.body.nama_laporan || 'Laporan Service Harian',
      periode: req.body.periode || new Date().toISOString().slice(0, 7)
    };

    if (!newRecord.vin) {
      res.status(400).json({ success: false, message: 'VIN wajib diisi' });
      return;
    }

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      await callGAS('saveServiceCall', { data: newRecord }, 'POST');
    }

    serviceCallDatabase.unshift(newRecord);
    res.json({ success: true, message: 'Data Service Call berhasil ditambahkan', data: newRecord });
  });

  app.put('/api/service-call/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const index = serviceCallDatabase.findIndex(r => r.id === id || r.no_invoice === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Data Service Call tidak ditemukan' });
      return;
    }

    serviceCallDatabase[index] = {
      ...serviceCallDatabase[index],
      ...req.body,
      vin: (req.body.vin || serviceCallDatabase[index].vin).toUpperCase().trim()
    };

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      await callGAS('saveServiceCall', { data: serviceCallDatabase[index] }, 'POST');
    }

    res.json({ success: true, message: 'Data Service Call berhasil diperbarui', data: serviceCallDatabase[index] });
  });

  app.delete('/api/service-call/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = serviceCallDatabase.find(r => r.id === id || r.no_invoice === id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Data Service Call tidak ditemukan' });
      return;
    }

    if (gasConfig.isLive && gasConfig.webAppUrl) {
      await callGAS('deleteServiceCall', { id: item.id }, 'POST');
    }

    serviceCallDatabase = serviceCallDatabase.filter(r => r.id !== id && r.no_invoice !== id);
    res.json({ success: true, message: 'Data Service Call berhasil dihapus' });
  });

  // BATCH IMPORT SERVICE CALL WITH DUPLICATE HANDLING
  app.post('/api/import/service-call', async (req: Request, res: Response) => {
    try {
      const items: ServiceCallRecord[] = req.body.items || [];
      const duplicateMode: 'skip' | 'replace' | 'all' = req.body.duplicateMode || 'skip';

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Payload items kosong' });
        return;
      }

      if (gasConfig.isLive && gasConfig.webAppUrl) {
        try {
          await callGAS('batchImportServiceCall', { items, duplicateMode }, 'POST');
        } catch (gasErr) {
          console.warn('[Sync Batch Import Service Call GAS Warning]:', gasErr);
        }
      }

      const result: ImportSummaryResult = {
        total: items.length,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: []
      };

      const extractVin = (item: any): string => {
        if (item.vin && String(item.vin).trim()) return String(item.vin).trim().toUpperCase();
        for (const k of Object.keys(item)) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanK.includes('rangka') || cleanK.includes('chassis') || cleanK.includes('vin') || cleanK.includes('frame')) {
            const val = String(item[k] || '').trim();
            if (val && val !== '-' && val !== 'undefined' && val !== 'null') return val.toUpperCase();
          }
        }
        return '';
      };

      items.forEach((item, idx) => {
        const cleanVin = extractVin(item);
        const cleanInvoice = (item.no_invoice || '').toString().trim();

        if (!cleanVin) {
          result.failed++;
          result.errors.push({ row: idx + 1, reason: 'VIN (Nomor Rangka) wajib diisi', data: item });
          return;
        }

      // Check duplicate
      const existingIdx = serviceCallDatabase.findIndex(
        r => r.vin === cleanVin && (cleanInvoice ? r.no_invoice === cleanInvoice : false)
      );

      if (existingIdx !== -1) {
        result.duplicates++;
        if (duplicateMode === 'skip') {
          return;
        } else if (duplicateMode === 'replace') {
          serviceCallDatabase[existingIdx] = {
            ...serviceCallDatabase[existingIdx],
            ...item,
            vin: cleanVin
          };
          result.success++;
          return;
        }
      }

      const newRecord: ServiceCallRecord = {
        id: `sc-${Date.now()}-${idx}`,
        week: item.week || 'W1',
        cabang: item.cabang || 'Toyota Setiajaya Depok',
        service_advisor: item.service_advisor || 'Unassigned',
        tanggal_entry: normalizeDateToISO(item.tanggal_entry),
        call_id: item.call_id || `CALL-${idx}`,
        kode_customer: item.kode_customer || 'CUST',
        nama_customer: item.nama_customer || '',
        no_hp: item.no_hp || '',
        no_wa: item.no_wa || item.no_hp || '',
        alamat: item.alamat || '',
        kelurahan: item.kelurahan || '',
        kecamatan: item.kecamatan || '',
        kota: item.kota || '',
        kode_pos: item.kode_pos || '',
        ring_area: item.ring_area || 'Ring 1',
        tipe_kendaraan: item.tipe_kendaraan || '',
        vin: cleanVin,
        no_mesin: item.no_mesin || '',
        no_polisi: (item.no_polisi || '').toString().trim().toUpperCase(),
        tahun_rakit: item.tahun_rakit || new Date().getFullYear(),
        tanggal_do: normalizeDateToISO(item.tanggal_do),
        point_of_service: item.point_of_service || 'Bengkel Resmi',
        problem_definition: item.problem_definition || 'Service Berkala',
        estimasi_harga: Number(item.estimasi_harga) || 0,
        no_voucher: item.no_voucher || '-',
        km_service: Number(item.km_service) || 0,
        jenis_pekerjaan: item.jenis_pekerjaan || 'Service Berkala',
        tipe_promo: item.tipe_promo || '-',
        ssc: item.ssc || 'Tidak',
        dealer_penjual: item.dealer_penjual || 'Setiajaya Depok',
        group: item.group || 'Setiajaya Group',
        area_dealer: item.area_dealer || 'Jabodetabek',
        t_Care: item.t_Care || 'Aktif',
        up_selling: item.up_selling || '-',
        cross_selling: item.cross_selling || '-',
        no_so: item.no_so || `SO-${idx}`,
        tanggal_so: normalizeDateToISO(item.tanggal_so),
        no_invoice: item.no_invoice || `INV-${idx}`,
        tanggal_invoice: normalizeDateToISO(item.tanggal_invoice),
        next_service: normalizeDateToISO(item.next_service),
        so_key: item.so_key || `SOKEY-${idx}`,
        invoice_key: item.invoice_key || `INVKEY-${idx}`,
        alamat_domisili: item.alamat_domisili || item.alamat || '',
        ring_area_domisili: item.ring_area_domisili || item.ring_area || 'Ring 1',
        nama_laporan: item.nama_laporan || 'Laporan Service Harian',
        periode: item.periode || new Date().toISOString().slice(0, 7)
      };

      serviceCallDatabase.push(newRecord);
      result.success++;
    });

    res.json({ success: true, summary: result });
    } catch (err: any) {
      console.error('[Batch Import Service Call Server Error]:', err);
      res.status(500).json({
        success: false,
        message: `Gagal memproses import Service Call: ${err.message || 'Server error'}`
      });
    }
  });

  // DASHBOARD ANALYTICS ENDPOINT
  app.get('/api/dashboard', async (req: Request, res: Response) => {
    if (gasConfig.isLive && gasConfig.webAppUrl) {
      const gasRes = await callGAS('getDashboard', {}, 'GET');
      if (gasRes && gasRes.decData && Array.isArray(gasRes.decData)) {
        decDatabase = gasRes.decData.map((r: any, idx: number) => ({
          id: r.id || r.vin || `dec-gas-${idx}`,
          bulan: r.bulan || 'Januari',
          tanggal_dec: normalizeDateToISO(r.tanggal_dec),
          nama_customer: r.nama_customer || '',
          payment: r.payment || 'Cash',
          phone_customer: String(r.phone_customer || ''),
          model: r.model || '',
          vin: String(r.vin || '').toUpperCase().trim(),
          sales: r.sales || '',
          alamat: r.alamat || '',
          kota: r.kota || ''
        }));
      }
      if (gasRes && gasRes.serviceCallData && Array.isArray(gasRes.serviceCallData)) {
        serviceCallDatabase = gasRes.serviceCallData.map((r: any, idx: number) => ({
          id: r.id || r.no_invoice || `sc-gas-${idx}`,
          week: r.week || 'W1',
          cabang: r.cabang || 'Toyota Setiajaya Depok',
          service_advisor: r.service_advisor || 'Unassigned',
          tanggal_entry: normalizeDateToISO(r.tanggal_entry),
          call_id: r.call_id || `CALL-${idx}`,
          kode_customer: r.kode_customer || 'CUST',
          nama_customer: r.nama_customer || '',
          no_hp: String(r.no_hp || ''),
          no_wa: String(r.no_wa || r.no_hp || ''),
          alamat: r.alamat || '',
          kelurahan: r.kelurahan || '',
          kecamatan: r.kecamatan || '',
          kota: r.kota || '',
          kode_pos: String(r.kode_pos || ''),
          ring_area: r.ring_area || 'Ring 1',
          tipe_kendaraan: r.tipe_kendaraan || '',
          vin: String(r.vin || '').toUpperCase().trim(),
          no_mesin: r.no_mesin || '',
          no_polisi: String(r.no_polisi || '').toUpperCase().trim(),
          tahun_rakit: Number(r.tahun_rakit) || new Date().getFullYear(),
          tanggal_do: normalizeDateToISO(r.tanggal_do),
          point_of_service: r.point_of_service || 'Bengkel Resmi',
          problem_definition: r.problem_definition || 'Service Berkala',
          estimasi_harga: Number(r.estimasi_harga) || 0,
          no_voucher: r.no_voucher || '-',
          km_service: Number(r.km_service) || 0,
          jenis_pekerjaan: r.jenis_pekerjaan || 'Service Berkala',
          tipe_promo: r.tipe_promo || '-',
          ssc: r.ssc || 'Tidak',
          dealer_penjual: r.dealer_penjual || 'Setiajaya Depok',
          group: r.group || 'Setiajaya Group',
          area_dealer: r.area_dealer || 'Jabodetabek',
          t_Care: r.t_Care || 'Aktif',
          up_selling: r.up_selling || '-',
          cross_selling: r.cross_selling || '-',
          no_so: r.no_so || `SO-${idx}`,
          tanggal_so: normalizeDateToISO(r.tanggal_so),
          no_invoice: r.no_invoice || `INV-${idx}`,
          tanggal_invoice: normalizeDateToISO(r.tanggal_invoice),
          next_service: normalizeDateToISO(r.next_service),
          so_key: r.so_key || `SOKEY-${idx}`,
          invoice_key: r.invoice_key || `INVKEY-${idx}`,
          alamat_domisili: r.alamat_domisili || r.alamat || '',
          ring_area_domisili: r.ring_area_domisili || r.ring_area || 'Ring 1',
          nama_laporan: r.nama_laporan || 'Laporan Service Harian',
          periode: r.periode || new Date().toISOString().slice(0, 7)
        }));
      }
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.slice(0, 7);

    // Calculate Realtime Reminders
    const reminders = calculateReminders(decDatabase, serviceCallDatabase);

    // KPI Metrics
    const uniqueDECVins = new Set(decDatabase.map(d => String(d.vin || '').toUpperCase().trim()).filter(Boolean));
    const uniqueServiceVins = new Set(serviceCallDatabase.map(s => String(s.vin || '').toUpperCase().trim()).filter(Boolean));
    const allCustomers = new Set([
      ...decDatabase.map(d => d.nama_customer.toLowerCase().trim()),
      ...serviceCallDatabase.map(s => s.nama_customer.toLowerCase().trim())
    ]);

    const serviceHariIni = serviceCallDatabase.filter(s => {
      const entryISO = normalizeDateToISO(s.tanggal_entry || s.tanggal_invoice);
      return entryISO === todayStr;
    }).length;

    const serviceBulanIni = serviceCallDatabase.filter(s => {
      const entryISO = normalizeDateToISO(s.tanggal_entry || s.tanggal_invoice);
      return entryISO.startsWith(currentMonthStr);
    }).length;

    const serviceOverdueCount = reminders.filter(r => r.status === 'OVERDUE').length;
    const reminderH7Count = reminders.filter(r => r.status === 'H-7' || r.status === 'HARI INI').length;

    const kpi: DashboardKPI = {
      totalUnitDEC: uniqueDECVins.size,
      unitAktifService: uniqueServiceVins.size,
      serviceBulanIni,
      serviceHariIni,
      serviceOverdue: serviceOverdueCount,
      reminderH7: reminderH7Count,
      totalCustomer: allCustomers.size
    };

    // Trend Service (Harian, Mingguan, Bulanan dengan filter Bulan/Tahun)
    const trendFilter = (req.query.trend as string) || 'bulanan';
    const selectedMonth = (req.query.month as string) || currentMonthStr; // e.g. "2026-07"
    const selectedYear = (req.query.year as string) || currentMonthStr.slice(0, 4); // e.g. "2026"

    const trendMap = new Map<string, number>();

    if (trendFilter === 'harian') {
      // Harian: Jumlah service per hari di bulan yang dipilih
      const [yStr, mStr] = selectedMonth.split('-');
      const tYear = parseInt(yStr) || new Date().getFullYear();
      const tMonth = parseInt(mStr) || (new Date().getMonth() + 1);
      const daysInMonth = new Date(tYear, tMonth, 0).getDate();
      const monthNameShort = new Date(tYear, tMonth - 1, 1).toLocaleString('id-ID', { month: 'short' });

      for (let d = 1; d <= daysInMonth; d++) {
        const dayPadded = d.toString().padStart(2, '0');
        trendMap.set(`${dayPadded} ${monthNameShort}`, 0);
      }

      serviceCallDatabase.forEach(s => {
        const dateStr = normalizeDateToISO(s.tanggal_entry || s.tanggal_invoice);
        if (dateStr.startsWith(selectedMonth)) {
          const day = dateStr.split('-')[2];
          const key = `${day} ${monthNameShort}`;
          if (trendMap.has(key)) {
            trendMap.set(key, trendMap.get(key)! + 1);
          }
        }
      });
    } else if (trendFilter === 'mingguan') {
      // Mingguan: Jumlah service per week (kolom week) di bulan yang dipilih
      const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
      weeks.forEach(w => trendMap.set(w, 0));

      serviceCallDatabase.forEach(s => {
        const dateStr = normalizeDateToISO(s.tanggal_entry || s.tanggal_invoice);
        if (dateStr.startsWith(selectedMonth)) {
          let rawWeek = String(s.week || 'W1').trim().toUpperCase();
          if (!rawWeek.startsWith('W')) rawWeek = `W${rawWeek}`;
          if (trendMap.has(rawWeek)) {
            trendMap.set(rawWeek, trendMap.get(rawWeek)! + 1);
          } else {
            trendMap.set(rawWeek, (trendMap.get(rawWeek) || 0) + 1);
          }
        }
      });
    } else {
      // Bulanan: Jumlah service per bulan di tahun yang dipilih
      const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      monthsIndo.forEach(m => trendMap.set(m, 0));

      serviceCallDatabase.forEach(s => {
        const dateStr = normalizeDateToISO(s.tanggal_entry || s.tanggal_invoice);
        if (dateStr.startsWith(selectedYear)) {
          const mIdx = parseInt(dateStr.split('-')[1]) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            const mKey = monthsIndo[mIdx];
            trendMap.set(mKey, trendMap.get(mKey)! + 1);
          }
        }
      });
    }

    const trendData: TrendDataPoint[] = Array.from(trendMap.entries()).map(([period, count]) => ({
      period,
      count
    }));

    // Dealer Distribution (Top 5 Dealer Penjual)
    const dealerMap = new Map<string, number>();
    serviceCallDatabase.forEach(s => {
      const dealer = (s.dealer_penjual || 'Setiajaya Depok').trim();
      dealerMap.set(dealer, (dealerMap.get(dealer) || 0) + 1);
    });

    const totalDealerServices = serviceCallDatabase.length || 1;
    const sortedDealers = Array.from(dealerMap.entries())
      .map(([dealer, count]) => ({
        dealer,
        count,
        percentage: Math.round((count / totalDealerServices) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const dealerData: DealerDistData[] = sortedDealers.slice(0, 5);

    // Ring Area Distribution (Tanpa Ring 4)
    const rings = ['Ring 1', 'Ring 2', 'Ring 3', 'Outer'] as const;
    const ringMap = new Map<string, { ring_area: number; ring_area_domisili: number }>();

    rings.forEach(r => ringMap.set(r, { ring_area: 0, ring_area_domisili: 0 }));

    serviceCallDatabase.forEach(s => {
      let ra = s.ring_area || 'Ring 1';
      let rad = s.ring_area_domisili || 'Ring 1';

      if (ra === 'Ring 4') ra = 'Ring 3';
      if (rad === 'Ring 4') rad = 'Ring 3';

      if (ringMap.has(ra)) ringMap.get(ra)!.ring_area += 1;
      if (ringMap.has(rad)) ringMap.get(rad)!.ring_area_domisili += 1;
    });

    const ringData: RingAreaData[] = rings.map(ring => ({
      ring,
      ring_area: ringMap.get(ring)!.ring_area,
      ring_area_domisili: ringMap.get(ring)!.ring_area_domisili
    }));

    // Leaderboard Service Advisor
    const saMap = new Map<string, { count: number; cabang: string }>();
    serviceCallDatabase.forEach(s => {
      const sa = s.service_advisor || 'Unassigned';
      const cabang = s.cabang || 'Setiajaya Depok';
      if (!saMap.has(sa)) {
        saMap.set(sa, { count: 0, cabang });
      }
      saMap.get(sa)!.count += 1;
    });

    const leaderboard: LeaderboardSAItem[] = Array.from(saMap.entries())
      .map(([name, data]) => ({
        rank: 0,
        name,
        totalService: data.count,
        percentage: Math.round((data.count / (serviceCallDatabase.length || 1)) * 100),
        cabangPrimary: data.cabang
      }))
      .sort((a, b) => b.totalService - a.totalService)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    res.json({
      success: true,
      kpi,
      trend: trendData,
      dealerDistribution: dealerData,
      ringAreaDistribution: ringData,
      leaderboardSA: leaderboard
    });
  });

  // REALTIME REMINDERS ENDPOINT
  app.get('/api/reminders', (req: Request, res: Response) => {
    const reminders = calculateReminders(decDatabase, serviceCallDatabase);
    res.json({ success: true, count: reminders.length, data: reminders });
  });

  // VEHICLE SERVICE HISTORY ENDPOINT
  app.get('/api/history', async (req: Request, res: Response) => {
    const vinParam = req.query.vin as string;
    const monthParam = req.query.month as string;
    const yearParam = req.query.year as string;

    // Fetch live from GAS if configured
    if (gasConfig.isLive && gasConfig.webAppUrl) {
      const gasResSC = await callGAS('getServiceCall', {}, 'GET');
      if (gasResSC && gasResSC.data && Array.isArray(gasResSC.data)) {
        serviceCallDatabase = gasResSC.data.map((r: any, idx: number) => ({
          id: r.id || r.no_invoice || `sc-gas-${idx}`,
          week: r.week || 'W1',
          cabang: r.cabang || 'Toyota Setiajaya Depok',
          service_advisor: r.service_advisor || 'Unassigned',
          tanggal_entry: normalizeDateToISO(r.tanggal_entry),
          call_id: r.call_id || `CALL-${idx}`,
          kode_customer: r.kode_customer || 'CUST',
          nama_customer: r.nama_customer || '',
          no_hp: String(r.no_hp || ''),
          no_wa: String(r.no_wa || r.no_hp || ''),
          alamat: r.alamat || '',
          kelurahan: r.kelurahan || '',
          kecamatan: r.kecamatan || '',
          kota: r.kota || '',
          kode_pos: String(r.kode_pos || ''),
          ring_area: r.ring_area || 'Ring 1',
          tipe_kendaraan: r.tipe_kendaraan || '',
          vin: String(r.vin || '').toUpperCase().trim(),
          no_mesin: r.no_mesin || '',
          no_polisi: String(r.no_polisi || '').toUpperCase().trim(),
          tahun_rakit: Number(r.tahun_rakit) || new Date().getFullYear(),
          tanggal_do: normalizeDateToISO(r.tanggal_do),
          point_of_service: r.point_of_service || 'Bengkel Resmi',
          problem_definition: r.problem_definition || 'Service Berkala',
          estimasi_harga: Number(r.estimasi_harga) || 0,
          no_voucher: r.no_voucher || '-',
          km_service: Number(r.km_service) || 0,
          jenis_pekerjaan: r.jenis_pekerjaan || 'Service Berkala',
          tipe_promo: r.tipe_promo || '-',
          ssc: r.ssc || 'Tidak',
          dealer_penjual: r.dealer_penjual || 'Setiajaya Depok',
          group: r.group || 'Setiajaya Group',
          area_dealer: r.area_dealer || 'Jabodetabek',
          t_Care: r.t_Care || 'Aktif',
          up_selling: r.up_selling || '-',
          cross_selling: r.cross_selling || '-',
          no_so: r.no_so || `SO-${idx}`,
          tanggal_so: normalizeDateToISO(r.tanggal_so),
          no_invoice: r.no_invoice || `INV-${idx}`,
          tanggal_invoice: normalizeDateToISO(r.tanggal_invoice),
          next_service: normalizeDateToISO(r.next_service),
          so_key: r.so_key || `SOKEY-${idx}`,
          invoice_key: r.invoice_key || `INVKEY-${idx}`,
          alamat_domisili: r.alamat_domisili || r.alamat || '',
          ring_area_domisili: r.ring_area_domisili || r.ring_area || 'Ring 1',
          nama_laporan: r.nama_laporan || 'Laporan Service Harian',
        }));
      }
      const gasResDEC = await callGAS('getDEC', {}, 'GET');
      if (gasResDEC && gasResDEC.data && Array.isArray(gasResDEC.data)) {
        decDatabase = gasResDEC.data;
      }
    }

    // Group service records by VIN from SERVICE_CALL ONLY
    const vehicleMap = new Map<string, ServiceCallRecord[]>();

    serviceCallDatabase.forEach(sc => {
      if (!sc.vin) return;
      const cleanVin = sc.vin.trim().toUpperCase();
      if (!vehicleMap.has(cleanVin)) vehicleMap.set(cleanVin, []);
      vehicleMap.get(cleanVin)!.push(sc);
    });

    // Filter by VIN if single vehicle requested
    if (vinParam) {
      const cleanVin = vinParam.trim().toUpperCase();
      const decItem = decDatabase.find(d => d.vin.toUpperCase() === cleanVin);
      const history = (vehicleMap.get(cleanVin) || []).sort((a, b) => {
        const dateA = new Date(normalizeDateToISO(a.tanggal_invoice || a.tanggal_entry)).getTime();
        const dateB = new Date(normalizeDateToISO(b.tanggal_invoice || b.tanggal_entry)).getTime();
        return dateB - dateA;
      });

      res.json({
        success: true,
        summary: {
          vin: cleanVin,
          no_polisi: history[0]?.no_polisi || 'Belum Plat',
          model: history[0]?.tipe_kendaraan || decItem?.model || 'Toyota',
          nama_customer: history[0]?.nama_customer || decItem?.nama_customer || 'Customer',
          no_hp: history[0]?.no_hp || history[0]?.no_wa || decItem?.phone_customer || '-',
          tanggal_do: history[0]?.tanggal_do || decItem?.tanggal_dec || '-',
          dealer_penjual: history[0]?.dealer_penjual || 'Setiajaya Depok',
          totalKunjungan: history.length,
          serviceTerakhirDate: history[0] ? normalizeDateToISO(history[0].tanggal_invoice || history[0].tanggal_entry) : '-',
          serviceTerakhirKM: history[0]?.km_service || 0,
          serviceTerakhirSA: history[0]?.service_advisor || 'Unassigned',
          history
        }
      });
      return;
    }

    // Return list of all vehicles with summary info
    const vehicleList = Array.from(vehicleMap.entries()).map(([vin, records]) => {
      const sortedRecords = [...records].sort((a, b) => {
        const dateA = new Date(normalizeDateToISO(a.tanggal_invoice || a.tanggal_entry)).getTime();
        const dateB = new Date(normalizeDateToISO(b.tanggal_invoice || b.tanggal_entry)).getTime();
        return dateB - dateA;
      });

      const decItem = decDatabase.find(d => d.vin.toUpperCase() === vin);
      const latest = sortedRecords[0];

      return {
        vin,
        no_polisi: latest?.no_polisi || 'Belum Plat',
        model: latest?.tipe_kendaraan || decItem?.model || 'Toyota',
        nama_customer: latest?.nama_customer || decItem?.nama_customer || 'Customer',
        no_hp: latest?.no_hp || latest?.no_wa || decItem?.phone_customer || '-',
        tanggal_do: latest?.tanggal_do || decItem?.tanggal_dec || '-',
        dealer_penjual: latest?.dealer_penjual || 'Setiajaya Depok',
        totalKunjungan: sortedRecords.length,
        serviceTerakhirDate: latest ? normalizeDateToISO(latest.tanggal_invoice || latest.tanggal_entry) : '-',
        serviceTerakhirKM: latest?.km_service || 0,
        serviceTerakhirSA: latest?.service_advisor || 'Unassigned',
        history: sortedRecords
      };
    });

    // Filter by month/year if supplied
    let filteredList = vehicleList;
    if (monthParam || yearParam) {
      filteredList = filteredList.filter(v => {
        if (!v.serviceTerakhirDate || v.serviceTerakhirDate === '-') return false;
        const date = new Date(v.serviceTerakhirDate);
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear().toString();

        if (monthParam && m !== monthParam.padStart(2, '0')) return false;
        if (yearParam && y !== yearParam) return false;
        return true;
      });
    }

    // Sort: Units with service history (>0 visits) FIRST, sorted by latest service date DESC
    filteredList.sort((a, b) => {
      if (a.totalKunjungan > 0 && b.totalKunjungan === 0) return -1;
      if (a.totalKunjungan === 0 && b.totalKunjungan > 0) return 1;

      const timeA = (a.totalKunjungan > 0 && a.serviceTerakhirDate !== '-') ? new Date(a.serviceTerakhirDate).getTime() : 0;
      const timeB = (b.totalKunjungan > 0 && b.serviceTerakhirDate !== '-') ? new Date(b.serviceTerakhirDate).getTime() : 0;

      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.totalKunjungan - a.totalKunjungan;
    });

    res.json({ success: true, count: filteredList.length, data: filteredList });
  });

  // Vite Middleware in Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Toyota Setiajaya Enterprise Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
