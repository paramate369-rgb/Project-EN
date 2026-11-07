import React, { useState } from 'react';
import { X, Link2, Check, RefreshCw, AlertCircle, FileSpreadsheet, ExternalLink, HelpCircle } from 'lucide-react';

interface SheetSettingsModalProps {
  isOpen: boolean;
  activeSheetUrl: string;
  syncInterval: number;
  isAutoSyncEnabled: boolean;
  onClose: () => void;
  onSave: (sheetUrl: string, interval: number, autoSync: boolean) => Promise<boolean>;
  onResetToDefault: () => Promise<void>;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  activeSheetUrl,
  syncInterval,
  isAutoSyncEnabled,
  onClose,
  onSave,
  onResetToDefault,
}) => {
  const [urlInput, setUrlInput] = useState(activeSheetUrl);
  const [intervalInput, setIntervalInput] = useState(syncInterval);
  const [autoSyncInput, setAutoSyncInput] = useState(isAutoSyncEnabled);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const success = await onSave(urlInput, intervalInput, autoSyncInput);
    setIsTesting(false);

    if (success) {
      setTestResult({
        success: true,
        message: 'เชื่อมต่อและบันทึกการตั้งค่าเรียบร้อยแล้ว!',
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setTestResult({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลจากลิงก์นี้ได้ กรุณาตรวจสอบสิทธิ์การแชร์หรือรูปแบบลิงก์',
      });
    }
  };

  const handleReset = async () => {
    setUrlInput('');
    setTestResult(null);
    await onResetToDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#243247]">
              ตั้งค่าการเชื่อมต่อ Google Sheets
            </h3>
            <p className="text-xs text-slate-500">
              นำเข้าข้อมูลจาก Google Sheets แบบอัตโนมัติและอัปเดตแบบเรียลไทม์
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ลิงก์ Google Sheets (แชร์แบบสาธารณะ หรือ เผยแพร่เว็บ)
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              รองรับทั้งลิงก์หน้าชีตทั่วไป (แชร์ทุกคนที่มีลิงก์ดูได้) หรือลิงก์ Published CSV
            </p>
          </div>

          {/* Sync Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ความถี่ในการอัปเดตข้อมูล
              </label>
              <select
                value={intervalInput}
                onChange={(e) => setIntervalInput(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              >
                <option value={5}>ทุก 5 วินาที (เร็วที่สุด)</option>
                <option value={10}>ทุก 10 วินาที</option>
                <option value={15}>ทุก 15 วินาที (แนะนำ)</option>
                <option value={30}>ทุก 30 วินาที</option>
                <option value={60}>ทุก 1 นาที</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สถานะการซิงก์อัตโนมัติ
              </label>
              <button
                type="button"
                onClick={() => setAutoSyncInput(!autoSyncInput)}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  autoSyncInput
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoSyncInput ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{autoSyncInput ? 'เปิดซิงก์อัตโนมัติ' : 'ปิด (กดรีเฟรชเอง)'}</span>
              </button>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Instructions Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>วิธีตั้งค่าให้ Google Sheets ใช้งานได้:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>เปิด Google Sheets ตารางงานของคุณ</li>
              <li>
                คลิกปุ่ม <strong>"แชร์ (Share)"</strong> ที่มุมขวาบน &gt; เปลี่ยนสิทธิ์เป็น{' '}
                <span className="text-blue-700 font-semibold">"ทุกคนที่มีลิงก์ (Anyone with link)"</span> และมีสิทธิ์ดู
              </li>
              <li>คัดลอกลิงก์จากแถบเบราว์เซอร์แล้วนำมาวางในช่องด้านบนได้ทันที</li>
              <li>
                หัวคอลัมน์ที่รองรับ: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">ชื่อพนักงาน</code>,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-slate-200">ตำแหน่ง</code>,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-slate-200">ชื่อโครงการ</code>,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-slate-200">ยอดราคา</code>,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-slate-200">สถานะ</code>
              </li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              ใช้ข้อมูลเริ่มต้นของระบบ
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังทดสอบ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>เชื่อมต่อและบันทึก</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
