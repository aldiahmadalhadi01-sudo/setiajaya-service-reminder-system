import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { KPICards } from './components/dashboard/KPICards';
import { TrendServiceChart } from './components/dashboard/TrendServiceChart';
import { DealerDistributionChart } from './components/dashboard/DealerDistributionChart';
import { RingAreaChart } from './components/dashboard/RingAreaChart';
import { LeaderboardSA } from './components/dashboard/LeaderboardSA';
import { ReminderTable } from './components/reminder/ReminderTable';
import { UnitHistoryList } from './components/history/UnitHistoryList';
import { UnitTimeline } from './components/history/UnitTimeline';
import { DECTable } from './components/dec/DECTable';
import { DECFormModal } from './components/dec/DECFormModal';
import { DECImportModal } from './components/dec/DECImportModal';
import { ServiceCallTable } from './components/service-call/ServiceCallTable';
import { ServiceCallFormModal } from './components/service-call/ServiceCallFormModal';
import { ServiceCallImportModal } from './components/service-call/ServiceCallImportModal';

import { apiService } from './services/apiService';
import { 
  DECRecord, 
  ServiceCallRecord, 
  DashboardKPI, 
  TrendDataPoint, 
  DealerDistData, 
  RingAreaData, 
  LeaderboardSAItem, 
  ReminderItem, 
  UnitVehicleSummary, 
  GasConfig 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // System Configuration
  const [gasConfig, setGasConfig] = useState<GasConfig>({
    webAppUrl: '',
    apiKey: '',
    isLive: false
  });

  // Dashboard Analytics Data
  const [kpi, setKpi] = useState<DashboardKPI>({
    totalUnitDEC: 0,
    unitAktifService: 0,
    serviceBulanIni: 0,
    serviceHariIni: 0,
    serviceOverdue: 0,
    reminderH7: 0,
    totalCustomer: 0
  });
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendFilter, setTrendFilter] = useState<'harian' | 'mingguan' | 'bulanan'>('bulanan');
  const [trendMonth, setTrendMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [trendYear, setTrendYear] = useState<string>(() => new Date().getFullYear().toString());
  const [dealerDistribution, setDealerDistribution] = useState<DealerDistData[]>([]);
  const [ringAreaDistribution, setRingAreaDistribution] = useState<RingAreaData[]>([]);
  const [leaderboardSA, setLeaderboardSA] = useState<LeaderboardSAItem[]>([]);

  // Module Data
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [units, setUnits] = useState<UnitVehicleSummary[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitVehicleSummary | null>(null);
  const [decRecords, setDecRecords] = useState<DECRecord[]>([]);
  const [serviceCallRecords, setServiceCallRecords] = useState<ServiceCallRecord[]>([]);

  // Modals state
  const [isGasSettingsOpen, setIsGasSettingsOpen] = useState(false);

  const [isDECFormOpen, setIsDECFormOpen] = useState(false);
  const [editingDECRecord, setEditingDECRecord] = useState<DECRecord | null>(null);
  const [isDECImportOpen, setIsDECImportOpen] = useState(false);

  const [isServiceCallFormOpen, setIsServiceCallFormOpen] = useState(false);
  const [editingServiceCallRecord, setEditingServiceCallRecord] = useState<ServiceCallRecord | null>(null);
  const [isServiceCallImportOpen, setIsServiceCallImportOpen] = useState(false);

  // Fetch Config
  const loadConfig = useCallback(async () => {
    try {
      const res = await apiService.getConfig();
      if (res.success && res.config) {
        setGasConfig(res.config);
      }
    } catch (err) {
      console.error('Failed to load config', err);
    }
  }, []);

  // Main Data Refresh
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Dashboard
      const dashRes = await apiService.getDashboardData(trendFilter, trendMonth, trendYear);
      if (dashRes.success) {
        setKpi(dashRes.kpi);
        setTrendData(dashRes.trend);
        setDealerDistribution(dashRes.dealerDistribution);
        setRingAreaDistribution(dashRes.ringAreaDistribution);
        setLeaderboardSA(dashRes.leaderboardSA);
      }

      // 2. Reminders
      const remRes = await apiService.getReminders();
      if (remRes.success) {
        setReminders(remRes.data || []);
      }

      // 3. Vehicle History List
      const histRes = await apiService.getUnitHistory();
      if (histRes.success && histRes.data) {
        setUnits(histRes.data);
      }

      // 4. DEC Records
      const decRes = await apiService.getDECList();
      if (decRes.success) {
        setDecRecords(decRes.data || []);
      }

      // 5. Service Call Records
      const scRes = await apiService.getServiceCallList();
      if (scRes.success) {
        setServiceCallRecords(scRes.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh system data', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [trendFilter, trendMonth, trendYear]);

  useEffect(() => {
    loadConfig();
    refreshAllData();
  }, [loadConfig, refreshAllData]);

  // Tab change handler
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'settings') {
      setIsGasSettingsOpen(true);
      return;
    }
    setActiveTab(tab);
    if (tab !== 'history') {
      setSelectedUnit(null);
    }
  };

  // DEC CRUD Handlers
  const handleSaveDEC = async (record: DECRecord) => {
    try {
      if (record.id) {
        await apiService.updateDEC(record.id, record);
        toast.success('Data DEC berhasil diperbarui!');
      } else {
        await apiService.createDEC(record);
        toast.success('Data DEC berhasil ditambahkan!');
      }
      refreshAllData();
    } catch (err) {
      toast.error('Gagal menyimpan data DEC');
    }
  };

  const handleDeleteDEC = async (id: string) => {
    try {
      await apiService.deleteDEC(id);
      toast.success('Data DEC berhasil dihapus!');
      refreshAllData();
    } catch (err) {
      toast.error('Gagal menghapus data DEC');
    }
  };

  const handleBatchImportDEC = async (items: DECRecord[]) => {
    const res = await apiService.batchImportDEC(items);
    refreshAllData();
    return res.summary;
  };

  // Service Call CRUD Handlers
  const handleSaveServiceCall = async (record: ServiceCallRecord) => {
    try {
      if (record.id) {
        await apiService.updateServiceCall(record.id, record);
        toast.success('Data Service Call berhasil diperbarui!');
      } else {
        await apiService.createServiceCall(record);
        toast.success('Data Service Call berhasil ditambahkan!');
      }
      refreshAllData();
    } catch (err) {
      toast.error('Gagal menyimpan data Service Call');
    }
  };

  const handleDeleteServiceCall = async (id: string) => {
    try {
      await apiService.deleteServiceCall(id);
      toast.success('Data Service Call berhasil dihapus!');
      refreshAllData();
    } catch (err) {
      toast.error('Gagal menghapus Service Call');
    }
  };

  const handleBatchImportServiceCall = async (
    items: ServiceCallRecord[],
    duplicateMode: 'skip' | 'replace' | 'all'
  ) => {
    const res = await apiService.batchImportServiceCall(items, duplicateMode);
    refreshAllData();
    return res.summary;
  };

  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Service Analytics';
      case 'reminder': return 'Reminder Service Berkala';
      case 'history': return selectedUnit ? `Riwayat Service ${selectedUnit.no_polisi}` : 'Daftar Riwayat Unit Kendaraan';
      case 'dec': return 'Input & Manajemen Data DEC';
      case 'service-call': return 'Input & Manajemen Service Call';
      case 'settings': return 'Pengaturan Google Apps Script';
      default: return 'Toyota Setiajaya System';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Modern Collapsible & Mobile Drawer Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        reminderBadgeCount={kpi.reminderH7 + kpi.serviceOverdue}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar Header */}
        <Header
          activeTabTitle={getTabTitle()}
          config={gasConfig}
          onRefreshData={refreshAllData}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Content View Routing */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Realtime KPI Cards */}
              <KPICards
                kpi={kpi}
                onNavigateReminders={() => setActiveTab('reminder')}
              />

              {/* Trend Chart (Line) & Dealer Donut Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TrendServiceChart
                    data={trendData}
                    filter={trendFilter}
                    month={trendMonth}
                    year={trendYear}
                    onFilterChange={(f) => setTrendFilter(f)}
                    onMonthChange={(m) => setTrendMonth(m)}
                    onYearChange={(y) => setTrendYear(y)}
                  />
                </div>
                <div>
                  <DealerDistributionChart data={dealerDistribution} />
                </div>
              </div>

              {/* Ring Area Distribution & Service Advisor Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RingAreaChart data={ringAreaDistribution} />
                <LeaderboardSA data={leaderboardSA} />
              </div>
            </div>
          )}

          {/* TAB 2: REMINDER SERVICE */}
          {activeTab === 'reminder' && (
            <ReminderTable
              reminders={reminders}
              isLoading={isLoading}
            />
          )}

          {/* TAB 3: RIWAYAT UNIT */}
          {activeTab === 'history' && (
            <UnitHistoryList
              units={units}
              isLoading={isLoading}
            />
          )}

          {/* TAB 4: INPUT DEC */}
          {activeTab === 'dec' && (
            <DECTable
              records={decRecords}
              onAdd={() => {
                setEditingDECRecord(null);
                setIsDECFormOpen(true);
              }}
              onEdit={(r) => {
                setEditingDECRecord(r);
                setIsDECFormOpen(true);
              }}
              onDelete={handleDeleteDEC}
              onOpenImport={() => setIsDECImportOpen(true)}
              isLoading={isLoading}
            />
          )}

          {/* TAB 5: INPUT SERVICE CALL */}
          {activeTab === 'service-call' && (
            <ServiceCallTable
              records={serviceCallRecords}
              onAdd={() => {
                setEditingServiceCallRecord(null);
                setIsServiceCallFormOpen(true);
              }}
              onEdit={(r) => {
                setEditingServiceCallRecord(r);
                setIsServiceCallFormOpen(true);
              }}
              onDelete={handleDeleteServiceCall}
              onOpenImport={() => setIsServiceCallImportOpen(true)}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      {/* SYSTEM MODALS */}
      {/* 1. DEC Form Modal */}
      <DECFormModal
        isOpen={isDECFormOpen}
        onClose={() => setIsDECFormOpen(false)}
        onSave={handleSaveDEC}
        initialRecord={editingDECRecord}
      />

      {/* 3. DEC Import Modal */}
      <DECImportModal
        isOpen={isDECImportOpen}
        onClose={() => setIsDECImportOpen(false)}
        onImportSuccess={handleBatchImportDEC}
      />

      {/* 4. Service Call Form Modal */}
      <ServiceCallFormModal
        isOpen={isServiceCallFormOpen}
        onClose={() => setIsServiceCallFormOpen(false)}
        onSave={handleSaveServiceCall}
        initialRecord={editingServiceCallRecord}
      />

      {/* 5. Service Call Import Modal */}
      <ServiceCallImportModal
        isOpen={isServiceCallImportOpen}
        onClose={() => setIsServiceCallImportOpen(false)}
        onImportSuccess={handleBatchImportServiceCall}
      />
    </div>
  );
}
