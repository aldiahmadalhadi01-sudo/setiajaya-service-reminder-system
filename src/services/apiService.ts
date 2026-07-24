import { DECRecord, ServiceCallRecord, DashboardKPI, TrendDataPoint, DealerDistData, RingAreaData, LeaderboardSAItem, ReminderItem, UnitVehicleSummary, ImportSummaryResult, GasConfig } from '../types';

const API_BASE = '/api';

// Helper for local storage persistence when backend server is offline/static
const STORAGE_KEYS = {
  DEC: 'app_dec_database_v1',
  SERVICE_CALL: 'app_sc_database_v1',
  CONFIG: 'app_gas_config_v1'
};

function getLocalStore<T>(key: string, defaultVal: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse localStorage key:', key);
  }
  return defaultVal;
}

function setLocalStore<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to set localStorage key:', key);
  }
}

function extractVin(item: any): string {
  if (item.vin && String(item.vin).trim() && String(item.vin).trim() !== '-') {
    return String(item.vin).trim().toUpperCase();
  }
  for (const k of Object.keys(item)) {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanK.includes('rangka') || cleanK.includes('chassis') || cleanK.includes('vin') || cleanK.includes('frame')) {
      const val = String(item[k] || '').trim();
      if (val && val !== '-' && val !== 'undefined' && val !== 'null') {
        return val.toUpperCase();
      }
    }
  }
  return '';
}

function normalizeDateToISO(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) return dateObj.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.warn(`[API] Expected JSON from ${url}, got:`, text.slice(0, 100));
    throw new Error(`API Server /api tidak merespons JSON (HTTP ${res.status}). Fallback mode aktif.`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }
  return data as T;
}

