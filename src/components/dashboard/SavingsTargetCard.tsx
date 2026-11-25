import React from 'react';
import {
  Target,
  Sparkles,
  Edit3,
  Palmtree,
  GraduationCap,
  ShieldAlert,
  PiggyBank,
  FolderPlus,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';
import { calculateSavingsProgress } from '../../lib/savingsUtils';
import { BankLogo } from '../ui/BankLogo';
import { SavingsTargetItem } from '../../types';
import { CatFinnySvg } from '../mascot/CatFinnySvg';

interface SavingsTargetCardProps {
  onOpenTargetModal: (initial?: Partial<SavingsTargetItem> | null) => void;
  onOpenSavingsModal?: (targetId?: string, action?: 'deposit' | 'withdraw') => void;
  showSummaryStats?: boolean;
}

export const SavingsTargetCard: React.FC<SavingsTargetCardProps> = ({
  onOpenTargetModal,
  onOpenSavingsModal,
  showSummaryStats = true,
}) => {
  const { savingsTargets, addSavingsTargetItem, emergencyFundPref } = useFinance();

  const currentYear = new Date().getFullYear();

  const getTargetIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Palmtree':
        return Palmtree;
      case 'GraduationCap':
        return GraduationCap;
      case 'ShieldAlert':
        return ShieldAlert;
      case 'PiggyBank':
        return PiggyBank;
      default:
        return Target;
    }
  };

  const emergencySuggestedTarget = emergencyFundPref?.targetAmount || 25000000;

  const defaultPresets = [
    {
      name: 'Tabungan Dana Darurat',
      target: emergencySuggestedTarget,
      deadline: `${currentYear + 1}-12`,
      icon: 'ShieldAlert',
      color: '#4a8c67',
      bank: 'BCA',
      desc: emergencyFundPref
        ? `Sesuai kalkulatormu (${emergencyFundPref.multiplier}x pengeluaran)`
        : 'Saran awal — bisa disesuaikan di Kalkulator',
    },
    {
      name: 'Tabungan Pendidikan Anak',
      target: 40000000,
      deadline: `${currentYear + 3}-07`,
      icon: 'GraduationCap',
      color: '#3b82f6',
      bank: 'Mandiri',
      desc: 'Persiapan masuk jenjang sekolah / kuliah',
    },
    {
      name: 'Tabungan Liburan Keluarga',
      target: 15000000,
      deadline: `${currentYear}-12`,
      icon: 'Palmtree',
      color: '#0d9488',
      bank: 'SeaBank',
      desc: 'Wisata & liburan akhir tahun',
    },
    {
      name: 'Tabungan Pensiun & Hari Tua',
      target: 100000000,
      deadline: `${currentYear + 5}-12`,
      icon: 'PiggyBank',
      color: '#8b5cf6',
      bank: 'BNI',
      desc: 'Investasi mandiri masa depan',
    },
  ];

  const handleAddPreset = async (preset: typeof defaultPresets[0]) => {
    await addSavingsTargetItem({
      name: preset.name,
      bank_name: preset.bank,
      initial_balance: 0,
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
  const overallProgressPercent =
    totalTargetAmount > 0 ? Math.min(100, Math.round((totalSavedCurrent / totalTargetAmount) * 100)) : 0;

  return (
    <div className="space-y-5">
      {/* Consistent 4 Summary Stat Cards (selalu tampil konsisten baik saat kosong maupun ada pos!) */}
      {showSummaryStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">
              Pos Tabungan Aktif
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {savingsTargets.length} Pos
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">
              Total Dana Terkumpul
            </span>
            <p className="text-xl font-black text-finance-700 dark:text-finance-300 mt-1">
              {formatRupiah(totalSavedCurrent)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">
              Total Target Dana
            </span>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
              {formatRupiah(totalTargetAmount)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">
              Rekomendasi Setor / Bln
            </span>
            <p className="text-xl font-black text-gold-600 dark:text-amber-400 mt-1">
              {formatRupiah(totalMonthlyCalculated)}
            </p>
          </div>
        </div>
      )}

      {/* Empty State when 0 pos aktif */}
      {savingsTargets.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-finance-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <CatFinnySvg mood="happy" size={76} idPrefix="savingsEmptyCat" />
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Belum Ada Pos Tabungan Aktif
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih salah satu preset cepat di bawah atau buat pos tabunganmu sendiri lengkap dengan nama bank & saldo awal opsional.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenTargetModal(null)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              Buat Pos Tabungan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {defaultPresets.map((p) => {
              const IconComponent = getTargetIcon(p.icon);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleAddPreset(p)}
                  className="p-4 rounded-2xl border border-finance-200/80 dark:border-slate-800 bg-cream-50 dark:bg-slate-950/60 hover:border-finance-500 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <BankLogo bankName={p.bank} size="sm" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-finance-700">
                      {p.name}
                    </h4>
                    <p className="text-[11px] font-bold text-finance-700 dark:text-finance-400 mt-0.5">
                      Target: {formatRupiah(p.target)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
                  </div>
                  <span className="inline-block text-[10px] px-2.5 py-1 rounded-full bg-finance-100 text-finance-700 font-bold w-fit group-hover:bg-finance-600 group-hover:text-white transition-colors">
                    + Aktifkan Pos
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Savings Pos Dashboard */
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-finance-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-5">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-finance-600 text-white shadow-sm flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Progres Pos Tabungan
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-finance-100 text-finance-700 font-bold border border-finance-200">
                    <Sparkles className="w-3 h-3" />
                    {savingsTargets.length} Pos Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Terkumpul <strong className="text-finance-700 dark:text-finance-300">{formatRupiah(totalSavedCurrent)}</strong> dari{' '}
                  <strong>{formatRupiah(totalTargetAmount)}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenSavingsModal && (
                <button
                  onClick={() => onOpenSavingsModal(undefined, 'deposit')}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 text-xs font-extrabold shadow-xs active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Setor / Transfer Kas
                </button>
              )}

              <button
                onClick={() => onOpenTargetModal(null)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                Kelola / Tambah Pos
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="p-4 rounded-2xl bg-cream-100/80 dark:bg-slate-950/70 border border-finance-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Akumulasi Semua Target
                {overallProgressPercent >= 100 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-finance-600 text-white font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Semua Target Tercapai!
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-finance-700 font-bold border border-finance-200">
                    Sisa menuju target: {formatRupiah(Math.max(0, totalTargetAmount - totalSavedCurrent))}
                  </span>
                )}
              </span>
              <span className="text-finance-700 dark:text-finance-300 font-black text-sm">
                {overallProgressPercent}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-cream-200 dark:bg-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-finance-500 transition-all duration-700"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Savings Targets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {savingsTargets.map((item) => {
              const IconComp = getTargetIcon(item.category_icon);
              const prog = calculateSavingsProgress(item);
              const currentSaved = item.current_amount || 0;
              const isFull = prog.isAchieved;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-cream-50/60 dark:bg-slate-950/70 border shadow-xs flex flex-col justify-between space-y-3.5 transition-all ${
                    isFull
                      ? 'border-gold-400 bg-gold-50/50 dark:bg-amber-950/10'
                      : prog.isOnTrack
                      ? 'border-finance-200 dark:border-slate-800'
                      : 'border-gold-300 dark:border-amber-800/50'
                  }`}
                >
                  {/* Card Header with Bank Logo */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color || '#4a8c67' }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item.bank_name && <BankLogo bankName={item.bank_name} size="sm" showLabel />}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenTargetModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-finance-600 hover:bg-finance-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Edit Pos Tabungan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Balance & Progress */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Saldo saat ini</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatRupiah(currentSaved)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isFull
                              ? 'bg-gold-400 text-slate-950 border-gold-500'
                              : prog.isOnTrack
                              ? 'bg-finance-100 text-finance-700 border-finance-200'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isFull ? 'Tercapai' : `${prog.progressPercent}%`}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-cream-200 dark:bg-slate-800 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-gold-500'
                            : prog.isOnTrack
                            ? 'bg-finance-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${prog.progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Target: {formatRupiah(item.target_amount)}</span>
                      {!isFull && (
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Sisa: {formatRupiah(prog.remainingAmount)}
                        </span>
                      )}
                    </div>

                    {!isFull && prog.monthlyTarget > 0 && (
                      <div className="pt-1 border-t border-finance-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-finance-700 dark:text-finance-300">
                          Saran: {formatRupiah(prog.monthlyTarget)}/bln
                        </span>
                        {item.deadline_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Sisa {prog.remainingMonths} bln
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* When Achieved: offer Tarik Dana or Buat Target Baru */}
                  {isFull && (
                    <div className="pt-2 border-t border-gold-200 flex items-center gap-2">
                      {onOpenSavingsModal && (
                        <button
                          type="button"
                          onClick={() => onOpenSavingsModal(item.id, 'withdraw')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-white border border-gold-300 hover:bg-gold-100 text-slate-800 text-[11px] font-bold"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-gold-600" />
                          Tarik Dananya
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenTargetModal(null)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-[11px] font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Target Baru
                      </button>
                    </div>
                  )}

                  {!isFull && !prog.isOnTrack && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Perlu tambahan setoran agar tepat waktu</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
