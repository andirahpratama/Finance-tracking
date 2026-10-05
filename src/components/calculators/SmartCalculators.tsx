import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ShieldAlert,
  Home,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';
import { isSavingsTransaction } from '../../lib/savingsUtils';
import { FinnyMascot } from '../mascot/FinnyMascot';
import { SavingsTargetItem } from '../../types';

type CalculatorTab = 'darurat' | 'kpr' | 'pendidikan';

interface SmartCalculatorsProps {
  onCreateSavingsTarget: (item: Partial<SavingsTargetItem>) => void;
}

export const SmartCalculators: React.FC<SmartCalculatorsProps> = ({ onCreateSavingsTarget }) => {
  const { transactions, totalBalance, thisMonthIncome, thisMonthExpense } = useFinance();
  const [activeTab, setActiveTab] = useState<CalculatorTab>('darurat');

  // Compute average monthly expenses and income from historical non-savings transactions
  const { avgMonthlyExpense, avgMonthlyIncome, avgMonthlyNet } = useMemo(() => {
    const monthlyExpensesMap: Record<string, number> = {};
    const monthlyIncomeMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (isSavingsTransaction(t)) return;
      const [y, m] = t.date.split('T')[0].split('-');
      const key = `${y}-${m}`;
      const amount = Number(t.amount) || 0;

      if (t.type === 'expense') {
        monthlyExpensesMap[key] = (monthlyExpensesMap[key] || 0) + amount;
      } else if (t.type === 'income') {
        monthlyIncomeMap[key] = (monthlyIncomeMap[key] || 0) + amount;
      }
    });

    const expenseKeys = Object.keys(monthlyExpensesMap);
    const incomeKeys = Object.keys(monthlyIncomeMap);

    const totalHistoricalExpense = Object.values(monthlyExpensesMap).reduce((s, v) => s + v, 0);
    const totalHistoricalIncome = Object.values(monthlyIncomeMap).reduce((s, v) => s + v, 0);

    const calculatedAvgExp = expenseKeys.length > 0 ? Math.round(totalHistoricalExpense / expenseKeys.length) : (thisMonthExpense || 3500000);
    const calculatedAvgInc = incomeKeys.length > 0 ? Math.round(totalHistoricalIncome / incomeKeys.length) : (thisMonthIncome || 8000000);

    const net = Math.max(0, calculatedAvgInc - calculatedAvgExp);

    return {
      avgMonthlyExpense: calculatedAvgExp > 0 ? calculatedAvgExp : 3500000,
      avgMonthlyIncome: calculatedAvgInc > 0 ? calculatedAvgInc : 8000000,
      avgMonthlyNet: net > 0 ? net : (thisMonthIncome - thisMonthExpense > 0 ? thisMonthIncome - thisMonthExpense : 2500000),
    };
  }, [transactions, thisMonthIncome, thisMonthExpense]);

  // =========================================================================
  // 1. STATE & CALCULATIONS: KALKULATOR DANA DARURAT
  // =========================================================================
  const [familyStatus, setFamilyStatus] = useState<'single' | 'married' | 'married_kids'>('married');
  const [customMonthlyExpenseRaw, setCustomMonthlyExpenseRaw] = useState<string>('');
  const [useCustomExpense, setUseCustomExpense] = useState<boolean>(false);

  const statusMultiplier = familyStatus === 'single' ? 3 : familyStatus === 'married' ? 6 : 9;

  const activeExpense = useCustomExpense && customMonthlyExpenseRaw
    ? parseRupiahInput(customMonthlyExpenseRaw)
    : avgMonthlyExpense;

  const targetDanaDarurat = activeExpense * statusMultiplier;
  const currentEmergencyCoverage = targetDanaDarurat > 0 ? Math.min(100, Math.round((Math.max(0, totalBalance) / targetDanaDarurat) * 100)) : 0;
  const emergencyDeficit = Math.max(0, targetDanaDarurat - Math.max(0, totalBalance));

  // =========================================================================
  // 2. STATE & CALCULATIONS: KALKULATOR KPR
  // =========================================================================
  const [housePriceRaw, setHousePriceRaw] = useState<string>('650000000');
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRatePerYear, setInterestRatePerYear] = useState<number>(7.5);
  const [tenorYears, setTenorYears] = useState<number>(15);

  const housePrice = parseRupiahInput(housePriceRaw) || 0;
  const downPaymentAmount = Math.round((housePrice * downPaymentPercent) / 100);
  const loanPrincipal = Math.max(0, housePrice - downPaymentAmount);

  // Standard Annuity Mortgage Calculation: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const kprMonthlyInstallment = useMemo(() => {
    if (loanPrincipal <= 0) return 0;
    const monthlyRate = (interestRatePerYear / 100) / 12;
    const totalMonths = tenorYears * 12;

    if (monthlyRate === 0) {
      return Math.round(loanPrincipal / totalMonths);
    }

    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const installment = loanPrincipal * ((monthlyRate * factor) / (factor - 1));
    return Math.round(installment);
  }, [loanPrincipal, interestRatePerYear, tenorYears]);

  const totalKprPayment = kprMonthlyInstallment * tenorYears * 12;
  const totalKprInterest = Math.max(0, totalKprPayment - loanPrincipal);

  // Smart Cashflow Integration Comparison: Cicilan KPR vs Selisih Bersih
  const isKprSafe = kprMonthlyInstallment <= avgMonthlyNet;
  const kprDeficitOrSurplus = Math.abs(avgMonthlyNet - kprMonthlyInstallment);

  // =========================================================================
  // 3. STATE & CALCULATIONS: KALKULATOR PENDIDIKAN ANAK
  // =========================================================================
  const [childCurrentAge, setChildCurrentAge] = useState<number>(3);
  const [targetCollegeAge, setTargetCollegeAge] = useState<number>(18);
  const [educationCostCurrentRaw, setEducationCostCurrentRaw] = useState<string>('75000000');
  const [educationInflationRate, setEducationInflationRate] = useState<number>(10);

  const educationCostCurrent = parseRupiahInput(educationCostCurrentRaw) || 0;
  const educationYearsGap = Math.max(1, targetCollegeAge - childCurrentAge);

  // Future Value (FV) = Biaya Saat Ini * (1 + Inflasi)^Jarak Tahun
  const futureEducationCost = useMemo(() => {
    const rate = educationInflationRate / 100;
    const fv = educationCostCurrent * Math.pow(1 + rate, educationYearsGap);
    return Math.round(fv);
  }, [educationCostCurrent, educationInflationRate, educationYearsGap]);

  // Monthly savings needed: FV / (Jarak Tahun * 12)
  const monthlyEducationSavings = useMemo(() => {
    return Math.round(futureEducationCost / (educationYearsGap * 12));
  }, [futureEducationCost, educationYearsGap]);

  // Handlers to create goal-based savings directly from calculators
  const handleCreateEmergencyTarget = () => {
    const currentYear = new Date().getFullYear();
    onCreateSavingsTarget({
      name: 'Tabungan Dana Darurat',
      target_amount: targetDanaDarurat,
      deadline_date: `${currentYear + 1}-12`,
      auto_calculate_monthly: true,
      category_icon: 'ShieldAlert',
      color: '#10b981',
    });
  };

  const handleCreateEducationTarget = () => {
    const currentYear = new Date().getFullYear();
    onCreateSavingsTarget({
      name: `Tabungan Pendidikan Anak (Usia ${targetCollegeAge})`,
      target_amount: futureEducationCost,
      deadline_date: `${currentYear + educationYearsGap}-07`,
      auto_calculate_monthly: true,
      category_icon: 'GraduationCap',
      color: '#3b82f6',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Smart Financial Calculators
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Kalkulator cerdas terintegrasi arus kas riil untuk rencana finansial masa depan
            </p>
          </div>
        </div>

        {/* Global Financial Snapshot Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-semibold">Arus Kas Riil (Surplus/Bln)</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(avgMonthlyNet)}/bln</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 gap-1.5 overflow-x-auto shadow-inner">
        <button
          onClick={() => setActiveTab('darurat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'darurat'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Dana Darurat</span>
        </button>

        <button
          onClick={() => setActiveTab('kpr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'kpr'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Cicilan KPR</span>
        </button>

        <button
          onClick={() => setActiveTab('pendidikan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pendidikan'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Pendidikan Anak</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: KALKULATOR DANA DARURAT                                        */}
      {/* ===================================================================== */}
      {activeTab === 'darurat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Parameter Dana Darurat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dihitung otomatis dari pengeluaran riil bulanan Anda
                </p>
              </div>
            </div>

            {/* Status Keluarga */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Status Keluarga
              </label>
              <select
                value={familyStatus}
                onChange={(e) => setFamilyStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="single">Single / Lajang — Butuh 3x Pengeluaran</option>
                <option value="married">Menikah tanpa Anak — Butuh 6x Pengeluaran</option>
                <option value="married_kids">Menikah dengan Anak — Butuh 9x Pengeluaran</option>
              </select>
              <p className="text-[10px] text-slate-400">
                Rekomendasi standar perencana keuangan independen untuk cadangan likuid keluarga.
              </p>
            </div>

            {/* Pengeluaran Bulanan Basis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Basis Pengeluaran Bulanan
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomExpense(!useCustomExpense)}
                  className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {useCustomExpense ? 'Gunakan Riwayat Otomatis' : 'Ubah Nominal Manual'}
                </button>
              </div>

              {useCustomExpense ? (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={customMonthlyExpenseRaw ? Number(customMonthlyExpenseRaw).toLocaleString('id-ID') : ''}
                    onChange={(e) => setCustomMonthlyExpenseRaw(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Contoh: 5.000.000"
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Rata-rata Riwayat Pengeluaranmu</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatRupiah(avgMonthlyExpense)} / bulan
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Otomatis
                  </span>
                </div>
              )}
            </div>

            {/* Formula Explanation Callout */}
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-teal-500" />
                <span>Rumus Target:</span>
              </div>
              <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                Target = {formatRupiah(activeExpense)} x {statusMultiplier} bulan = <strong>{formatRupiah(targetDanaDarurat)}</strong>
              </p>
            </div>
          </div>

          {/* Right Column: Output & Action */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Hasil Analisis Kesiapan
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Rekomendasi Dana Darurat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbandingan target terhadap total saldo kas yang Anda miliki saat ini
              </p>

              {/* Big Target Card */}
              <div className="my-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-bold">Target Dana Darurat:</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(targetDanaDarurat)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Total Saldo Saat Ini:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatRupiah(totalBalance)}
                  </span>
                </div>

                {/* Meter Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Tingkat Kesiapan Likuiditas</span>
                    <span className={currentEmergencyCoverage >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                      {currentEmergencyCoverage}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        currentEmergencyCoverage >= 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${currentEmergencyCoverage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs">
                  {currentEmergencyCoverage >= 100 ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Luar biasa! Saldomu telah mencukupi kebutuhan dana darurat keluarga.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Masih dibutuhkan {formatRupiah(emergencyDeficit)} lagi agar proteksi keluarga optimal.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Button to Create Emergency Savings Target */}
            <button
              onClick={handleCreateEmergencyTarget}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 active:scale-98 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Buat Pos Dana Darurat Sekarang</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: KALKULATOR KPR TERINTEGRASI ARUS KAS                           */}
      {/* ===================================================================== */}
      {activeTab === 'kpr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {/* Left Column: Mortgage Inputs */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Simulasi Cicilan KPR
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hitung cicilan anuitas dan validasi langsung terhadap sisa uang bulanan
                </p>
              </div>
            </div>

            {/* Harga Rumah */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Harga Rumah / Properti
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  value={housePriceRaw ? Number(housePriceRaw).toLocaleString('id-ID') : ''}
                  onChange={(e) => setHousePriceRaw(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="650.000.000"
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* DP (%) & Tenor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Uang Muka / DP (%)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600">{downPaymentPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block truncate">
                  DP: {formatRupiah(downPaymentAmount)}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tenor Pinjaman
                  </label>
                  <span className="text-[11px] font-bold text-purple-600">{tenorYears} Tahun</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={tenorYears}
                  onChange={(e) => setTenorYears(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  {tenorYears * 12} bulan cicilan
                </span>
              </div>
            </div>

            {/* Suku Bunga per Tahun */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Suku Bunga KPR Fixed (% per tahun)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="25"
                  value={interestRatePerYear}
                  onChange={(e) => setInterestRatePerYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            {/* Quick Mortgage Breakdown Pills */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Pokok Pinjaman KPR</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                  {formatRupiah(loanPrincipal)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Beban Bunga</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                  {formatRupiah(totalKprInterest)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Smart Validation Output with Mascot */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Kalkulasi Anuitas & Uji Kelayakan Arus Kas
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Cicilan: {formatRupiah(kprMonthlyInstallment)} <span className="text-xs font-normal text-slate-500">/ bulan</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dibandingkan terhadap sisa selisih bersih arus kas Anda ({formatRupiah(avgMonthlyNet)}/bln)
              </p>

              {/* SMART VALIDATION CARD WITH FINNY MASCOT */}
              <div
                className={`my-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isKprSafe
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/10'
                }`}
              >
                {/* Mascot Icon */}
                <FinnyMascot mood={isKprSafe ? 'happy' : 'sad'} size={72} className="shrink-0" />

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isKprSafe ? (
                      <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300">
                        Cicilan Aman, Sisa Dana Bulanan Mencukupi! 🎉
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        Peringatan: Cicilan Melebihi Arus Kas! ⚠️
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isKprSafe
                      ? `Arus kas bulananmu surplus ${formatRupiah(avgMonthlyNet)}, cukup untuk mencicil ${formatRupiah(kprMonthlyInstallment)}/bln dan masih menyisakan kelonggaran dana sebesar ${formatRupiah(kprDeficitOrSurplus)}/bln.`
                      : `Cicilan KPR (${formatRupiah(kprMonthlyInstallment)}) lebih besar dari sisa uang bulananmu (${formatRupiah(avgMonthlyNet)}). Keuanganmu berisiko defisit ${formatRupiah(kprDeficitOrSurplus)} setiap bulan!`}
                  </p>

                  <p className="text-[11px] font-semibold italic text-slate-500 dark:text-slate-400 pt-1">
                    {isKprSafe
                      ? 'Finny: "Pilihan yang bijak! Keuangan tetap stabil sambil memiliki hunian impian."'
                      : 'Finny: "Finny panik nih! Coba naikkan DP, pilih tenor 20-25 tahun, atau cari rumah dengan harga lebih terjangkau ya."'}
                  </p>
                </div>
              </div>

              {/* Comparison Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Pembayaran KPR</span>
                  <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5 truncate">
                    {formatRupiah(totalKprPayment)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Beban Bunga vs Pokok</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400 block mt-0.5">
                    {loanPrincipal > 0 ? Math.round((totalKprInterest / loanPrincipal) * 100) : 0}% dari Pokok
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Beban vs Pendapatan</span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400 block mt-0.5">
                    {avgMonthlyIncome > 0 ? Math.round((kprMonthlyInstallment / avgMonthlyIncome) * 100) : 0}% DSR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: KALKULATOR PENDIDIKAN ANAK                                    */}
      {/* ===================================================================== */}
      {activeTab === 'pendidikan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {/* Left Column: Education Inputs */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Kalkulator Dana Pendidikan Anak
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Perhitungkan efek inflasi pendidikan dan siapkan tabungan sejak dini
                </p>
              </div>
            </div>

            {/* Usia Anak & Usia Masuk Kuliah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Usia Anak Saat Ini (Tahun)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={childCurrentAge}
                  onChange={(e) => setChildCurrentAge(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Usia Masuk (Kuliah)
                </label>
                <input
                  type="number"
                  min={childCurrentAge + 1}
                  max="25"
                  value={targetCollegeAge}
                  onChange={(e) => setTargetCollegeAge(Math.max(childCurrentAge + 1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Perkiraan Biaya Saat Ini */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Perkiraan Biaya Pendidikan Hari Ini
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  value={educationCostCurrentRaw ? Number(educationCostCurrentRaw).toLocaleString('id-ID') : ''}
                  onChange={(e) => setEducationCostCurrentRaw(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="75.000.000"
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Uang gedung, uang pangkal, & semester awal jika mendaftar tahun ini.
              </p>
            </div>

            {/* Asumsi Inflasi Pendidikan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Asumsi Inflasi Pendidikan (% / tahun)
                </label>
                <span className="text-[11px] font-bold text-cyan-600">{educationInflationRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={educationInflationRate}
                onChange={(e) => setEducationInflationRate(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Standar inflasi biaya kuliah di Indonesia berkisar 8% - 15% per tahun.
              </p>
            </div>
          </div>

          {/* Right Column: Projected Future Value & CTA */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/20 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Proyeksi Nilai Masa Depan (Future Value)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {formatRupiah(futureEducationCost)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Biaya yang harus disiapkan saat anak berusia {targetCollegeAge} tahun ({educationYearsGap} tahun dari sekarang)
              </p>

              {/* Breakdown Cards */}
              <div className="my-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Biaya Saat Ini:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatRupiah(educationCostCurrent)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Kenaikan Akibat Inflasi:</span>
                  <span className="font-extrabold text-rose-500">
                    +{formatRupiah(Math.max(0, futureEducationCost - educationCostCurrent))}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Rekomendasi Setoran:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Disiapkan setiap bulan selama {educationYearsGap} tahun
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400">
                    {formatRupiah(monthlyEducationSavings)} / bln
                  </span>
                </div>
              </div>

              {/* Financial Tip */}
              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Semakin dini Anda mulai menabung, semakin ringan cicilan bulanan yang dibutuhkan berkat kekuatan *compounding interest* dan waktu.
                </p>
              </div>
            </div>

            {/* CTA Button to pass data directly into Savings Target */}
            <button
              onClick={handleCreateEducationTarget}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 active:scale-98 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Buat Pos Tabungan Pendidikan</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