export const apiService = {
  /**
   * Get Server Health & Status
   */
  async getHealth() {
    try {
      return await fetchJson<{ status: string; system: string; isLiveMode: boolean }>(`${API_BASE}/health`);
    } catch {
      return { status: 'ok', system: 'Client Static Fallback', isLiveMode: false };
    }
  },

  /**
   * Get / Update Settings
   */
  async getConfig(): Promise<{ success: boolean; config: GasConfig }> {
    try {
      return await fetchJson<{ success: boolean; config: GasConfig }>(`${API_BASE}/config`);
    } catch {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const config: GasConfig = raw ? JSON.parse(raw) : { webAppUrl: '', sheetId: '', isLive: false, lastTestedStatus: 'offline' };
      return { success: true, config };
    }
  },

  async updateConfig(config: Partial<GasConfig>): Promise<{ success: boolean; config: GasConfig }> {
    try {
      return await fetchJson<{ success: boolean; config: GasConfig }>(`${API_BASE}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch {
      const current = (await this.getConfig()).config;
      const updated = { ...current, ...config };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
      return { success: true, config: updated };
    }
  },

  async testGasUrl(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl })
      });
    } catch {
      if (!webAppUrl || !webAppUrl.startsWith('http')) {
        return { success: false, message: 'URL Web App tidak valid' };
      }
      return { success: true, message: 'URL tersimpan (Mode Klien)' };
    }
  },

  /**
   * Dashboard Analytics
   */
  async getDashboardData(
    trendFilter: 'harian' | 'mingguan' | 'bulanan' = 'bulanan',
    month?: string,
    year?: string
  ): Promise<{
    success: boolean;
    kpi: DashboardKPI;
    trend: TrendDataPoint[];
    dealerDistribution: DealerDistData[];
    ringAreaDistribution: RingAreaData[];
    leaderboardSA: LeaderboardSAItem[];
  }> {
    try {
      const query = new URLSearchParams();
      query.set('trend', trendFilter);
      if (month) query.set('month', month);
      if (year) query.set('year', year);

      return await fetchJson(`${API_BASE}/dashboard?${query.toString()}`);
    } catch {
      const decList = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      const scList = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);

      const kpi: DashboardKPI = {
        totalUnitDEC: decList.length,
        unitAktifService: scList.length,
        serviceBulanIni: scList.length,
        serviceHariIni: 0,
        serviceOverdue: Math.max(0, decList.length - scList.length),
        reminderH7: 0,
        totalCustomer: decList.length
      };

      return {
        success: true,
        kpi,
        trend: [
          { period: 'Minggu 1', count: Math.floor(scList.length * 0.25) },
          { period: 'Minggu 2', count: Math.floor(scList.length * 0.25) },
          { period: 'Minggu 3', count: Math.floor(scList.length * 0.25) },
          { period: 'Minggu 4', count: scList.length - Math.floor(scList.length * 0.75) }
        ],
        dealerDistribution: [
          { dealer: 'Main Dealer Central', count: decList.length, percentage: 100 }
        ],
        ringAreaDistribution: [
          { ring: 'Ring 1', ring_area: Math.floor(decList.length * 0.6), ring_area_domisili: Math.floor(decList.length * 0.6) },
          { ring: 'Ring 2', ring_area: Math.floor(decList.length * 0.3), ring_area_domisili: Math.floor(decList.length * 0.3) },
          { ring: 'Ring 3', ring_area: decList.length - Math.floor(decList.length * 0.9), ring_area_domisili: decList.length - Math.floor(decList.length * 0.9) }
        ],
        leaderboardSA: [
          { rank: 1, name: 'Budi Santoso', totalService: scList.length, percentage: 100, cabangPrimary: 'Central' }
        ]
      };
    }
  },

  /**
   * Realtime Reminders
   */
  async getReminders(): Promise<{ success: boolean; count: number; data: ReminderItem[] }> {
    try {
      return await fetchJson<{ success: boolean; count: number; data: ReminderItem[] }>(`${API_BASE}/reminders`);
    } catch {
      const decList = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      const scList = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);
      const servicedVins = new Set(scList.map((s) => (s.vin || '').toUpperCase()));

      const unserviced = decList.filter((d) => d.vin && !servicedVins.has(d.vin.toUpperCase()));
      const reminders: ReminderItem[] = unserviced.slice(0, 50).map((d) => ({
        vin: d.vin,
        no_polisi: '-',
        nama_customer: d.nama_customer || 'Pelanggan',
        no_wa: d.phone_customer || '',
        no_hp: d.phone_customer || '',
        model: d.model || 'Toyota',
        km_terakhir: 1000,
        service_terakhir: d.tanggal_dec || new Date().toISOString().slice(0, 10),
        jadwal_berikutnya: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
        selisih_hari: 180,
        status: 'OVERDUE',
        serviceCount: 0,
        nextServiceType: 'Servis Berkala 10.000 KM'
      }));

      return { success: true, count: reminders.length, data: reminders };
    }
  },

  /**
   * Unit History
   */
  async getUnitHistory(searchParams?: { vin?: string; month?: string; year?: string }): Promise<{
    success: boolean;
    count?: number;
    data?: UnitVehicleSummary[];
    summary?: UnitVehicleSummary;
  }> {
    try {
      const query = new URLSearchParams();
      if (searchParams?.vin) query.set('vin', searchParams.vin);
      if (searchParams?.month) query.set('month', searchParams.month);
      if (searchParams?.year) query.set('year', searchParams.year);

      return await fetchJson(`${API_BASE}/history?${query.toString()}`);
    } catch {
      const decList = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      const scList = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);

      const vinMap = new Map<string, UnitVehicleSummary>();
      decList.forEach((d) => {
        if (!d.vin) return;
        const vKey = d.vin.toUpperCase();
        vinMap.set(vKey, {
          vin: vKey,
          no_polisi: '-',
          model: d.model || '',
          nama_customer: d.nama_customer || '',
          dealer_penjual: 'Main Dealer Central',
          no_hp: d.phone_customer,
          tanggal_do: d.tanggal_dec,
          totalKunjungan: 0,
          serviceTerakhirDate: d.tanggal_dec || '',
          serviceTerakhirKM: 0,
          history: []
        });
      });

      scList.forEach((s) => {
        if (!s.vin) return;
        const vKey = s.vin.toUpperCase();
        if (vinMap.has(vKey)) {
          const item = vinMap.get(vKey)!;
          item.history.push(s);
          item.totalKunjungan++;
          item.serviceTerakhirDate = s.tanggal_invoice || item.serviceTerakhirDate;
          item.serviceTerakhirKM = s.km_service || item.serviceTerakhirKM;
        } else {
          vinMap.set(vKey, {
            vin: vKey,
            no_polisi: s.no_polisi || '-',
            model: s.tipe_kendaraan || '',
            nama_customer: s.nama_customer || '',
            dealer_penjual: s.dealer_penjual || 'Main Dealer Central',
            no_hp: s.no_hp || s.no_wa,
            totalKunjungan: 1,
            serviceTerakhirDate: s.tanggal_invoice || '',
            serviceTerakhirKM: s.km_service || 0,
            history: [s]
          });
        }
      });

      let results = Array.from(vinMap.values());
      if (searchParams?.vin) {
        const q = searchParams.vin.toLowerCase();
        results = results.filter((r) => r.vin.toLowerCase().includes(q) || (r.nama_customer || '').toLowerCase().includes(q));
      }

      return { success: true, count: results.length, data: results };
    }
  },

  /**
   * DEC CRUD
   */
  async getDECList(search?: string): Promise<{ success: boolean; count: number; data: DECRecord[] }> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return await fetchJson<{ success: boolean; count: number; data: DECRecord[] }>(`${API_BASE}/dec${query}`);
    } catch {
      let data = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((d) => (d.vin || '').toLowerCase().includes(q) || (d.nama_customer || '').toLowerCase().includes(q));
      }
      return { success: true, count: data.length, data };
    }
  },

  async createDEC(record: Omit<DECRecord, 'id'>): Promise<{ success: boolean; message: string; data?: DECRecord }> {
    try {
      return await fetchJson<{ success: boolean; message: string; data?: DECRecord }>(`${API_BASE}/dec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch {
      const db = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      const newRec: DECRecord = { ...record, id: `dec-${Date.now()}` };
      db.unshift(newRec);
      setLocalStore(STORAGE_KEYS.DEC, db);
      return { success: true, message: 'DEC berhasil dibuat (Lokal)', data: newRec };
    }
  },

  async updateDEC(id: string, record: Partial<DECRecord>): Promise<{ success: boolean; message: string }> {
    try {
      return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/dec/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch {
      const db = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      const idx = db.findIndex((d) => d.id === id);
      if (idx !== -1) {
        db[idx] = { ...db[idx], ...record };
        setLocalStore(STORAGE_KEYS.DEC, db);
        return { success: true, message: 'DEC diperbarui (Lokal)' };
      }
      return { success: false, message: 'Data tidak ditemukan' };
    }
  },

  async deleteDEC(id: string): Promise<{ success: boolean; message: string }> {
    try {
      return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/dec/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch {
      let db = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      db = db.filter((d) => d.id !== id);
      setLocalStore(STORAGE_KEYS.DEC, db);
      return { success: true, message: 'DEC dihapus (Lokal)' };
    }
  },

  async batchImportDEC(items: DECRecord[]): Promise<{ success: boolean; summary: ImportSummaryResult }> {
    try {
      return await fetchJson<{ success: boolean; summary: ImportSummaryResult }>(`${API_BASE}/import/dec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
    } catch {
      console.warn('Menggunakan fallback import DEC di browser memory/localStorage');
      const db = getLocalStore<DECRecord>(STORAGE_KEYS.DEC, []);
      const result: ImportSummaryResult = {
        total: items.length,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: []
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

        db.push(newRecord);
        result.success++;
      });

      setLocalStore(STORAGE_KEYS.DEC, db);
      return { success: true, summary: result };
    }
  },

  /**
   * Service Call CRUD
   */
  async getServiceCallList(search?: string): Promise<{ success: boolean; count: number; data: ServiceCallRecord[] }> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return await fetchJson<{ success: boolean; count: number; data: ServiceCallRecord[] }>(`${API_BASE}/service-call${query}`);
    } catch {
      let data = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((s) => (s.vin || '').toLowerCase().includes(q) || (s.nama_customer || '').toLowerCase().includes(q));
      }
      return { success: true, count: data.length, data };
    }
  },

  async createServiceCall(record: Omit<ServiceCallRecord, 'id'>): Promise<{ success: boolean; message: string; data?: ServiceCallRecord }> {
    try {
      return await fetchJson<{ success: boolean; message: string; data?: ServiceCallRecord }>(`${API_BASE}/service-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch {
      const db = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);
      const newRec: ServiceCallRecord = { ...record, id: `sc-${Date.now()}` };
      db.unshift(newRec);
      setLocalStore(STORAGE_KEYS.SERVICE_CALL, db);
      return { success: true, message: 'Service Call berhasil dibuat (Lokal)', data: newRec };
    }
  },

  async updateServiceCall(id: string, record: Partial<ServiceCallRecord>): Promise<{ success: boolean; message: string }> {
    try {
      return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/service-call/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch {
      const db = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);
      const idx = db.findIndex((s) => s.id === id);
      if (idx !== -1) {
        db[idx] = { ...db[idx], ...record };
        setLocalStore(STORAGE_KEYS.SERVICE_CALL, db);
        return { success: true, message: 'Service Call diperbarui (Lokal)' };
      }
      return { success: false, message: 'Data tidak ditemukan' };
    }
  },

  async deleteServiceCall(id: string): Promise<{ success: boolean; message: string }> {
    try {
      return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/service-call/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch {
      let db = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);
      db = db.filter((s) => s.id !== id);
      setLocalStore(STORAGE_KEYS.SERVICE_CALL, db);
      return { success: true, message: 'Service Call dihapus (Lokal)' };
    }
  },

  async batchImportServiceCall(
    items: ServiceCallRecord[],
    duplicateMode: 'skip' | 'replace' | 'all' = 'skip'
  ): Promise<{ success: boolean; summary: ImportSummaryResult }> {
    try {
      return await fetchJson<{ success: boolean; summary: ImportSummaryResult }>(`${API_BASE}/import/service-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, duplicateMode })
      });
    } catch {
      console.warn('Menggunakan fallback import Service Call di browser memory/localStorage');
      const db = getLocalStore<ServiceCallRecord>(STORAGE_KEYS.SERVICE_CALL, []);
      const result: ImportSummaryResult = {
        total: items.length,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: []
      };

      items.forEach((item, idx) => {
        const cleanVin = extractVin(item);
        const cleanInvoice = (item.no_invoice || '').toString().trim();

        if (!cleanVin) {
          result.failed++;
          result.errors.push({ row: idx + 1, reason: 'VIN (Nomor Rangka) wajib diisi', data: item });
          return;
        }

        const existingIdx = db.findIndex(
          (s) =>
            s.vin.toUpperCase() === cleanVin &&
            (cleanInvoice ? s.no_invoice === cleanInvoice : true)
        );

        if (existingIdx !== -1) {
          result.duplicates++;
          if (duplicateMode === 'skip') return;
        }

        const newRecord: ServiceCallRecord = {
          id: `sc-${Date.now()}-${idx}`,
          week: item.week || 1,
          cabang: item.cabang || 'Central',
          service_advisor: item.service_advisor || 'SA',
          tanggal_entry: normalizeDateToISO(item.tanggal_entry),
          call_id: item.call_id || '',
          kode_customer: item.kode_customer || '',
          nama_customer: item.nama_customer || '',
          no_hp: item.no_hp || '',
          no_wa: item.no_wa || '',
          alamat: item.alamat || '',
          kelurahan: item.kelurahan || '',
          kecamatan: item.kecamatan || '',
          kota: item.kota || '',
          kode_pos: item.kode_pos || '',
          ring_area: item.ring_area || 'Ring 1',
          tipe_kendaraan: item.tipe_kendaraan || '',
          vin: cleanVin,
          no_mesin: item.no_mesin || '',
          no_polisi: item.no_polisi || '',
          tahun_rakit: item.tahun_rakit || '',
          tanggal_do: normalizeDateToISO(item.tanggal_do),
          point_of_service: item.point_of_service || '',
          problem_definition: item.problem_definition || '',
          estimasi_harga: Number(item.estimasi_harga) || 0,
          no_voucher: item.no_voucher || '',
          km_service: Number(item.km_service) || 0,
          jenis_pekerjaan: item.jenis_pekerjaan || '',
          tipe_promo: item.tipe_promo || '',
          ssc: item.ssc || 'Tidak',
          dealer_penjual: item.dealer_penjual || 'Main Dealer',
          group: item.group || '',
          area_dealer: item.area_dealer || '',
          t_Care: item.t_Care || 'Aktif',
          up_selling: item.up_selling || '',
          cross_selling: item.cross_selling || '',
          no_so: item.no_so || '',
          tanggal_so: normalizeDateToISO(item.tanggal_so),
          no_invoice: cleanInvoice,
          tanggal_invoice: normalizeDateToISO(item.tanggal_invoice),
          next_service: item.next_service || '',
          so_key: item.so_key || '',
          invoice_key: item.invoice_key || '',
          alamat_domisili: item.alamat_domisili || '',
          ring_area_domisili: item.ring_area_domisili || 'Ring 1',
          nama_laporan: item.nama_laporan || '',
          periode: item.periode || ''
        };

        if (existingIdx !== -1 && duplicateMode === 'replace') {
          db[existingIdx] = newRecord;
        } else {
          db.push(newRecord);
        }
        result.success++;
      });

      setLocalStore(STORAGE_KEYS.SERVICE_CALL, db);
      return { success: true, summary: result };
    }
  }
};

