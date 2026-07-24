import { DECRecord, ServiceCallRecord, DashboardKPI, TrendDataPoint, DealerDistData, RingAreaData, LeaderboardSAItem, ReminderItem, UnitVehicleSummary, ImportSummaryResult, GasConfig } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn(`[API] Expected JSON from ${url}, got:`, text.slice(0, 100));
      if (res.status === 404 || text.toLowerCase().includes('doctype')) {
        throw new Error(`API Server /api tidak merespons (HTTP ${res.status}). Pastikan file vercel.json dan /api/index.ts terdaftar di repository Vercel Anda.`);
      }
      throw new Error(`Server API response was not JSON (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data as T;
  } catch (err: any) {
    console.error(`[API Error - ${url}]:`, err);
    throw err;
  }
}

export const apiService = {
  /**
   * Get Server Health & Status
   */
  async getHealth() {
    return await fetchJson<{ status: string; system: string; isLiveMode: boolean }>(`${API_BASE}/health`);
  },

  /**
   * Get / Update Settings
   */
  async getConfig(): Promise<{ success: boolean; config: GasConfig }> {
    return await fetchJson<{ success: boolean; config: GasConfig }>(`${API_BASE}/config`);
  },

  async updateConfig(config: Partial<GasConfig>): Promise<{ success: boolean; config: GasConfig }> {
    return await fetchJson<{ success: boolean; config: GasConfig }>(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  async testGasUrl(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl })
    });
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
    const query = new URLSearchParams();
    query.set('trend', trendFilter);
    if (month) query.set('month', month);
    if (year) query.set('year', year);

    return await fetchJson(`${API_BASE}/dashboard?${query.toString()}`);
  },

  /**
   * Realtime Reminders
   */
  async getReminders(): Promise<{ success: boolean; count: number; data: ReminderItem[] }> {
    return await fetchJson<{ success: boolean; count: number; data: ReminderItem[] }>(`${API_BASE}/reminders`);
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
    const query = new URLSearchParams();
    if (searchParams?.vin) query.set('vin', searchParams.vin);
    if (searchParams?.month) query.set('month', searchParams.month);
    if (searchParams?.year) query.set('year', searchParams.year);

    return await fetchJson(`${API_BASE}/history?${query.toString()}`);
  },

  /**
   * DEC CRUD
   */
  async getDECList(search?: string): Promise<{ success: boolean; count: number; data: DECRecord[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await fetchJson<{ success: boolean; count: number; data: DECRecord[] }>(`${API_BASE}/dec${query}`);
  },

  async createDEC(record: Omit<DECRecord, 'id'>): Promise<{ success: boolean; message: string; data?: DECRecord }> {
    return await fetchJson<{ success: boolean; message: string; data?: DECRecord }>(`${API_BASE}/dec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  async updateDEC(id: string, record: Partial<DECRecord>): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/dec/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  async deleteDEC(id: string): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/dec/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async batchImportDEC(items: DECRecord[]): Promise<{ success: boolean; summary: ImportSummaryResult }> {
    return await fetchJson<{ success: boolean; summary: ImportSummaryResult }>(`${API_BASE}/import/dec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
  },

  /**
   * Service Call CRUD
   */
  async getServiceCallList(search?: string): Promise<{ success: boolean; count: number; data: ServiceCallRecord[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await fetchJson<{ success: boolean; count: number; data: ServiceCallRecord[] }>(`${API_BASE}/service-call${query}`);
  },

  async createServiceCall(record: Omit<ServiceCallRecord, 'id'>): Promise<{ success: boolean; message: string; data?: ServiceCallRecord }> {
    return await fetchJson<{ success: boolean; message: string; data?: ServiceCallRecord }>(`${API_BASE}/service-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  async updateServiceCall(id: string, record: Partial<ServiceCallRecord>): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/service-call/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  async deleteServiceCall(id: string): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/service-call/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async batchImportServiceCall(
    items: ServiceCallRecord[],
    duplicateMode: 'skip' | 'replace' | 'all' = 'skip'
  ): Promise<{ success: boolean; summary: ImportSummaryResult }> {
    return await fetchJson<{ success: boolean; summary: ImportSummaryResult }>(`${API_BASE}/import/service-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, duplicateMode })
    });
  }
};
