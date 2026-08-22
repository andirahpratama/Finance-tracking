import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Check, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category, TransactionType } from '../../types';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../lib/defaultData';
import { CategoryIcon } from '../ui/CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, deleteCategory, updateCategory } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [icon, setIcon] = useState<string>('Wallet');
  const [color, setColor] = useState<string>('#10B981');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const currentCategories = categories.filter((c) => c.type === activeTab);

  const startAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setIcon(activeTab === 'income' ? 'Wallet' : 'ShoppingCart');
    setColor(activeTab === 'income' ? '#10B981' : '#EF4444');
    setErrorMsg('');
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setIsAdding(false);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kategori tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingId) {
        const res = await updateCategory(editingId, {
          name: name.trim(),
          icon,
          color,
        });
        if (res.error) throw new Error(res.error);
        setEditingId(null);
      } else {
        const res = await addCategory({
          name: name.trim(),
          type: activeTab,
          icon,
          color,
          is_default: false,
        });
        if (res.error) throw new Error(res.error);
        setIsAdding(false);
      }
      setName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Kelola Kategori Keuangan
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Tab Selector */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('expense');
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'expense'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Kategori Pengeluaran
              </button>
              <button
                onClick={() => {
                  setActiveTab('income');
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'income'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Kategori Pemasukan
              </button>
            </div>

            {/* Add New or Edit Form */}
            {(isAdding || editingId) && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSave}
                className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Tutup
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-500 font-medium">⚠️ {errorMsg}</p>
                )}

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Misal: Bonus, Tabungan, Listrik, Hiburan..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1.5">Pilih Ikon</label>
                  <div className="grid grid-cols-8 gap-1.5 max-h-24 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setIcon(ic.name)}
                        title={ic.label}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                          icon === ic.name
                            ? 'bg-emerald-500 text-white'
                            : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <CategoryIcon name={ic.name} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1.5">Pilih Warna</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                          color === c ? 'ring-2 ring-emerald-500 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {color === c && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* List of Existing Categories */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Daftar Kategori ({currentCategories.length})
                </span>
                {!isAdding && !editingId && (
                  <button
                    onClick={startAddNew}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baru
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {currentCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="p-2 rounded-lg text-white flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs block truncate">
                          {cat.name}
                        </span>
                        {cat.is_default && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Bawaan Sistem</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        title="Edit kategori"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus kategori "${cat.name}"?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        title="Hapus kategori"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
