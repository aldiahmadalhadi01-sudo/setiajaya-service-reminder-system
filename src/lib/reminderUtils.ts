import { DECRecord, ServiceCallRecord, ReminderItem, ReminderStatus } from '../types';
import { normalizeDateToISO, addMonths, getDaysDifference } from './dateUtils';

/**
 * Calculates realtime reminders based on DEC records and Service Call histories.
 * Does NOT persist to spreadsheet, calculated on the fly.
 */
export function calculateReminders(
  decRecords: DECRecord[],
  serviceCallRecords: ServiceCallRecord[],
  today: Date = new Date()
): ReminderItem[] {
  // Map service call history by VIN
  const serviceByVin = new Map<string, ServiceCallRecord[]>();
  
  for (const sc of serviceCallRecords) {
    if (!sc.vin) continue;
    const cleanVin = sc.vin.trim().toUpperCase();
    if (!serviceByVin.has(cleanVin)) {
      serviceByVin.set(cleanVin, []);
    }
    serviceByVin.get(cleanVin)!.push(sc);
  }

  // Sort each VIN's service history by invoice date DESC
  serviceByVin.forEach((records) => {
    records.sort((a, b) => {
      const dateA = new Date(normalizeDateToISO(a.tanggal_invoice || a.tanggal_entry)).getTime();
      const dateB = new Date(normalizeDateToISO(b.tanggal_invoice || b.tanggal_entry)).getTime();
      return dateB - dateA;
    });
  });

  const reminders: ReminderItem[] = [];

  for (const dec of decRecords) {
    if (!dec.vin) continue;
    const cleanVin = dec.vin.trim().toUpperCase();
    const history = serviceByVin.get(cleanVin) || [];
    
    // Parse DEC Date
    const decDateStr = normalizeDateToISO(dec.tanggal_dec);
    const decDate = new Date(decDateStr);

    let nextScheduleDateStr = '';
    let nextServiceType = 'Service Berkala';
    let kmTerakhir = 0;
    let lastServiceDateStr = decDateStr;

    if (history.length > 0) {
      const latestService = history[0];
      kmTerakhir = Number(latestService.km_service) || 0;
      lastServiceDateStr = normalizeDateToISO(latestService.tanggal_invoice || latestService.tanggal_entry);

      // If next_service is explicitly specified in the service call record
      if (latestService.next_service) {
        nextScheduleDateStr = normalizeDateToISO(latestService.next_service);
      } else {
        // Otherwise calculate +6 months from latest service date
        const lastServiceDate = new Date(lastServiceDateStr);
        const nextDate = addMonths(lastServiceDate, 6);
        nextScheduleDateStr = normalizeDateToISO(nextDate);
      }

      nextServiceType = `Service ${history.length + 1} (${kmTerakhir + 10000} KM)`;
    } else {
      // No service calls recorded yet after DEC
      // Service 1: DEC Date + 1 Month
      const service1Date = addMonths(decDate, 1);
      const daysToService1 = getDaysDifference(normalizeDateToISO(service1Date), today);

      if (daysToService1 < -30) {
        // Passed Service 1 long ago, prompt Service 2 (+6 months from DEC)
        const service2Date = addMonths(decDate, 6);
        nextScheduleDateStr = normalizeDateToISO(service2Date);
        nextServiceType = 'Service 2 (10.000 KM)';
      } else {
        nextScheduleDateStr = normalizeDateToISO(service1Date);
        nextServiceType = 'Service 1 (1.000 KM / 1 Bulan)';
      }
    }

    // Determine days difference and status
    const selisihHari = getDaysDifference(nextScheduleDateStr, today);
    let status: ReminderStatus = 'AMAN';

    if (selisihHari < 0) {
      status = 'OVERDUE';
    } else if (selisihHari === 0) {
      status = 'HARI INI';
    } else if (selisihHari <= 7) {
      status = 'H-7';
    } else {
      status = 'AMAN';
    }

    const noWa = dec.phone_customer || (history[0]?.no_wa || history[0]?.no_hp || '');
    const noHp = history[0]?.no_hp || dec.phone_customer || '';
    const noPolisi = history[0]?.no_polisi || 'Belum Plat';

    reminders.push({
      vin: dec.vin,
      no_polisi: noPolisi,
      nama_customer: dec.nama_customer || history[0]?.nama_customer || 'Customer',
      no_wa: noWa,
      no_hp: noHp,
      model: dec.model || history[0]?.tipe_kendaraan || 'Toyota',
      km_terakhir: kmTerakhir,
      service_terakhir: lastServiceDateStr,
      jadwal_berikutnya: nextScheduleDateStr,
      selisih_hari: selisihHari,
      status: status,
      serviceCount: history.length,
      nextServiceType: nextServiceType
    });
  }

  // Sort by urgency: OVERDUE, HARI INI, H-7, AMAN, then by selisih_hari ASC
  const statusPriority: Record<ReminderStatus, number> = {
    'OVERDUE': 1,
    'HARI INI': 2,
    'H-7': 3,
    'AMAN': 4
  };

  return reminders.sort((a, b) => {
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return a.selisih_hari - b.selisih_hari;
  });
}

/**
 * Builds standard professional WhatsApp message URL
 */
export function buildWhatsAppReminderUrl(item: ReminderItem): string {
  const rawPhone = item.no_wa || item.no_hp || '';
  let cleanPhone = rawPhone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('8')) {
    cleanPhone = '628' + cleanPhone.slice(1);
  }

  const message = `Halo Bapak/Ibu *${item.nama_customer}*,\n\nSalam Toyota Setiajaya!\n\nMengingatkan kembali jadwal Service Berkala untuk kendaraan Toyota Anda:\n🚘 *Model*: ${item.model}\n🔢 *No. Polisi*: ${item.no_polisi}\n🆔 *VIN*: ${item.vin}\n📅 *Jadwal Service*: ${item.jadwal_berikutnya}\n\nNikmati layanan terbaik, garansi resmi, serta promo berkala dari Toyota Setiajaya. Hubungi kami untuk reservasi waktu service agar tidak perlu mengantre.\n\nTerima kasih dan sehat selalu!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
