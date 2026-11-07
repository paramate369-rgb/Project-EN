import React from 'react';
import { RefreshCw, Link2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface HeaderProps {
  lastUpdated: string;
  isFetching: boolean;
  source: 'google_sheets' | 'local_file';
  sheetUrl: string;
  errorMessage: string | null;
  countdown: number;
  isAutoSyncEnabled: boolean;
  onRefreshNow: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isFetching,
  source,
  sheetUrl,
  errorMessage,
  countdown,
  isAutoSyncEnabled,
  onRefreshNow,
  onOpenSettings,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#243247] tracking-tight">
            Office Project Dashboard
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Real-time
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          ภาพรวมทีมและโครงการที่แต่ละคนรับผิดชอบ · จัดเก็บข้อมูลบน Firebase ({'wlprojectsum'})
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Firebase Cloud Database Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs text-amber-900 shadow-xs" title="เชื่อมต่อกับ Firebase Firestore: wlprojectsum">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold">Firebase:</span>
          <span className="font-mono text-amber-950 font-bold">wlprojectsum</span>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs shadow-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                errorMessage
                  ? 'bg-amber-500'
                  : isFetching
                  ? 'bg-blue-500 animate-ping'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-medium text-slate-700">
              {source === 'google_sheets' ? 'Google Sheet สด' : 'คลาวด์ Firestore'}
            </span>
          </div>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1 text-slate-500" title="เวลาอัปเดตล่าสุด">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono tabular-nums">{formatTime(lastUpdated)}</span>
          </div>

          {isAutoSyncEnabled && (
            <>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-500 text-[11px] tabular-nums">
                {isFetching ? 'กำลังซิงก์...' : `${countdown}s`}
              </span>
            </>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefreshNow}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          title="กดเพื่อดึงข้อมูลล่าสุดทันที"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>รีเฟรช</span>
        </button>

        {/* Google Sheets Link / Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer ${
            sheetUrl
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
          title="ตั้งค่าหรือเปลี่ยนลิงก์ Google Sheets"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{sheetUrl ? 'เชื่อมต่อ Google Sheet แล้ว' : 'ตั้งค่า Google Sheets'}</span>
        </button>
      </div>
    </header>
  );
};
