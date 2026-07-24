/**
 * Date Formatting & Manipulation Utilities for Toyota Setiajaya System
 */

export function formatDateIndonesian(dateString: string | Date | undefined | null): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatCurrencyIDR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rp 0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatKM(km: number | string | undefined | null): string {
  if (km === undefined || km === null || km === '') return '0 KM';
  const num = typeof km === 'number' ? km : parseInt(String(km).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '0 KM';
  return `${num.toLocaleString('id-ID')} KM`;
}

/**
 * Normalizes any string or Date object into YYYY-MM-DD
 */
export function normalizeDateToISO(dateInput: any): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput.toISOString().split('T')[0];
  }

  const str = String(dateInput).trim();
  if (!str || str === '-' || str === 'undefined' || str === 'null') {
    return new Date().toISOString().split('T')[0];
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Excel Serial Number (e.g. 44562 or 45123.5)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    if (serial > 20000 && serial < 60000) {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      if (!isNaN(date_info.getTime())) {
        return date_info.toISOString().split('T')[0];
      }
    }
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-\.]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD, YYYY.MM.DD
  if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/\-\.]/);
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle Indonesian Month Names (e.g., 15 Juli 2026, 15-Jul-2026)
  const indoMonths: Record<string, string> = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    agt: '08', agustus: '08', aug: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10', oct: '10',
    nov: '11', november: '11',
    des: '12', desember: '12', dec: '12'
  };

  const textMatch = str.match(/^(\d{1,2})[\s\/\-\.]([a-zA-Z]+)[\s\/\-\.](\d{4})$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const mStr = textMatch[2].toLowerCase();
    const year = textMatch[3];
    if (indoMonths[mStr]) {
      return `${year}-${indoMonths[mStr]}-${day}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Adds months to a Date object
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculates differences in days between two YYYY-MM-DD strings (targetDate - today)
 */
export function getDaysDifference(targetDateStr: string, baseDate: Date = new Date()): number {
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const base = new Date(baseDate);
  base.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
