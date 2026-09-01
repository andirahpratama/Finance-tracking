import React, { useState, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav, TabType } from './components/layout/MobileBottomNav';
import { AnimatedMascot } from './components/mascot/AnimatedMascot';
import { StatCard } from './components/dashboard/StatCard';
import { SavingsTargetCard } from './components/dashboard/SavingsTargetCard';
import { SavingsTargetModal } from './components/dashboard/SavingsTargetModal';
import { CashflowChart } from './components/dashboard/CashflowChart';
import { CategoryPieChart } from './components/dashboard/CategoryPieChart';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionFilter } from './components/transactions/TransactionFilter';
import { TransactionModal } from './components/transactions/TransactionModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { PrintReportModal } from './components/reports/PrintReportModal';
import { AuthModal } from './components/auth/AuthModal';
import { exportTransactionsToCSV } from './lib/exportUtils';
import { FilterOptions, Transaction, TransactionType } from './types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ListOrdered,
  Plus,
  ArrowRight,
  Receipt,
  Target,
} from 'lucide-react';

export const App: React.FC = () => {
  const { isLoading: authLoading } = useAuth();
  const {
    categories,
    transactions,
    isLoading: financeLoading,
    totalIncome,
    totalExpense,
    totalBalance,
    thisMonthIncome,
    thisMonthExpense,
    deleteTransaction,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType | 'savings'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavingsTargetModalOpen, setIsSavingsTargetModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filters state (Default to 'this_month' for isolated monthly history)
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    type: 'all',
    categoryId: '',
    period: 'this_month',
  });

  // Opening balance carried over from prior months ("Saldo dari bulan sebelumnya")
  const openingBalance = useMemo(() => {
    if (filters.period === 'all') return 0;

    const now = new Date();
    let cutoffDate: Date;

    if (filters.period === 'this_month') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filters.period === 'last_month') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (filters.period === 'this_year') {
      cutoffDate = new Date(now.getFullYear(), 0, 1);
    } else {
      return 0;
    }

    let priorInc = 0;
    let priorExp = 0;

    transactions.forEach((t) => {
      const txDate = new Date(t.date);
      if (txDate < cutoffDate) {
        if (t.type === 'income') priorInc += Number(t.amount) || 0;
        else priorExp += Number(t.amount) || 0;
      }
    });

    return priorInc - priorExp;
  }, [transactions, filters.period]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const matchNotes = (t.notes || '').toLowerCase().includes(query);
        const matchCategory = (t.category_name || '').toLowerCase().includes(query);
        if (!matchNotes && !matchCategory) return false;
      }

      if (filters.type !== 'all' && t.type !== filters.type) {
        return false;
      }

      if (filters.categoryId && t.category_id !== filters.categoryId) {
        return false;
      }

      if (filters.period !== 'all') {
        const txDate = new Date(t.date);
        const now = new Date();

        if (filters.period === 'this_month') {
          if (
            txDate.getMonth() !== now.getMonth() ||
            txDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (filters.period === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (
            txDate.getMonth() !== lastMonth.getMonth() ||
            txDate.getFullYear() !== lastMonth.getFullYear()
          ) {
            return false;
          }
        } else if (filters.period === 'this_year') {
          if (txDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [transactions, filters]);

  // Quick Open Modal Handlers
  const handleOpenIncome = () => {
    setEditingTransaction(null);
    setTransactionModalType('income');
    setIsTransactionModalOpen(true);
  };

  const handleOpenExpense = () => {
    setEditingTransaction(null);
    setTransactionModalType('expense');
    setIsTransactionModalOpen(true);
  };

  const handleOpenSavings = () => {
    setEditingTransaction(null);
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

  if (authLoading || financeLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center animate-bounce shadow-xl shadow-emerald-500/20 dark:shadow-emerald-950">
          <Wallet className="w-6 h-6 text-white dark:text-slate-950" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white animate-pulse">Memuat Finance Tracking...</p>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Menyiapkan database & maskot</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar with PC Floating Tab Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenIncomeModal={handleOpenIncome}
        onOpenExpenseModal={handleOpenExpense}
        onOpenSavingsModal={handleOpenSavings}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSavingsTargetModal={() => setIsSavingsTargetModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        
        {/* ================= 1. HOME TAB ================= */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Animated Mascot & Greeting */}
            <AnimatedMascot balance={totalBalance} />

            {/* Home Only KPI Summary Cards Grid (Total Saldo, Total Pemasukan, Total Pengeluaran) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
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
                title="Total Pemasukan"
                amount={totalIncome}
                icon={TrendingUp}
                variant="emerald"
                subtitle={`Bulan Ini: Rp ${thisMonthIncome.toLocaleString('id-ID')}`}
              />
              <StatCard
                title="Total Pengeluaran"
                amount={totalExpense}
                icon={TrendingDown}
                variant="rose"
                subtitle={`Bulan Ini: Rp ${thisMonthExpense.toLocaleString('id-ID')}`}
              />
            </div>

            {/* Quick Menu Shortcuts Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-xl">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Akses Cepat Fitur Keuangan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('rekap')}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold">Rekap Grafik</p>
                      <p className="text-[10px] text-purple-600/70 dark:text-purple-300/70 hidden sm:block">Grafik & Donat</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-5 h-5 text-cyan-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold">History Catatan</p>
                      <p className="text-[10px] text-cyan-600/70 dark:text-cyan-300/70 hidden sm:block">Arus Kas Keuangan</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('tabungan')}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all group col-span-2 sm:col-span-1"
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-5 h-5 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold">Target Tabungan</p>
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-300/70 hidden sm:block">Progres Menabung</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. REKAP TAB (GRAFIK) ================= */}
        {activeTab === 'rekap' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Rekap & Analisis Grafik</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Visualisasi arus kas harian, bulanan & analisis kategori</p>
              </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Cashflow & Yearly Chart */}
              <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analisis Arus Kas & Tabungan</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Grafik perbandingan 1 tahun & tren harian</span>
                    </div>
                  </div>
                </div>
                <CashflowChart transactions={transactions} />
              </div>

              {/* Category Donut Breakdown Chart */}
              <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 backdrop-blur-xl shadow-sm dark:shadow-xl transition-colors duration-200">
                <CategoryPieChart transactions={transactions} />
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. HISTORY TAB (CATATAN ARUS KAS) ================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-4 sm:space-y-5 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">History Arus Kas Keuangan</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Menampilkan {filteredTransactions.length} dari total {transactions.length} transaksi
                    </span>
                  </div>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={handleOpenExpense}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/20 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Catat Transaksi Baru
                </button>
              </div>

              {/* Filter Controls */}
              <TransactionFilter
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                onExportCSV={handleExportCSV}
                onPrintReport={handlePrintReport}
              />

              {/* List of Transactions */}
              <TransactionList
                transactions={filteredTransactions}
                openingBalance={openingBalance}
                onEdit={handleEditTransaction}
                onDelete={deleteTransaction}
                onAddNew={handleOpenExpense}
              />
            </div>
          </div>
        )}

        {/* ================= 4. TABUNGAN TAB (TARGET TABUNGAN) ================= */}
        {activeTab === 'tabungan' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Target & Pos Tabungan Keluarga</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelola pos tabungan liburan, pendidikan, dana darurat, dan pensiun</p>
              </div>
            </div>

            {/* Savings Target Progress Card */}
            <SavingsTargetCard onOpenTargetModal={() => setIsSavingsTargetModalOpen(true)} />
          </div>
        )}

      </main>

      {/* Floating Bottom Navigation Bar (Mobile View) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExpenseModal={handleOpenExpense}
        onOpenIncomeModal={handleOpenIncome}
        onOpenSavingsModal={handleOpenSavings}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        initialType={transactionModalType}
        editingTransaction={editingTransaction}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <SavingsTargetModal
        isOpen={isSavingsTargetModalOpen}
        onClose={() => setIsSavingsTargetModalOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default App;
