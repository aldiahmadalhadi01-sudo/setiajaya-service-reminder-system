import React from 'react';
import { 
  ArrowLeft, 
  Car, 
  Wrench, 
  Calendar, 
  UserCheck, 
  Receipt, 
  FileText, 
  AlertCircle, 
  MapPin, 
  DollarSign 
} from 'lucide-react';
import { UnitVehicleSummary } from '../../types';
import { formatDateIndonesian, formatCurrencyIDR, formatKM } from '../../lib/dateUtils';

interface UnitTimelineProps {
  unit: UnitVehicleSummary;
  onBack: () => void;
}

export const UnitTimeline: React.FC<UnitTimelineProps> = ({ unit, onBack }) => {
  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Unit</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">{unit.no_polisi}</span>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {unit.model}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              VIN: {unit.vin} | Customer: {unit.nama_customer} | Dealer Asal: {unit.dealer_penjual}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">Total Kunjungan Service</span>
            <span className="text-lg font-black text-slate-900">{unit.totalKunjungan} Kali</span>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Wrench className="w-5 h-5 text-slate-800" />
          <span>Timeline Riwayat Service (Terbaru → Terlama)</span>
        </h3>

        {unit.history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm italic">
            Belum ada catatan riwayat service untuk unit kendaraan ini di sheet SERVICE_CALL.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8">
            {unit.history.map((record, index) => (
              <div key={record.id || index} className="relative group">
                {/* Timeline Node Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-5 h-5 rounded-full bg-slate-900 border-4 border-white shadow-md flex items-center justify-center text-white" />

                {/* Timeline Card */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 hover:border-slate-400 hover:shadow-xs transition-all space-y-4">
                  {/* Top Bar: Date & Invoice */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
                        Tanggal Service: {formatDateIndonesian(record.tanggal_invoice || record.tanggal_entry)}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/80 px-2.5 py-0.5 rounded-full border border-slate-300">
                        Kilometer: {formatKM(record.km_service)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                      <span>Nomor SO: <strong>{record.no_so || '-'}</strong></span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">Nomor Invoice: {record.no_invoice || '-'}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Keluhan & Jenis Pekerjaan */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Problem / Keluhan Customer
                        </span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                          <span>{record.problem_definition || 'Service Berkala'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Jenis Pekerjaan
                          </span>
                          <span className="font-semibold text-slate-800">{record.jenis_pekerjaan || 'Service Berkala'}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Point of Service
                          </span>
                          <span className="font-semibold text-slate-800">{record.point_of_service || 'Bengkel Resmi'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Advisor & Financial Details */}
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Service Advisor
                        </span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{record.service_advisor || '-'}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Cabang Bengkel
                        </span>
                        <span className="font-semibold text-slate-800">{record.cabang || 'Toyota Setiajaya Depok'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Estimasi Biaya
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          {formatCurrencyIDR(record.estimasi_harga)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
