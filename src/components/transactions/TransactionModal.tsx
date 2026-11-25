import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  FileText,
  Plus,
  ArrowLeftRight,
  Split,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  Transaction,
  TransactionType,
  SavingsActionType,
  TransferNodeRef,
} from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatRupiah, getTodayDateInput, parseRupiahInput } from '../../lib/formatters';

export type InputModeType = 'expense' | 'income' | 'savings';
type TransferSubMode = 'savings_quick' | 'pos_transfer';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType | 'savings';
  editingTransaction?: Transaction | null;
  onOpenCategoryManager?: () => void;
  initialDate?: string;
  initialSavingsTargetId?: string;
  initialSavingsAction?: SavingsActionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction,
  onOpenCategoryManager,
  initialDate,
  initialSavingsTargetId,
  initialSavingsAction,
}) => {
  const {
    categories,
    savingsTargets,
    currentMonthBudgetStatus,
    addTransaction,
    updateTransaction,
    recordSavingsTransaction,
    recordSplitSavingsDeposit,
    recordTransfer,
    appCurrency,
  } = useFinance();

  const [inputMode, setInputMode] = useState<InputModeType>(initialType as InputModeType);
  const [transferSubMode, setTransferSubMode] = useState<TransferSubMode>('savings_quick');
  const [savingsAction, setSavingsAction] = useState<SavingsActionType>('deposit');
  const [selectedSavingsTargetId, setSelectedSavingsTargetId] = useState<string>('');

  // Multi-target split deposit state
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});

  // General pos-to-pos transfer state
  const [fromNodeKey, setFromNodeKey] = useState<string>('main_wallet:main_wallet');
  const [toNodeKey, setToNodeKey] = useState<string>('');

  const [amountRaw, setAmountRaw] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(initialDate || getTodayDateInput());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Single-path savings rule: exclude 'Tabungan' category from Expense form
  const availableCategories = useMemo(() => {
    const targetType = inputMode === 'income' ? 'income' : 'expense';
    return categories.filter((c) => {
      if (c.type !== targetType) return false;
      if (targetType === 'expense' && c.name.trim().toLowerCase() === 'tabungan') {
        return false;
      }
      return true;
    });
  }, [categories, inputMode]);

  // All transfer nodes: Dompet Utama, Budget Posts, Savings Targets
  const transferNodes: { key: string; ref: TransferNodeRef; group: string }[] = useMemo(() => {
    const nodes: { key: string; ref: TransferNodeRef; group: string }[] = [
      {
        key: 'main_wallet:main_wallet',
        ref: { type: 'main_wallet', id: 'main_wallet', label: 'Dompet Utama' },
        group: 'Kas Utama',
      },
    ];

    if (currentMonthBudgetStatus.mode === 'simple') {
      nodes.push({
        key: 'budget_post:simple-budget',
        ref: { type: 'budget_post', id: 'simple-budget', label: 'Budget Bulanan' },
        group: 'Pos Budgeting',
      });
    } else {
      (currentMonthBudgetStatus.posts || []).forEach((p) => {
        nodes.push({
          key: `budget_post:${p.post.id}`,
          ref: { type: 'budget_post', id: p.post.id, label: p.post.name },
          group: 'Pos Budgeting',
        });
      });
    }

    savingsTargets.forEach((s) => {
      nodes.push({
        key: `savings_target:${s.id}`,
        ref: { type: 'savings_target', id: s.id, label: s.name },
        group: 'Pos Tabungan',
      });
    });

    return nodes;
  }, [currentMonthBudgetStatus.mode, currentMonthBudgetStatus.posts, savingsTargets]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setInputMode(editingTransaction.type);
      setAmountRaw(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.category_id);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setIsSplitMode(false);
    } else {
      setInputMode(initialType as InputModeType);
      setTransferSubMode('savings_quick');
      setSavingsAction(initialSavingsAction || 'deposit');
      setIsSplitMode(false);
      setSplitAmounts({});
      setAmountRaw('');
      setDate(initialDate || getTodayDateInput());
      setNotes('');

      if (initialType === 'savings') {
        setSelectedSavingsTargetId(initialSavingsTargetId || savingsTargets[0]?.id || '');
      } else {
        const targetType = initialType === 'income' ? 'income' : 'expense';
        const filtered = categories.filter(
          (c) =>
            c.type === targetType &&
            !(targetType === 'expense' && c.name.trim().toLowerCase() === 'tabungan')
        );
        setCategoryId(filtered[0]?.id || '');
      }

      setFromNodeKey(transferNodes[0]?.key || 'main_wallet:main_wallet');
      setToNodeKey(transferNodes[1]?.key || transferNodes[0]?.key || '');
    }
    setErrorMsg('');
  }, [
    editingTransaction,
    initialType,
    isOpen,
    initialDate,
    initialSavingsTargetId,
    initialSavingsAction,
    categories,
    savingsTargets,
    transferNodes,
  ]);

  const handleInputModeChange = (newMode: InputModeType) => {
    setInputMode(newMode);
    setErrorMsg('');
    if (newMode !== 'savings') {
      const filtered = categories.filter(
        (c) =>
          c.type === newMode &&
          !(newMode === 'expense' && c.name.trim().toLowerCase() === 'tabungan')
      );
      setCategoryId(filtered[0]?.id || '');
    } else {
      setSelectedSavingsTargetId(savingsTargets[0]?.id || '');
    }
  };

  const splitTotal = useMemo(() => {
    return Object.values(splitAmounts).reduce((sum, raw) => sum + parseRupiahInput(raw), 0);
  }, [splitAmounts]);

  const isSavingsQuickMissingTarget =
    inputMode === 'savings' &&
    transferSubMode === 'savings_quick' &&
    savingsTargets.length === 0;

  const getNotesPlaceholder = (): string => {
    if (inputMode === 'income') {
      return 'Contoh: Gaji bulanan, bonus proyek, atau hasil usaha';
    }
    if (inputMode === 'expense') {
      return 'Contoh: Belanja sayur, bayar listrik, atau jajan anak';
    }
    if (transferSubMode === 'pos_transfer') {
      return 'Contoh: Pindah sisa Biaya Bulanan ke Nabung';
    }
    if (savingsAction === 'withdraw') {
      return 'Contoh: Tarik dana untuk kebutuhan mendesak';
    }
    return 'Contoh: Setor rutin bulanan ke Dana Darurat';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date) {
      setErrorMsg('Silakan pilih tanggal transaksi');
      return;
    }

    setIsSubmitting(true);

    try {
      if (inputMode === 'savings') {
        if (transferSubMode === 'pos_transfer') {
          const numericAmount = parseRupiahInput(amountRaw);
          if (numericAmount <= 0) {
            setErrorMsg(`Nominal transfer harus lebih dari ${appCurrency} 0`);
            setIsSubmitting(false);
            return;
          }
          const fromObj = transferNodes.find((n) => n.key === fromNodeKey)?.ref;
          const toObj = transferNodes.find((n) => n.key === toNodeKey)?.ref;
          if (!fromObj || !toObj) {
            setErrorMsg('Pilih pos asal dan pos tujuan');
            setIsSubmitting(false);
            return;
          }
          const res = await recordTransfer({
            from: fromObj,
            to: toObj,
            amount: numericAmount,
            date,
            notes: notes.trim(),
          });
          if (res.error) throw new Error(res.error);
        } else if (isSplitMode && savingsAction === 'deposit') {
          if (savingsTargets.length === 0) {
            setErrorMsg('Belum ada pos tabungan aktif.');
            setIsSubmitting(false);
            return;
          }
          const allocations = Object.entries(splitAmounts)
            .map(([targetId, raw]) => ({ targetId, amount: parseRupiahInput(raw) }))
            .filter((a) => a.amount > 0);
          if (allocations.length === 0) {
            setErrorMsg('Isi minimal satu nominal untuk pos tabungan tujuan');
            setIsSubmitting(false);
            return;
          }
          const res = await recordSplitSavingsDeposit(allocations, date, notes.trim());
          if (res.error) throw new Error(res.error);
        } else {
          const numericAmount = parseRupiahInput(amountRaw);
          if (numericAmount <= 0) {
            setErrorMsg(`Jumlah nominal harus lebih dari ${appCurrency} 0`);
            setIsSubmitting(false);
            return;
          }
          if (!selectedSavingsTargetId) {
            setErrorMsg('Belum ada pos tabungan aktif — buat dulu di halaman Tabungan');
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
        }
      } else {
        const numericAmount = parseRupiahInput(amountRaw);
        if (numericAmount <= 0) {
          setErrorMsg(`Jumlah nominal harus lebih dari ${appCurrency} 0`);
          setIsSubmitting(false);
          return;
        }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-finance-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi & Transfer Kas'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Input Mode Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-cream-100 dark:bg-slate-950/70 border border-finance-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleInputModeChange('expense')}
                  className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputMode === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Pengeluaran
                </button>

                <button
                  type="button"
                  onClick={() => handleInputModeChange('income')}
                  className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputMode === 'income'
                      ? 'bg-finance-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Pemasukan
                </button>

                <button
                  type="button"
                  onClick={() => handleInputModeChange('savings')}
                  className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputMode === 'savings'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Transfer Kas
                </button>
              </div>

              {/* ── TRANSFER KAS / TABUNGAN FIELDS ── */}
              {inputMode === 'savings' ? (
                <div className="space-y-4 p-4 rounded-2xl bg-finance-50/60 dark:bg-slate-950/50 border border-finance-200 dark:border-slate-800">
                  {/* Sub-mode Switcher */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTransferSubMode('savings_quick')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold ${
                        transferSubMode === 'savings_quick'
                          ? 'bg-finance-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Setor / Tarik Tabungan
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferSubMode('pos_transfer')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold ${
                        transferSubMode === 'pos_transfer'
                          ? 'bg-finance-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Transfer Antar Pos
                    </button>
                  </div>

                  {transferSubMode === 'savings_quick' ? (
                    <>
                      {/* Action: Setor vs Tarik */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSavingsAction('deposit')}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            savingsAction === 'deposit'
                              ? 'bg-finance-600 text-white border-finance-600'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-finance-200 dark:border-slate-800'
                          }`}
                        >
                          Setor ke Tabungan
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSavingsAction('withdraw');
                            setIsSplitMode(false);
                          }}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            savingsAction === 'withdraw'
                              ? 'bg-gold-500 text-slate-950 border-gold-500'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-finance-200 dark:border-slate-800'
                          }`}
                        >
                          Tarik dari Tabungan
                        </button>
                      </div>

                      {/* Target Selection or Empty Explanation */}
                      {savingsTargets.length === 0 ? (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gold-300 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                          Belum ada pos aktif — buat dulu di halaman Tabungan.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {savingsAction === 'deposit' && savingsTargets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setIsSplitMode(!isSplitMode)}
                              className="flex items-center gap-1.5 text-xs font-bold text-finance-700 dark:text-finance-300 hover:underline"
                            >
                              <Split className="w-3.5 h-3.5" />
                              {isSplitMode
                                ? 'Kembali ke pilih 1 target saja'
                                : 'Bagi setoran ke beberapa target sekaligus'}
                            </button>
                          )}

                          {isSplitMode && savingsAction === 'deposit' ? (
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                                Isi nominal per pos target yang ingin disetor:
                              </span>
                              {savingsTargets.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {t.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Saldo: {formatRupiah(t.current_amount || 0)}
                                    </p>
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      splitAmounts[t.id]
                                        ? Number(splitAmounts[t.id]).toLocaleString('id-ID')
                                        : ''
                                    }
                                    onChange={(e) =>
                                      setSplitAmounts((prev) => ({
                                        ...prev,
                                        [t.id]: e.target.value.replace(/[^\d]/g, ''),
                                      }))
                                    }
                                    placeholder="0"
                                    className="w-32 px-2.5 py-2 rounded-lg bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-700 text-xs font-extrabold text-right"
                                  />
                                </div>
                              ))}
                              <div className="text-right text-xs font-black text-finance-700 dark:text-finance-300">
                                Total Setoran: {formatRupiah(splitTotal)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Pilih Pos Target Tabungan
                              </label>
                              <select
                                value={selectedSavingsTargetId}
                                onChange={(e) => setSelectedSavingsTargetId(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                              >
                                {savingsTargets.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} (Saldo: {formatRupiah(t.current_amount || 0)} / Target:{' '}
                                    {formatRupiah(t.target_amount)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Transfer Antar Pos (Dari Pos -> Ke Pos) */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Dari Pos
                        </label>
                        <select
                          value={fromNodeKey}
                          onChange={(e) => setFromNodeKey(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                        >
                          {transferNodes.map((n) => (
                            <option key={n.key} value={n.key}>
                              [{n.group}] {n.ref.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Ke Pos
                        </label>
                        <select
                          value={toNodeKey}
                          onChange={(e) => setToNodeKey(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                        >
                          {transferNodes.map((n) => (
                            <option key={n.key} value={n.key}>
                              [{n.group}] {n.ref.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Transfer Kas memindahkan dana antar pos tanpa dihitung sebagai pemasukan atau pengeluaran, dan tanpa label kategori.
                      </p>
                    </div>
                  )}
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
                        className="text-[11px] text-finance-600 dark:text-finance-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        Kelola Kategori
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
                              ? 'bg-finance-50 dark:bg-slate-800 border-finance-500 ring-1 ring-finance-500 text-slate-900 dark:text-white shadow-xs'
                              : 'bg-cream-50 dark:bg-slate-950/60 border-finance-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
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

              {/* Amount Input (hidden when split mode active since each target has its own input) */}
              {!(inputMode === 'savings' && transferSubMode === 'savings_quick' && isSplitMode && savingsAction === 'deposit') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Nominal ({appCurrency})
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                      {appCurrency}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amountRaw ? Number(amountRaw).toLocaleString('id-ID') : ''}
                      onChange={(e) => setAmountRaw(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="0"
                      className="w-full pl-16 pr-4 py-3 bg-cream-50 dark:bg-slate-950/80 border border-finance-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold text-xl focus:outline-none focus:border-finance-500"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              )}

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
                    className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-slate-950/80 border border-finance-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-finance-500"
                    required
                  />
                </div>
              </div>

              {/* Notes Input (Context-appropriate placeholder per tab) */}
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
                    placeholder={getNotesPlaceholder()}
                    className="w-full pl-10 pr-4 py-2.5 bg-cream-50 dark:bg-slate-950/80 border border-finance-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-finance-500 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isSavingsQuickMissingTarget ||
                    (isSplitMode && savingsAction === 'deposit' && splitTotal <= 0)
                  }
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all ${
                    inputMode === 'expense'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : inputMode === 'income'
                      ? 'bg-finance-600 hover:bg-finance-700'
                      : 'bg-teal-600 hover:bg-teal-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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
