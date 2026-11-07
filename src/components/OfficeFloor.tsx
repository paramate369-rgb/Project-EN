import React from 'react';
import { Employee } from '../types';
import { formatMoney, getAvatarForEmployee, getStatusStyle } from '../utils/formatters';
import { Sparkles, Check } from 'lucide-react';

interface OfficeFloorProps {
  employees: Employee[];
  selectedEmployeeName: string | null;
  onSelectEmployee: (name: string | null) => void;
}

export const OfficeFloor: React.FC<OfficeFloorProps> = ({
  employees,
  selectedEmployeeName,
  onSelectEmployee,
}) => {
  return (
    <section className="mb-6 office-floor p-5 md:p-6 rounded-2xl border border-[#dbe4ec] shadow-xs relative overflow-visible">
      {/* Office Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse-subtle"></div>
          <h2 className="text-base md:text-lg font-bold text-[#243247]">
            ทีมงานในออฟฟิศ
          </h2>
          <span className="text-xs text-slate-400 font-normal">
            ({employees.length} คน)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>ชี้เมาส์หรือคลิกที่ตัวละครเพื่อดูโครงการที่รับผิดชอบ</span>
          {selectedEmployeeName && (
            <button
              onClick={() => onSelectEmployee(null)}
              className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
            >
              แสดงทุกคน
            </button>
          )}
        </div>
      </div>

      {/* People Grid */}
      {employees.length === 0 ? (
        <div className="py-12 text-center bg-white/70 backdrop-blur-xs rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm">ไม่พบพนักงานตามคำค้นหาที่ระบุ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {employees.map((person, index) => {
            const isSelected = selectedEmployeeName === person.name;
            const avatar = getAvatarForEmployee(person.name, index);

            return (
              <div
                key={person.name}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                onClick={() => {
                  onSelectEmployee(isSelected ? null : person.name);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectEmployee(isSelected ? null : person.name);
                  }
                }}
                className={`group relative flex flex-col items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-white shadow-lg ring-2 ring-blue-500 -translate-y-1 z-10'
                    : 'bg-white/90 hover:bg-white shadow-xs hover:shadow-md hover:-translate-y-1 border border-slate-200/80 hover:border-blue-300'
                }`}
              >
                {/* Active check indicator */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Avatar Icon */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner transition-transform group-hover:scale-105"
                  style={{ backgroundColor: avatar.bg }}
                >
                  <span>{avatar.emoji}</span>
                </div>

                {/* Info */}
                <div className="text-center w-full">
                  <h3 className="font-bold text-sm text-[#243247] truncate">
                    {person.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {person.role}
                  </p>

                  <div className="mt-2.5 flex flex-col items-center gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {person.projects.length} โครงการ
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-600 tabular-nums">
                      {formatMoney(person.totalValue)}
                    </span>
                  </div>
                </div>

                {/* Hover Card Popup */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 pointer-events-none text-left">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">
                      โครงการของ {person.name}
                    </span>
                    <span className="text-[10px] text-blue-300 font-mono">
                      รวม {formatMoney(person.totalValue)}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {person.projects.map((proj, pIdx) => {
                      const style = getStatusStyle(proj.status);
                      return (
                        <div key={pIdx} className="text-xs py-1 border-b border-slate-800/80 last:border-0">
                          <div className="font-semibold text-slate-100 leading-snug">
                            {proj.project}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-blue-300 font-mono tabular-nums font-bold">
                              {formatMoney(proj.price)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {proj.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-1 text-[10px] text-slate-400 text-center border-t border-slate-800">
                    คลิกเพื่อเปิดตารางรายละเอียด
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
