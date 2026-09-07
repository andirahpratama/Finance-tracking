import React from 'react';
import { Search, Download, Printer, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { Category, FilterOptions } from '../../types';

interface TransactionFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: Category[];
  onExportCSV: () => void;
  onPrintReport: () => void;
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  filters,
  onFilterChange,
  categories,
  onExportCSV,
  onPrintReport,
}) => {
  const year = filters.selectedYear ?? new Date().getFullYear();
  const month = filters.selectedMonth ?? new Date().getMonth();
  const day = filters.selectedDay ?? new Date().getDate();

  const hasActiveFilters =
    filters.searchTerm ||
    filters.type !== 'all' ||
    filters.categoryId ||
    filters.period !== 'monthly';

  const handlePrev = () => {
    if (filters.period === 'daily') {
      const prevDate = new Date(year, month, day - 1);
      onFilterChange({
        ...filters,
        selectedYear: prevDate.getFullYear(),
        selectedMonth: prevDate.getMonth(),
        selectedDay: prevDate.getDate(),
      });
    } else if (filters.period === 'monthly' || filters.period === 'this_month' || filters.period === 'last_month') {
      let newMonth = month - 1;
      let newYear = year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      onFilterChange({
        ...filters,
        selectedYear: newYear,
        selectedMonth: newMonth,
      });
    } else if (filters.period === 'yearly' || filters.period === 'this_year') {
      onFilterChange({
        ...filters,
        selectedYear: year - 1,
      });
    }
  };

  const handleNext = () => {
    if (filters.period === 'daily') {
      const nextDate = new Date(year, month, day + 1);
      onFilterChange({
        ...filters,
        selectedYear: nextDate.getFullYear(),
        selectedMonth: nextDate.getMonth(),
        selectedDay: nextDate.getDate(),
      });
    } else if (filters.period === 'monthly' || filters.period === 'this_month' || filters.period === 'last_month') {
      let newMonth = month + 1;
      let newYear = year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      onFilterChange({
        ...filters,
        selectedYear: newYear,
        selectedMonth: newMonth,
      });
    } else if (filters.period === 'yearly' || filters.period === 'this_year') {
      onFilterChange({
        ...filters,
        selectedYear: year + 1,
      });
    }
  };

  const getPeriodLabel = () => {
    if (filters.period === 'daily') {
      const dt = new Date(year, month, day);
      const dayName = dayNames[dt.getDay()];
      return `${dayName}, ${day} ${monthNames[month]} ${year}`;
    }
    if (filters.period === 'monthly' || filters.period === 'this_month' || filters.period === 'last_month') {
      return `${monthNames[month]} ${year}`;
    }
    if (filters.period === 'yearly' || filters.period === 'this_year') {
      return `Tahun ${year}`;
    }
    return 'Semua Waktu';
  };

  const activePeriodType =
    filters.period === 'daily'
      ? 'daily'
      : filters.period === 'monthly' || filters.period === 'this_month' || filters.period === 'last_month'
      ? 'monthly'
      : filters.period === 'yearly' || filters.period === 'this_year'
      ? 'yearly'
      : 'all';

  return (
    <div className="space-y-3">
      {/* Search Input Bar + Quick Export Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
            placeholder="Cari transaksi..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={onExportCSV}
          title="Ekspor CSV"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CSV</span>
        </button>

        <button
          onClick={onPrintReport}
          title="Cetak Laporan"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-colors flex-shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cetak</span>
        </button>
      </div>

      {/* Streamlined Filter Controls Container (Compact Grid on Mobile) */}
      <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
        {/* Row 1: Type Segmented Pills & Category Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
          {/* Type Segmented Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'income', label: 'Pemasukan' },
              { id: 'expense', label: 'Pengeluaran' },
              { id: 'savings', label: 'Tabungan' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onFilterChange({ ...filters, type: item.id as any })}
                className={`flex-1 min-w-[65px] px-2 py-1 rounded-lg font-bold text-[11px] text-center transition-all ${
                  filters.type === item.id
                    ? item.id === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : item.id === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : item.id === 'savings'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown & Reset Action */}
          <div className="flex items-center gap-2">
            <select
              value={filters.categoryId}
              onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={() =>
                  onFilterChange({
                    searchTerm: '',
                    type: 'all',
                    categoryId: '',
                    period: 'monthly',
                    selectedYear: new Date().getFullYear(),
                    selectedMonth: new Date().getMonth(),
                    selectedDay: new Date().getDate(),
                  })
                }
                title="Reset Filter"
                className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold flex items-center gap-1 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Period Pills & Date Navigator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
          {/* Period Selector Pills */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'daily', label: 'Harian' },
              { id: 'monthly', label: 'Bulanan' },
              { id: 'yearly', label: 'Tahunan' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    period: item.id as any,
                    selectedYear: year,
                    selectedMonth: month,
                    selectedDay: day,
                  })
                }
                className={`flex-1 px-2.5 py-1 rounded-lg font-bold text-[11px] text-center transition-all ${
                  activePeriodType === item.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Date Arrow Navigator */}
          {activePeriodType !== 'all' && (
            <div className="flex items-center justify-between sm:justify-end gap-2 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-500" />
              </button>
              <div className="flex items-center gap-1.5 px-1 min-w-[110px] justify-center">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] tracking-tight">{getPeriodLabel()}</span>
              </div>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Selanjutnya"
              >
                <ChevronRight className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
