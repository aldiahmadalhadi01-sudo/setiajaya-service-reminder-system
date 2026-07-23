import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BellRing, 
  History, 
  FileSpreadsheet, 
  Wrench, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'reminder' | 'history' | 'dec' | 'service-call' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  reminderBadgeCount?: number;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  reminderBadgeCount = 0,
  isMobileOpen = false,
  setIsMobileOpen
}) => {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = "https://lh3.googleusercontent.com/d/1hFjw0SOG2Y32pO6H3PkLnHJxBbLrnP7p";

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Analytics',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'reminder' as ActiveTab,
      label: 'Reminder Service',
      icon: BellRing,
      badge: reminderBadgeCount > 0 ? reminderBadgeCount : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'history' as ActiveTab,
      label: 'Riwayat Unit',
      icon: History,
      badge: null
    },
    {
      id: 'dec' as ActiveTab,
      label: 'Input Data DEC',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'service-call' as ActiveTab,
      label: 'Input Service Call',
      icon: Wrench,
      badge: null
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Google Apps Script',
      icon: Settings,
      badge: null
    }
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const renderNavContent = (collapsed: boolean) => (
    <>
      {/* Toyota Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 shrink-0 shadow-md overflow-hidden p-1">
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Toyota Setiajaya Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Building2 className="w-5 h-5 text-slate-300" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-white uppercase truncate">
                TOYOTA <span className="text-slate-300">SETIAJAYA</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase truncate">
                Service & Reminder System
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Mobile Close Button */}
        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative min-h-[44px] ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border-l-4 border-red-600/90'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110 text-slate-100' : 'group-hover:scale-105 text-slate-400'}`} />

              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {item.badge !== null && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                    item.badgeColor || 'bg-slate-700 text-slate-200'
                  } ${collapsed ? 'absolute -top-1 -right-1 px-1.5 text-[10px]' : ''}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Badge */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Toyota SJM System</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 text-slate-100 z-50 flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex relative flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent(isCollapsed)}
      </aside>
    </>
  );
};

