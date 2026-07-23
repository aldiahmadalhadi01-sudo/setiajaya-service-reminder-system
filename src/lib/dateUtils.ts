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
  
  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
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
