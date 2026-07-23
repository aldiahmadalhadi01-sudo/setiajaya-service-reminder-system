/**
 * TOYOTA SETIAJAYA SERVICE ANALYTICS & REMINDER SYSTEM
 * Google Apps Script Web App REST API Backend Engine
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet (with sheets: "DEC" and "SERVICE_CALL")
 * 2. Click Extensions > Apps Script
 * 3. Paste this entire Code.gs file content
 * 4. Click Deploy > New Deployment > Select type: Web App
 * 5. Set "Execute as": Me
 * 6. Set "Who has access": Anyone (Bisa Siapa Saja)
 * 7. Deploy & copy the Web App URL into the Toyota Setiajaya App Settings panel!
 */

const SHEET_DEC_NAME = 'DEC';
const SHEET_SERVICE_CALL_NAME = 'SERVICE_CALL';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    let params = e.parameter || {};
    let postData = {};

    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback
      }
    }

    const action = params.action || postData.action || 'getDashboard';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let result = { success: false, message: 'Invalid action' };

    switch (action) {
      case 'getDEC':
        result = getDECData(spreadsheet, params.search);
        break;

      case 'saveDEC':
        result = saveDECData(spreadsheet, postData.data || postData);
        break;

      case 'deleteDEC':
        result = deleteDECData(spreadsheet, params.vin || postData.vin);
        break;

      case 'getServiceCall':
        result = getServiceCallData(spreadsheet, params.search);
        break;

      case 'saveServiceCall':
        result = saveServiceCallData(spreadsheet, postData.data || postData);
        break;

      case 'deleteServiceCall':
        result = deleteServiceCallData(spreadsheet, params.id || postData.id || params.no_invoice);
        break;

      case 'batchImportDEC':
        result = batchImportDEC(spreadsheet, postData.items || []);
        break;

      case 'batchImportServiceCall':
        result = batchImportServiceCall(spreadsheet, postData.items || [], postData.duplicateMode || 'skip');
        break;

      case 'getDashboard':
        result = getDashboardAnalytics(spreadsheet);
        break;

      default:
        result = { success: false, message: 'Unknown action: ' + action };
        break;
    }

    return responseJSON(result);

  } catch (error) {
    return responseJSON({ success: false, error: error.toString(), stack: error.stack });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get Sheet Headers and Rows
 */
function getSheetRecords(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const records = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1] && !row[2]) continue; // Skip empty rows

    const record = {};
    headers.forEach((h, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
      }
      record[h] = val;
    });
    record.rowIndex = i + 1;
    records.push(record);
  }

  return records;
}

function getDECData(spreadsheet, search) {
  const records = getSheetRecords(spreadsheet, SHEET_DEC_NAME);
  if (search) {
    const query = String(search).toLowerCase();
    const filtered = records.filter(r =>
      String(r.vin || '').toLowerCase().includes(query) ||
      String(r.nama_customer || '').toLowerCase().includes(query) ||
      String(r.model || '').toLowerCase().includes(query)
    );
    return { success: true, count: filtered.length, data: filtered };
  }
  return { success: true, count: records.length, data: records };
}

