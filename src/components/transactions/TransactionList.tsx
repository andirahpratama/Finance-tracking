import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Transaction } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatDateIndo, formatRupiah } from '../../lib/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeleteId(null);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Calendar className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold text-white">Tidak ada transaksi ditemukan</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          Tidak ada data transaksi yang cocok dengan filter yang Anda pilih saat ini.
        </p>
        <button
          onClick={onAddNew}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
        >
          + Catat Transaksi Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
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
              className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-sm"
            >
              {/* Left Column: Icon & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md"
                  style={{ backgroundColor: t.category_color || '#64748B' }}
                >
                  <CategoryIcon name={t.category_icon || 'Wallet'} className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm truncate">
                      {t.category_name || 'Lainnya'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{formatDateIndo(t.date)}</span>
                    {t.notes && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[140px] sm:max-w-xs text-slate-300">
                          {t.notes}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span
                    className={`font-extrabold text-sm sm:text-base tracking-tight flex items-center justify-end gap-0.5 ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatRupiah(t.amount)}
                  </span>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(t)}
                    title="Edit transaksi"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteId(t.id)}
                    title="Hapus transaksi"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Hapus Transaksi?</h3>
              <p className="text-xs text-slate-400 mb-5">
                Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
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
