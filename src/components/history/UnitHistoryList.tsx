import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  UserCheck, 
  Wrench, 
  Target, 
  History,
  Car
} from 'lucide-react';
import { UnitVehicleSummary } from '../../types';
import { formatDateIndonesian, formatKM } from '../../lib/dateUtils';

interface UnitHistoryListProps {
  units: UnitVehicleSummary[];
  isLoading?: boolean;
}

export const UnitHistoryList: React.FC<UnitHistoryListProps> = ({
  units,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedVin, setSelectedVin] = useState<string | null>(null);

  // Filter Units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        u.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.no_polisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nama_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.model.toLowerCase().includes(searchTerm.toLowerCase());

      let matchMonthYear = true;
      if (u.serviceTerakhirDate && u.serviceTerakhirDate !== '-') {
        const d = new Date(u.serviceTerakhirDate);
        if (!isNaN(d.getTime())) {
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          const y = d.getFullYear().toString();
          if (monthFilter && m !== monthFilter) matchMonthYear = false;
          if (yearFilter && y !== yearFilter) matchMonthYear = false;
        }
      }

      return matchSearch && matchMonthYear;
    }).sort((a, b) => {
      // Sort by latest service date DESC
      const timeA = (a.serviceTerakhirDate && a.serviceTerakhirDate !== '-') 
        ? new Date(a.serviceTerakhirDate).getTime() 
        : 0;
      const timeB = (b.serviceTerakhirDate && b.serviceTerakhirDate !== '-') 
        ? new Date(b.serviceTerakhirDate).getTime() 
        : 0;

      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.totalKunjungan - a.totalKunjungan;
    });
  }, [units, searchTerm, monthFilter, yearFilter]);

  // Active Unit Selection
  const activeUnit = useMemo(() => {
    if (!filteredUnits || filteredUnits.length === 0) return null;
    const found = filteredUnits.find(u => u.vin === selectedVin);
    return found || filteredUnits[0];
  }, [filteredUnits, selectedVin]);

  return (
    <div className="space-y-6">
      {/* Page Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Riwayat Perbaikan Unit
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Toyota SJM — Lengkap dengan Visual Timeline Kunjungan & Detail Service Advisor
        </p>
      </div>

      {/* Main Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daftar Unit List */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col h-auto max-h-[420px] lg:h-[740px] lg:max-h-none">
          {/* Header & Filter Controls */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                DAFTAR UNIT AKTIF ({filteredUnits.length})
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Nama, VIN, No Polisi..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50 min-h-[40px]"
              />
            </div>

            {/* Month & Year Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 outline-none min-h-[38px]"
              >
                <option value="">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = (i + 1).toString().padStart(2, '0');
                  const monthName = new Date(2025, i, 1).toLocaleString('id-ID', { month: 'long' });
                  return (
                    <option key={monthNum} value={monthNum}>
                      {monthName}
                    </option>
                  );
                })}
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 outline-none min-h-[38px]"
              >
                <option value="">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {/* Unit List Items */}
          <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Memuat daftar unit...
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Tidak ada unit ditemukan.
              </div>
            ) : (
              filteredUnits.map((unit) => {
                const isSelected = activeUnit?.vin === unit.vin;
                return (
                  <div
                    key={unit.vin}
                    onClick={() => setSelectedVin(unit.vin)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Top Row: Model & Kunjungan Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {unit.model}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                          unit.totalKunjungan > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {unit.totalKunjungan} Kunjungan
                      </span>
                    </div>

                    {/* Middle Row: Nama Customer */}
                    <p className="text-xs font-bold text-slate-600 uppercase mt-1 truncate">
                      {unit.nama_customer || 'Customer'}
                    </p>

                    {/* Bottom Row: VIN & No Polisi */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px]">
                      <span className="font-mono text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[170px]">
                        VIN: {unit.vin}
                      </span>
                      <span className="font-mono font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
                        {unit.no_polisi || 'Belum Plat'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail Panel & History Timeline */}
        <div className="lg:col-span-8 space-y-5 min-w-0">
          {!activeUnit ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center text-slate-400 text-sm border border-slate-200/80">
              Pilih salah satu unit dari daftar di samping untuk melihat riwayat lengkap.
            </div>
          ) : (
            <>
              {/* Top Card: Metadata Overview Grid */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      VIN / RANGKA:
                    </span>
                    <span className="text-xs font-black text-slate-900 font-mono block mt-0.5 break-all">
                      {activeUnit.vin}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      NO POLISI:
                    </span>
                    <span className="text-xs font-black text-slate-900 font-mono block mt-0.5">
                      {activeUnit.no_polisi || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      NAMA CUSTOMER:
                    </span>
                    <span className="text-xs font-black text-slate-900 uppercase block mt-0.5 truncate">
                      {activeUnit.nama_customer || 'Customer'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      NO HP KONTAK:
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono block mt-0.5">
                      {activeUnit.no_hp || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      MODEL UNIT:
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {activeUnit.model || 'Toyota'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      TANGGAL SERAH UNIT (DEC):
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {activeUnit.tanggal_do && activeUnit.tanggal_do !== '-' 
                        ? activeUnit.tanggal_do 
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card: History Timeline */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs min-h-[400px]">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                  <History className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>HISTORI PERBAIKAN LENGKAP (TERBARU - LAMA)</span>
                </h3>

                {activeUnit.history.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center text-slate-400 text-xs italic">
                    Belum ada riwayat perbaikan di sheet SERVICE_CALL untuk unit ini.
                  </div>
                ) : (
                  <div className="relative pl-5 sm:pl-8 border-l-2 border-blue-500/30 space-y-6 ml-2 sm:ml-3">
                    {activeUnit.history.map((record, index) => (
                      <div key={record.id || index} className="relative">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[29px] sm:-left-[41px] top-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center text-blue-600 shadow-xs">
                          <Target className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-blue-600" />
                        </div>

                        {/* History Card */}
                        <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4.5 space-y-3.5">
                          {/* Top Row: Date & KM */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                {formatDateIndonesian(record.tanggal_invoice || record.tanggal_entry)}
                              </span>
                            </div>

                            <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto shadow-2xs">
                              ⏱ {formatKM(record.km_service)}
                            </span>
                          </div>

                          {/* Middle Body Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Problem Definition */}
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                💬 KELUHAN (PROBLEM DEFINITION):
                              </span>
                              <div className="text-xs font-medium italic text-slate-800 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 min-h-[44px] flex items-center">
                                "{record.problem_definition || 'Service Berkala'}"
                              </div>
                            </div>

                            {/* Pekerjaan & Suku Cadang */}
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                🔧 PEKERJAAN & SUKU CADANG:
                              </span>
                              <div className="text-xs font-semibold text-slate-800 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 min-h-[44px] flex items-center">
                                {record.jenis_pekerjaan || 'Service Berkala'}
                              </div>
                            </div>
                          </div>

                          {/* Footer Row: Service Advisor & Status Badge */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-500 font-medium">
                                Service Advisor:{' '}
                                <strong className="text-slate-900 font-bold">
                                  {record.service_advisor || 'Unassigned'}
                                </strong>
                              </span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              {record.no_so && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  SO: {record.no_so}
                                </span>
                              )}
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                SELESAI
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
