import React from 'react';
import { Target, Sparkles, Edit3, Palmtree, GraduationCap, ShieldAlert, PiggyBank, FolderPlus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';

interface SavingsTargetCardProps {
  onOpenTargetModal: () => void;
}

export const SavingsTargetCard: React.FC<SavingsTargetCardProps> = ({ onOpenTargetModal }) => {
  const { savingsTargets } = useFinance();

  const getTargetIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Palmtree': return Palmtree;
      case 'GraduationCap': return GraduationCap;
      case 'ShieldAlert': return ShieldAlert;
      case 'PiggyBank': return PiggyBank;
      default: return Target;
    }
  };

  const totalTargetMonthly = savingsTargets.reduce((sum, item) => sum + (item.target_amount || 0), 0);
  const totalSavedCurrent = savingsTargets.reduce((sum, item) => sum + (item.current_amount || 0), 0);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-sm dark:shadow-md transition-all duration-200 space-y-4">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Target & Pos Tabungan Keluarga</h3>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {savingsTargets.length} Pos Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Terkumpul: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatRupiah(totalSavedCurrent)}</strong> • Total Target Bulanan: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatRupiah(totalTargetMonthly)}</strong>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenTargetModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          Kelola Pos Tabungan
        </button>
      </div>

      {/* Savings Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
        {savingsTargets.map((item) => {
          const IconComp = getTargetIcon(item.category_icon);
          const targetMonthly = item.target_amount || 1;
          const currentSaved = item.current_amount || 0;
          const progressPercent = Math.min(100, Math.round((currentSaved / targetMonthly) * 100));

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: item.color || '#10b981' }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Target: {formatRupiah(item.target_amount)}/bln
                    </span>
                  </div>
                </div>

                <button
                  onClick={onOpenTargetModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Target"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatRupiah(currentSaved)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: item.color || '#10b981',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
