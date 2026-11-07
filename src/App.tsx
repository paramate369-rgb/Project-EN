import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StatsSection } from './components/StatsSection';
import { OfficeFloor } from './components/OfficeFloor';
import { ProjectTable } from './components/ProjectTable';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { DashboardApiResponse, Employee, ProjectItem, DashboardStats } from './types';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY_URL = 'office_dashboard_sheet_url';
const STORAGE_KEY_INTERVAL = 'office_dashboard_interval';
const STORAGE_KEY_AUTOSYNC = 'office_dashboard_autosync';

const INITIAL_STATS: DashboardStats = {
  totalEmployees: 0,
  totalProjects: 0,
  totalAssignments: 0,
  totalValue: 0,
  statusCounts: {
    ongoing: 0,
    completed: 0,
    proposal: 0,
  },
};

export default function App() {
  const [data, setData] = useState<{
    employees: Employee[];
    rows: ProjectItem[];
    stats: DashboardStats;
    source: 'google_sheets' | 'local_file';
    lastUpdated: string;
    errorMessage: string | null;
  }>({
    employees: [],
    rows: [],
    stats: INITIAL_STATS,
    source: 'local_file',
    lastUpdated: new Date().toISOString(),
    errorMessage: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time Settings
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_URL) || '';
  });
  const [syncInterval, setSyncInterval] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INTERVAL);
    return saved ? Number(saved) : 15;
  });
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTOSYNC);
    return saved !== null ? saved === 'true' : true;
  });

  const [countdown, setCountdown] = useState<number>(syncInterval);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show a temporary toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Dashboard Data from backend (which fetches Google Sheets or local project file)
  const fetchData = useCallback(
    async (customUrl?: string, isManual = false) => {
      setIsFetching(true);
      const urlToFetch = customUrl !== undefined ? customUrl : sheetUrl;

      try {
        const queryParams = new URLSearchParams();
        if (urlToFetch) {
          queryParams.set('sheetUrl', urlToFetch);
        }

        const res = await fetch(`/api/dashboard?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const json: DashboardApiResponse = await res.json();

        if (json.success) {
          setData({
            employees: json.employees || [],
            rows: json.rawRows || [],
            stats: json.stats || INITIAL_STATS,
            source: json.source,
            lastUpdated: json.lastUpdated || new Date().toISOString(),
            errorMessage: json.errorMessage || null,
          });

          if (isManual) {
            showToast('อัปเดตข้อมูลล่าสุดเรียบร้อยแล้ว', 'success');
          }
          return true;
        } else {
          showToast(json.errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
          return false;
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อดึงข้อมูลได้', 'error');
        return false;
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        setCountdown(syncInterval);
      }
    },
    [sheetUrl, syncInterval]
  );

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Countdown & Polling Loop
  useEffect(() => {
    if (!isAutoSyncEnabled) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setCountdown(syncInterval);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          fetchData();
          return syncInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [syncInterval, isAutoSyncEnabled, fetchData]);

  // Save Settings from modal
  const handleSaveSettings = async (newUrl: string, newInterval: number, newAutoSync: boolean) => {
    const success = await fetchData(newUrl, true);
    if (success) {
      setSheetUrl(newUrl);
      setSyncInterval(newInterval);
      setIsAutoSyncEnabled(newAutoSync);

      localStorage.setItem(STORAGE_KEY_URL, newUrl);
      localStorage.setItem(STORAGE_KEY_INTERVAL, String(newInterval));
      localStorage.setItem(STORAGE_KEY_AUTOSYNC, String(newAutoSync));

      // Also notify backend
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: newUrl, interval: newInterval }),
      }).catch(console.error);

      return true;
    }
    return false;
  };

  // Reset to default sample file
  const handleResetToDefault = async () => {
    setSheetUrl('');
    localStorage.removeItem(STORAGE_KEY_URL);
    await fetchData('', true);
    showToast('รีเซ็ตกลับมาใช้ข้อมูลต้นฉบับเรียบร้อยแล้ว', 'success');
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-[#243247] p-4 sm:p-6 md:p-8">
      <main className="max-w-[1400px] mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Global Error Notice if any */}
        {data.errorMessage && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{data.errorMessage} (กำลังแสดงข้อมูลสำรองล่าสุดในระบบ)</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer shrink-0"
            >
              แก้ไขลิงก์
            </button>
          </div>
        )}

        {/* Header (Excel upload removed, live Google Sheets sync in place) */}
        <Header
          lastUpdated={data.lastUpdated}
          isFetching={isFetching}
          source={data.source}
          sheetUrl={sheetUrl}
          errorMessage={data.errorMessage}
          countdown={countdown}
          isAutoSyncEnabled={isAutoSyncEnabled}
          onRefreshNow={() => fetchData(sheetUrl, true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">กำลังเชื่อมต่อและโหลดข้อมูลโครงการ...</p>
          </div>
        ) : (
          <>
            {/* KPI Stats Section */}
            <StatsSection
              stats={data.stats}
              selectedStatusFilter={statusFilter}
              onSelectStatusFilter={(filter) => {
                setStatusFilter(filter);
              }}
            />

            {/* Office Interactive Floor Plan with Character Avatars */}
            <OfficeFloor
              employees={data.employees}
              selectedEmployeeName={selectedEmployeeName}
              onSelectEmployee={(name) => {
                setSelectedEmployeeName(name);
              }}
            />

            {/* Detailed Project Table */}
            <ProjectTable
              rows={data.rows}
              selectedEmployeeName={selectedEmployeeName}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectEmployee={(name) => {
                setSelectedEmployeeName(name);
              }}
            />
          </>
        )}

        {/* Google Sheets Settings Modal */}
        <SheetSettingsModal
          isOpen={isSettingsOpen}
          activeSheetUrl={sheetUrl}
          syncInterval={syncInterval}
          isAutoSyncEnabled={isAutoSyncEnabled}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          onResetToDefault={handleResetToDefault}
        />
      </main>
    </div>
  );
}
