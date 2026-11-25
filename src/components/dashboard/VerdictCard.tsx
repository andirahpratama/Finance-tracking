import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface VerdictCardProps {
  onOpenBudgeting?: () => void;
  onOpenSettings?: () => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  onOpenBudgeting,
  onOpenSettings,
}) => {
  const { currentMonthVerdict, currentMonthBudgetStatus } = useFinance();

  const styles =
    currentMonthVerdict.level === 'Baik'
      ? {
          wrap: 'bg-finance-50/90 dark:bg-finance-950/30 border-finance-300/80 dark:border-finance-800/60',
          badge: 'bg-finance-600 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-finance-600 dark:text-finance-400" />,
          titleColor: 'text-finance-900 dark:text-finance-200',
        }
      : currentMonthVerdict.level === 'Waspada'
      ? {
          wrap: 'bg-gold-50 dark:bg-amber-950/20 border-gold-300 dark:border-amber-700/50',
          badge: 'bg-gold-500 text-slate-950',
          icon: <AlertTriangle className="w-5 h-5 text-gold-600 dark:text-amber-400" />,
          titleColor: 'text-amber-900 dark:text-amber-200',
        }
      : {
          wrap: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60',
          badge: 'bg-rose-600 text-white',
          icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          titleColor: 'text-rose-900 dark:text-rose-200',
        };

  return (
    <div className={`rounded-3xl border p-4 sm:p-5 shadow-sm transition-all ${styles.wrap}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-black/5 shadow-xs shrink-0">
            {styles.icon}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-finance-500" />
                Verdict Perencanaan Bulan Ini
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${styles.badge}`}>
                {currentMonthVerdict.level}
              </span>
              {currentMonthBudgetStatus.mode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-black/10">
                  {currentMonthBudgetStatus.mode === 'simple' ? 'Mode Sederhana' : 'Mode Lengkap'}
                </span>
              )}
            </div>
            <h3 className={`text-sm sm:text-base font-extrabold ${styles.titleColor}`}>
              {currentMonthVerdict.headline}
            </h3>
            <ul className="space-y-1 pt-0.5">
              {currentMonthVerdict.reasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {!currentMonthBudgetStatus.config && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Atur Budget
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenBudgeting && (
            <button
              onClick={onOpenBudgeting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-700 text-finance-700 dark:text-finance-300 hover:bg-finance-50 text-xs font-bold shadow-xs transition-all"
            >
              Pantau Pos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
