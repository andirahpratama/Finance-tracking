import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const SmartTipsCard: React.FC = () => {
  const { currentMonthInsights } = useFinance();

  if (currentMonthInsights.length === 0) return null;

  const getToneStyle = (tone: 'good' | 'warn' | 'bad' | 'info') => {
    switch (tone) {
      case 'good':
        return {
          box: 'bg-finance-50/90 dark:bg-finance-950/30 border-finance-200 dark:border-finance-800/50',
          icon: <CheckCircle2 className="w-4 h-4 text-finance-600 dark:text-finance-400 shrink-0 mt-0.5" />,
        };
      case 'warn':
        return {
          box: 'bg-gold-50 dark:bg-amber-950/20 border-gold-200 dark:border-amber-800/40',
          icon: <AlertTriangle className="w-4 h-4 text-gold-600 dark:text-amber-400 shrink-0 mt-0.5" />,
        };
      case 'bad':
        return {
          box: 'bg-rose-50 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800/40',
          icon: <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
        };
      default:
        return {
          box: 'bg-cream-100 dark:bg-slate-800/50 border-finance-100 dark:border-slate-700',
          icon: <Info className="w-4 h-4 text-finance-600 dark:text-finance-400 shrink-0 mt-0.5" />,
        };
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-finance-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3.5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-gold-100 text-gold-600 border border-gold-200">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
            Tips & Analisa Otomatis Bulan Ini
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catatan jujur dari data transaksimu sendiri
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentMonthInsights.map((tip) => {
          const style = getToneStyle(tip.tone);
          return (
            <div key={tip.id} className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${style.box}`}>
              {style.icon}
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">
                  {tip.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
