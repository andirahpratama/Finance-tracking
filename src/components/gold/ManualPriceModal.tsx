import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Check, RotateCcw } from 'lucide-react';
import { GoldPrices } from '../../types';

interface ManualPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  goldPrices: GoldPrices;
  onSaveManualPrice: (prices: GoldPrices) => void;
  onResetManualPrice: () => Promise<void>;
}

export const ManualPriceModal: React.FC<ManualPriceModalProps> = ({
  isOpen,
  onClose,
  goldPrices,
  onSaveManualPrice,
  onResetManualPrice,
}) => {
  const [antamBuy, setAntamBuy] = useState<number>(goldPrices.antam.buy);
  const [antamSell, setAntamSell] = useState<number>(goldPrices.antam.sell);
  const [ubsBuy, setUbsBuy] = useState<number>(goldPrices.ubs.buy);
  const [ubsSell, setUbsSell] = useState<number>(goldPrices.ubs.sell);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setAntamBuy(goldPrices.antam.buy);
      setAntamSell(goldPrices.antam.sell);
      setUbsBuy(goldPrices.ubs.buy);
      setUbsSell(goldPrices.ubs.sell);
    }
  }, [isOpen, goldPrices]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GoldPrices = {
      antam: {
        buy: Number(antamBuy),
        sell: Number(antamSell),
      },
      ubs: {
        buy: Number(ubsBuy),
        sell: Number(ubsSell),
      },
      source: 'manual',
      last_updated: new Date().toISOString(),
    };
    onSaveManualPrice(updated);
    onClose();
  };

  const handleReset = async () => {
    setIsResetting(true);
    await onResetManualPrice();
    setIsResetting(false);
    onClose();
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
          className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 z-10 text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Sesuaikan Harga Emas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gunakan harga manual jika API luar sedang lambat
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

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {/* Antam Section */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Logam Mulia Antam
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Harga Beli / g
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={antamBuy}
                    onChange={(e) => setAntamBuy(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Harga Buyback / g
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={antamSell}
                    onChange={(e) => setAntamSell(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
            </div>

            {/* UBS Section */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Emas UBS
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Harga Beli / g
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={ubsBuy}
                    onChange={(e) => setUbsBuy(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Harga Buyback / g
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={ubsSell}
                    onChange={(e) => setUbsSell(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 text-slate-950" />
                Terapkan Harga Manual
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Menghubungkan API...' : 'Kembalikan ke Auto Fetch API'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
