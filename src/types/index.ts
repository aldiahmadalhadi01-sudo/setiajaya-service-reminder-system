/**
 * Toyota Setiajaya Service Analytics & Reminder System
 * Data Types & Models
 */

// SHEET: DEC Interface
export interface DECRecord {
  id?: string;
  bulan: string;
  tanggal_dec: string; // YYYY-MM-DD
  nama_customer: string;
  payment: string; // Cash, Credit, Leasing, etc.
  phone_customer: string;
  model: string; // Innova Zenix, Avanza, Fortuner, Yaris Cross, etc.
  vin: string; // 17 char VIN
  sales: string;
  alamat: string;
  kota: string;
}

// SHEET: SERVICE_CALL Interface
export interface ServiceCallRecord {
  id?: string;
  week: string | number;
  cabang: string;
  service_advisor: string;
  tanggal_entry: string;
  call_id: string;
  kode_customer: string;
  nama_customer: string;
  no_hp: string;
  no_wa: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  kode_pos: string;
  ring_area: 'Ring 1' | 'Ring 2' | 'Ring 3' | 'Outer' | string;
  tipe_kendaraan: string;
  vin: string;
  no_mesin: string;
  no_polisi: string;
  tahun_rakit: string | number;
  tanggal_do: string;
  point_of_service: string;
  problem_definition: string;
  estimasi_harga: number;
  no_voucher: string;
  km_service: number;
  jenis_pekerjaan: string;
  tipe_promo: string;
  ssc: 'Ya' | 'Tidak' | string;
  dealer_penjual: string;
  group: string;
  area_dealer: string;
  t_Care: 'Aktif' | 'Non-Aktif' | string;
  up_selling: string;
  cross_selling: string;
  no_so: string;
  tanggal_so: string;
  no_invoice: string;
  tanggal_invoice: string;
  next_service: string;
  so_key: string;
  invoice_key: string;
  alamat_domisili: string;
  ring_area_domisili: 'Ring 1' | 'Ring 2' | 'Ring 3' | 'Outer' | string;
  nama_laporan: string;
  periode: string;
}

// KPI Interface
export interface DashboardKPI {
  totalUnitDEC: number;
  unitAktifService: number;
  serviceBulanIni: number;
  serviceHariIni: number;
  serviceOverdue: number;
  reminderH7: number;
  totalCustomer: number;
}

// Trend Service Data Point
export interface TrendDataPoint {
  period: string; // "01 Jul", "W1", "Jan 2025"
  count: number;
  dateKey?: string;
}

// Dealer Distribution Data Point
export interface DealerDistData {
  dealer: string;
  count: number;
  percentage: number;
}

// Ring Area Distribution Data
export interface RingAreaData {
  ring: 'Ring 1' | 'Ring 2' | 'Ring 3' | 'Outer';
  ring_area: number;
  ring_area_domisili: number;
}

// Leaderboard Service Advisor Item
export interface LeaderboardSAItem {
  rank: number;
  name: string;
  totalService: number;
  percentage: number;
  cabangPrimary: string;
}

// Reminder Status Type
export type ReminderStatus = 'AMAN' | 'H-7' | 'HARI INI' | 'OVERDUE';

// Calculated Reminder Item
export interface ReminderItem {
  vin: string;
  no_polisi: string;
  nama_customer: string;
  no_wa: string;
  no_hp: string;
  model: string;
  km_terakhir: number;
  service_terakhir: string; // YYYY-MM-DD
  jadwal_berikutnya: string; // YYYY-MM-DD
  selisih_hari: number; // positive = days until due, negative = days overdue
  status: ReminderStatus;
  serviceCount: number;
  nextServiceType: string;
}

// Unit Service History
export interface UnitVehicleSummary {
  vin: string;
  no_polisi: string;
  model: string;
  nama_customer: string;
  dealer_penjual: string;
  no_hp?: string;
  tanggal_do?: string;
  totalKunjungan: number;
  serviceTerakhirDate: string;
  serviceTerakhirKM: number;
  serviceTerakhirSA?: string;
  history: ServiceCallRecord[];
}

// Import Result Summary
export interface ImportSummaryResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string; data?: any }>;
}

// GAS Config Settings
export interface GasConfig {
  webAppUrl: string;
  apiKey: string;
  isLive: boolean;
}
