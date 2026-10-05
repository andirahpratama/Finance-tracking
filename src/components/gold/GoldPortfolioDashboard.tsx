import React, { useState } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Scale,
  Trash2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { calculateGoldValuation } from '../../lib/goldPriceService';
import { formatCurrency } from '../../lib/formatters';
import { BuyGoldModal } from './BuyGoldModal';
import { SellGoldModal } from './SellGoldModal';
import { ManualPriceModal } from './ManualPriceModal';
import { GoldTransaction } from '../../types';

export const GoldPortfolioDashboard: React.FC = () => {
  const {
    goldTransactions,
    goldPortfolio,
    goldPrices,
    isGoldPricesLoading,
    buyGold,
    sellGold,
    deleteGoldTransaction,
    refreshGoldPrices,
    updateManualGoldPrice,
    resetManualGoldPrice,
  } = useFinance();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // We use Antam buyback price as the primary benchmark valuation
  const valuation = calculateGoldValuation(goldPortfolio, goldPrices.antam.sell);

  const handleDelete = async (tx: GoldTransaction) => {
    if (confirm(`Hapus transaksi ${tx.type === 'BUY' ? 'pembelian' : 'penjualan'} ${tx.gram}g emas ${tx.brand}?`)) {
      setDeletingId(tx.id);
      await deleteGoldTransaction(tx.id);
      setDeletingId(null);
    }
  };

  const getSourceBadge = () => {
    switch (goldPrices.source) {
      case 'api-internal':
        return { label: 'Scraper Internal', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'public-api':
        return { label: 'Galeri24 API', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'manual':
        return { label: 'Harga Manual', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      default:
        return { label: 'Pasar Terkini (Est)', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
    }
  };

  const badge = getSourceBadge();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Live Price Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Portofolio Tabungan Emas
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wealth tracker & kalkulator valuasi real-time berbasis Average Cost Method
          </p>
        </div>

        {/* Action Controls for Price */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
            title="Ubah harga emas secara manual jika API gangguan"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Set Manual</span>
          </button>

          <button
            onClick={refreshGoldPrices}
            disabled={isGoldPricesLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 transition-all disabled:opacity-50"
            title="Refresh harga emas terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGoldPricesLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Live Market Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Antam Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/20">
                LM
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Logam Mulia Antam
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">
              Per 1 gram
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Harga Beli Butik</p>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(goldPrices.antam.buy)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Harga Buyback (Jual)</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(goldPrices.antam.sell)}
              </p>
            </div>
          </div>
        </div>

        {/* UBS Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-black text-xs border border-yellow-500/20">
                UBS
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Emas Batangan UBS
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">
              Per 1 gram
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Harga Beli Toko</p>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(goldPrices.ubs.buy)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Harga Buyback (Jual)</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(goldPrices.ubs.sell)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hero Asset Summary Card (PRD 5.A) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 p-6 sm:p-8 text-slate-950 shadow-xl shadow-amber-500/20">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-yellow-300/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 backdrop-blur-md text-slate-950 font-bold text-xs">
              <Coins className="w-3.5 h-3.5" />
              <span>Estimasi Nilai Aset Emas Saat Ini</span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
                {formatCurrency(valuation.currentValuation)}
              </h1>
              <span className="text-base sm:text-xl font-extrabold text-slate-900/80">
                ({goldPortfolio.total_gram} gram)
              </span>
            </div>

            {/* Floating Profit/Loss & ROI Pill */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-sm ${
                  valuation.isProfit
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {valuation.isProfit ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  Floating P/L: {valuation.floatingProfit >= 0 ? '+' : ''}
                  {formatCurrency(valuation.floatingProfit)}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${
                  valuation.isProfit
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                <span>ROI: {valuation.roiPercent >= 0 ? '+' : ''}{valuation.roiPercent}%</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col gap-2.5 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-950 text-white font-bold text-xs sm:text-sm hover:bg-slate-900 active:scale-95 transition-all shadow-lg shadow-slate-950/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Beli Emas Baru</span>
            </button>

            <button
              onClick={() => setIsSellModalOpen(true)}
              disabled={goldPortfolio.total_gram <= 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md shadow-amber-950/10 disabled:opacity-50 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>Jual / Cairkan</span>
            </button>
          </div>
        </div>

        {/* Mini stats footer inside Hero */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 mt-6 border-t border-slate-950/15">
          <div>
            <p className="text-[11px] font-bold text-slate-950/70">Total Modal Mengendap</p>
            <p className="text-sm sm:text-base font-black text-slate-950">
              {formatCurrency(goldPortfolio.total_invested_capital)}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-950/70">Harga Beli Rata-Rata</p>
            <p className="text-sm sm:text-base font-black text-slate-950">
              {goldPortfolio.total_gram > 0
                ? `${formatCurrency(goldPortfolio.average_buy_price)} / g`
                : '-'}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-slate-950/70">Metode Perhitungan</p>
            <p className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Weighted Average Cost
            </p>
          </div>
        </div>
      </div>

      {/* 4. Transactions History Table / Card List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Riwayat Transaksi Emas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar akumulasi beli dan pencairan emas fisik
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {goldTransactions.length} Transaksi
          </span>
        </div>

        {goldTransactions.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Riwayat Transaksi Emas
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Mulai catat graman emas Anda untuk memantau nilai aset dan keuntungan secara berkala.
            </p>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
            >
              + Catat Pembelian Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Tanggal</th>
                  <th className="pb-3">Tipe</th>
                  <th className="pb-3">Brand</th>
                  <th className="pb-3 text-right">Gram</th>
                  <th className="pb-3 text-right">Harga / Gram</th>
                  <th className="pb-3 text-right">Total Nilai</th>
                  <th className="pb-3 hidden md:table-cell">Catatan</th>
                  <th className="pb-3 text-center pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {goldTransactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 pl-2 whitespace-nowrap text-slate-700 dark:text-slate-300 font-semibold">
                        {tx.date}
                      </td>

                      <td className="py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isBuy
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isBuy ? '+ BELI' : '- JUAL'}
                        </span>
                      </td>

                      <td className="py-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {tx.brand}
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap font-black text-slate-900 dark:text-white">
                        {tx.gram} g
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatCurrency(tx.price_per_gram)}
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap font-black text-slate-900 dark:text-white">
                        {formatCurrency(tx.total_amount)}
                      </td>

                      <td className="py-3.5 hidden md:table-cell text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {tx.notes || '-'}
                      </td>

                      <td className="py-3.5 text-center pr-2 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title="Hapus Transaksi Emas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Edu & Guardrails Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-1">
              Wealth Tracker Terisolasi
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              Transaksi <strong>Beli Emas</strong> tidak memotong saldo kas harian utama Anda. Modul ini terisolasi murni sebagai pelacak kekayaan (wealth management).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3 text-xs leading-relaxed">
          <ArrowUpRight className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-1">
              Pencairan Otomatis Masuk Kas
            </h5>
            <p className="text-slate-600 dark:text-slate-400">
              Saat Anda menekan <strong>Jual / Cairkan Emas</strong>, uang hasil penjualan otomatis tercatat sebagai transaksi <strong>Pemasukan</strong> di buku kas utama Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BuyGoldModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        goldPrices={goldPrices}
        onBuyGold={buyGold}
      />

      <SellGoldModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        goldPrices={goldPrices}
        goldPortfolio={goldPortfolio}
        onSellGold={sellGold}
      />

      <ManualPriceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        goldPrices={goldPrices}
        onSaveManualPrice={updateManualGoldPrice}
        onResetManualPrice={resetManualGoldPrice}
      />
    </div>
  );
};
