import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle2, AlertTriangle, Settings, Building2, Menu } from 'lucide-react';
import { formatDateIndonesian } from '../../lib/dateUtils';
import { GasConfig } from '../../types';

interface HeaderProps {
  activeTabTitle: string;
  config: GasConfig;
  onOpenSettings: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  config,
  onOpenSettings,
  onRefreshData,
  isRefreshing = false,
  onToggleMobileMenu
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Branch Context & Mobile Menu */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200/80 shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
            {activeTabTitle}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1 sm:gap-1.5 mt-0.5 truncate">
            <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Toyota Setiajaya Depok</span>
          </p>
        </div>
      </div>

      {/* Action Controls & Indicators */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Live / Demo Mode Indicator */}
        <div
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer border transition-all ${
            config.isLive && config.webAppUrl
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title="Klik untuk konfigurasi Google Apps Script Web App"
        >
          {config.isLive && config.webAppUrl ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden lg:inline">Google Spreadsheet Live Connected</span>
              <span className="lg:hidden">GAS Live</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Demo Mode (Reactive Database)</span>
              <span className="lg:hidden">Demo Mode</span>
            </>
          )}
        </div>

        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatDateIndonesian(currentDate)}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 sm:px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 min-h-[44px] min-w-[44px] sm:min-w-0 justify-center"
          title="Refresh Data Spreadsheet"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Pengaturan Google Apps Script"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

