import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Transaction } from '../../types';
import { formatCompactRupiah } from '../../lib/formatters';
import { useFinance } from '../../context/FinanceContext';
import { CalendarDays, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

type ChartTab = 'monthly' | 'yearly';

interface CashflowChartProps {
  transactions: Transaction[];
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ transactions }) => {
  const { monthlySavingsTarget, availableYears, getYearlySummary } = useFinance();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const [tab, setTab] = useState<ChartTab>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // ─── Monthly view: daily breakdown for the selected month ──────────────────
  const monthlyChartData = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayMap: Record<number, { income: number; expense: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dayMap[d] = { income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const amt = Number(t.amount);
        if (t.type === 'income') dayMap[day].income += amt;
        else dayMap[day].expense += amt;
      }
    });

    return Object.entries(dayMap).map(([day, vals]) => ({
      label: day,
      income: vals.income,
      expense: vals.expense,
      net: vals.income - vals.expense,
    }));
  }, [transactions, selectedYear, selectedMonth]);

  // ─── Yearly view: 12-month breakdown for selected year ─────────────────────
  const yearlyChartData = useMemo(() => {
    return getYearlySummary(selectedYear).months.map((m) => ({
      label: m.monthName,
      fullLabel: m.fullMonthName,
      income: m.income,
      expense: m.expense,
      net: m.net,
      cumulativeSavings: m.cumulativeSavings,
      targetSavings: m.targetSavings,
      hasData: m.hasData,
    }));
  }, [getYearlySummary, selectedYear]);

  // ─── Year-over-year comparison (for yearly summary cards) ──────────────────
  const yearlySummary = useMemo(() => getYearlySummary(selectedYear), [getYearlySummary, selectedYear]);

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Navigation helpers
  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const prevYear = () => setSelectedYear(y => y - 1);
  const nextYear = () => {
    if (selectedYear >= currentYear) return;
    setSelectedYear(y => y + 1);
  };

  const isCurrentMonthOrFuture = selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth();
  const isCurrentYear = selectedYear >= currentYear;

  // ─── Tooltips ──────────────────────────────────────────────────────────────
  const MonthlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const inc = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const exp = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const net = inc - exp;
    return (
      <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-sm min-w-[180px]">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          {monthShort[selectedMonth]} {label}, {selectedYear}
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Pemasukan
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCompactRupiah(inc)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Pengeluaran
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatCompactRupiah(exp)}</span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between items-center gap-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Net</span>
            <span className={`text-xs font-bold ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {net < 0 ? '-' : '+'}{formatCompactRupiah(Math.abs(net))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const YearlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const inc = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const exp = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const net = inc - exp;
    const cumSav = payload.find((p: any) => p.dataKey === 'cumulativeSavings')?.value || 0;
    const tgtSav = payload.find((p: any) => p.dataKey === 'targetSavings')?.value || 0;
    return (
      <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-sm min-w-[200px]">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label} {selectedYear}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Pemasukan
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCompactRupiah(inc)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Pengeluaran
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatCompactRupiah(exp)}</span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between gap-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Net Bulan Ini</span>
            <span className={`text-xs font-bold ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {net < 0 ? '-' : '+'}{formatCompactRupiah(Math.abs(net))}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />Akumulasi
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{formatCompactRupiah(cumSav)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full border-2 border-dashed border-amber-500 inline-block" />Target
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{formatCompactRupiah(tgtSav)}</span>
          </div>
        </div>
      </div>
    );
  };

  const hasMonthlyData = monthlyChartData.some(d => d.income > 0 || d.expense > 0);
  const hasYearlyData = yearlyChartData.some(d => d.hasData);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Grafik Arus Kas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visualisasi pemasukan & pengeluaran</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 gap-1 self-start sm:self-auto">
            <button
              onClick={() => setTab('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                tab === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Bulanan
            </button>
            <button
              onClick={() => setTab('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                tab === 'yearly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Tahunan
            </button>
          </div>
        </div>

        {/* Period Navigator */}
        <div className="mt-3 flex items-center justify-between">
          {tab === 'monthly' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[160px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={nextMonth}
                disabled={isCurrentMonthOrFuture}
                className={`p-1.5 rounded-lg transition-colors ${
                  isCurrentMonthOrFuture
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Month quick-select */}
              <div className="hidden sm:flex items-center gap-1 ml-2">
                {monthShort.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(i)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                      i === selectedMonth
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={prevYear}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[60px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={nextYear}
                disabled={isCurrentYear}
                className={`p-1.5 rounded-lg transition-colors ${
                  isCurrentYear
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Year quick-select pills */}
              <div className="flex items-center gap-1 ml-2 flex-wrap">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                      y === selectedYear
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MONTHLY CHART ── */}
      {tab === 'monthly' && (
        <div className="p-5">
          {!hasMonthlyData ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada transaksi di bulan ini</p>
            </div>
          ) : (
            <>
              {/* Summary pills */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total Pemasukan', val: monthlyChartData.reduce((s, d) => s + d.income, 0), color: 'emerald' },
                  { label: 'Total Pengeluaran', val: monthlyChartData.reduce((s, d) => s + d.expense, 0), color: 'rose' },
                  {
                    label: 'Selisih Bersih',
                    val: monthlyChartData.reduce((s, d) => s + d.net, 0),
                    color: monthlyChartData.reduce((s, d) => s + d.net, 0) >= 0 ? 'blue' : 'rose',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 bg-${item.color}-50 dark:bg-${item.color}-500/10 border border-${item.color}-200 dark:border-${item.color}-500/20`}
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-wide text-${item.color}-600 dark:text-${item.color}-400 mb-1`}>
                      {item.label}
                    </p>
                    <p className={`text-sm font-extrabold text-${item.color}-700 dark:text-${item.color}-300`}>
                      {formatCompactRupiah(Math.abs(item.val))}
                    </p>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barGap={2}>
                  <defs>
                    <linearGradient id="incGradM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="expGradM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#FB7185" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactRupiah}
                    width={60}
                  />
                  <Tooltip content={<MonthlyTooltip />} />
                  <ReferenceLine y={0} stroke="currentColor" className="text-slate-300 dark:text-slate-600" />
                  <Bar dataKey="income" name="Pemasukan" fill="url(#incGradM)" radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="url(#expGradM)" radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}

      {/* ── YEARLY CHART ── */}
      {tab === 'yearly' && (
        <div className="p-5">
          {/* Yearly KPI summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Pemasukan', val: yearlySummary.totalIncome, color: 'emerald' },
              { label: 'Total Pengeluaran', val: yearlySummary.totalExpense, color: 'rose' },
              { label: 'Total Tabungan', val: yearlySummary.totalSavings, color: yearlySummary.totalSavings >= 0 ? 'blue' : 'rose' },
              { label: 'Capai Target', val: null, pct: yearlySummary.targetAchievementRate, color: yearlySummary.targetAchievementRate >= 100 ? 'emerald' : yearlySummary.targetAchievementRate >= 50 ? 'amber' : 'rose' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-3 bg-${item.color}-50 dark:bg-${item.color}-500/10 border border-${item.color}-200 dark:border-${item.color}-500/20`}
              >
                <p className={`text-[10px] font-semibold uppercase tracking-wide text-${item.color}-600 dark:text-${item.color}-400 mb-1`}>
                  {item.label}
                </p>
                {item.val !== null ? (
                  <p className={`text-sm font-extrabold text-${item.color}-700 dark:text-${item.color}-300`}>
                    {formatCompactRupiah(Math.abs(item.val ?? 0))}
                  </p>
                ) : (
                  <p className={`text-sm font-extrabold text-${item.color}-700 dark:text-${item.color}-300`}>
                    {item.pct}%
                  </p>
                )}
              </div>
            ))}
          </div>

          {!hasYearlyData ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada data untuk tahun {selectedYear}</p>
            </div>
          ) : (
            <>
              {/* Bar chart: income vs expense per month */}
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Pemasukan vs Pengeluaran per Bulan</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearlyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barGap={2}>
                  <defs>
                    <linearGradient id="incGradY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="expGradY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#FB7185" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactRupiah}
                    width={60}
                  />
                  <Tooltip content={<YearlyTooltip />} />
                  <Bar dataKey="income" name="Pemasukan" fill="url(#incGradY)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="url(#expGradY)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Area chart: cumulative savings vs target */}
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-5 mb-2">Akumulasi Tabungan vs Target</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={yearlyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="cumSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactRupiah}
                    width={60}
                  />
                  <Tooltip content={<YearlyTooltip />} />
                  <ReferenceLine y={monthlySavingsTarget * 12} stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={1.5} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => {
                      if (value === 'cumulativeSavings') return 'Akumulasi Tabungan';
                      if (value === 'targetSavings') return 'Target Tahunan';
                      return value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeSavings"
                    name="cumulativeSavings"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#cumSavingsGrad)"
                    dot={{ r: 3.5, fill: '#06B6D4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="targetSavings"
                    name="targetSavings"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2.5, fill: '#F59E0B' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}
    </div>
  );
};
