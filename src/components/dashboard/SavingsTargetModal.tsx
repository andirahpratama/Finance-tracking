import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Target,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  GraduationCap,
  Palmtree,
  PiggyBank,
  Check,
  Building2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';
import { calculateSavingsProgress } from '../../lib/savingsUtils';
import { INDONESIAN_BANKS } from '../../lib/defaultData';
import { SavingsTargetItem } from '../../types';
import { BankLogo } from '../ui/BankLogo';

interface SavingsTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<SavingsTargetItem> | null;
}

const getPresetIcon = (iconName?: string) => {
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
    emergencyFundPref,
    appCurrency,
  } = useFinance();

  const currentYear = new Date().getFullYear();
  const defaultDeadline = `${currentYear + 1}-12`;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('BCA');
  const [initialBalanceRaw, setInitialBalanceRaw] = useState<string>(''); // Boleh kosong!
  const [targetRaw, setTargetRaw] = useState<string>('25000000');
  const [deadlineDate, setDeadlineDate] = useState<string>(defaultDeadline);
  const [autoCalculateMonthly, setAutoCalculateMonthly] = useState<boolean>(true);
  const [icon, setIcon] = useState<string>('Target');
  const [color, setColor] = useState<string>('#4a8c67');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const emergencySuggestedTarget = emergencyFundPref?.targetAmount || 25000000;

  const presetChoices = useMemo(
    () => [
      {
        name: 'Tabungan Dana Darurat',
        icon: 'ShieldAlert',
        color: '#4a8c67',
        target: emergencySuggestedTarget,
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
        color: '#0d9488',
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
    ],
    [currentYear, emergencySuggestedTarget]
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setSelectedPresetName(null);

      if (initialData) {
        setEditingId(initialData.id || null);
        setName(initialData.name || '');
        setBankName(initialData.bank_name || 'BCA');
        setInitialBalanceRaw(
          initialData.initial_balance && initialData.initial_balance > 0
            ? String(initialData.initial_balance)
            : ''
        );
        setTargetRaw((initialData.target_amount || emergencySuggestedTarget).toString());
        setDeadlineDate(initialData.deadline_date || defaultDeadline);
        setAutoCalculateMonthly(initialData.auto_calculate_monthly ?? true);
        setIcon(initialData.category_icon || 'Target');
        setColor(initialData.color || '#4a8c67');
      } else {
        setEditingId(null);
        setName('');
        setBankName('BCA');
        setInitialBalanceRaw('');
        setTargetRaw(String(emergencySuggestedTarget));
        setDeadlineDate(defaultDeadline);
        setAutoCalculateMonthly(true);
        setIcon('Target');
        setColor('#4a8c67');
      }
    }
  }, [isOpen, initialData, defaultDeadline, emergencySuggestedTarget]);

  const editingItem = editingId ? savingsTargets.find((s) => s.id === editingId) : null;

  const liveCalculation = useMemo(() => {
    const targetAmount = parseRupiahInput(targetRaw);
    const initBal = parseRupiahInput(initialBalanceRaw);
    let previewCurrent = initBal;
    if (editingItem) {
      const oldInit = Number(editingItem.initial_balance) || 0;
      const netMoves = Math.max(0, (Number(editingItem.current_amount) || 0) - oldInit);
      previewCurrent = initBal + netMoves;
    }

    const mockItem: SavingsTargetItem = {
      id: 'mock',
      name: name || 'Preview',
      target_amount: targetAmount,
      current_amount: previewCurrent,
      initial_balance: initBal,
      deadline_date: deadlineDate,
      auto_calculate_monthly: autoCalculateMonthly,
    };
    return calculateSavingsProgress(mockItem);
  }, [targetRaw, initialBalanceRaw, deadlineDate, autoCalculateMonthly, name, editingItem]);

  const handleSelectPreset = (preset: typeof presetChoices[0]) => {
    setSelectedPresetName(preset.name);
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

    const initBalance = parseRupiahInput(initialBalanceRaw); // 0 jika dibiarkan kosong

    if (editingId) {
      await updateSavingsTargetItem(editingId, {
        name: name.trim(),
        bank_name: bankName,
        initial_balance: initBalance,
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
        bank_name: bankName,
        initial_balance: initBalance,
        current_amount: initBalance,
        target_amount: targetAmount,
        deadline_date: deadlineDate,
        auto_calculate_monthly: autoCalculateMonthly,
        category_icon: icon,
        color,
      });
      setSuccessMsg('Pos tabungan baru berhasil dibuat!');
    }

    setName('');
    setInitialBalanceRaw('');
    setTargetRaw(String(emergencySuggestedTarget));
    setDeadlineDate(defaultDeadline);
    setEditingId(null);
    setSelectedPresetName(null);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleStartEdit = (item: SavingsTargetItem) => {
    setEditingId(item.id);
    setSelectedPresetName(null);
    setName(item.name);
    setBankName(item.bank_name || 'BCA');
    setInitialBalanceRaw(
      item.initial_balance && item.initial_balance > 0 ? String(item.initial_balance) : ''
    );
    setTargetRaw(item.target_amount.toString());
    setDeadlineDate(item.deadline_date || defaultDeadline);
    setAutoCalculateMonthly(item.auto_calculate_monthly ?? true);
    setIcon(item.category_icon || 'Target');
    setColor(item.color || '#4a8c67');
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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-finance-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-finance-100 dark:border-slate-800/80 bg-cream-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-finance-600 text-white shadow-md">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Kelola Pos & Target Tabungan
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih bank penyimpan, saldo awal opsional, & target tabungan
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
              {/* Presets Grid (HANYA preset terpilih yang menampilkan centang!) */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Preset Cepat Pos Tabungan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetChoices.map((p) => {
                    const PresetIcon = getPresetIcon(p.icon);
                    const isSelected = selectedPresetName === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`relative flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'border-finance-500 bg-finance-50/70 dark:bg-finance-950/30 ring-1 ring-finance-500'
                            : 'border-finance-100 dark:border-slate-800 bg-cream-50 dark:bg-slate-950/60 hover:border-finance-400'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-finance-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: p.color }}
                        >
                          <PresetIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formatRupiah(p.target)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Item */}
              <form
                onSubmit={handleSaveItem}
                className="p-4 sm:p-5 rounded-2xl bg-cream-50 dark:bg-slate-950/70 border border-finance-200/70 dark:border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingId ? 'Edit Pos Tabungan' : 'Form Pos Tabungan Baru'}
                  </h3>
                  {editingId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-100 text-amber-800 font-bold border border-gold-300">
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
                    onChange={(e) => {
                      setName(e.target.value);
                      setSelectedPresetName(null);
                    }}
                    placeholder="Contoh: Dana Darurat, Pendidikan Anak, Liburan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-finance-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                  />
                </div>

                {/* Bank Penyimpan (Tanpa Nomor Rekening) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-finance-600" />
                    Bank Penyimpan (tanpa nomor rekening)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <BankLogo bankName={bankName} size="md" />
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-finance-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                    >
                      {INDONESIAN_BANKS.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Saldo Awal (Opsional — boleh kosong) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Saldo Awal (Opsional — boleh kosong)
                    </label>
                    <span className="text-[10px] text-slate-400">Bisa diisi belakangan</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {appCurrency}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={initialBalanceRaw ? Number(initialBalanceRaw).toLocaleString('id-ID') : ''}
                      onChange={(e) => setInitialBalanceRaw(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="Kosongkan jika mulai dari 0"
                      className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-finance-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saldo pos dihitung: Saldo Awal + Setor − Tarik (tidak mengubah riwayat transaksi lama).
                  </p>
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
                        inputMode="numeric"
                        value={targetRaw ? Number(targetRaw).toLocaleString('id-ID') : ''}
                        onChange={(e) => setTargetRaw(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="25.000.000"
                        className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-finance-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tenggat Waktu (Deadline)
                    </label>
                    <input
                      type="month"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-finance-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                    />
                  </div>
                </div>

                {/* Smart Calculation Insight Banner: (target - saldo terkumpul) / sisa bulan */}
                <div className="p-3.5 rounded-xl bg-finance-50 dark:bg-finance-950/30 border border-finance-200 text-finance-800 dark:text-finance-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-finance-600" />
                    <span>Rekomendasi Setoran Otomatis:</span>
                  </div>
                  {liveCalculation.isAchieved ? (
                    <p className="text-xs font-extrabold text-finance-700">
                      Target sudah tercapai dengan saldo saat ini!
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-extrabold text-finance-700 dark:text-finance-300">
                        {formatRupiah(liveCalculation.monthlyTarget)} / bulan
                      </p>
                      <p className="text-[10px] text-finance-700/80 dark:text-finance-300/70">
                        Sisa kebutuhan {formatRupiah(liveCalculation.remainingAmount)} dibagi {liveCalculation.remainingMonths} bulan hingga {deadlineDate}.
                      </p>
                    </>
                  )}
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Warna Kartu Pos
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      '#4a8c67',
                      '#0d9488',
                      '#3b82f6',
                      '#8b5cf6',
                      '#ec4899',
                      '#d49a22',
                      '#ef4444',
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-xl transition-all ${
                          color === c ? 'scale-110 ring-2 ring-offset-2 ring-finance-500' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-xs text-rose-500 font-bold p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 text-xs text-finance-700 font-bold p-2.5 rounded-xl bg-finance-50 border border-finance-200">
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
                        setInitialBalanceRaw('');
                        setTargetRaw(String(emergencySuggestedTarget));
                        setDeadlineDate(defaultDeadline);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {editingId ? 'Simpan Perubahan' : 'Simpan Pos Tabungan'}
                  </button>
                </div>
              </form>

              {/* List of Existing Savings Targets */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Daftar Pos Tabungan Aktif ({savingsTargets.length})
                </span>

                {savingsTargets.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-finance-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Belum ada pos tabungan. Buat sekarang atau pilih preset di atas!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savingsTargets.map((item) => {
                      const prog = calculateSavingsProgress(item);
                      const ItemIcon = getPresetIcon(item.category_icon);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-finance-100 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: item.color || '#4a8c67' }}
                            >
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.name}
                                </p>
                                {item.bank_name && <BankLogo bankName={item.bank_name} size="sm" />}
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${
                                    prog.isAchieved
                                      ? 'bg-finance-100 text-finance-700 border-finance-300'
                                      : prog.isOnTrack
                                      ? 'bg-finance-50 text-finance-700 border-finance-200'
                                      : 'bg-gold-50 text-amber-700 border-gold-300'
                                  }`}
                                >
                                  {prog.isAchieved ? 'Tercapai' : prog.isOnTrack ? 'On Track' : 'Perlu Setoran'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Terkumpul: <strong className="text-finance-700 dark:text-finance-300">{formatRupiah(item.current_amount)}</strong> dari{' '}
                                <strong>{formatRupiah(item.target_amount)}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-finance-600 hover:bg-finance-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavingsTargetItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
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
