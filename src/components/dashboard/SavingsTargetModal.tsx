import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Sparkles, Check, TrendingUp, Shield, AlertTriangle, Flame } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';

interface SavingsTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsTargetModal: React.FC<SavingsTargetModalProps> = ({ isOpen, onClose }) => {
  const { monthlySavingsTarget, updateSavingsTarget, balanceThresholds, updateBalanceThresholds } = useFinance();

  const [targetRaw, setTargetRaw] = useState<string>('');
  const [safeRaw, setSafeRaw] = useState<string>('');
  const [warningRaw, setWarningRaw] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'target' | 'thresholds'>('target');

  useEffect(() => {
    if (isOpen) {
      setTargetRaw(monthlySavingsTarget.toString());
      setSafeRaw(balanceThresholds.safe.toString());
      setWarningRaw(balanceThresholds.warning.toString());
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, monthlySavingsTarget, balanceThresholds]);

  const presetAmounts = [500000, 1000000, 1500000, 2000000, 3000000, 5000000, 10000000];
  const presetThresholds = [
    { safe: 1000000, warning: 500000, label: 'Default' },
    { safe: 2000000, warning: 1000000, label: 'Sedang' },
    { safe: 5000000, warning: 2000000, label: 'Tinggi' },
    { safe: 10000000, warning: 5000000, label: 'Premium' },
  ];

  const currentTarget = parseRupiahInput(targetRaw);
  const currentSafe = parseRupiahInput(safeRaw);
  const currentWarning = parseRupiahInput(warningRaw);
  const yearlyTarget = currentTarget * 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    if (activeTab === 'target') {
      if (currentTarget <= 0) {
        setErrorMsg('Target menabung bulanan harus lebih dari Rp 0');
        setIsSubmitting(false);
        return;
      }
      try {
        const res = await updateSavingsTarget(currentTarget);
        if (res.error) throw new Error(res.error);
        setSuccessMsg('Target menabung berhasil diperbarui!');
        setTimeout(() => onClose(), 700);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memperbarui target menabung');
      }
    } else {
      if (currentSafe <= 0 || currentWarning <= 0) {
        setErrorMsg('Semua batas saldo harus lebih dari Rp 0');
        setIsSubmitting(false);
        return;
      }
      if (currentWarning >= currentSafe) {
        setErrorMsg('Batas waspada harus lebih kecil dari batas aman');
        setIsSubmitting(false);
        return;
      }
      try {
        const res = await updateBalanceThresholds({ safe: currentSafe, warning: currentWarning });
        if (res.error) throw new Error(res.error);
        setSuccessMsg('Batas saldo berhasil diperbarui!');
        setTimeout(() => onClose(), 700);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memperbarui batas saldo');
      }
    }

    setIsSubmitting(false);
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
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Pengaturan Keuangan</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Target & batas saldo pribadi</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => { setActiveTab('target'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === 'target'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Target Bulanan
              </button>
              <button
                onClick={() => { setActiveTab('thresholds'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === 'thresholds'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Batas Saldo
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* ── TARGET BULANAN TAB ── */}
              {activeTab === 'target' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Menabung per Bulan
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={targetRaw ? Number(targetRaw).toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          setTargetRaw(val);
                          setErrorMsg('');
                        }}
                        placeholder="1.500.000"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                      />
                    </div>
                    {currentTarget > 0 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        Target tahunan: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(yearlyTarget)}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Pilihan Cepat</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {presetAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setTargetRaw(amt.toString()); setErrorMsg(''); }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                            currentTarget === amt
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                          }`}
                        >
                          {amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── BATAS SALDO TAB ── */}
              {activeTab === 'thresholds' && (
                <>
                  {/* Visual guide */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                    <div className="flex">
                      <div className="flex-1 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span className="font-semibold text-rose-600 dark:text-rose-400">Kritis</span>
                        <span className="text-rose-500/70 text-[10px]">saldo rendah</span>
                      </div>
                      <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-semibold text-amber-600 dark:text-amber-400">Waspada</span>
                      </div>
                      <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Aman</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning threshold */}
                  <div>
                    <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                      Batas Waspada — di bawah ini Finny mulai khawatir
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={warningRaw ? Number(warningRaw).toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          setWarningRaw(val);
                          setErrorMsg('');
                        }}
                        placeholder="500.000"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-500/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Safe threshold */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                      Batas Aman — di atas ini Finny bahagia
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={safeRaw ? Number(safeRaw).toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          setSafeRaw(val);
                          setErrorMsg('');
                        }}
                        placeholder="1.000.000"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-500/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                      />
                    </div>
                    {currentSafe > 0 && currentWarning > 0 && currentWarning < currentSafe && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        Zona waspada: <span className="font-bold text-amber-600 dark:text-amber-400">{formatRupiah(currentWarning)}</span>
                        {' '}&ndash;{' '}
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(currentSafe)}</span>
                      </p>
                    )}
                  </div>

                  {/* Preset thresholds */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Preset Batas</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {presetThresholds.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setSafeRaw(p.safe.toString());
                            setWarningRaw(p.warning.toString());
                            setErrorMsg('');
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                            currentSafe === p.safe && currentWarning === p.warning
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Messages */}
              {errorMsg && (
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-3 py-2">
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-3 py-2">
                  <Check className="w-3.5 h-3.5" />{successMsg}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
