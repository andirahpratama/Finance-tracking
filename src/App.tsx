import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav, TabType } from './components/layout/MobileBottomNav';
import { AnimatedMascot } from './components/mascot/AnimatedMascot';
import { VerdictCard } from './components/dashboard/VerdictCard';
import { MonthlyBudgetHeroCard } from './components/dashboard/MonthlyBudgetHeroCard';
import { MoneyTrailCard } from './components/dashboard/MoneyTrailCard';
import { SmartTipsCard } from './components/dashboard/SmartTipsCard';
import { StatCard } from './components/dashboard/StatCard';
import { SavingsTargetCard } from './components/dashboard/SavingsTargetCard';
import { SavingsTargetModal } from './components/dashboard/SavingsTargetModal';
import { MonthlyActivityCalendar } from './components/dashboard/MonthlyActivityCalendar';
import { CashflowChart } from './components/dashboard/CashflowChart';
import { CategoryPieChart } from './components/dashboard/CategoryPieChart';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionFilter } from './components/transactions/TransactionFilter';
import { TransactionModal } from './components/transactions/TransactionModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { PrintReportModal } from './components/reports/PrintReportModal';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileSettingsModal } from './components/profile/ProfileSettingsModal';
import { FeedbackModal } from './components/profile/FeedbackModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BudgetingPage } from './components/budgeting/BudgetingPage';
import { InvestmentPage } from './components/invest/InvestmentPage';
import { UtangPiutangPage } from './components/debt/UtangPiutangPage';
import { exportTransactionsToCSV } from './lib/exportUtils';
import { formatRupiah } from './lib/formatters';
import { getAppSettings, applyFavicon } from './lib/appSettings';
import { checkAndTriggerAutoPing } from './lib/supabasePing';
import { isSavingsTransaction } from './lib/savingsUtils';
import { FilterOptions, Transaction, TransactionType, AppSettings, SavingsTargetItem, SavingsActionType } from './types';
import { SmartCalculators } from './components/calculators/SmartCalculators';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ListOrdered,
  Plus,
  ArrowRight,
  Target,
  Calculator,
  PieChart,
  HandCoins,
  Printer,
  Zap,
} from 'lucide-react';

