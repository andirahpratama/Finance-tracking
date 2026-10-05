import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Trash2, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';
import { calculateSavingsProgress } from '../../lib/savingsUtils';
import { SavingsTargetItem } from '../../types';

interface SavingsTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<SavingsTargetItem> | null;
}

export const SavingsTargetModal: React.FC<SavingsTargetModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const {
    savingsTargets,
    addSavingsTargetItem,
    updateSavingsTargetItem,
    deleteSavingsTargetItem,
    appCurrency,
  } = useFinance();

  const currentYear = new Date().getFullYear();
  const defaultDeadline = `${currentYear + 1}-12`;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [targetRaw, setTargetRaw] = useState<string>('25000000');
  const [deadlineDate, setDeadlineDate] = useState<string>(defaultDeadline);
  const [autoCalculateMonthly, setAutoCalculateMonthly] = useState<boolean>(true);
  const [icon, setIcon] = useState<string>('Target');
  const [color, setColor] = useState<string>('#10b981');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const presetChoices = [
    {
      name: 'Tabungan Dana Darurat',
      icon: 'ShieldAlert',
      color: '#10b981',
      target: 25000000,
      deadline: `${currentYear + 1}-12`,
    },
    {
      name: 'Tabungan Pendidikan Anak',
      icon: 'GraduationCap',
      color: '#3b82f6',
      target: 40000000,
      deadline: `${currentYear + 3}-07`,
    },
    {
      name: 'Tabungan Liburan Keluarga',
      icon: 'Palmtree',
      color: '#06b6d4',
      target: 15000000,
      deadline: `${currentYear}-12`,
    },
    {
      name: 'Tabungan Pensiun & Hari Tua',
      icon: 'PiggyBank',
      color: '#8b5cf6',
      target: 100000000,
      deadline: `${currentYear + 5}-12`,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');

      if (initialData) {
        setEditingId(null);
        setName(initialData.name || '');
        setTargetRaw((initialData.target_amount || 25000000).toString());
        setDeadlineDate(initialData.deadline_date || defaultDeadline);
        setAutoCalculateMonthly(initialData.auto_calculate_monthly ?? true);
        setIcon(initialData.category_icon || 'Target');
        setColor(initialData.color || '#10b981');
      } else {
        setEditingId(null);
        setName('');
        setTargetRaw('25000000');
        setDeadlineDate(defaultDeadline);
        setAutoCalculateMonthly(true);
        setIcon('Target');
        setColor('#10b981');
      }
    }
  }, [isOpen, initialData, defaultDeadline]);

  // Real-time calculation preview of monthly target
  const liveCalculation = useMemo(() => {
    const targetAmount = parseRupiahInput(targetRaw);
    const mockItem: SavingsTargetItem = {
      id: 'mock',
      name: name || 'Preview',
      target_amount: targetAmount,
      current_amount: 0,
      deadline_date: deadlineDate,
      auto_calculate_monthly: autoCalculateMonthly,
    };
    return calculateSavingsProgress(mockItem);
  }, [targetRaw, deadlineDate, autoCalculateMonthly, name]);

  const handleSelectPreset = (preset: typeof presetChoices[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
    setTargetRaw(preset.target.toString());
    setDeadlineDate(preset.deadline);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama pos tabungan wajib diisi');
      return;
    }

    const targetAmount = parseRupiahInput(targetRaw);
    if (targetAmount <= 0) {
      setErrorMsg(`Target dana harus lebih besar dari ${appCurrency} 0`);
      return;
    }

    if (!deadlineDate) {
      setErrorMsg('Tenggat waktu (Bulan & Tahun) wajib dipilih');
      return;
    }

    if (editingId) {
      await updateSavingsTargetItem(editingId, {
        name: name.trim(),
        target_amount: targetAmount,
        deadline_date: deadlineDate,
        auto_calculate_monthly: autoCalculateMonthly,
        category_icon: icon,
        color,
      });
      setSuccessMsg('Pos tabungan berhasil diperbarui!');
    } else {
      await addSavingsTargetItem({
        name: name.trim(),
        target_amount: targetAmount,
        current_amount: 0,
        deadline_date: deadlineDate,
        auto_calculate_monthly: autoCalculateMonthly,
        category_icon: icon,
        color,
      });
      setSuccessMsg('Pos tabungan baru berhasil dibuat!');
    }

    setName('');
    setTargetRaw('25000000');
    setDeadlineDate(defaultDeadline);
    setEditingId(null);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleStartEdit = (item: SavingsTargetItem) => {
    setEditingId(item.id);
    setName(item.name);
    setTargetRaw(item.target_amount.toString());
    setDeadlineDate(item.deadline_date || defaultDeadline);
    setAutoCalculateMonthly(item.auto_calculate_monthly ?? true);
    setIcon(item.category_icon || 'Target');
    setColor(item.color || '#10b981');
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Goal-Based Savings System
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atur target dana, tenggat waktu & kalkulasi setoran bulanan
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Presets Grid */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                  Preset Cepat Pos Tabungan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetChoices.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatRupiah(p.target)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input Item */}
              <form
                onSubmit={handleSaveItem}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingId ? 'Edit Pos Tabungan' : 'Form Pos Tabungan Baru'}
                  </h3>
                  {editingId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                      Mode Edit
                    </span>
                  )}
                </div>

                {/* Nama Pos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Pos Tabungan
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Tabungan Pendidikan S2, Mobil Baru, dll"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Target Amount & Deadline Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Total Target Dana
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {appCurrency}
                      </span>
                      <input
                        type="text"
                        value={targetRaw ? Number(targetRaw).toLocaleString('id-ID') : ''}
                        onChange={(e) => setTargetRaw(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="50.000.000"
                        className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tenggat Waktu (Deadline)
                    </label>
                    <div className="relative">
                      <input
                        type="month"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Smart Calculation Insight Banner */}
                {liveCalculation.monthlyTarget > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Rekomendasi Setoran Otomatis:</span>
                    </div>
                    <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(liveCalculation.monthlyTarget)} / bulan
                    </p>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-300/70">
                      Dengan sisa waktu {liveCalculation.remainingMonths} bulan hingga target {deadlineDate}.
                    </p>
                  </div>
                )}

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Warna Pos Tabungan
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      '#10b981',
                      '#06b6d4',
                      '#3b82f6',
                      '#8b5cf6',
                      '#ec4899',
                      '#f59e0b',
                      '#ef4444',
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-xl transition-all ${
                          color === c ? 'scale-110 ring-2 ring-offset-2 ring-emerald-500' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-xs text-rose-500 font-bold p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setName('');
                        setTargetRaw('25000000');
                        setDeadlineDate(defaultDeadline);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {editingId ? 'Simpan Perubahan' : 'Simpan Pos Tabungan'}
                  </button>
                </div>
              </form>

              {/* List of Existing Savings Targets */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Daftar Pos Tabungan Aktif ({savingsTargets.length})
                </span>

                {savingsTargets.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Belum ada pos tabungan. Buat sekarang atau pilih preset di atas!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savingsTargets.map((item) => {
                      const prog = calculateSavingsProgress(item);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                              style={{ backgroundColor: item.color || '#10b981' }}
                            >
                              ✓
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.name}
                                </p>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${
                                    prog.isAchieved
                                      ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                                      : prog.isOnTrack
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {prog.isAchieved ? 'Tercapai 🎉' : prog.isOnTrack ? 'On Track 🚀' : 'Off Track ⚠️'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Terkumpul: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(item.current_amount)}</strong> dari target{' '}
                                <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formatRupiah(item.target_amount)}</strong>
                              </p>
                              {prog.monthlyTarget > 0 && (
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                                  Target: {formatRupiah(prog.monthlyTarget)}/bln (Sisa {prog.remainingMonths} bln)
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavingsTargetItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                              title="Hapus Pos"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
