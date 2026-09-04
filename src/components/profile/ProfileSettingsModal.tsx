import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Smile, AlertTriangle, Frown, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../lib/formatters';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { balanceThresholds, updateBalanceThresholds, totalBalance } = useFinance();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [safeInput, setSafeInput] = useState<string>(balanceThresholds.safe.toString());
  const [warningInput, setWarningInput] = useState<string>(balanceThresholds.warning.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync inputs when modal opens or thresholds change
  useEffect(() => {
    if (isOpen) {
      setFullName(user?.full_name || '');
      setSafeInput(balanceThresholds.safe.toString());
      setWarningInput(balanceThresholds.warning.toString());
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, balanceThresholds, user]);

  const safeVal = Math.max(0, parseInt(safeInput.replace(/\D/g, ''), 10) || 0);
  const warningVal = Math.max(0, parseInt(warningInput.replace(/\D/g, ''), 10) || 0);

  // Calculate remaining days for live preview
  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);
  const dailyRate = Math.round(totalBalance / remainingDays);

  const previewMood = dailyRate > safeVal
    ? 'happy'
    : dailyRate >= warningVal
    ? 'neutral'
    : 'sad';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (warningVal >= safeVal) {
      setErrorMsg('Batas Waspada harus lebih kecil dari Batas Aman (Senang)');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateBalanceThresholds({
        safe: safeVal,
        warning: warningVal,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Pengaturan Finny berhasil disimpan!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 transition-colors duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Pengaturan Profil & Finny
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atur profil dan acuan sisa saldo harian maskot
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification messages */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              {/* SECTION 1: User Profile Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Informasi Profil
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pengguna
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'Mode Tamu / Offline'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Finny Mascot Daily Threshold Settings */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Kondisi Emosi Finny (Per Hari)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Finny menghitung <strong>Sisa Saldo Harian</strong> = Total Saldo / Sisa Hari di Bulan Ini (saat ini sisa {remainingDays} hari).
                  </p>
                </div>

                {/* Threshold 1: Safe (Senang) */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-emerald-500" />
                      Wajah Tersenyum Senang 🥳
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      &gt; {formatRupiah(safeVal)} / hari
                    </span>
                  </div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400">
                    Sisa saldo per hari minimal untuk bikin Finny gembira:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={safeInput}
                      onChange={(e) => setSafeInput(e.target.value)}
                      placeholder="100000"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Threshold 2: Warning (Datar / Panik) */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Wajah Datar Sedikit Panik 🧐
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {formatRupiah(warningVal)} - {formatRupiah(safeVal)} / hari
                    </span>
                  </div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400">
                    Batas bawah sisa saldo harian zona waspada/panik:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={warningInput}
                      onChange={(e) => setWarningInput(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Info Card: Below Warning (Sedih) */}
                <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Frown className="w-4 h-4 text-rose-500" />
                    Wajah Sedih Menangis 🥺
                  </span>
                  <span className="font-bold">
                    &lt; {formatRupiah(warningVal)} / hari
                  </span>
                </div>
              </div>

              {/* LIVE PREVIEW STATUS */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Preview Emosi Finny Saat Ini</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    previewMood === 'happy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : previewMood === 'neutral'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {previewMood === 'happy' ? 'Senang (Happy) 🥳' : previewMood === 'neutral' ? 'Datar / Panik 🧐' : 'Sedih / Menangis 🥺'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sisa Saldo Harian Anda: <strong className="text-slate-900 dark:text-white font-bold">{formatRupiah(dailyRate)}/hari</strong> (Total Saldo {formatRupiah(totalBalance)} ÷ {remainingDays} hari).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
