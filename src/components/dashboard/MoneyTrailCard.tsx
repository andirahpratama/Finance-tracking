import React from 'react';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Route } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';

export const MoneyTrailCard: React.FC = () => {
  const { currentMonthVerdict } = useFinance();
  const { income, expenseTotal, expenseByPost, savedThisMonth } = currentMonthVerdict.moneyTrail;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-finance-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-finance-100 text-finance-700 dark:bg-finance-900/40 dark:text-finance-300">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
              Ringkasan Jejak Uang Bulan Ini
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ke mana perginya uang masuk, keluar per pos, dan jadi tabungan
            </p>
          </div>
        </div>
      </div>

      {/* 3 Primary Money Flow Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-finance-50 dark:bg-finance-950/30 border border-finance-200 dark:border-finance-800/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-finance-700 dark:text-finance-300 mb-1">
            <ArrowUpRight className="w-4 h-4" />
            Uang Masuk
          </div>
          <p className="text-lg font-black text-finance-800 dark:text-white">
            {formatRupiah(income)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
            <ArrowDownRight className="w-4 h-4" />
            Uang Keluar
          </div>
          <p className="text-lg font-black text-rose-700 dark:text-rose-300">
            {formatRupiah(expenseTotal)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-gold-50 dark:bg-amber-950/20 border border-gold-200 dark:border-amber-700/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gold-600 dark:text-amber-400 mb-1">
            <PiggyBank className="w-4 h-4" />
            Jadi Tabungan
          </div>
          <p className="text-lg font-black text-amber-800 dark:text-amber-200">
            {formatRupiah(savedThisMonth)}
          </p>
        </div>
      </div>

      {/* Per-Post Allocation vs Usage Trail */}
      {expenseByPost.length > 0 && (
        <div className="pt-2 border-t border-finance-100 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Jejak per Pos Budgeting
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {expenseByPost.map((p) => (
              <div
                key={p.postId}
                className="p-3 rounded-xl bg-cream-100/70 dark:bg-slate-950/50 border border-finance-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{p.postName}</p>
                  <p className="text-[10px] text-slate-500">
                    Jatah {formatRupiah(p.allocated)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-extrabold text-slate-800 dark:text-white">
                    {formatRupiah(p.used)}
                  </p>
                  <p className={`text-[10px] font-bold ${p.remaining >= 0 ? 'text-finance-600' : 'text-rose-500'}`}>
                    Sisa {formatRupiah(p.remaining)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
