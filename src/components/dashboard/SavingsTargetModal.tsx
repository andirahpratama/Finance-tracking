import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Trash2, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';

interface SavingsTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsTargetModal: React.FC<SavingsTargetModalProps> = ({ isOpen, onClose }) => {
  const { savingsTargets, addSavingsTargetItem, updateSavingsTargetItem, deleteSavingsTargetItem } = useFinance();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [targetRaw, setTargetRaw] = useState<string>('');
  const [icon, setIcon] = useState<string>('Palmtree');
  const [color, setColor] = useState<string>('#10b981');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setEditingId(null);
      setName('');
      setTargetRaw('1500000');
    }
  }, [isOpen]);

  const presetChoices = [
    { name: 'Tabungan Liburan', icon: 'Palmtree', color: '#06b6d4', target: 1000000 },
    { name: 'Tabungan Pendidikan', icon: 'GraduationCap', color: '#3b82f6', target: 2000000 },
    { name: 'Tabungan Dana Darurat', icon: 'ShieldAlert', color: '#10b981', target: 1500000 },
    { name: 'Tabungan Pensiun', icon: 'PiggyBank', color: '#8b5cf6', target: 2500000 },
  ];

  const handleSelectPreset = (preset: typeof presetChoices[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
    setTargetRaw(preset.target.toString());
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
      setErrorMsg('Target bulanan harus lebih besar dari Rp 0');
      return;
    }

    if (editingId) {
      await updateSavingsTargetItem(editingId, {
        name,
        target_amount: targetAmount,
        category_icon: icon,
        color,
      });
      setSuccessMsg('Pos tabungan berhasil diperbarui!');
    } else {
      await addSavingsTargetItem({
        name,
        target_amount: targetAmount,
        current_amount: 0,
        category_icon: icon,
        color,
      });
      setSuccessMsg('Pos tabungan baru berhasil ditambahkan!');
    }

    setName('');
    setTargetRaw('1500000');
    setEditingId(null);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleStartEdit = (item: typeof savingsTargets[0]) => {
    setEditingId(item.id);
    setName(item.name);
    setTargetRaw(item.target_amount.toString());
    setIcon(item.category_icon || 'Palmtree');
    setColor(item.color || '#10b981');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Kelola Target Tabungan</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Buat & atur komitmen target tabungan bulanan</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Preset Quick Selections */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                  Pilih Preset Default atau Buat Sendiri
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {presetChoices.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-emerald-500 transition-all text-left"
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs" style={{ backgroundColor: p.color }}>
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500">Target: {formatRupiah(p.target)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input Item */}
              <form onSubmit={handleSaveItem} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Pos Tabungan' : 'Tambah Pos Tabungan Baru'}
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Pos Tabungan</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Tabungan Dana Darurat"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Menabung per Bulan</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={targetRaw ? Number(targetRaw).toLocaleString('id-ID') : ''}
                      onChange={(e) => setTargetRaw(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="1.500.000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {errorMsg && <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-emerald-500 font-semibold">{successMsg}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setName(''); setTargetRaw('1500000'); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingId ? 'Simpan Perubahan' : 'Tambah Pos Tabungan'}
                  </button>
                </div>
              </form>

              {/* List of Existing Savings Targets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Daftar Pos Tabungan Saat Ini ({savingsTargets.length})
                </span>
                <div className="space-y-2">
                  {savingsTargets.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: item.color || '#10b981' }}>
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Terkumpul: <strong className="text-emerald-600 font-bold">{formatRupiah(item.current_amount)}</strong> / Target: {formatRupiah(item.target_amount)} per bulan
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavingsTargetItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
