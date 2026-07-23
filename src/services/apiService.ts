import { DECRecord, ServiceCallRecord, DashboardKPI, TrendDataPoint, DealerDistData, RingAreaData, LeaderboardSAItem, ReminderItem, UnitVehicleSummary, ImportSummaryResult, GasConfig } from '../types';

const API_BASE = '/api';

export const apiService = {
  /**
   * Get Server Health & Status
   */
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  },

  /**
   * Get / Update Settings
   */
  async getConfig(): Promise<{ success: boolean; config: GasConfig }> {
    const res = await fetch(`${API_BASE}/config`);
    return await res.json();
  },

  async updateConfig(config: Partial<GasConfig>): Promise<{ success: boolean; config: GasConfig }> {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  },

  async testGasUrl(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl })
    });
    return await res.json();
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

    const res = await fetch(`${API_BASE}/dashboard?${query.toString()}`);
    return await res.json();
  },

  /**
   * Realtime Reminders
   */
  async getReminders(): Promise<{ success: boolean; count: number; data: ReminderItem[] }> {
    const res = await fetch(`${API_BASE}/reminders`);
    return await res.json();
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

    const res = await fetch(`${API_BASE}/history?${query.toString()}`);
    return await res.json();
  },

  /**
   * DEC CRUD
   */
  async getDECList(search?: string): Promise<{ success: boolean; count: number; data: DECRecord[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/dec${query}`);
    return await res.json();
  },

  async createDEC(record: Omit<DECRecord, 'id'>): Promise<{ success: boolean; message: string; data?: DECRecord }> {
    const res = await fetch(`${API_BASE}/dec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return await res.json();
  },

  async updateDEC(id: string, record: Partial<DECRecord>): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/dec/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return await res.json();
  },

  async deleteDEC(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/dec/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async batchImportDEC(items: DECRecord[]): Promise<{ success: boolean; summary: ImportSummaryResult }> {
    const res = await fetch(`${API_BASE}/import/dec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return await res.json();
  },

  /**
   * Service Call CRUD
   */
  async getServiceCallList(search?: string): Promise<{ success: boolean; count: number; data: ServiceCallRecord[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/service-call${query}`);
    return await res.json();
  },

  async createServiceCall(record: Omit<ServiceCallRecord, 'id'>): Promise<{ success: boolean; message: string; data?: ServiceCallRecord }> {
    const res = await fetch(`${API_BASE}/service-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return await res.json();
  },

  async updateServiceCall(id: string, record: Partial<ServiceCallRecord>): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/service-call/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return await res.json();
  },

  async deleteServiceCall(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/service-call/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async batchImportServiceCall(
    items: ServiceCallRecord[],
    duplicateMode: 'skip' | 'replace' | 'all' = 'skip'
  ): Promise<{ success: boolean; summary: ImportSummaryResult }> {
    const res = await fetch(`${API_BASE}/import/service-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, duplicateMode })
    });
    return await res.json();
  }
};
