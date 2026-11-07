import React from 'react';
import { Users, Briefcase, Coins, CheckCircle, Clock4, FileText } from 'lucide-react';
import { DashboardStats } from '../types';
import { formatMoney, formatNumber } from '../utils/formatters';

interface StatsSectionProps {
  stats: DashboardStats;
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  stats,
  selectedStatusFilter,
  onSelectStatusFilter,
}) => {
  return (
    <section className="mb-6">
      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
        {/* Employees */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">พนักงานในทีม</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#243247] tabular-nums font-mono">
              {formatNumber(stats.totalEmployees)}
            </span>
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            รับผิดชอบงาน {formatNumber(stats.totalAssignments)} รายการ
          </p>
        </div>

        {/* Projects */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">โครงการทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#243247] tabular-nums font-mono">
              {formatNumber(stats.totalProjects)}
            </span>
            <span className="text-xs font-medium text-slate-500">โครงการ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            นับเฉพาะโครงการที่ไม่ซ้ำกัน
          </p>
        </div>

        {/* Total Value */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">มูลค่าโครงการรวม</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-blue-700 tabular-nums font-mono">
              {formatMoney(stats.totalValue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            คำนวณจากมูลค่าโครงการรวมทั้งหมด
          </p>
        </div>
      </div>

      {/* Sub-status Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100/80 rounded-xl text-xs">
        <span className="text-slate-500 font-medium">กรองตามสถานะ:</span>

        <button
          onClick={() => onSelectStatusFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            selectedStatusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ทั้งหมด ({stats.totalAssignments})
        </button>

        <button
          onClick={() => onSelectStatusFilter('กำลังดำเนินการ')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            selectedStatusFilter === 'กำลังดำเนินการ'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-blue-700 bg-white/60'
          }`}
        >
          <Clock4 className="w-3 h-3" />
          <span>กำลังดำเนินการ ({stats.statusCounts.ongoing})</span>
        </button>

        <button
          onClick={() => onSelectStatusFilter('เสนอราคา')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            selectedStatusFilter === 'เสนอราคา'
              ? 'bg-amber-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-amber-700 bg-white/60'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>เสนอราคา ({stats.statusCounts.proposal})</span>
        </button>

        <button
          onClick={() => onSelectStatusFilter('เสร็จ')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            selectedStatusFilter === 'เสร็จ'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-emerald-700 bg-white/60'
          }`}
        >
          <CheckCircle className="w-3 h-3" />
          <span>เสร็จสิ้น ({stats.statusCounts.completed})</span>
        </button>
      </div>
    </section>
  );
};
