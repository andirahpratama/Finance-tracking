import React, { useState, useMemo } from 'react';
import {
  PieChart,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertTriangle,
  CheckCircle2,
  PiggyBank,
  ArrowRightLeft,
  RotateCw,
  Wallet,
  Printer,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../lib/formatters';
import { formatMonthKeyLabel, getCurrentMonthKey, getMonthKey } from '../../lib/budgetUtils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { BankLogo } from '../ui/BankLogo';
import { PostUsageSummary } from '../../lib/budgetUtils';
import { RemainderActionType } from '../../types';
import { CatFinnySvg } from '../mascot/CatFinnySvg';

interface BudgetingPageProps {
  onOpenBudgetSettings: () => void;
  onOpenPrintModal: () => void;
  onOpenSavingsTab: () => void;
}

export const BudgetingPage: React.FC<BudgetingPageProps> = ({
  onOpenBudgetSettings,
  onOpenPrintModal,
  onOpenSavingsTab,
}) => {
  const {
    savingsTargets,
    getBudgetStatusForMonth,
    settleMonthPostRemainder,
    recordTransfer,
    appCurrency,
  } = useFinance();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11

  const monthKey = getMonthKey(selectedYear, selectedMonth);
  const currentMonthKey = getCurrentMonthKey();
  const budgetStatus = useMemo(
    () => getBudgetStatusForMonth(monthKey),
    [getBudgetStatusForMonth, monthKey]
  );

  // Modal: Ambil dari Tabungan (AMBIL-DARI-TABUNGAN)
  const [isTakeFromSavingsOpen, setIsTakeFromSavingsOpen] = useState(false);
  const [takeTargetPost, setTakeTargetPost] = useState<{ id: string; name: string } | null>(null);
  const [selectedSavingsId, setSelectedSavingsId] = useState<string>('');
  const [takeAmountRaw, setTakeAmountRaw] = useState<string>('');
  const [takeNotes, setTakeNotes] = useState<string>('');
  const [takeError, setTakeError] = useState<string>('');
  const [takeSuccess, setTakeSuccess] = useState<string>('');

  // Modal / inline state: Sisa Akhir Bulan per pos
  const [settlingPost, setSettlingPost] = useState<PostUsageSummary | null>(null);
  const [settlementAction, setSettlementAction] = useState<RemainderActionType>('to_savings');
  const [settlementSavingsId, setSettlementSavingsId] = useState<string>('');
  const [settlementError, setSettlementError] = useState<string>('');

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const openTakeFromSavings = (postId: string, postName: string) => {
    setTakeTargetPost({ id: postId, name: postName });
    setSelectedSavingsId(savingsTargets[0]?.id || '');
    setTakeAmountRaw('');
    setTakeNotes('');
    setTakeError('');
    setTakeSuccess('');
    setIsTakeFromSavingsOpen(true);
  };

  const selectedSavingsObj = savingsTargets.find((s) => s.id === selectedSavingsId);
  const takeAmount = parseRupiahInput(takeAmountRaw);

  // Live impact preview on savings target progress
  const savingsImpactPreview = useMemo(() => {
    if (!selectedSavingsObj || takeAmount <= 0) return null;
    const beforeBal = selectedSavingsObj.current_amount || 0;
    const targetAmt = selectedSavingsObj.target_amount || 1;
    const afterBal = Math.max(0, beforeBal - takeAmount);
    const beforePct = Math.min(100, Math.round((beforeBal / targetAmt) * 100));
    const afterPct = Math.min(100, Math.round((afterBal / targetAmt) * 100));
    return { beforeBal, afterBal, beforePct, afterPct, sufficient: takeAmount <= beforeBal };
  }, [selectedSavingsObj, takeAmount]);

  const handleSubmitTakeFromSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    setTakeError('');
    if (!takeTargetPost || !selectedSavingsObj) {
      setTakeError('Pilih pos tabungan terlebih dahulu.');
      return;
    }
    if (takeAmount <= 0) {
      setTakeError('Nominal harus lebih dari 0.');
      return;
    }
    if (takeAmount > (selectedSavingsObj.current_amount || 0)) {
      setTakeError('Saldo pos tabungan yang dipilih tidak mencukupi.');
      return;
    }

    const res = await recordTransfer({
      from: { type: 'savings_target', id: selectedSavingsObj.id, label: selectedSavingsObj.name },
      to: { type: 'budget_post', id: takeTargetPost.id, label: takeTargetPost.name },
      amount: takeAmount,
      date: new Date().toISOString().split('T')[0],
      notes: takeNotes.trim() || `Tambahan dana untuk ${takeTargetPost.name}`,
    });

    if (res.error) {
      setTakeError(res.error);
    } else {
      setTakeSuccess(
        `Berhasil mengambil ${formatRupiah(takeAmount)} dari ${selectedSavingsObj.name} ke ${takeTargetPost.name}.`
      );
      setTimeout(() => setIsTakeFromSavingsOpen(false), 1100);
    }
  };

  const openSettleModal = (summary: PostUsageSummary) => {
    setSettlingPost(summary);
    setSettlementAction('to_savings');
    setSettlementSavingsId(savingsTargets[0]?.id || '');
    setSettlementError('');
  };

  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingPost) return;
    setSettlementError('');

    if (settlementAction === 'to_savings' && !settlementSavingsId) {
      setSettlementError('Pilih pos tabungan tujuan terlebih dahulu.');
      return;
    }

    const res = await settleMonthPostRemainder({
      monthKey,
      postId: settlingPost.post.id,
      postName: settlingPost.post.name,
      amount: Math.max(0, settlingPost.remaining),
      action: settlementAction,
      targetSavingsId: settlementAction === 'to_savings' ? settlementSavingsId : undefined,
    });

    if (res.error) {
      setSettlementError(res.error);
    } else {
      setSettlingPost(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-finance-600 text-white shadow-sm">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Pantauan Budgeting Bulanan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alokasi pemasukan per pos, progres pemakaian, dan pengelolaan sisa akhir bulan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-700 text-finance-700 dark:text-finance-300 text-xs font-bold hover:bg-finance-50 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={onOpenBudgetSettings}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Atur Proporsi Budget</span>
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={handlePrevMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-cream-100 dark:bg-slate-800 hover:bg-finance-50 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <ChevronLeft className="w-4 h-4 text-finance-600" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="text-center">
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {formatMonthKeyLabel(monthKey)}
          </span>
          {monthKey === currentMonthKey && (
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-finance-100 text-finance-700 font-bold">
              Bulan Berjalan
            </span>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-cream-100 dark:bg-slate-800 hover:bg-finance-50 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="w-4 h-4 text-finance-600" />
        </button>
      </div>

      {/* Empty State if no budgeting configured for this month */}
      {!budgetStatus.config ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4">
          <div className="flex justify-center">
            <CatFinnySvg mood="neutral" size={110} idPrefix="budgetEmptyCat" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Budgeting {formatMonthKeyLabel(monthKey)} Belum Diatur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Isi total pemasukan bulanan secara manual dan bagi ke pos-pos pilihanmu (misalnya Biaya Bulanan, Investasi, Nabung). Pengaturan baru berlaku untuk bulan berjalan ke depan tanpa mengubah data bulan lalu.
            </p>
          </div>
          <button
            onClick={onOpenBudgetSettings}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-md transition-all"
          >
            <Settings className="w-4 h-4" />
            Atur Budgeting Sekarang
          </button>
        </div>
      ) : (
        <>
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Total Pemasukan Rencana
              </span>
              <p className="text-xl font-black text-finance-700 dark:text-finance-300 mt-1">
                {formatRupiah(budgetStatus.plannedIncome)}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Pemasukan tercatat: {formatRupiah(budgetStatus.actualIncome)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Total Pengeluaran Bulan Ini
              </span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatRupiah(budgetStatus.actualExpense)}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Otomatis mengurangi pos Biaya Bulanan
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Setoran Tabungan Bulan Ini
              </span>
              <p className="text-xl font-black text-gold-600 dark:text-amber-400 mt-1">
                {formatRupiah(budgetStatus.actualNetSavingsDeposit)}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Via Transfer Kas ke pos tabungan
              </span>
            </div>
          </div>

          {/* Cards per Budget Post */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {budgetStatus.posts.map((item) => {
              const isExpensePost = item.post.kind === 'expense' || item.post.id === budgetStatus.primaryExpensePost?.post.id;
              const pctClamped = Math.min(100, Math.max(0, item.percentUsed));
              const isLowOrNegative = item.remaining <= 0 || item.percentUsed >= 85;

              return (
                <div
                  key={item.post.id}
                  className={`rounded-3xl bg-white dark:bg-slate-900 border p-5 shadow-sm space-y-4 ${
                    item.isOverBudget
                      ? 'border-rose-300 dark:border-rose-800'
                      : 'border-finance-200 dark:border-slate-800'
                  }`}
                >
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {item.post.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.post.percent}%
                        </span>
                        {item.rolloverIn > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-finance-100 text-finance-700">
                            +Rollover {formatRupiah(item.rolloverIn)}
                          </span>
                        )}
                        {item.transferIn > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-600">
                            +Transfer {formatRupiah(item.transferIn)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Terpakai <strong>{formatRupiah(item.spent)}</strong> dari{' '}
                        <strong>{formatRupiah(item.effectiveBudget)}</strong>
                      </p>
                    </div>

                    <span
                      className={`text-sm font-black ${
                        item.isOverBudget
                          ? 'text-rose-600'
                          : item.remaining >= 0
                          ? 'text-finance-700 dark:text-finance-300'
                          : 'text-rose-600'
                      }`}
                    >
                      {item.percentUsed}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-cream-200 dark:bg-slate-800 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isOverBudget
                            ? 'bg-rose-500'
                            : item.percentUsed >= 85
                            ? 'bg-gold-500'
                            : 'bg-finance-500'
                        }`}
                        style={{ width: `${pctClamped}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={item.remaining < 0 ? 'text-rose-600 flex items-center gap-1' : 'text-finance-700 dark:text-finance-300'}>
                        {item.remaining < 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.remaining >= 0
                          ? `Sisa: ${formatRupiah(item.remaining)}`
                          : `Melebihi: ${formatRupiah(Math.abs(item.remaining))}`}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Jatah awal {formatRupiah(item.allocated)}
                      </span>
                    </div>
                  </div>

                  {/* Category breakdown inside Biaya Bulanan */}
                  {isExpensePost && (
                    <div className="pt-3 border-t border-finance-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Rincian Kategori di {item.post.name}
                        </span>
                        {isLowOrNegative && (
                          <button
                            type="button"
                            onClick={() => openTakeFromSavings(item.post.id, item.post.name)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 text-[11px] font-extrabold shadow-xs"
                          >
                            <PiggyBank className="w-3.5 h-3.5" />
                            Ambil dari Tabungan
                          </button>
                        )}
                      </div>

                      {budgetStatus.expenseCategories.length === 0 ? (
                        <p className="text-xs text-slate-400">Belum ada pengeluaran kategori di bulan ini.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {budgetStatus.expenseCategories.map((cat) => (
                            <div
                              key={cat.categoryId}
                              className="flex items-center justify-between p-2 rounded-xl bg-cream-100/80 dark:bg-slate-950/50 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                                  style={{ backgroundColor: cat.categoryColor }}
                                >
                                  <CategoryIcon name={cat.categoryIcon} className="w-3 h-3" />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {cat.categoryName}
                                </span>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="font-extrabold text-slate-800 dark:text-white">
                                  {formatRupiah(cat.total)}
                                </span>
                                <span className="text-[10px] text-slate-500 ml-1.5">
                                  ({cat.percentOfExpense}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isLowOrNegative && savingsTargets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openTakeFromSavings(item.post.id, item.post.name)}
                          className="text-[11px] font-bold text-finance-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Butuh tambahan? Ambil dari Tabungan
                        </button>
                      )}
                    </div>
                  )}

                  {/* End-of-Month Remainder Handling */}
                  <div className="pt-3 border-t border-finance-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {item.settlement ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-finance-700 dark:text-finance-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Sisa akhir bulan ({formatRupiah(item.settlement.amount)}):{' '}
                          {item.settlement.action === 'to_savings'
                            ? `Dipindah ke ${item.settlement.targetSavingsName}`
                            : item.settlement.action === 'rollover'
                            ? 'Digulung ke bulan depan'
                            : 'Ditarik bebas'}
                        </span>
                      </div>
                    ) : item.remaining > 0 ? (
                      <>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Sisa akhir bulan: <strong className="text-slate-800 dark:text-white">{formatRupiah(item.remaining)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => openSettleModal(item)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-finance-50 dark:bg-slate-800 hover:bg-finance-100 text-finance-700 dark:text-finance-300 text-xs font-bold border border-finance-200 dark:border-slate-700"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          Kelola Sisa Akhir Bulan
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Tidak ada sisa anggaran di pos ini.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Ambil dari Tabungan */}
      {isTakeFromSavingsOpen && takeTargetPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsTakeFromSavingsOpen(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finance-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-100 text-gold-600">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ambil dari Tabungan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer kas ke pos {takeTargetPost.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTakeFromSavingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savingsTargets.length === 0 ? (
              <div className="p-4 rounded-2xl bg-cream-100 dark:bg-slate-950 text-center space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Belum ada pos tabungan aktif untuk diambil dananya.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsTakeFromSavingsOpen(false);
                    onOpenSavingsTab();
                  }}
                  className="px-4 py-2 rounded-xl bg-finance-600 text-white text-xs font-bold"
                >
                  Buat Pos Tabungan
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTakeFromSavings} className="space-y-4">
                {takeError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                    {takeError}
                  </div>
                )}
                {takeSuccess && (
                  <div className="p-2.5 rounded-xl bg-finance-50 border border-finance-200 text-finance-700 text-xs font-bold">
                    {takeSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pilih Pos Tabungan Sumber Dana
                  </label>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {savingsTargets.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedSavingsId(st.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          selectedSavingsId === st.id
                            ? 'bg-finance-50 dark:bg-finance-950/30 border-finance-500 ring-1 ring-finance-500'
                            : 'bg-cream-50 dark:bg-slate-950 border-finance-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {st.bank_name && <BankLogo bankName={st.bank_name} size="sm" />}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {st.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Target: {formatRupiah(st.target_amount)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-finance-700 dark:text-finance-300 shrink-0 ml-2">
                          {formatRupiah(st.current_amount || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Pengambilan ({appCurrency})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={takeAmountRaw ? Number(takeAmountRaw).toLocaleString('id-ID') : ''}
                    onChange={(e) => setTakeAmountRaw(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="500.000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-sm font-black"
                    required
                  />
                </div>

                {savingsImpactPreview && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      savingsImpactPreview.sufficient
                        ? 'bg-gold-50 border-gold-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-700'
                    }`}
                  >
                    {savingsImpactPreview.sufficient ? (
                      <span>
                        Dampak: Progres <strong>{selectedSavingsObj?.name}</strong> turun dari{' '}
                        <strong>{savingsImpactPreview.beforePct}%</strong> menjadi{' '}
                        <strong>{savingsImpactPreview.afterPct}%</strong> (sisa saldo{' '}
                        {formatRupiah(savingsImpactPreview.afterBal)}).
                      </span>
                    ) : (
                      <span>
                        Saldo {selectedSavingsObj?.name} hanya {formatRupiah(savingsImpactPreview.beforeBal)} — tidak mencukupi.
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={takeNotes}
                    onChange={(e) => setTakeNotes(e.target.value)}
                    placeholder="Contoh: Tambahan kebutuhan pokok akhir bulan"
                    className="w-full px-3.5 py-2 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTakeFromSavingsOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!savingsImpactPreview?.sufficient}
                    className="px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Catat Transfer Kas
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Kelola Sisa Akhir Bulan */}
      {settlingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSettlingPost(null)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finance-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Sisa Akhir Bulan: {settlingPost.post.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Sisa dana: <strong className="text-finance-700">{formatRupiah(settlingPost.remaining)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSettlingPost(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettlement} className="space-y-3.5">
              {settlementError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                  {settlementError}
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSettlementAction('to_savings')}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 ${
                    settlementAction === 'to_savings'
                      ? 'bg-finance-50 border-finance-500 ring-1 ring-finance-500'
                      : 'bg-cream-50 border-finance-100 dark:bg-slate-950 dark:border-slate-800'
                  }`}
                >
                  <PiggyBank className="w-5 h-5 text-finance-600 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Pindah ke Tabungan
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tercatat sebagai Transfer Kas ke target tabungan pilihanmu
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementAction('rollover')}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 ${
                    settlementAction === 'rollover'
                      ? 'bg-finance-50 border-finance-500 ring-1 ring-finance-500'
                      : 'bg-cream-50 border-finance-100 dark:bg-slate-950 dark:border-slate-800'
                  }`}
                >
                  <RotateCw className="w-5 h-5 text-gold-500 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Gulung ke Bulan Depan
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Menambah jatah anggaran pos ini di bulan berikutnya
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementAction('withdraw_free')}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 ${
                    settlementAction === 'withdraw_free'
                      ? 'bg-finance-50 border-finance-500 ring-1 ring-finance-500'
                      : 'bg-cream-50 border-finance-100 dark:bg-slate-950 dark:border-slate-800'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Tarik Bebas
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tandai sisa anggaran sebagai dana bebas di dompet utama
                    </p>
                  </div>
                </button>
              </div>

              {settlementAction === 'to_savings' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Target Tabungan Tujuan
                  </label>
                  {savingsTargets.length === 0 ? (
                    <p className="text-xs text-rose-600 font-semibold">
                      Belum ada pos tabungan aktif — buat dulu di halaman Tabungan.
                    </p>
                  ) : (
                    <select
                      value={settlementSavingsId}
                      onChange={(e) => setSettlementSavingsId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-bold"
                    >
                      {savingsTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({formatRupiah(t.current_amount || 0)} / {formatRupiah(t.target_amount)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingPost(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={settlementAction === 'to_savings' && savingsTargets.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  Simpan Pilihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
