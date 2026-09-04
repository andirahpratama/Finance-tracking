import React from 'react';
import { Search, Download, Printer, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
    filters.period === 'daily' ? 'daily' :
    (filters.period === 'monthly' || filters.period === 'this_month' || filters.period === 'last_month') ? 'monthly' :
    (filters.period === 'yearly' || filters.period === 'this_year') ? 'yearly' : 'all';

  return (
    <div className="space-y-3.5">
      {/* Top Row: Search & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
            placeholder="Cari transaksi berdasarkan catatan atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Action Buttons: Export CSV & Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            title="Ekspor ke CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Ekspor</span> CSV
          </button>

          <button
            onClick={onPrintReport}
            title="Cetak Laporan Keuangan"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Cetak</span> Laporan
          </button>
        </div>
      </div>

      {/* Row 2: Type Filter, Category Filter, Period Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Controls: Type & Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex-shrink-0">
            <button
              onClick={() => onFilterChange({ ...filters, type: 'all' })}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                filters.type === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, type: 'income' })}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                filters.type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, type: 'expense' })}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                filters.type === 'expense'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold border border-rose-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Category Filter Select */}
          <select
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
              </option>
            ))}
          </select>
        </div>

        {/* Right Controls: Period Type Pills (Semua | Harian | Bulanan | Tahunan) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => onFilterChange({ ...filters, period: 'all' })}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all ${
              activePeriodType === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Semua
          </button>

          <button
            onClick={() =>
              onFilterChange({
                ...filters,
                period: 'daily',
                selectedYear: year,
                selectedMonth: month,
                selectedDay: day,
              })
            }
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all ${
              activePeriodType === 'daily'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Harian
          </button>

          <button
            onClick={() =>
              onFilterChange({
                ...filters,
                period: 'monthly',
                selectedYear: year,
                selectedMonth: month,
              })
            }
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all ${
              activePeriodType === 'monthly'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Bulanan
          </button>

          <button
            onClick={() =>
              onFilterChange({
                ...filters,
                period: 'yearly',
                selectedYear: year,
              })
            }
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all ${
              activePeriodType === 'yearly'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Tahunan
          </button>
        </div>
      </div>

      {/* Row 3: Simple Arrow Navigation Bar (Panah Kiri / Kanan - Tanpa Dropdown) */}
      {activePeriodType !== 'all' && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={handlePrev}
            title="Periode Sebelumnya"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white px-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>{getPeriodLabel()}</span>
          </div>

          <button
            onClick={handleNext}
            title="Periode Selanjutnya"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      )}

      {/* Reset Filter Button */}
      {(filters.searchTerm || filters.type !== 'all' || filters.categoryId || filters.period !== 'monthly') && (
        <div className="flex justify-end pt-0.5">
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
            className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-medium"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
};
