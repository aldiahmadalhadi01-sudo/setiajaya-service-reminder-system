import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Filter, Calendar } from 'lucide-react';
import { TrendDataPoint } from '../../types';

interface TrendServiceChartProps {
  data: TrendDataPoint[];
  filter: 'harian' | 'mingguan' | 'bulanan';
  month: string;
  year: string;
  onFilterChange: (filter: 'harian' | 'mingguan' | 'bulanan') => void;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
}

export const TrendServiceChart: React.FC<TrendServiceChartProps> = ({
  data,
  filter,
  month,
  year,
  onFilterChange,
  onMonthChange,
  onYearChange
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-[420px] sm:h-[380px]">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            <span>Trend Service Kendaraan</span>
          </h3>
          <p className="text-xs text-slate-500">
            {filter === 'harian' && `Aktivitas service harian per tanggal (Bulan: ${month})`}
            {filter === 'mingguan' && `Aktivitas service mingguan per Week (Bulan: ${month})`}
            {filter === 'bulanan' && `Aktivitas service bulanan (Tahun: ${year})`}
          </p>
        </div>

        {/* Filter Controls & Toggle */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Month / Year Specific Selector */}
          {filter === 'bulanan' ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
                <option value="2024">Tahun 2024</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={month}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 hidden sm:inline" />
            <button
              onClick={() => onFilterChange('harian')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'harian'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => onFilterChange('mingguan')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'mingguan'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => onFilterChange('bulanan')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === 'bulanan'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="flex-1 w-full min-h-0">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
            Belum ada data trend untuk periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                itemStyle={{ color: '#60a5fa' }}
                formatter={(val: any) => [`${val} Unit Service`, 'Jumlah Service']}
                labelFormatter={(label) => `Periode: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1e293b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
