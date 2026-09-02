import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Calendar, AlertCircle, BookmarkCheck } from 'lucide-react';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatDateIndo, formatRupiah } from '../../lib/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  openingBalance?: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  openingBalance,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeleteId(null);
  };

  const hasOpeningBalance = openingBalance !== undefined && openingBalance !== 0;

  if (transactions.length === 0 && !hasOpeningBalance) {
    return (
      <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Calendar className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Tidak ada transaksi ditemukan</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
          Tidak ada data transaksi yang cocok dengan filter yang Anda pilih saat ini.
        </p>
        <button
          onClick={onAddNew}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 dark:shadow-emerald-950 transition-all"
        >
          + Catat Transaksi Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Saldo dari Bulan Sebelumnya Banner */}
      {hasOpeningBalance && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 border border-blue-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20 font-bold mt-0.5 sm:mt-0">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  Saldo dari Bulan Sebelumnya
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 font-semibold border border-blue-500/20 shrink-0">
                  Sisa Saldo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Akumulasi sisa / defisit saldo dari bulan-bulan sebelumnya
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-blue-200/40 dark:border-blue-900/30">
            <span
              className={`font-black text-sm sm:text-base tracking-tight ${
                (openingBalance ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {(openingBalance ?? 0) >= 0 ? '+' : ''}
              {formatRupiah(openingBalance ?? 0)}
            </span>
          </div>
        </div>
      )}

      {/* Transaction Items */}
      <AnimatePresence mode="popLayout">
        {transactions.map((t) => {
          const isIncome = t.type === 'income';

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Column: Icon & Details */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md mt-0.5 sm:mt-0"
                  style={{ backgroundColor: t.category_color || '#64748B' }}
                >
                  <CategoryIcon name={t.category_icon || 'Wallet'} className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words">
                      {t.category_name || 'Lainnya'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{formatDateIndo(t.date)}</span>
                    {t.notes && (
                      <span className="text-slate-700 dark:text-slate-300 break-words font-normal">
                        • {t.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60 flex-shrink-0">
                <div className="text-left sm:text-right">
                  <span
                    className={`font-black text-base sm:text-base tracking-tight flex items-center justify-start sm:justify-end gap-0.5 ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatRupiah(t.amount)}
                  </span>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(t)}
                    title="Edit transaksi"
                    className="p-2 sm:p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteId(t.id)}
                    title="Hapus transaksi"
                    className="p-2 sm:p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Hapus Transaksi?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => confirmDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
