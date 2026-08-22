import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownRight, ArrowUpRight, Calendar, FileText, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatRupiah, getTodayDateInput, parseRupiahInput } from '../../lib/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
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
  const { categories, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateInput());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountRaw(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.category_id);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
    } else {
      setType(initialType);
      setAmountRaw('');
      setDate(getTodayDateInput());
      setNotes('');
      // Set default category if available
      const filtered = categories.filter((c) => c.type === initialType);
      if (filtered.length > 0) {
        setCategoryId(filtered[0].id);
      }
    }
    setErrorMsg('');
  }, [editingTransaction, initialType, isOpen, categories]);

  // When type changes, ensure valid category is selected
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const filtered = categories.filter((c) => c.type === newType);
    if (filtered.length > 0) {
      setCategoryId(filtered[0].id);
    } else {
      setCategoryId('');
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

    if (!categoryId) {
      setErrorMsg('Silakan pilih kategori transaksi');
      return;
    }

    if (!date) {
      setErrorMsg('Silakan pilih tanggal transaksi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingTransaction) {
        const res = await updateTransaction(editingTransaction.id, {
          type,
          amount: numericAmount,
          category_id: categoryId,
          date,
          notes: notes.trim(),
        });
        if (res.error) throw new Error(res.error);
      } else {
        const res = await addTransaction({
          type,
          amount: numericAmount,
          category_id: categoryId,
          date,
          notes: notes.trim(),
        });
        if (res.error) throw new Error(res.error);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Pemasukan
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-bold text-xl placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                    autoFocus
                  />
                </div>

                {/* Quick Amount Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmountRaw(q.toString())}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      +{formatRupiah(q).replace(',00', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Kategori {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </label>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCategoryManager();
                      }}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Kelola / Tambah Kategori
                    </button>
                  )}
                </div>

                {availableCategories.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                    Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}.
                  </div>
                ) : (
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
                              ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white shadow-md'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
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
                )}
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                    placeholder="Contoh: Belanja mingguan di pasar, gaji bulanan, dsb."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-lg transition-all ${
                    type === 'expense'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? 'Menyimpan...' : editingTransaction ? 'Simpan Perubahan' : 'Catat Sekarang'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
