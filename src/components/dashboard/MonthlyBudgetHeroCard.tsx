import React from 'react';
import { Wallet, AlertTriangle, ArrowRight, Settings, PiggyBank } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';

interface MonthlyBudgetHeroCardProps {
  onOpenBudgeting: () => void;
  onOpenSettings: () => void;
  onTakeFromSavings?: () => void;
}

export const MonthlyBudgetHeroCard: React.FC<MonthlyBudgetHeroCardProps> = ({
  onOpenBudgeting,
  onOpenSettings,
  onTakeFromSavings,
}) => {
  const { currentMonthBudgetStatus, savingsTargets } = useFinance();
  const { primaryExpensePost, expenseCategories, actualExpense, config } = currentMonthBudgetStatus;

  const hasBudget = Boolean(config && primaryExpensePost);
  const budgetTitle = primaryExpensePost?.post.name || 'Biaya Bulanan';
  const allocated = primaryExpensePost?.effectiveBudget || 0;
  const used = primaryExpensePost ? primaryExpensePost.spent : actualExpense;
  const remaining = allocated - used;
  const pct = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
  const isLowOrEmpty = hasBudget && (remaining <= 0 || pct >= 85);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border-2 border-finance-200 dark:border-finance-800/60 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-finance-500 text-white shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                {budgetTitle} Bulan Ini
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-600 border border-gold-300">
                Anggaran Utama
              </span>
            </div>
            {hasBudget ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terpakai <strong className="text-slate-800 dark:text-white">{formatRupiah(used)}</strong> dari{' '}
                <strong className="text-finance-700 dark:text-finance-300">{formatRupiah(allocated)}</strong>{' '}
                • {remaining >= 0 ? `Sisa ${formatRupiah(remaining)}` : `Melebihi ${formatRupiah(Math.abs(remaining))}`}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total pengeluaran bulan ini: <strong className="text-slate-800 dark:text-white">{formatRupiah(actualExpense)}</strong> (atur batas bulanan di Profil)
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLowOrEmpty && onTakeFromSavings && savingsTargets.length > 0 && (
            <button
              onClick={onTakeFromSavings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              Ambil dari Tabungan
            </button>
          )}
          {!hasBudget ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Atur Budgeting
            </button>
          ) : (
            <button
              onClick={onOpenBudgeting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-finance-50 dark:bg-slate-800 hover:bg-finance-100 text-finance-700 dark:text-finance-300 text-xs font-bold border border-finance-200 dark:border-slate-700 transition-all"
            >
              Lihat Semua Pos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Progress Bar */}
      {hasBudget && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={remaining < 0 ? 'text-rose-600 flex items-center gap-1' : 'text-finance-700 dark:text-finance-300'}>
              {remaining < 0 && <AlertTriangle className="w-3.5 h-3.5" />}
              {remaining >= 0
                ? `Sisa anggaran: ${formatRupiah(remaining)}`
                : `Over budget ${formatRupiah(Math.abs(remaining))}`}
            </span>
            <span className="text-slate-600 dark:text-slate-300">{primaryExpensePost?.percentUsed || pct}% terpakai</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-cream-200 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                remaining < 0
                  ? 'bg-rose-500'
                  : pct >= 85
                  ? 'bg-gold-500'
                  : 'bg-finance-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
        </div>
      )}

      {/* Breakdown per Kategori */}
      <div className="pt-2 border-t border-finance-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rincian Pengeluaran per Kategori
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {expenseCategories.length} kategori aktif
          </span>
        </div>

        {expenseCategories.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            Belum ada pengeluaran tercatat di bulan ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {expenseCategories.map((cat) => (
              <div
                key={cat.categoryId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-cream-100/80 dark:bg-slate-950/60 border border-finance-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.categoryColor }}
                  >
                    <CategoryIcon name={cat.categoryIcon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {cat.categoryName}
                    </p>
                    <p className="text-[10px] text-slate-500">{cat.percentOfExpense}% dari pengeluaran</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white ml-2 shrink-0">
                  {formatRupiah(cat.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
