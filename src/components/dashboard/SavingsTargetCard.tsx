import React from 'react';
import { Target, Sparkles, Edit3, Palmtree, GraduationCap, ShieldAlert, PiggyBank, FolderPlus, Plus, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';
import { calculateSavingsProgress } from '../../lib/savingsUtils';

interface SavingsTargetCardProps {
  onOpenTargetModal: () => void;
  onOpenSavingsModal?: () => void;
}

export const SavingsTargetCard: React.FC<SavingsTargetCardProps> = ({ onOpenTargetModal, onOpenSavingsModal }) => {
  const { savingsTargets, addSavingsTargetItem } = useFinance();

  const currentYear = new Date().getFullYear();

  const getTargetIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Palmtree': return Palmtree;
      case 'GraduationCap': return GraduationCap;
      case 'ShieldAlert': return ShieldAlert;
      case 'PiggyBank': return PiggyBank;
      default: return Target;
    }
  };

  const defaultPresets = [
    {
      name: 'Tabungan Dana Darurat',
      target: 25000000,
      deadline: `${currentYear + 1}-12`,
      icon: 'ShieldAlert',
      color: '#10b981',
      desc: 'Dana siaga 6x pengeluaran pokok',
    },
    {
      name: 'Tabungan Pendidikan Anak',
      target: 40000000,
      deadline: `${currentYear + 3}-07`,
      icon: 'GraduationCap',
      color: '#3b82f6',
      desc: 'Persiapan masuk jenjang sekolah / kuliah',
    },
    {
      name: 'Tabungan Liburan Keluarga',
      target: 15000000,
      deadline: `${currentYear}-12`,
      icon: 'Palmtree',
      color: '#06b6d4',
      desc: 'Wisata & liburan akhir tahun',
    },
    {
      name: 'Tabungan Pensiun & Hari Tua',
      target: 100000000,
      deadline: `${currentYear + 5}-12`,
      icon: 'PiggyBank',
      color: '#8b5cf6',
      desc: 'Investasi mandiri masa depan',
    },
  ];

  const handleAddPreset = async (preset: typeof defaultPresets[0]) => {
    await addSavingsTargetItem({
      name: preset.name,
      target_amount: preset.target,
      current_amount: 0,
      deadline_date: preset.deadline,
      auto_calculate_monthly: true,
      category_icon: preset.icon,
      color: preset.color,
    });
  };

  const totalTargetAmount = savingsTargets.reduce((sum, item) => sum + (item.target_amount || 0), 0);
  const totalSavedCurrent = savingsTargets.reduce((sum, item) => sum + (item.current_amount || 0), 0);
  const totalMonthlyCalculated = savingsTargets.reduce((sum, item) => {
    const prog = calculateSavingsProgress(item);
    return sum + prog.monthlyTarget;
  }, 0);
  const overallProgressPercent = totalTargetAmount > 0 ? Math.min(100, Math.round((totalSavedCurrent / totalTargetAmount) * 100)) : 0;

  // Empty state when no savings targets exist
  if (savingsTargets.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Sistem Goal-Based Savings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih preset cerdas di bawah atau buat pos kustom dengan target dana dan tenggat waktu
              </p>
            </div>
          </div>
          <button
            onClick={onOpenTargetModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Buat Pos Custom
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {defaultPresets.map((p) => {
            const IconComponent = getTargetIcon(p.icon);
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleAddPreset(p)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3.5"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: p.color }}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                    + Aktifkan
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Target: {formatRupiah(p.target)}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                    {p.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm dark:shadow-md transition-all duration-200 space-y-5">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Goal-Based Savings Dashboard
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {savingsTargets.length} Pos Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total Tabungan: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatRupiah(totalSavedCurrent)}</strong> dari Target Total: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatRupiah(totalTargetAmount)}</strong>
              {totalMonthlyCalculated > 0 && (
                <span className="hidden md:inline text-teal-600 dark:text-teal-400 font-semibold ml-2">
                  • Target Setoran Bersama: {formatRupiah(totalMonthlyCalculated)}/bln
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenSavingsModal && (
            <button
              onClick={onOpenSavingsModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Setor / Tarik Tabungan
            </button>
          )}

          <button
            onClick={onOpenTargetModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Kelola Pos
          </button>
        </div>
      </div>

      {/* Overall Progress Bar Summary */}
      <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            Akumulasi Target Keseluruhan
            {overallProgressPercent >= 100 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Semua Target Penuh! 🎉
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/20">
                Sisa Kebutuhan: {formatRupiah(Math.max(0, totalTargetAmount - totalSavedCurrent))}
              </span>
            )}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
            {overallProgressPercent}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              overallProgressPercent >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Savings Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {savingsTargets.map((item) => {
          const IconComp = getTargetIcon(item.category_icon);
          const prog = calculateSavingsProgress(item);
          const currentSaved = item.current_amount || 0;
          const isFull = prog.isAchieved;

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950/70 border shadow-sm flex flex-col justify-between space-y-3.5 relative group transition-all duration-200 ${
                isFull
                  ? 'border-emerald-500/60 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : prog.isOnTrack
                  ? 'border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/40'
                  : 'border-amber-500/40 dark:border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/5'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color || '#10b981' }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Target: {formatRupiah(item.target_amount)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onOpenTargetModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Edit Target"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status and Automatic Calculation */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {formatRupiah(currentSaved)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isFull ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Tercapai 🎉
                      </span>
                    ) : prog.isOnTrack ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        On Track 🚀
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Off Track
                      </span>
                    )}
                    <span
                      className={`text-xs font-black ${
                        isFull || prog.isOnTrack
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {prog.progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Dynamic Progress Bar (Green when On-Track, Yellow/Amber when Off-Track) */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : prog.isOnTrack
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${prog.progressPercent}%`,
                    }}
                  />
                </div>

                {/* Target Bulanan Otomatis Info */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  {prog.monthlyTarget > 0 ? (
                    <>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Target: <strong className="text-teal-600 dark:text-teal-400">{formatRupiah(prog.monthlyTarget)}</strong>/bln
                      </span>
                      {item.deadline_date && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Sisa {prog.remainingMonths} bln
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Target dana telah tercapai!
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
