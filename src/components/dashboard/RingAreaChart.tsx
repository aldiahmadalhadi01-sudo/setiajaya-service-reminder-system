import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { MapPin } from 'lucide-react';
import { RingAreaData } from '../../types';

interface RingAreaChartProps {
  data: RingAreaData[];
}

export const RingAreaChart: React.FC<RingAreaChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between h-[380px]">
      <div>
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-slate-700" />
          <span>Distribusi Ring Area Service & Domisili</span>
        </h3>
        <p className="text-xs text-slate-500">Perbandingan lokasi pelanggan (Ring 1, 2, 3 & Outer)</p>
      </div>

      <div className="flex-1 w-full min-h-0 my-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
            Belum ada data ring area.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="ring" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Bar
                dataKey="ring_area"
                name="Ring Area (Lokasi Beli)"
                fill="#0f172a"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="ring_area_domisili"
                name="Ring Area Domisili"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
