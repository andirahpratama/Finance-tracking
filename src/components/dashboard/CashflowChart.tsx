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
import { Transaction, ChartViewMode } from '../../types';
import { formatCompactRupiah, formatRupiah, formatDateIndo } from '../../lib/formatters';
import { useFinance } from '../../context/FinanceContext';
import { Calendar, BarChart3, LineChart } from 'lucide-react';


interface CashflowChartProps {
  transactions: Transaction[];
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ transactions }) => {
  const { monthlySavingsTarget, availableYears, getYearlySummary } = useFinance();
  const currentYear = new Date().getFullYear();

  const [viewMode, setViewMode] = useState<ChartViewMode>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Daily Chart Data (Last 15 active days)
  const dailyChartData = useMemo(() => {
    if (!transactions.length) return [];
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dateMap = new Map<string, { date: string; income: number; expense: number; net: number }>();

    sorted.forEach((t) => {
      const existing = dateMap.get(t.date) || { date: t.date, income: 0, expense: 0, net: 0 };
      const amt = Number(t.amount);
      if (t.type === 'income') {
        existing.income += amt;
      } else {
        existing.expense += amt;
      }
      existing.net = existing.income - existing.expense;
      dateMap.set(t.date, existing);
    });

    const list = Array.from(dateMap.values());
    return list.slice(-15);
  }, [transactions]);

  // Yearly Summary for selected year
  const yearlySummary = useMemo(() => {
    return getYearlySummary(selectedYear);
  }, [getYearlySummary, selectedYear]);

  // Custom Tooltip for Daily Area Chart
  const DailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = inc - exp;

      return (
        <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md transition-colors duration-200">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{formatDateIndo(label)}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pemasukan:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(inc)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Pengeluaran:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(exp)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">Tabungan Bersih:</span>
              <span className={`font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatRupiah(net)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Monthly 12-Month Chart
  const MonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md transition-colors duration-200 min-w-[200px]">
          <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">{data.fullMonthName}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pemasukan:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(data.income)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Pengeluaran:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(data.expense)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Tabungan Bersih:</span>
              <span className={`font-bold ${data.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatRupiah(data.net)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400">
              <span>Target Bulanan:</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{formatRupiah(monthlySavingsTarget)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Yearly Cumulative Savings Chart
  const CumulativeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const targetDiff = data.cumulativeSavings - data.targetSavings;
      const isSurplus = targetDiff >= 0;

      return (
        <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md transition-colors duration-200 min-w-[220px]">
          <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">{data.fullMonthName}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Tabungan Bulan Ini:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(data.net)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Total Terkumpul:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(data.cumulativeSavings)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Target Akumulasi:
              </span>
              <span className="font-bold">{formatRupiah(data.targetSavings)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">Status Target:</span>
              <span className={`font-bold ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isSurplus ? `+${formatRupiah(targetDiff)}` : formatRupiah(targetDiff)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* View Mode Controls & Year Selector Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* View Mode Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs overflow-x-auto">
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            Bulanan (1 Tahun)
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              viewMode === 'yearly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-cyan-500" />
            Akumulasi Tabungan 1 Th
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            Harian (15 Hari)
          </button>
        </div>

        {/* Year Selector (visible for monthly & yearly modes) */}
        {viewMode !== 'daily' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mini Summary Cards for Selected Year in Monthly / Yearly Mode */}
      {viewMode !== 'daily' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Pemasukan {selectedYear}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatRupiah(yearlySummary.totalIncome)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Pengeluaran {selectedYear}</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
              {formatRupiah(yearlySummary.totalExpense)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Total Tabungan {selectedYear}</span>
            <span className={`font-extrabold text-sm ${yearlySummary.totalSavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatRupiah(yearlySummary.totalSavings)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Target Tahunan</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
              {yearlySummary.targetAchievementRate}% Tercapai
            </span>
          </div>
        </div>
      )}

      {/* Main Chart Canvas */}
      <div className="w-full h-72 sm:h-80">
        {/* 1. DAILY AREA VIEW */}
        {viewMode === 'daily' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(num) => formatCompactRupiah(num)}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip content={<DailyTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                formatter={(value) => (value === 'income' ? 'Pemasukan' : 'Pengeluaran')}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="income"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* 2. MONTHLY 12-MONTH BAR/LINE VIEW */}
        {viewMode === 'monthly' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlySummary.months} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
              <XAxis
                dataKey="monthName"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(num) => formatCompactRupiah(num)}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip content={<MonthlyTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                formatter={(value) => {
                  if (value === 'income') return 'Pemasukan';
                  if (value === 'expense') return 'Pengeluaran';
                  if (value === 'net') return 'Tabungan Bersih';
                  return value;
                }}
              />
              <ReferenceLine
                y={monthlySavingsTarget}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: 'Target Bulanan',
                  position: 'insideTopRight',
                  fill: '#F59E0B',
                  fontSize: 10,
                }}
              />
              <Bar dataKey="income" name="income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="expense" name="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Line
                type="monotone"
                dataKey="net"
                name="net"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06B6D4' }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 3. YEARLY CUMULATIVE SAVINGS VIEW */}
        {viewMode === 'yearly' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlySummary.months} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="cumSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
              <XAxis
                dataKey="monthName"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(num) => formatCompactRupiah(num)}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip content={<CumulativeTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                formatter={(value) => {
                  if (value === 'cumulativeSavings') return 'Akumulasi Tabungan Terkumpul';
                  if (value === 'targetSavings') return 'Garis Target Tahunan';
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
        )}
      </div>
    </div>
  );
};
