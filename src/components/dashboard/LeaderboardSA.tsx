import React from 'react';
import { Award, Trophy, UserCheck } from 'lucide-react';
import { LeaderboardSAItem } from '../../types';

interface LeaderboardSAProps {
  data: LeaderboardSAItem[];
}

export const LeaderboardSA: React.FC<LeaderboardSAProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Leaderboard Service Advisor</span>
          </h3>
          <p className="text-xs text-slate-500">Peringkat Service Advisor berdasarkan total penanganan service</p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {data.length} Advisor
        </span>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
            Belum ada data Service Advisor.
          </div>
        ) : (
          data.map((item) => {
            const isTop3 = item.rank <= 3;
            let rankBadge = 'bg-slate-100 text-slate-700';
            if (item.rank === 1) rankBadge = 'bg-amber-100 text-amber-800 border-amber-300 font-black';
            if (item.rank === 2) rankBadge = 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
            if (item.rank === 3) rankBadge = 'bg-amber-900/10 text-amber-900 border-amber-800/20 font-bold';

            return (
              <div
                key={item.name}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3"
              >
                {/* Rank & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border shrink-0 ${rankBadge}`}
                  >
                    {item.rank === 1 ? (
                      <Trophy className="w-4 h-4 text-amber-600" />
                    ) : (
                      `#${item.rank}`
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {isTop3 && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{item.cabangPrimary}</p>
                  </div>
                </div>

                {/* Service Count & Percentage */}
                <div className="text-right shrink-0">
                  <span className="font-black text-slate-900 text-sm block">
                    {item.totalService} <span className="text-[10px] font-normal text-slate-500">Unit</span>
                  </span>
                  
                  {/* Progress Bar */}
                  <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-red-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
