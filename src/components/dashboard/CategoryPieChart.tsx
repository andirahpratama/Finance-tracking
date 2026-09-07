import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '../../types';
import { formatRupiah } from '../../lib/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';

interface CategoryPieChartProps {
  transactions: Transaction[];
}

export type ViewType = 'all' | 'expense' | 'income';

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions }) => {
  // Default to 'all' (Semua) as requested by user
  const [activeType, setActiveType] = useState<ViewType>('all');

  // Compute breakdown data
  const { data, centerTitle, centerTotal, baselineTotal } = useMemo(() => {
    const incomeTransactions = transactions.filter((t) => t.type === 'income');
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');

    const totalInc = incomeTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalExp = expenseTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

    if (activeType === 'all') {
      // Baseline for percentages is Total Pemasukan (if 0, fallback to totalExp to avoid div by 0)
      const baseline = totalInc > 0 ? totalInc : (totalExp > 0 ? totalExp : 1);

      // Group expenses by category
      const catMap = new Map<
        string,
        { name: string; icon: string; color: string; value: number }
      >();

      expenseTransactions.forEach((t) => {
        const amount = Number(t.amount || 0);
        const key = t.category_id || t.category_name || 'Pengeluaran Lainnya';
        const existing = catMap.get(key) || {
          name: t.category_name || 'Pengeluaran Lainnya',
          icon: t.category_icon || 'Tag',
          color: t.category_color || '#F43F5E',
          value: 0,
        };
        existing.value += amount;
        catMap.set(key, existing);
      });

      const items = Array.from(catMap.values()).sort((a, b) => b.value - a.value);

      // Add "Sisa Uang" item if income > expense
      const remainingMoney = totalInc - totalExp;
      if (remainingMoney > 0) {
        items.push({
          name: 'Sisa Uang (Surplus)',
          icon: 'Wallet',
          color: '#10B981', // Emerald green
          value: remainingMoney,
        });
      }

      return {
        data: items,
        centerTitle: 'Total Pemasukan',
        centerTotal: totalInc,
        baselineTotal: baseline,
      };
    } else {
      // Mode 'expense' atau 'income'
      const targetTx = transactions.filter((t) => t.type === activeType);
      const catMap = new Map<
        string,
        { name: string; icon: string; color: string; value: number }
      >();

      let sum = 0;
      targetTx.forEach((t) => {
        const amount = Number(t.amount || 0);
        sum += amount;
        const key = t.category_id || t.category_name || 'Lainnya';
        const existing = catMap.get(key) || {
          name: t.category_name || 'Lainnya',
          icon: t.category_icon || (activeType === 'expense' ? 'ArrowDownRight' : 'ArrowUpRight'),
          color: t.category_color || (activeType === 'expense' ? '#F43F5E' : '#10B981'),
          value: 0,
        };
        existing.value += amount;
        catMap.set(key, existing);
      });

      const items = Array.from(catMap.values()).sort((a, b) => b.value - a.value);
      return {
        data: items,
        centerTitle: activeType === 'expense' ? 'Total Pengeluaran' : 'Total Pemasukan',
        centerTotal: sum,
        baselineTotal: sum > 0 ? sum : 1,
      };
    }
  }, [transactions, activeType]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = baselineTotal > 0 ? ((item.value / baselineTotal) * 100).toFixed(1) : '0';
      return (
        <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md text-white space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-xs">{item.name}</span>
          </div>
          <p className="text-sm font-black text-white">{formatRupiah(item.value)}</p>
          <p className="text-[11px] text-slate-300 font-semibold">
            {percentage}% dari {centerTitle}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col justify-between">
      {/* Type Toggle Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Distribusi Kategori
        </span>
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeType === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveType('expense')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeType === 'expense'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveType('income')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeType === 'income'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
          <p className="text-xs font-semibold">Belum ada transaksi pada periode ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
          {/* Donut Chart */}
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="currentColor"
                      className="text-white dark:text-slate-900 stroke-2"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label inside Donut Chart */}
            <div className="absolute text-center pointer-events-none px-2 max-w-[120px]">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-400 block truncate">
                {centerTitle}
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                {formatRupiah(centerTotal)}
              </span>
            </div>
          </div>

          {/* Category List Breakdown */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {data.map((item, idx) => {
              const pct = baselineTotal > 0 ? ((item.value / baselineTotal) * 100).toFixed(1) : '0';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-1.5 rounded-lg text-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-900 dark:text-slate-100 font-bold block truncate">
                        {item.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {formatRupiah(item.value)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {pct}% dari {activeType === 'all' ? 'Pemasukan' : 'Total'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
