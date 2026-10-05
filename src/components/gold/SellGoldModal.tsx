import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Calendar, AlertCircle, Check } from 'lucide-react';
import { GoldBrand, GoldPrices, GoldPortfolio } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface SellGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  goldPrices: GoldPrices;
  goldPortfolio: GoldPortfolio;
  onSellGold: (params: {
    brand: GoldBrand;
    gram: number;
    price_per_gram: number;
    date: string;
    notes?: string;
  }) => Promise<{ error: string | null }>;
}

const BRAND_OPTIONS: GoldBrand[] = ['Antam', 'UBS', 'Hartadinata', 'Galeri24', 'Lainnya'];

export const SellGoldModal: React.FC<SellGoldModalProps> = ({
  isOpen,
  onClose,
  goldPrices,
  goldPortfolio,
  onSellGold,
}) => {
  const [brand, setBrand] = useState<GoldBrand>('Antam');
  const [gram, setGram] = useState<string>('1');
  const [pricePerGram, setPricePerGram] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto pre-fill buyback price based on brand selection
  useEffect(() => {
    if (isOpen) {
      const defaultSellPrice = brand === 'UBS' ? goldPrices.ubs.sell : goldPrices.antam.sell;
      setPricePerGram(defaultSellPrice);
      setErrorMsg(null);
      // If user has less than 1g, set gram to total_gram
      if (goldPortfolio.total_gram < 1 && goldPortfolio.total_gram > 0) {
        setGram(goldPortfolio.total_gram.toString());
      }
    }
  }, [brand, goldPrices, isOpen, goldPortfolio.total_gram]);

  if (!isOpen) return null;

  const numGram = parseFloat(gram) || 0;
  const totalAmount = Math.round(numGram * pricePerGram);
  const isOverBalance = numGram > goldPortfolio.total_gram;

  const handleMaxGram = () => {
    setGram(goldPortfolio.total_gram.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numGram <= 0) {
      setErrorMsg('Jumlah gram harus lebih besar dari 0');
      return;
    }
    if (isOverBalance) {
      setErrorMsg(`Maksimal gram yang bisa dicairkan adalah ${goldPortfolio.total_gram} gram`);
      return;
    }
    if (pricePerGram <= 0) {
      setErrorMsg('Harga jual per gram tidak valid');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await onSellGold({
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
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl p-5 sm:p-6 z-10 text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  Jual / Cairkan Emas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konversi tabungan emas ke uang tunai kas utama
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

          {/* Current Holding Banner */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Total Kepemilikan Emas Tersedia
              </p>
              <p className="text-sm font-black text-amber-500">
                {goldPortfolio.total_gram} gram
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Modal Beli Rata-Rata
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(goldPortfolio.average_buy_price)} / g
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Brand Emas yang Dijual
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {BRAND_OPTIONS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      brand === b
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-600/30 font-black'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400/50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Gram Input & Max button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Jumlah Gram yang Dijual
                </label>
                <button
                  type="button"
                  onClick={handleMaxGram}
                  className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Jual Semua ({goldPortfolio.total_gram}g)
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  max={goldPortfolio.total_gram}
                  required
                  value={gram}
                  onChange={(e) => setGram(e.target.value)}
                  placeholder="Contoh: 1 atau 2.5"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 pr-16 ${
                    isOverBalance
                      ? 'border-rose-500 focus:ring-rose-500/50'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/50'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  gram
                </span>
              </div>
              {isOverBalance && (
                <p className="mt-1 text-[11px] font-bold text-rose-500">
                  Melebihi saldo kepemilikan ({goldPortfolio.total_gram}g)
                </p>
              )}
            </div>

            {/* Price Per Gram (Pre-filled from buyback API with manual edit capability) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Harga Jual / Buyback per Gram (Rp)
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Pre-filled buyback hari ini (bisa diedit)
                </span>
              </div>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={pricePerGram || ''}
                onChange={(e) => setPricePerGram(Number(e.target.value))}
                placeholder="Rp 1.410.000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Setara: {formatCurrency(pricePerGram)} / gram
              </p>
            </div>

            {/* Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Tanggal Pencairan
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                  placeholder="Misal: Cairkan untuk DP motor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Total Proceeds Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total Dana Diterima:
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {numGram || 0} gram × {formatCurrency(pricePerGram)}
              </p>
            </div>

            {/* Cross-Module Integration Alert (PRD requirement 5.C) */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-emerald-700 dark:text-emerald-300 mb-0.5">
                  Integrasi Otomatis Kas Utama Aktif:
                </strong>
                Dana hasil penjualan sebesar <strong>{formatCurrency(totalAmount)}</strong> akan otomatis dicatat sebagai <strong>PEMASUKAN</strong> (Kategori: Investasi) di dashboard arus kas utama Anda.
              </div>
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
                disabled={isSubmitting || numGram <= 0 || isOverBalance}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-105 active:scale-95 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Memproses...'
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Cairkan Emas ke Kas
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
