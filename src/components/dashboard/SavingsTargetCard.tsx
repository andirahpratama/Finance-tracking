import React from 'react';
import { Target, Sparkles, TrendingUp, Edit3, CheckCircle2, AlertCircle, ArrowUpRight, Flame } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';

interface SavingsTargetCardProps {
  onOpenTargetModal: () => void;
}

export const SavingsTargetCard: React.FC<SavingsTargetCardProps> = ({ onOpenTargetModal }) => {
  const {
    monthlySavingsTarget,
    thisMonthSavings,
    thisMonthSavingsProgress,
    yearlySavingsTotal,
    yearlyTargetTotal,
    yearlySavingsProgress,
  } = useFinance();

  const isAchieved = thisMonthSavings >= monthlySavingsTarget && monthlySavingsTarget > 0;
  const isNegative = thisMonthSavings < 0;
  const remainingMonthly = Math.max(0, monthlySavingsTarget - thisMonthSavings);
  const clampedProgress = Math.min(100, Math.max(0, thisMonthSavingsProgress));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-sm dark:shadow-md transition-all duration-200">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Menabung</h3>
              {isAchieved ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Target Bulan Ini Tercapai!
                </span>
              ) : isNegative ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30">
                  <AlertCircle className="w-3 h-3" />
                  Pengeluaran Melebihi Pemasukan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                  <Flame className="w-3 h-3 text-amber-500" />
                  {thisMonthSavingsProgress}% Tercapai
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Komitmen tabungan bulanan & akumulasi tahunan</span>
          </div>
        </div>

        {/* Edit Target Button */}
        <button
          onClick={onOpenTargetModal}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
          Atur Target
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Left: Monthly Target & Progress */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tabungan Bulan Ini</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Target: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatRupiah(monthlySavingsTarget)}</strong>
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <h4
              className={`text-2xl font-black tracking-tight ${
                isNegative
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatRupiah(thisMonthSavings)}
            </h4>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {thisMonthSavingsProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isAchieved
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : isNegative
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                }`}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>
                {isAchieved ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Surplus {formatRupiah(thisMonthSavings - monthlySavingsTarget)} dari target
                  </span>
                ) : isNegative ? (
                  <span className="text-rose-500">Perlu tambah pemasukan/rem belanja</span>
                ) : (
                  <span>Tersisa {formatRupiah(remainingMonthly)} lagi</span>
                )}
              </span>
              <span>Bulan {new Date().toLocaleString('id-ID', { month: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Right: 1-Year Goal Projection */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                Akumulasi Tabungan Tahun {new Date().getFullYear()}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Target: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatRupiah(yearlyTargetTotal)}</strong>
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatRupiah(yearlySavingsTotal)}
              </h4>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                {yearlySavingsProgress}% Target 1 Th
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, yearlySavingsProgress))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Terkumpul sepanjang tahun berjalan</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-0.5">
                Lihat grafik tahunan <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
