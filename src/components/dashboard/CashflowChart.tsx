import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Transaction } from '../../types';
import { formatCompactRupiah, formatRupiah, formatDateIndo } from '../../lib/formatters';

interface CashflowChartProps {
  transactions: Transaction[];
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ transactions }) => {
  // Aggregate transactions by date
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    // Sort transactions ascending by date
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date
    const dateMap = new Map<string, { date: string; income: number; expense: number }>();

    sorted.forEach((t) => {
      const existing = dateMap.get(t.date) || { date: t.date, income: 0, expense: 0 };
      if (t.type === 'income') {
        existing.income += Number(t.amount);
      } else {
        existing.expense += Number(t.amount);
      }
      dateMap.set(t.date, existing);
    });

    const list = Array.from(dateMap.values());
    // Take up to last 15 active dates for clean visualization
    return list.slice(-15);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = inc - exp;

      return (
        <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md transition-colors duration-200">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">{formatDateIndo(label)}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Pemasukan:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(inc)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Pengeluaran:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(exp)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400">Selisih Bersih:</span>
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

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80">
        <p className="text-sm">Belum ada data transaksi untuk ditampilkan pada grafik.</p>
        <span className="text-xs text-slate-400 dark:text-slate-600 mt-1">Tambahkan pemasukan atau pengeluaran pertama Anda</span>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            formatter={(value) => (value === 'income' ? 'Pemasukan' : 'Pengeluaran')}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="income"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#incomeGradient)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="expense"
            stroke="#F43F5E"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#expenseGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
