import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CalendarCheck,
} from 'lucide-react';
import { Transaction } from '../../types';
import { formatRupiah, formatDateFullIndo } from '../../lib/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';

interface MonthlyActivityCalendarProps {
  transactions: Transaction[];
  onOpenAddExpense?: (dateStr: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

const WEEKDAYS = [
  { short: 'SN', full: 'Senin' },
  { short: 'SL', full: 'Selasa' },
  { short: 'RB', full: 'Rabu' },
  { short: 'KM', full: 'Kamis' },
  { short: 'JM', full: 'Jumat' },
  { short: 'SB', full: 'Sabtu' },
  { short: 'MG', full: 'Minggu' },
];

/**
 * Format expense compactly as shown in the design mockup:
 * - >= 1,000,000,000 => -X.XM
 * - >= 1,000,000 => -X.XXJT, -X.XJT or -XJT
 * - >= 1,000 => -XRB
 * - < 1,000 => -X
 */
export function formatCalendarExpense(amount: number): string {
  if (!amount || amount <= 0) return '';
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '');
    return `-${val}M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '');
    return `-${val}JT`;
  }
  if (abs >= 1_000) {
    const val = Math.round(abs / 1_000);
    return `-${val}RB`;
  }
  return `-${abs}`;
}

const parseDateParts = (dateStr?: string) => {
  if (!dateStr) return null;
  const clean = String(dateStr).trim().split(/[T\s]/)[0];
  const parts = clean.split(/[-/]/);
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
};

const parseAmount = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      return parseInt(str.replace(/\./g, ''), 10) || 0;
    }
  }
  const num = Number(str);
  return isNaN(num) ? 0 : num;
};

export const MonthlyActivityCalendar: React.FC<MonthlyActivityCalendarProps> = ({
  transactions,
  onOpenAddExpense,
  onEditTransaction,
}) => {
  const today = useMemo(() => new Date(), []);

  // Currently viewed month & year
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0-11

  // Selected date for day details breakdown (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const isCurrentMonthViewed =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Month label uppercase (e.g. "OCTOBER 2026")
  const monthYearLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    // Display in English uppercase to match screenshot ("OCTOBER 2026")
    const monthName = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    return `${monthName} ${currentYear}`;
  }, [currentYear, currentMonth]);

  // Aggregate daily transactions for the viewed month
  const dailyDataMap = useMemo(() => {
    const map = new Map<string, { totalExpense: number; totalIncome: number; transactions: Transaction[] }>();

    transactions.forEach((tx) => {
      const dateInfo = parseDateParts(tx?.date);
      if (!dateInfo) return;

      if (dateInfo.year === currentYear && dateInfo.month === currentMonth) {
        const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dateInfo.day).padStart(2, '0')}`;
        const existing = map.get(key) || { totalExpense: 0, totalIncome: 0, transactions: [] };
        
        const amount = parseAmount(tx.amount);
        const txType = (tx.type || '').toLowerCase();

        // Count every expense transaction inputted for this day
        if (txType === 'expense') {
          existing.totalExpense += amount;
        } else if (txType === 'income') {
          existing.totalIncome += amount;
        }

        existing.transactions.push(tx);
        map.set(key, existing);
      }
    });

    return map;
  }, [transactions, currentYear, currentMonth]);

  // Days in current month & starting weekday offset (Monday first)
  const { daysInMonth, blankLeadingDays } = useMemo(() => {
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // In JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const firstDow = new Date(currentYear, currentMonth, 1).getDay();
    // Convert to Monday = 0, ..., Sunday = 6
    const mondayFirstOffset = (firstDow + 6) % 7;

    return {
      daysInMonth: numDays,
      blankLeadingDays: Array.from({ length: mondayFirstOffset }, (_, i) => i),
    };
  }, [currentYear, currentMonth]);

  // Transactions of selected date
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const data = dailyDataMap.get(selectedDate);
    return {
      dateStr: selectedDate,
      totalExpense: data?.totalExpense || 0,
      totalIncome: data?.totalIncome || 0,
      transactions: data?.transactions || [],
    };
  }, [selectedDate, dailyDataMap]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-3.5 sm:p-6 backdrop-blur-xl shadow-sm transition-all duration-200">
      {/* Title & Month Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Aktivitas Bulan Ini
          </h2>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex items-center gap-2">
          {!isCurrentMonthViewed && (
            <button
              onClick={handleResetToCurrentMonth}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-lime-100 hover:bg-lime-200 dark:bg-lime-950/60 dark:hover:bg-lime-900/60 text-lime-800 dark:text-lime-300 transition-colors border border-lime-300 dark:border-lime-700/50"
              title="Kembali ke bulan sekarang"
            >
              Bulan Ini
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Bulan sebelumnya"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {new Date(currentYear, currentMonth, 1).toLocaleString('id-ID', { month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Bulan berikutnya"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Styled Month-Year Label (As shown in screenshot: "OCTOBER 2026") */}
      <div className="mt-4 mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
          {monthYearLabel}
        </p>
      </div>

      {/* Days of the Week Bar: SN, SL, RB, KM, JM, SB, MG */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 sm:mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="text-center py-1 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider select-none"
            title={day.full}
          >
            {day.short}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Leading Empty Cells */}
        {blankLeadingDays.map((i) => (
          <div
            key={`blank-${i}`}
            className="h-[58px] sm:h-[68px] rounded-xl sm:rounded-2xl bg-transparent select-none opacity-20 pointer-events-none"
          />
        ))}

        {/* Days of the Month */}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const dayNum = index + 1;
          const dayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          
          const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === dayNum;

          const isSelected = selectedDate === dayKey;

          const dayData = dailyDataMap.get(dayKey);
          const expenseAmount = dayData?.totalExpense || 0;
          const hasExpense = expenseAmount > 0;
          const expenseLabel = hasExpense ? formatCalendarExpense(expenseAmount) : '';

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => {
                // Toggle selection or open details
                setSelectedDate((prev) => (prev === dayKey ? null : dayKey));
              }}
              className={`
                group relative h-[58px] sm:h-[68px] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl
                flex flex-col justify-between items-start text-left transition-all duration-200 outline-none
                ${
                  /* Has expense: soft lime/yellowish pastel background */
                  hasExpense
                    ? 'bg-[#f4fce3] hover:bg-[#ecfccb] dark:bg-lime-950/40 dark:hover:bg-lime-900/50 border border-lime-200/90 dark:border-lime-700/50 shadow-xs'
                    : 'bg-slate-50/80 hover:bg-slate-100/90 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800/60'
                }
                ${
                  /* Today highlight: lime rounded border as in screenshot day 6 */
                  isToday
                    ? 'border-2 border-lime-400 dark:border-lime-400 ring-2 ring-lime-400/30'
                    : ''
                }
                ${
                  /* Selected state */
                  isSelected
                    ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 z-10 scale-[1.02] shadow-md'
                    : ''
                }
              `}
              title={`${dayNum} ${monthYearLabel}${hasExpense ? ` • Pengeluaran: ${formatRupiah(expenseAmount)}` : ''}`}
            >
              {/* Day Number */}
              <span
                className={`
                  text-[11px] sm:text-xs font-bold leading-none
                  ${
                    hasExpense
                      ? 'text-slate-800 dark:text-lime-200'
                      : isToday
                      ? 'text-lime-700 dark:text-lime-300 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400'
                  }
                `}
              >
                {dayNum}
              </span>

              {/* Expense Total Shorthand Badge (e.g. -2.2JT, -60RB) */}
              {hasExpense ? (
                <div className="w-full text-center pb-0.5">
                  <span className="block text-[10px] sm:text-xs font-black text-rose-600 dark:text-rose-400 tracking-tighter sm:tracking-tight leading-none whitespace-nowrap">
                    {expenseLabel}
                  </span>
                </div>
              ) : isToday ? (
                <div className="w-full text-center pb-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-bold text-lime-600 dark:text-lime-400 block leading-none">
                    Hari ini
                  </span>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Selected Day Transaction Breakdown Drawer */}
      {selectedDayInfo && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatDateFullIndo(selectedDayInfo.dateStr)}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs mt-0.5">
                  {selectedDayInfo.totalExpense > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      Total Pengeluaran: {formatRupiah(selectedDayInfo.totalExpense)}
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Tidak ada pengeluaran</span>
                  )}
                  {selectedDayInfo.totalIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      • Pemasukan: {formatRupiah(selectedDayInfo.totalIncome)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddExpense && (
                <button
                  type="button"
                  onClick={() => onOpenAddExpense(selectedDayInfo.dateStr)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-bold shadow-xs transition-all active:scale-95"
                  title="Tambah pengeluaran untuk tanggal ini"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Catat Pengeluaran</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
                title="Tutup rincian"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Transactions on Selected Day */}
          <div className="mt-3 space-y-2">
            {selectedDayInfo.transactions.length > 0 ? (
              selectedDayInfo.transactions.map((tx) => {
                const isExpense = (tx.type || '').toLowerCase() === 'expense';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${tx.category_color || '#10B981'}20`,
                          color: tx.category_color || '#10B981',
                        }}
                      >
                        <CategoryIcon name={tx.category_icon} className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tx.notes || tx.category_name || (isExpense ? 'Pengeluaran' : 'Pemasukan')}
                        </p>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {tx.category_name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span
                        className={`text-xs font-extrabold ${
                          isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatRupiah(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Belum ada transaksi di tanggal ini. Klik &quot;Catat Pengeluaran&quot; untuk menambahkan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
