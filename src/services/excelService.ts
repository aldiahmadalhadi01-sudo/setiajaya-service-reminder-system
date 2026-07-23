import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFileResult {
  sheetNames: string[];
  selectedSheet: string;
  data: Record<string, any>[];
  headers: string[];
  rawRows: any[][];
}

export const excelService = {
  /**
   * Reads a file (CSV or XLSX/XLS) and returns parsed records & headers
   */
  async parseFile(file: File, sheetIndex: number = 0): Promise<ParsedFileResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: 'greedy',
          dynamicTyping: false,
          complete: (results) => {
            const data = (results.data as Record<string, any>[]).filter(
              row => Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '')
            );
            const headers = results.meta.fields || (data[0] ? Object.keys(data[0]) : []);

            resolve({
              sheetNames: ['CSV Data'],
              selectedSheet: 'CSV Data',
              data,
              headers,
              rawRows: []
            });
          },
          error: (err) => reject(err)
        });
      });
    } else {
      // Excel File (.xlsx, .xls)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result;
            const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true, cellNF: false });
            const sheetNames = workbook.SheetNames;
            
            if (sheetNames.length === 0) {
              throw new Error('File Excel tidak memiliki lembar kerja (sheet)');
            }

            const targetSheetName = sheetNames[sheetIndex] || sheetNames[0];
            const worksheet = workbook.Sheets[targetSheetName];

            const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
              defval: '',
              raw: false
            });

            const data = rawJson.filter(row =>
              Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '')
            );

            const headers = data[0] ? Object.keys(data[0]) : [];

            resolve({
              sheetNames,
              selectedSheet: targetSheetName,
              data,
              headers,
              rawRows: []
            });
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
      });
    }
  },

  /**
   * Header Mapping Helper: Maps file headers to expected target schema headers
   */
  mapHeaders(parsedData: Record<string, any>[], headerMapping: Record<string, string>): Record<string, any>[] {
    return parsedData.map(row => {
      const mappedRow: Record<string, any> = { ...row };

      Object.entries(headerMapping).forEach(([expectedKey, fileHeader]) => {
        if (fileHeader && row[fileHeader] !== undefined && row[fileHeader] !== null) {
          mappedRow[expectedKey] = row[fileHeader];
        } else if (mappedRow[expectedKey] === undefined) {
          // Check case-insensitive match from raw row keys
          const matchingKey = Object.keys(row).find(
            k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === expectedKey.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (matchingKey && row[matchingKey] !== undefined) {
            mappedRow[expectedKey] = row[matchingKey];
          }
        }
      });
      return mappedRow;
    });
  },

  /**
   * Export JSON array to CSV download
   */
  exportToCSV(filename: string, rows: Record<string, any>[]) {
    const csv = Papa.unparse(rows);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export JSON array to Excel (.xlsx) download
   */
  exportToExcel(filename: string, rows: Record<string, any>[], sheetName: string = 'Data') {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  },

  /**
   * Download Error Log CSV for failed import rows
   */
  downloadErrorLog(filename: string, errors: Array<{ row: number; reason: string; data?: any }>) {
    const rows = errors.map(e => ({
      'Baris Ke': e.row,
      'Alasan Error': e.reason,
      ...e.data
    }));

    this.exportToCSV(`Error_Log_${filename}`, rows);
  }
};
