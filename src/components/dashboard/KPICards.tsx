import React from 'react';
import { 
  Car, 
  Wrench, 
  CalendarDays, 
  CalendarCheck, 
  AlertTriangle, 
  BellRing, 
  Users 
} from 'lucide-react';
import { DashboardKPI } from '../../types';

interface KPICardsProps {
  kpi: DashboardKPI;
  onNavigateReminders?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpi, onNavigateReminders }) => {
  const cards = [
    {
      id: 'dec',
      label: 'Total Unit DEC',
      value: kpi.totalUnitDEC,
      subtext: 'Unit dikirim / terdaftar',
      icon: Car,
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'active',
      label: 'Unit Aktif Service',
      value: kpi.unitAktifService,
      subtext: 'Pernah riwayat service',
      icon: Wrench,
      color: 'bg-indigo-600',
      lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'month',
      label: 'Service Bulan Ini',
      value: kpi.serviceBulanIni,
      subtext: 'Aktivitas bengkel bulan ini',
      icon: CalendarDays,
      color: 'bg-teal-600',
      lightBg: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      id: 'today',
      label: 'Jadwal Service Hari Ini',
      value: kpi.serviceHariIni,
      subtext: 'Service entry hari ini',
      icon: CalendarCheck,
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'overdue',
      label: 'Service Overdue',
      value: kpi.serviceOverdue,
      subtext: 'Perlu follow-up segera',
      icon: AlertTriangle,
      color: 'bg-rose-600',
      lightBg: 'bg-rose-50 text-rose-700 border-rose-200',
      action: onNavigateReminders
    },
    {
      id: 'reminder',
      label: 'Reminder Service (H-7)',
      value: kpi.reminderH7,
      subtext: 'Jadwal 1-7 hari kedepan',
      icon: BellRing,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
      action: onNavigateReminders
    },
    {
      id: 'customers',
      label: 'Total Customer',
      value: kpi.totalCustomer,
      subtext: 'Pelanggan terdaftar',
      icon: Users,
      color: 'bg-slate-700',
      lightBg: 'bg-slate-100 text-slate-800 border-slate-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.action}
            className={`bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
              card.action ? 'cursor-pointer hover:border-slate-300' : ''
            }`}
          >
            {/* Header Icon */}
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl text-white shadow-xs ${card.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              {card.action && (
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                  Lihat
                </span>
              )}
            </div>

            {/* Metrics */}
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight group-hover:scale-105 transition-transform inline-block">
                {card.value.toLocaleString('id-ID')}
              </span>
              <h3 className="text-xs font-bold text-slate-700 mt-1 truncate">{card.label}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
