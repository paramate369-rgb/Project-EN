import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StatsSection } from './components/StatsSection';
import { OfficeFloor } from './components/OfficeFloor';
import { ProjectTable } from './components/ProjectTable';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { DashboardApiResponse, Employee, ProjectItem, DashboardStats } from './types';
import { computeStatsAndEmployees } from './utils/formatters';
import {
  subscribeToProjects,
  syncProjectsToFirestore,
  subscribeToSettings,
  saveSettingsToFirestore,
  isProjectsCollectionEmpty,
} from './services/firestoreService';
import { testFirestoreConnection, firebaseProjectInfo } from './firebase';
import { AlertCircle, RefreshCw, CheckCircle2, Database } from 'lucide-react';

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
  const [rows, setRows] = useState<ProjectItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [source, setSource] = useState<'google_sheets' | 'local_file'>('local_file');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Firestore Synced Settings
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [syncInterval, setSyncInterval] = useState<number>(15);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  const [countdown, setCountdown] = useState<number>(15);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedFromRemoteRef = useRef<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper to recompute and set state from any project rows
  const applyProjectRows = useCallback((newRows: ProjectItem[]) => {
    setRows(newRows);
    const { employees: newEmps, stats: newStats } = computeStatsAndEmployees(newRows);
    setEmployees(newEmps);
    setStats(newStats);
  }, []);

  // Fetch fresh data from backend (Google Sheets or fallback) and sync into Firestore
  const fetchAndSyncToFirestore = useCallback(
    async (targetSheetUrl?: string, isManual = false) => {
      setIsFetching(true);
      const urlToFetch = targetSheetUrl !== undefined ? targetSheetUrl : sheetUrl;

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

        if (json.success && json.rawRows && json.rawRows.length > 0) {
          setSource(json.source);
          setLastUpdated(json.lastUpdated || new Date().toISOString());
          setErrorMessage(json.errorMessage || null);

          // Save directly into Firebase Firestore in wlprojectsum!
          await syncProjectsToFirestore(json.rawRows);

          // In case Firestore listener is delayed, also update local state immediately
          applyProjectRows(json.rawRows);

          if (isManual) {
            showToast('อัปเดตและบันทึกข้อมูลลง Firebase เรียบร้อยแล้ว', 'success');
          }
          return true;
        } else {
          setErrorMessage(json.errorMessage || 'ไม่พบข้อมูลโครงการ');
          showToast(json.errorMessage || 'เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
          return false;
        }
      } catch (err: any) {
        console.error('Error in fetchAndSyncToFirestore:', err);
        showToast('ไม่สามารถเชื่อมต่อเพื่อดึงข้อมูลได้', 'error');
        return false;
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        setCountdown(syncInterval);
      }
    },
    [sheetUrl, syncInterval, applyProjectRows]
  );

  // Firestore Real-time subscriptions & Initial Bootstrap
  useEffect(() => {
    testFirestoreConnection();

    // 1. Subscribe to Firestore settings
    const unsubSettings = subscribeToSettings((settings) => {
      if (settings.sheetUrl !== undefined) {
        setSheetUrl(settings.sheetUrl);
      }
      if (settings.syncInterval) {
        setSyncInterval(settings.syncInterval);
      }
      if (settings.lastUpdated) {
        setLastUpdated(settings.lastUpdated);
      }
    });

    // 2. Subscribe to Firestore projects
    const unsubProjects = subscribeToProjects(
      (firestoreProjects) => {
        if (firestoreProjects.length > 0) {
          applyProjectRows(firestoreProjects);
          setIsLoading(false);
        } else {
          // If Firestore is empty on first run, seed it from initial data
          if (!hasInitializedFromRemoteRef.current) {
            hasInitializedFromRemoteRef.current = true;
            fetchAndSyncToFirestore(sheetUrl, false);
          }
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    // Initial check if Firestore is empty
    isProjectsCollectionEmpty().then((empty) => {
      if (empty && !hasInitializedFromRemoteRef.current) {
        hasInitializedFromRemoteRef.current = true;
        fetchAndSyncToFirestore('', false);
      }
    });

    return () => {
      unsubSettings();
      unsubProjects();
    };
  }, []);

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
          // Trigger refresh and sync to Firestore
          fetchAndSyncToFirestore();
          return syncInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [syncInterval, isAutoSyncEnabled, fetchAndSyncToFirestore]);

  // Save Settings from modal to Firestore
  const handleSaveSettings = async (newUrl: string, newInterval: number, newAutoSync: boolean) => {
    const success = await fetchAndSyncToFirestore(newUrl, true);
    if (success) {
      setSheetUrl(newUrl);
      setSyncInterval(newInterval);
      setIsAutoSyncEnabled(newAutoSync);

      // Save settings to Firebase Firestore
      await saveSettingsToFirestore({
        sheetUrl: newUrl,
        syncInterval: newInterval,
        lastUpdated: new Date().toISOString(),
      });

      return true;
    }
    return false;
  };

  // Reset to default sample dataset in Firestore
  const handleResetToDefault = async () => {
    setSheetUrl('');
    await saveSettingsToFirestore({
      sheetUrl: '',
      lastUpdated: new Date().toISOString(),
    });
    await fetchAndSyncToFirestore('', true);
    showToast('รีเซ็ตกลับมาใช้ข้อมูลต้นฉบับบน Firebase เรียบร้อยแล้ว', 'success');
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
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage} (กำลังแสดงข้อมูลล่าสุดจาก Firebase)</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer shrink-0"
            >
              แก้ไขลิงก์
            </button>
          </div>
        )}

        {/* Header with live sync status and Firebase badge */}
        <Header
          lastUpdated={lastUpdated}
          isFetching={isFetching}
          source={source}
          sheetUrl={sheetUrl}
          errorMessage={errorMessage}
          countdown={countdown}
          isAutoSyncEnabled={isAutoSyncEnabled}
          onRefreshNow={() => fetchAndSyncToFirestore(sheetUrl, true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {isLoading && rows.length === 0 ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              กำลังเชื่อมต่อ Firebase Firestore ({firebaseProjectInfo.projectId})...
            </p>
          </div>
        ) : (
          <>
            {/* KPI Stats Section */}
            <StatsSection
              stats={stats}
              selectedStatusFilter={statusFilter}
              onSelectStatusFilter={(filter) => {
                setStatusFilter(filter);
              }}
            />

            {/* Office Interactive Floor Plan with Character Avatars */}
            <OfficeFloor
              employees={employees}
              selectedEmployeeName={selectedEmployeeName}
              onSelectEmployee={(name) => {
                setSelectedEmployeeName(name);
              }}
            />

            {/* Detailed Project Table */}
            <ProjectTable
              rows={rows}
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