export const App: React.FC = () => {
  useAuth();
  const {
    categories,
    transactions,
    isLoading,
    totalIncome,
    totalExpense,
    totalBalance,
    thisMonthIncome,
    thisMonthExpense,
    deleteTransaction,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Admin Route & Auth State
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.endsWith('/admin') || window.location.hash === '#admin';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ft_admin_authenticated') === 'true';
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings());

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType | 'savings'>('expense');
  const [transactionModalDate, setTransactionModalDate] = useState<string | undefined>(undefined);
  const [txModalSavingsTargetId, setTxModalSavingsTargetId] = useState<string | undefined>(undefined);
  const [txModalSavingsAction, setTxModalSavingsAction] = useState<SavingsActionType | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavingsTargetModalOpen, setIsSavingsTargetModalOpen] = useState(false);
  const [savingsModalInitialData, setSavingsModalInitialData] = useState<Partial<SavingsTargetItem> | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'budgeting' | 'agent'>('profile');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleCreateSavingsTargetFromCalc = (item: Partial<SavingsTargetItem>) => {
    setSavingsModalInitialData(item);
    setIsSavingsTargetModalOpen(true);
  };

  useEffect(() => {
    if (appSettings.customFavicon) {
      applyFavicon(appSettings.customFavicon);
    }

    const checkAdminRoute = () => {
      const pathIsAdmin = window.location.pathname.endsWith('/admin') || window.location.hash === '#admin';
      setIsAdminRoute(pathIsAdmin);
    };

    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, [appSettings]);

  // Keep-Alive Supabase: Auto Ping 3 Hari Sekali
  useEffect(() => {
    checkAndTriggerAutoPing();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndTriggerAutoPing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalTimer = setInterval(() => {
      checkAndTriggerAutoPing();
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalTimer);
    };
  }, []);

  const handleExitAdmin = () => {
    if (window.location.hash === '#admin') {
      window.location.hash = '';
    } else if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
    setIsAdminRoute(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('ft_admin_authenticated');
    setIsAdminAuthenticated(false);
  };

  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    type: 'all',
    categoryId: '',
    period: 'monthly',
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
    selectedDay: new Date().getDate(),
  });

  const openingBalance = useMemo(() => {
    if (filters.period === 'all') return 0;

    const year = filters.selectedYear ?? new Date().getFullYear();
    const month = filters.selectedMonth ?? new Date().getMonth();
    const day = filters.selectedDay ?? new Date().getDate();

    let cutoffDate: Date;

    if (filters.period === 'daily') {
      cutoffDate = new Date(year, month, day);
    } else if (filters.period === 'monthly' || filters.period === 'this_month' || filters.period === 'last_month') {
      cutoffDate = new Date(year, month, 1);
    } else if (filters.period === 'yearly' || filters.period === 'this_year') {
      cutoffDate = new Date(year, 0, 1);
    } else {
      return 0;
    }

    let priorInc = 0;
    let priorExp = 0;

    transactions.forEach((t) => {
      const parts = t.date.split('T')[0].split('-');
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10) - 1;
      const txDay = parseInt(parts[2], 10);
      const txDate = new Date(txYear, txMonth, txDay);

      if (txDate < cutoffDate) {
        const isSav = isSavingsTransaction(t);
        const isDeposit = t.notes?.includes('Setor') || t.savings_action === 'deposit' || (isSav && t.type === 'expense');
        const isWithdraw = t.notes?.includes('Tarik') || t.savings_action === 'withdraw' || (isSav && t.type === 'income');
        const amt = Number(t.amount) || 0;

        if (isSav) {
          if (isDeposit) priorExp += amt;
          else if (isWithdraw) priorInc += amt;
        } else {
          if (t.type === 'income') priorInc += amt;
          else priorExp += amt;
        }
      }
    });

    return priorInc - priorExp;
  }, [transactions, filters]);

  const filteredTransactions = useMemo(() => {
    const year = filters.selectedYear ?? new Date().getFullYear();
    const month = filters.selectedMonth ?? new Date().getMonth();
    const day = filters.selectedDay ?? new Date().getDate();

    return transactions.filter((t) => {
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const matchNotes = (t.notes || '').toLowerCase().includes(query);
        const matchCategory = (t.category_name || '').toLowerCase().includes(query);
        if (!matchNotes && !matchCategory) return false;
      }

      if (filters.type !== 'all') {
        const isSavings =
          isSavingsTransaction(t) ||
          (t.category_name || '').toLowerCase().includes('tabungan') ||
          (t.notes || '').toLowerCase().includes('tabungan') ||
          t.category_icon === 'PiggyBank';

        if (filters.type === 'savings') {
          if (!isSavings) return false;
        } else if (filters.type === 'expense') {
          if (isSavings || t.type !== 'expense') return false;
        } else if (filters.type === 'income') {
          if (isSavings || t.type !== 'income') return false;
        }
      }

      if (filters.categoryId && t.category_id !== filters.categoryId) {
        return false;
      }

      if (filters.period !== 'all') {
        const parts = t.date.split('T')[0].split('-');
        const txYear = parseInt(parts[0], 10);
        const txMonth = parseInt(parts[1], 10) - 1;
        const txDay = parseInt(parts[2], 10);

        if (filters.period === 'daily') {
          if (txYear !== year || txMonth !== month || txDay !== day) return false;
        } else if (filters.period === 'monthly' || filters.period === 'this_month') {
          if (txYear !== year || txMonth !== month) return false;
        } else if (filters.period === 'last_month') {
          const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
          if (txYear !== lastMonth.getFullYear() || txMonth !== lastMonth.getMonth()) return false;
        } else if (filters.period === 'yearly' || filters.period === 'this_year') {
          if (txYear !== year) return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  const handleOpenIncome = () => {
    setEditingTransaction(null);
    setTxModalSavingsTargetId(undefined);
    setTxModalSavingsAction(undefined);
    setTransactionModalType('income');
    setIsTransactionModalOpen(true);
  };

  const handleOpenExpense = (customDate?: string | React.MouseEvent) => {
    setEditingTransaction(null);
    setTxModalSavingsTargetId(undefined);
    setTxModalSavingsAction(undefined);
    setTransactionModalType('expense');
    setTransactionModalDate(typeof customDate === 'string' ? customDate : undefined);
    setIsTransactionModalOpen(true);
  };

  const handleOpenSavings = (targetId?: string, action?: SavingsActionType) => {
    setEditingTransaction(null);
    setTxModalSavingsTargetId(targetId);
    setTxModalSavingsAction(action);
    setTransactionModalType('savings');
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalType(tx.type);
    setIsTransactionModalOpen(true);
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, `finance-tracking-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrintReport = () => {
    setIsPrintModalOpen(true);
  };

  const openProfileSettings = (tab: 'profile' | 'budgeting' | 'agent' = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileModalOpen(true);
  };

  // Hidden Admin Route view
  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLoginModal
          onLoginSuccess={() => setIsAdminAuthenticated(true)}
          onBackToApp={handleExitAdmin}
        />
      );
    }
    return (
      <AdminDashboard
        onLogoutAdmin={handleAdminLogout}
        onBackToApp={handleExitAdmin}
        onSettingsUpdated={(newSettings) => setAppSettings(newSettings)}
      />
    );
  }

  // Daily allowance helper for Home StatCard
  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.round(totalBalance / remainingDays);
  const hasAnyTransactions = transactions.length > 0;

  return (
    <div className="min-h-screen bg-[#FAF8F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-finance-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenIncomeModal={handleOpenIncome}
        onOpenExpenseModal={handleOpenExpense}
        onOpenSavingsModal={() => handleOpenSavings()}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSavingsTargetModal={() => {
          setSavingsModalInitialData(null);
          setIsSavingsTargetModalOpen(true);
        }}
        onOpenProfileSettings={() => openProfileSettings('profile')}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        customLogo={appSettings.customLogo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 lg:pb-8 space-y-5 sm:space-y-6">

        {/* ================= 1. HOME TAB ================= */}
        {activeTab === 'home' && (
          isLoading ? (
            /* BUG-LOADING-0: Tampilkan skeleton loading saat data belum termuat (bukan Rp0 'Belum ada input') */
            <div className="space-y-5 animate-pulse" aria-label="Memuat data keuangan">
              <div className="h-44 rounded-3xl bg-white/80 dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800 p-6 flex items-center gap-5">
                <div className="w-28 h-28 rounded-full bg-cream-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 rounded-lg bg-cream-200 dark:bg-slate-800" />
                  <div className="h-4 w-72 rounded-lg bg-cream-200 dark:bg-slate-800" />
                  <div className="h-12 w-full rounded-2xl bg-cream-200 dark:bg-slate-800" />
                </div>
              </div>
              <div className="h-28 rounded-3xl bg-white/80 dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800" />
              <div className="h-48 rounded-3xl bg-white/80 dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-28 rounded-2xl bg-white/80 dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800" />
                <div className="h-28 rounded-2xl bg-white/80 dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800" />
                <div className="h-28 rounded-2xl bg-white/80 dark:bg-slate-900 border border-finance-200/70 dark:border-slate-800" />
              </div>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
              {/* Quick Sticky Catat Cepat Bar (Desktop & Mobile accessible without scrolling far) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Zap className="w-4 h-4 text-gold-500" />
                  <span>Catat Cepat Transaksi Hari Ini</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenExpense()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Catat Pengeluaran
                  </button>
                  <button
                    onClick={handleOpenIncome}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Catat Pemasukan
                  </button>
                </div>
              </div>

              {/* (1) Sapaan + Maskot Finny (Kucing Oren) */}
              <AnimatedMascot balance={totalBalance} onOpenSettings={() => openProfileSettings('budgeting')} />

              {/* (2) Kartu Verdict Singkat */}
              <VerdictCard
                onOpenBudgeting={() => setActiveTab('budgeting')}
                onOpenSettings={() => openProfileSettings('budgeting')}
              />

              {/* (3) Kartu Besar Biaya Bulanan + Rincian Kategori */}
              <MonthlyBudgetHeroCard
                onOpenBudgeting={() => setActiveTab('budgeting')}
                onOpenSettings={() => openProfileSettings('budgeting')}
                onTakeFromSavings={() => setActiveTab('budgeting')}
              />

              {/* (4) Kartu Ringkasan Jejak Uang */}
              <MoneyTrailCard />

              {/* (5) Total Saldo, Pemasukan/Pengeluaran Bulan Ini, Sisa Uang Harian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Saldo Saat Ini"
                  amount={totalBalance}
                  icon={Wallet}
                  variant={totalBalance >= 0 ? 'emerald' : 'rose'}
                  subtitle={totalBalance >= 1000000 ? 'Zona Aman' : totalBalance >= 500000 ? 'Zona Waspada' : 'Zona Kritis'}
                  badge={totalBalance >= 0 ? 'Surplus' : 'Defisit'}
                  isNegative={totalBalance < 0}
                />
                <StatCard
                  title="Pemasukan Bulan Ini"
                  amount={thisMonthIncome}
                  icon={TrendingUp}
                  variant="emerald"
                  subtitle={
                    !hasAnyTransactions
                      ? 'Belum ada input'
                      : thisMonthIncome === 0
                      ? 'Belum ada pemasukan bulan ini'
                      : `Total Riwayat: ${formatRupiah(totalIncome)}`
                  }
                />
                <StatCard
                  title="Pengeluaran Bulan Ini"
                  amount={thisMonthExpense}
                  icon={TrendingDown}
                  variant="rose"
                  subtitle={
                    !hasAnyTransactions
                      ? 'Belum ada input'
                      : thisMonthExpense === 0
                      ? 'Belum ada pengeluaran bulan ini'
                      : `Total Riwayat: ${formatRupiah(totalExpense)}`
                  }
                />
                <StatCard
                  title="Sisa Uang Harian"
                  amount={dailyAllowance}
                  icon={Wallet}
                  variant={dailyAllowance >= 0 ? 'blue' : 'rose'}
                  subtitle={`Untuk ${remainingDays} hari tersisa bulan ini`}
                  isNegative={dailyAllowance < 0}
                />
              </div>

              {/* Tips & Analisa Otomatis Bulanan */}
              <SmartTipsCard />

              {/* (6) Kalender Bulanan */}
              <MonthlyActivityCalendar
                transactions={transactions}
                onOpenAddExpense={(dateStr) => handleOpenExpense(dateStr)}
                onEditTransaction={handleEditTransaction}
              />

              {/* (7) Akses Cepat Fitur */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-finance-200/80 dark:border-slate-800 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Akses Cepat Menu Keuangan
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    { id: 'budgeting' as TabType, label: 'Budgeting', sub: 'Pos & Sisa', icon: PieChart },
                    { id: 'tabungan' as TabType, label: 'Tabungan', sub: 'Target & Bank', icon: Target },
                    { id: 'investasi' as TabType, label: 'Investasi', sub: 'Emas & Aset', icon: TrendingUp },
                    { id: 'utang' as TabType, label: 'Utang Piutang', sub: 'Buku Catatan', icon: HandCoins },
                    { id: 'rekap' as TabType, label: 'Rekap Grafik', sub: 'Grafik & Donat', icon: BarChart3 },
                    { id: 'kalkulator' as TabType, label: 'Kalkulator', sub: 'Darurat & KPR', icon: Calculator },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-cream-100/80 dark:bg-slate-950/60 border border-finance-200/60 dark:border-slate-800 text-finance-800 dark:text-slate-200 hover:bg-finance-50 hover:border-finance-400 transition-all group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-finance-600 shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-xs font-bold truncate">{item.label}</p>
                            <p className="text-[10px] text-slate-500 truncate hidden sm:block">{item.sub}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-finance-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}

        {/* ================= 2. BUDGETING TAB ================= */}
        {activeTab === 'budgeting' && (
          <BudgetingPage
            onOpenBudgetSettings={() => openProfileSettings('budgeting')}
            onOpenPrintModal={handlePrintReport}
            onOpenSavingsTab={() => setActiveTab('tabungan')}
          />
        )}

        {/* ================= 3. TABUNGAN TAB ================= */}
        {activeTab === 'tabungan' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Target & Pos Tabungan Keluarga
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Catat pos tabungan lengkap dengan bank penyimpan, saldo awal opsional, dan progres target
              </p>
            </div>

            <SavingsTargetCard
              showSummaryStats={true}
              onOpenTargetModal={(initial) => {
                setSavingsModalInitialData(initial || null);
                setIsSavingsTargetModalOpen(true);
              }}
              onOpenSavingsModal={(targetId, action) => handleOpenSavings(targetId, action)}
            />
          </div>
        )}

        {/* ================= 4. INVESTASI TAB ================= */}
        {activeTab === 'investasi' && <InvestmentPage />}

        {/* ================= 5. UTANG PIUTANG TAB ================= */}
        {activeTab === 'utang' && <UtangPiutangPage />}

        {/* ================= 6. REKAP TAB (GRAFIK + TIPS + PDF) ================= */}
        {activeTab === 'rekap' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Rekap & Analisis Grafik
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualisasi arus kas harian, bulanan, distribusi pengeluaran & tips otomatis
                </p>
              </div>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                Ekspor Laporan Bulanan (PDF)
              </button>
            </div>

            {isLoading ? (
              <div className="h-72 rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 animate-pulse" />
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                  <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-finance-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-xl bg-finance-100 text-finance-700">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Analisis Arus Kas & Tabungan
                        </h3>
                        <span className="text-xs text-slate-500">Grafik perbandingan harian, bulanan & tahunan</span>
                      </div>
                    </div>
                    <CashflowChart transactions={transactions} />
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-finance-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs">
                    <CategoryPieChart transactions={transactions} />
                  </div>
                </div>

                <SmartTipsCard />
              </>
            )}
          </div>
        )}

        {/* ================= 7. HISTORY TAB ================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-finance-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-finance-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-finance-100 text-finance-700">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      History Arus Kas Keuangan
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Menampilkan {filteredTransactions.length} dari total {transactions.length} transaksi
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenExpense()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Catat Transaksi Baru
                </button>
              </div>

              <TransactionFilter
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                onExportCSV={handleExportCSV}
                onPrintReport={handlePrintReport}
              />

              <TransactionList
                transactions={filteredTransactions}
                openingBalance={openingBalance}
                onEdit={handleEditTransaction}
                onDelete={deleteTransaction}
                onAddNew={() => handleOpenExpense()}
              />
            </div>
          </div>
        )}

        {/* ================= 8. KALKULATOR TAB ================= */}
        {activeTab === 'kalkulator' && (
          <SmartCalculators onCreateSavingsTarget={handleCreateSavingsTargetFromCalc} />
        )}
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExpenseModal={() => handleOpenExpense()}
        onOpenIncomeModal={handleOpenIncome}
        onOpenSavingsModal={() => handleOpenSavings()}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenProfileSettings={() => openProfileSettings('profile')}
      />

      <Footer />

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionModalDate(undefined);
          setTxModalSavingsTargetId(undefined);
          setTxModalSavingsAction(undefined);
        }}
        initialType={transactionModalType}
        editingTransaction={editingTransaction}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        initialDate={transactionModalDate}
        initialSavingsTargetId={txModalSavingsTargetId}
        initialSavingsAction={txModalSavingsAction}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <SavingsTargetModal
        isOpen={isSavingsTargetModalOpen}
        onClose={() => {
          setIsSavingsTargetModalOpen(false);
          setSavingsModalInitialData(null);
        }}
        initialData={savingsModalInitialData}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileInitialTab}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};

export default App;
