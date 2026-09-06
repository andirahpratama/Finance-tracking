import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownRight, ArrowUpRight, Calendar, FileText, Plus, Target } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType, SavingsActionType } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatRupiah, getTodayDateInput, parseRupiahInput } from '../../lib/formatters';

export type InputModeType = 'expense' | 'income' | 'savings';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType | 'savings';
  editingTransaction?: Transaction | null;
  onOpenCategoryManager?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction,
  onOpenCategoryManager,
}) => {
  const { categories, savingsTargets, addTransaction, updateTransaction, recordSavingsTransaction } = useFinance();

  const [inputMode, setInputMode] = useState<InputModeType>(initialType as InputModeType);
  const [savingsAction, setSavingsAction] = useState<SavingsActionType>('deposit');
  const [selectedSavingsTargetId, setSelectedSavingsTargetId] = useState<string>('');

  const [amountRaw, setAmountRaw] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateInput());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setInputMode(editingTransaction.type);
      setAmountRaw(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.category_id);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
    } else {
      setInputMode(initialType as InputModeType);
      setAmountRaw('');
      setDate(getTodayDateInput());
      setNotes('');

      if (initialType === 'savings') {
        if (savingsTargets.length > 0) {
          setSelectedSavingsTargetId(savingsTargets[0].id);
        }
      } else {
        const filtered = categories.filter((c) => c.type === initialType);
        if (filtered.length > 0) {
          setCategoryId(filtered[0].id);
        }
      }
    }
    setErrorMsg('');
  }, [editingTransaction, initialType, isOpen, categories, savingsTargets]);

  useEffect(() => {
    if (savingsTargets.length > 0 && !selectedSavingsTargetId) {
      setSelectedSavingsTargetId(savingsTargets[0].id);
    }
  }, [savingsTargets, selectedSavingsTargetId]);

  const handleInputModeChange = (newMode: InputModeType) => {
    setInputMode(newMode);
    setErrorMsg('');
    if (newMode !== 'savings') {
      const filtered = categories.filter((c) => c.type === newMode);
      if (filtered.length > 0) {
        setCategoryId(filtered[0].id);
      } else {
        setCategoryId('');
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    setAmountRaw(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRupiahInput(amountRaw);

    if (numericAmount <= 0) {
      setErrorMsg('Jumlah nominal harus lebih dari Rp 0');
      return;
    }

    if (!date) {
      setErrorMsg('Silakan pilih tanggal transaksi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (inputMode === 'savings') {
        if (!selectedSavingsTargetId) {
          setErrorMsg('Silakan pilih pos tabungan');
          setIsSubmitting(false);
          return;
        }
        const res = await recordSavingsTransaction(
          selectedSavingsTargetId,
          numericAmount,
          savingsAction,
          date,
          notes.trim()
        );
        if (res.error) throw new Error(res.error);
      } else {
        if (!categoryId) {
          setErrorMsg('Silakan pilih kategori transaksi');
          setIsSubmitting(false);
          return;
        }

        if (editingTransaction) {
          const res = await updateTransaction(editingTransaction.id, {
            type: inputMode,
            amount: numericAmount,
            category_id: categoryId,
            date,
            notes: notes.trim(),
          });
          if (res.error) throw new Error(res.error);
        } else {
          const res = await addTransaction({
            type: inputMode,
            amount: numericAmount,
            category_id: categoryId,
            date,
            notes: notes.trim(),
          });
          if (res.error) throw new Error(res.error);
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = categories.filter((c) => c.type === (inputMode === 'income' ? 'income' : 'expense'));
  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto transition-colors duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingTransaction ? 'Edit Transaksi' : 'Menu Input Data Keuangan'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Input Mode Switcher (Pengeluaran, Pemasukan, Tabungan) */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleInputModeChange('expense')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'expense'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Pengeluaran
                </button>

                <button
                  type="button"
                  onClick={() => handleInputModeChange('income')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'income'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Pemasukan
                </button>

                <button
                  type="button"
                  onClick={() => handleInputModeChange('savings')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'savings'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  Tabungan
                </button>
              </div>

              {/* ── TABUNGAN SPECIFIC FIELDS ── */}
              {inputMode === 'savings' ? (
                <div className="space-y-4 p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60">
                  {/* Action: Setor vs Tarik */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Jenis Transaksi Tabungan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSavingsAction('deposit')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          savingsAction === 'deposit'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Setor ke Tabungan (+ Tabungan)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSavingsAction('withdraw')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          savingsAction === 'withdraw'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Tarik dari Tabungan (- Tabungan)
                      </button>
                    </div>
                  </div>

                  {/* Target Account Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Pilih Pos Target Tabungan
                    </label>
                    <select
                      value={selectedSavingsTargetId}
                      onChange={(e) => setSelectedSavingsTargetId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {savingsTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Terkumpul: {formatRupiah(t.current_amount)} / Target: {formatRupiah(t.target_amount)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Category Selector for Income/Expense */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Kategori {inputMode === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </label>
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCategoryManager();
                        }}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        Kelola / Tambah Kategori
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableCategories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-slate-900 dark:text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div
                            className="p-1.5 rounded-lg text-white flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Nominal (Rp)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    Rp
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountRaw ? formatRupiah(Number(amountRaw)).replace('Rp', '').trim() : ''}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold text-xl placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmountRaw(q.toString())}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-transparent"
                    >
                      +{formatRupiah(q).replace(',00', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Tanggal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Catatan / Keterangan (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Setor tabungan liburan keluarga akhir tahun"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-lg transition-all ${
                    inputMode === 'expense'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20'
                      : inputMode === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                      : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/20'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Catat Sekarang'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
