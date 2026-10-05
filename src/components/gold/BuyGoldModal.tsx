import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles, Calendar, Info, Check } from 'lucide-react';
import { GoldBrand, GoldPrices } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface BuyGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  goldPrices: GoldPrices;
  onBuyGold: (params: {
    brand: GoldBrand;
    gram: number;
    price_per_gram: number;
    date: string;
    notes?: string;
  }) => Promise<{ error: string | null }>;
}

const BRAND_OPTIONS: GoldBrand[] = ['Antam', 'UBS', 'Hartadinata', 'Galeri24', 'Lainnya'];
const QUICK_GRAMS = [0.5, 1, 2, 5, 10, 25];

export const BuyGoldModal: React.FC<BuyGoldModalProps> = ({
  isOpen,
  onClose,
  goldPrices,
  onBuyGold,
}) => {
  const [brand, setBrand] = useState<GoldBrand>('Antam');
  const [gram, setGram] = useState<string>('1');
  const [pricePerGram, setPricePerGram] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto pre-fill price based on brand selection
  useEffect(() => {
    if (isOpen) {
      const defaultPrice = brand === 'UBS' ? goldPrices.ubs.buy : goldPrices.antam.buy;
      setPricePerGram(defaultPrice);
      setErrorMsg(null);
    }
  }, [brand, goldPrices, isOpen]);

  if (!isOpen) return null;

  const numGram = parseFloat(gram) || 0;
  const totalAmount = Math.round(numGram * pricePerGram);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numGram <= 0) {
      setErrorMsg('Jumlah gram harus lebih besar dari 0');
      return;
    }
    if (pricePerGram <= 0) {
      setErrorMsg('Harga per gram tidak valid');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await onBuyGold({
      brand,
      gram: numGram,
      price_per_gram: pricePerGram,
      date,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 shadow-2xl p-5 sm:p-6 z-10 text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                <Coins className="w-5 h-5 text-amber-950" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  Beli & Catat Emas
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tambah aset graman emas ke portofolio investasi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Brand / Produsen Emas
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {BRAND_OPTIONS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      brand === b
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm shadow-amber-500/30 font-black'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-amber-400/50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Gram Input & Quick Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Jumlah Gram
                </label>
                <span className="text-[11px] text-slate-400">Bisa desimal (misal 0.5)</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  value={gram}
                  onChange={(e) => setGram(e.target.value)}
                  placeholder="Contoh: 1 atau 0.5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-16"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  gram
                </span>
              </div>

              {/* Quick Select Chips */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                {QUICK_GRAMS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGram(g.toString())}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            {/* Price Per Gram (Pre-filled from API with manual edit capability) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Harga Beli per Gram (Rp)
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Pre-filled harga pasar (bisa diedit)
                </span>
              </div>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={pricePerGram || ''}
                onChange={(e) => setPricePerGram(Number(e.target.value))}
                placeholder="Rp 1.545.000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Setara: {formatCurrency(pricePerGram)} / gram
              </p>
            </div>

            {/* Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Tanggal Beli
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Beli di Butik LM Antam"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Total Summary Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total Modal Pembelian:
                </span>
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {numGram || 0} gram × {formatCurrency(pricePerGram)}
              </p>
            </div>

            {/* Guardrail Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Wealth Tracker:</strong> Transaksi beli ini murni menambah saldo graman emas portofolio dan <strong>TIDAK memotong saldo kas harian utama</strong> Anda.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || numGram <= 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-105 active:scale-95 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    Simpan Pembelian Emas
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
