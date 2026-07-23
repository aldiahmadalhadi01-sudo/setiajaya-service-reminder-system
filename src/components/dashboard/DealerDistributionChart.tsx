import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Building2 } from 'lucide-react';
import { DealerDistData } from '../../types';

interface DealerDistributionChartProps {
  data: DealerDistData[];
}

const COLORS = ['#0f172a', '#2563eb', '#0d9488', '#d97706', '#7c3aed', '#059669', '#475569'];

export const DealerDistributionChart: React.FC<DealerDistributionChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between h-[380px]">
      <div>
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-700" />
          <span>TOP5 DISTRIBUSI DEALER PENJUAL</span>
        </h3>
        <p className="text-xs text-slate-500">Persentase Top 5 dealer penjual unit service terbanyak</p>
      </div>

      <div className="flex-1 w-full min-h-0 my-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
            Belum ada data dealer penjual.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="dealer"
                cx="50%"
                cy="42%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} Unit (${item.payload.percentage}%)`,
                  item.payload.dealer
                ]}
              />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#334155', paddingTop: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