function saveDECData(spreadsheet, record) {
  let sheet = spreadsheet.getSheetByName(SHEET_DEC_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_DEC_NAME);

  const cleanVin = String(record.vin || '').trim().toUpperCase();
  if (!cleanVin) return { success: false, message: 'VIN wajib diisi' };

  const data = sheet.getDataRange().getValues();
  const headers = [
    'bulan', 'tanggal_dec', 'nama_customer', 'payment', 'phone_customer',
    'model', 'vin', 'sales', 'alamat', 'kota'
  ];

  // Set headers if missing
  if (data.length === 0 || !data[0][0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const existingRecords = getSheetRecords(spreadsheet, SHEET_DEC_NAME);
  const existingIndex = existingRecords.findIndex(r => String(r.vin).toUpperCase() === cleanVin);

  const rowValues = [
    record.bulan || '',
    record.tanggal_dec || '',
    record.nama_customer || '',
    record.payment || '',
    record.phone_customer || '',
    record.model || '',
    cleanVin,
    record.sales || '',
    record.alamat || '',
    record.kota || ''
  ];

  if (existingIndex !== -1) {
    const targetRow = existingRecords[existingIndex].rowIndex;
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    return { success: true, message: 'Data DEC diperbarui' };
  } else {
    sheet.appendRow(rowValues);
    return { success: true, message: 'Data DEC ditambahkan' };
  }
}

function deleteDECData(spreadsheet, vin) {
  const sheet = spreadsheet.getSheetByName(SHEET_DEC_NAME);
  if (!sheet) return { success: false, message: 'Sheet DEC tidak ditemukan' };

  const records = getSheetRecords(spreadsheet, SHEET_DEC_NAME);
  const target = records.find(r => String(r.vin).toUpperCase() === String(vin).trim().toUpperCase());

  if (!target) return { success: false, message: 'VIN tidak ditemukan' };

  sheet.deleteRow(target.rowIndex);
  return { success: true, message: 'Data DEC berhasil dihapus' };
}

function getServiceCallData(spreadsheet, search) {
  const records = getSheetRecords(spreadsheet, SHEET_SERVICE_CALL_NAME);
  if (search) {
    const query = String(search).toLowerCase();
    const filtered = records.filter(r =>
      String(r.vin || '').toLowerCase().includes(query) ||
      String(r.no_polisi || '').toLowerCase().includes(query) ||
      String(r.nama_customer || '').toLowerCase().includes(query)
    );
    return { success: true, count: filtered.length, data: filtered };
  }
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

function deleteServiceCallData(spreadsheet, id) {
  const sheet = spreadsheet.getSheetByName(SHEET_SERVICE_CALL_NAME);
  if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };

  const records = getSheetRecords(spreadsheet, SHEET_SERVICE_CALL_NAME);
  const target = records.find(r => String(r.no_invoice) === String(id) || String(r.vin) === String(id));

  if (!target) return { success: false, message: 'Record tidak ditemukan' };

  sheet.deleteRow(target.rowIndex);
  return { success: true, message: 'Data Service Call berhasil dihapus' };
}

function batchImportDEC(spreadsheet, items) {
  let sheet = spreadsheet.getSheetByName(SHEET_DEC_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_DEC_NAME);

  if (!items || items.length === 0) return { success: false, message: 'Data kosong' };

  const rowsToAdd = items.map(record => [
    record.bulan || '',
    record.tanggal_dec || '',
    record.nama_customer || '',
    record.payment || '',
    record.phone_customer || '',
    record.model || '',
    String(record.vin || '').toUpperCase().trim(),
    record.sales || '',
    record.alamat || '',
    record.kota || ''
  ]);

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }

  return { success: true, imported: rowsToAdd.length };
}

function batchImportServiceCall(spreadsheet, items, duplicateMode) {
  let sheet = spreadsheet.getSheetByName(SHEET_SERVICE_CALL_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_SERVICE_CALL_NAME);

  if (!items || items.length === 0) return { success: false, message: 'Data kosong' };

  const existingRecords = getSheetRecords(spreadsheet, SHEET_SERVICE_CALL_NAME);
  const existingKeys = new Set(existingRecords.map(r => String(r.vin).toUpperCase() + '_' + String(r.no_invoice)));

  const rowsToAdd = [];
  let skipped = 0;

  items.forEach(record => {
    const key = String(record.vin || '').toUpperCase().trim() + '_' + String(record.no_invoice || '').trim();
    if (existingKeys.has(key) && duplicateMode === 'skip') {
      skipped++;
      return;
    }

    rowsToAdd.push([
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
  });

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }

  return { success: true, imported: rowsToAdd.length, skipped };
}

function getDashboardAnalytics(spreadsheet) {
  const decRecords = getSheetRecords(spreadsheet, SHEET_DEC_NAME);
  const scRecords = getSheetRecords(spreadsheet, SHEET_SERVICE_CALL_NAME);

  return {
    success: true,
    totalDEC: decRecords.length,
    totalServiceCall: scRecords.length,
    decData: decRecords,
    serviceCallData: scRecords
  };
}
