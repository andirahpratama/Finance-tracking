import { Search, Download, Printer } from 'lucide-react';
import { Category, FilterOptions } from '../../types';

interface TransactionFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: Category[];
  onExportCSV: () => void;
  onPrintReport: () => void;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  filters,
  onFilterChange,
  categories,
  onExportCSV,
  onPrintReport,
}) => {
  return (
    <div className="space-y-3">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Action Buttons: Export CSV & Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            title="Ekspor ke CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ekspor</span> CSV
          </button>

          <button
            onClick={onPrintReport}
            title="Cetak Laporan Keuangan"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Cetak</span> Laporan
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Type Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <button
            onClick={() => onFilterChange({ ...filters, type: 'all' })}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filters.type === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, type: 'income' })}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filters.type === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, type: 'expense' })}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filters.type === 'expense'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        {/* Category Filter Select */}
        <select
          value={filters.categoryId}
          onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
          className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
            </option>
          ))}
        </select>

        {/* Period Filter Select */}
        <select
          value={filters.period}
          onChange={(e) => onFilterChange({ ...filters, period: e.target.value as any })}
          className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Semua Waktu</option>
          <option value="this_month">Bulan Ini</option>
          <option value="last_month">Bulan Lalu</option>
          <option value="this_year">Tahun Ini</option>
        </select>

        {/* Reset Filter indicator */}
        {(filters.searchTerm || filters.type !== 'all' || filters.categoryId || filters.period !== 'all') && (
          <button
            onClick={() =>
              onFilterChange({
                searchTerm: '',
                type: 'all',
                categoryId: '',
                period: 'all',
              })
            }
            className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-medium ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
};
