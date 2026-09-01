import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { printFinancialReport } from '../../lib/exportUtils';
import { Transaction } from '../../types';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, availableYears } = useFinance();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [periodType, setPeriodType] = useState<'this_month' | 'specific_month' | 'yearly'>('this_month');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(currentMonth);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const handlePrint = () => {
    let filtered: Transaction[] = [];
    let periodTitle = '';

    if (periodType === 'this_month') {
      const now = new Date();
      filtered = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      periodTitle = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    } else if (periodType === 'specific_month') {
      filtered = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear;
      });
      periodTitle = `${monthNames[selectedMonthIndex]} ${selectedYear}`;
    } else {
      filtered = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear;
      });
      periodTitle = `Tahun ${selectedYear}`;
    }

    let inc = 0;
    let exp = 0;
    filtered.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });

    printFinancialReport(filtered, {
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: inc - exp,
      monthName: periodTitle,
    });

    onClose();
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Cetak Laporan PDF</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pilih periode laporan untuk dicetak</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Type Buttons */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Pilih Periode Laporan
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodType('this_month')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    periodType === 'this_month'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Bulan Ini
                </button>

                <button
                  type="button"
                  onClick={() => setPeriodType('specific_month')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    periodType === 'specific_month'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Pilih Bulan
                </button>

                <button
                  type="button"
                  onClick={() => setPeriodType('yearly')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    periodType === 'yearly'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Tahunan
                </button>
              </div>

              {/* Month & Year Selectors */}
              {periodType === 'specific_month' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Bulan</label>
                    <select
                      value={selectedMonthIndex}
                      onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {monthNames.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tahun</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {periodType === 'yearly' && (
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tahun Laporan</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Tahun {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Print Action */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
              >
                <Printer className="w-4 h-4" />
                Cetak PDF Laporan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
