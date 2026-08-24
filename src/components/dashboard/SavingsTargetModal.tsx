import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Sparkles, Check, TrendingUp } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';

interface SavingsTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsTargetModal: React.FC<SavingsTargetModalProps> = ({ isOpen, onClose }) => {
  const { monthlySavingsTarget, updateSavingsTarget } = useFinance();
  const [targetRaw, setTargetRaw] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTargetRaw(monthlySavingsTarget.toString());
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, monthlySavingsTarget]);

  const presetAmounts = [
    500000,
    1000000,
    1500000,
    2000000,
    3000000,
    5000000,
    10000000,
  ];

  const currentNumeric = parseRupiahInput(targetRaw);
  const yearlyTarget = currentNumeric * 12;

  const handlePresetClick = (amount: number) => {
    setTargetRaw(amount.toString());
    setErrorMsg('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    setTargetRaw(val);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentNumeric <= 0) {
      setErrorMsg('Target menabung bulanan harus lebih dari Rp 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await updateSavingsTarget(currentNumeric);
      if (res.error) throw new Error(res.error);
      setSuccessMsg('Target menabung berhasil diperbarui!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui target menabung');
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
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 overflow-hidden transition-colors duration-200"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Target Menabung Bulanan</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Atur komitmen tabungan setiap bulan</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Input Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Tabungan per Bulan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetRaw ? parseInt(targetRaw, 10).toLocaleString('id-ID') : ''}
                    onChange={handleInputChange}
                    placeholder="Contoh: 1.500.000"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-extrabold text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Pilih Cepat Target Bulanan:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {presetAmounts.map((amt) => {
                    const isSelected = currentNumeric === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handlePresetClick(amt)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        {formatRupiah(amt).replace(',00', '').replace('Rp ', '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1 Year Projection Info Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Proyeksi Tabungan 1 Tahun</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Total Akumulasi Target:</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatRupiah(yearlyTarget)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Konsisten menabung {formatRupiah(currentNumeric || 0)} setiap bulan akan menghasilkan{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(yearlyTarget)}</strong> di akhir tahun.
                </p>
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {successMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
