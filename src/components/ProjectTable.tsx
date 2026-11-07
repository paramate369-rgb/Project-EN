import React, { useMemo } from 'react';
import { ProjectItem, Employee } from '../types';
import { formatMoney, getStatusStyle } from '../utils/formatters';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

interface ProjectTableProps {
  rows: ProjectItem[];
  selectedEmployeeName: string | null;
  statusFilter: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectEmployee: (name: string | null) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  rows,
  selectedEmployeeName,
  statusFilter,
  searchQuery,
  onSearchChange,
  onSelectEmployee,
}) => {
  const [sortField, setSortField] = React.useState<'price' | 'project' | 'name'>('price');
  const [sortAsc, setSortAsc] = React.useState<boolean>(false);

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      // Filter by selected employee
      if (selectedEmployeeName && item.name !== selectedEmployeeName) {
        return false;
      }

      // Filter by status
      if (statusFilter !== 'all') {
        if (!item.status.toLowerCase().includes(statusFilter.toLowerCase())) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRole = item.role.toLowerCase().includes(q);
        const matchProject = item.project.toLowerCase().includes(q);
        const matchStatus = item.status.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchProject && !matchStatus) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'price') {
        return sortAsc ? a.price - b.price : b.price - a.price;
      }
      if (sortField === 'project') {
        return sortAsc
          ? a.project.localeCompare(b.project, 'th')
          : b.project.localeCompare(a.project, 'th');
      }
      return sortAsc
        ? a.name.localeCompare(b.name, 'th')
        : b.name.localeCompare(a.name, 'th');
    });
  }, [rows, selectedEmployeeName, statusFilter, searchQuery, sortField, sortAsc]);

  const totalFilteredValue = useMemo(() => {
    return filteredRows.reduce((sum, item) => sum + item.price, 0);
  }, [filteredRows]);

  const toggleSort = (field: 'price' | 'project' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs">
      {/* Title & Active Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#243247] flex items-center gap-2">
            <span>
              {selectedEmployeeName
                ? `รายละเอียดโครงการของ: ${selectedEmployeeName}`
                : 'รายละเอียดโครงการทั้งหมด'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
              {filteredRows.length} รายการ
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedEmployeeName
              ? `แสดงเฉพาะโครงการที่ได้รับมอบหมายของ ${selectedEmployeeName}`
              : 'ตารางแสดงความคืบหน้าและงบประมาณของแต่ละโครงการในออฟฟิศ'}
          </p>
        </div>

        {selectedEmployeeName && (
          <button
            onClick={() => onSelectEmployee(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>ล้างการเลือก (ดูโครงการทั้งหมด)</span>
          </button>
        )}
      </div>

      {/* Toolbar inside table */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน, ตำแหน่ง หรือโครงการ..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sorting buttons */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="hidden md:inline">เรียงตาม:</span>
          <button
            onClick={() => toggleSort('price')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              sortField === 'price'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>ยอดราคา</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('project')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              sortField === 'project'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>ชื่อโครงการ</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('name')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              sortField === 'name'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>พนักงาน</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">ชื่อโครงการ</th>
              <th className="py-3 px-4">ผู้รับผิดชอบ</th>
              <th className="py-3 px-4">ตำแหน่ง</th>
              <th className="py-3 px-4">สถานะ</th>
              <th className="py-3 px-4 text-right">ยอดราคา</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  ไม่พบข้อมูลโครงการตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filteredRows.map((item, index) => {
                const statusStyle = getStatusStyle(item.status);
                const isCurrentEmployee = selectedEmployeeName === item.name;

                return (
                  <tr
                    key={`${item.name}-${item.project}-${index}`}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      isCurrentEmployee ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono tabular-nums text-[11px]">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#243247]">
                      {item.project}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectEmployee(item.name)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{item.name}</span>
                        {item.id && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({item.id})
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {item.role}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.bg} ${statusStyle.border}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 tabular-nums">
                      {formatMoney(item.price)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/90 font-semibold border-t-2 border-slate-200 text-xs">
                <td colSpan={5} className="py-3.5 px-4 text-slate-700 text-right">
                  ยอดรวมทั้งหมด ({filteredRows.length} รายการ):
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-extrabold text-blue-700 text-sm tabular-nums">
                  {formatMoney(totalFilteredValue)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
};
