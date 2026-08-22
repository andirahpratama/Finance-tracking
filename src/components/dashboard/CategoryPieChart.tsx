import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, TransactionType } from '../../types';
import { formatRupiah } from '../../lib/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';

interface CategoryPieChartProps {
  transactions: Transaction[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions }) => {
  const [activeType, setActiveType] = useState<TransactionType>('expense');

  // Group by category for selected type
  const { data, total } = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === activeType);
    const catMap = new Map<
      string,
      { name: string; icon: string; color: string; value: number }
    >();

    let sum = 0;
    filtered.forEach((t) => {
      const amount = Number(t.amount);
      sum += amount;
      const key = t.category_id || t.category_name || 'Lainnya';
      const existing = catMap.get(key) || {
        name: t.category_name || 'Lainnya',
        icon: t.category_icon || 'Tag',
        color: t.category_color || '#64748B',
        value: 0,
      };
      existing.value += amount;
      catMap.set(key, existing);
    });

    const items = Array.from(catMap.values()).sort((a, b) => b.value - a.value);
    return { data: items, total: sum };
  }, [transactions, activeType]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="rounded-xl bg-slate-900/95 border border-slate-700/80 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-semibold text-white text-xs">{item.name}</span>
          </div>
          <p className="text-sm font-bold text-white">{formatRupiah(item.value)}</p>
          <p className="text-[11px] text-slate-400 font-medium">{percentage}% dari total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col justify-between">
      {/* Type Toggle Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Distribusi Kategori
        </span>
        <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveType('expense')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeType === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveType('income')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeType === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-500">
          <p className="text-xs">Belum ada {activeType === 'expense' ? 'pengeluaran' : 'pemasukan'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
          {/* Donut Chart */}
          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total</span>
              <span className="text-xs font-bold text-white">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Category List Breakdown */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {data.slice(0, 5).map((item, idx) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-800/40 border border-slate-800/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="p-1 rounded-md text-white flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold text-white block">{formatRupiah(item.value)}</span>
                    <span className="text-[10px] text-slate-400">{pct}%</span>
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
