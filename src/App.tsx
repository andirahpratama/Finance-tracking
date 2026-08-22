import React, { useState, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AnimatedMascot } from './components/mascot/AnimatedMascot';
import { StatCard } from './components/dashboard/StatCard';
import { CashflowChart } from './components/dashboard/CashflowChart';
import { CategoryPieChart } from './components/dashboard/CategoryPieChart';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionFilter } from './components/transactions/TransactionFilter';
import { TransactionModal } from './components/transactions/TransactionModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { AuthModal } from './components/auth/AuthModal';
import { exportTransactionsToCSV, printFinancialReport } from './lib/exportUtils';
import { FilterOptions, Transaction, TransactionType } from './types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart3,
  ListOrdered,
  Plus,
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
    savingsRate,
    deleteTransaction,
  } = useFinance();

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    type: 'all',
    categoryId: '',
    period: 'all',
  });

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search term filter (notes or category name)
      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const matchNotes = (t.notes || '').toLowerCase().includes(query);
        const matchCategory = (t.category_name || '').toLowerCase().includes(query);
        if (!matchNotes && !matchCategory) return false;
      }

      // Type filter
      if (filters.type !== 'all' && t.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.categoryId && t.category_id !== filters.categoryId) {
        return false;
      }

      // Period filter
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

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalType(tx.type);
    setIsTransactionModalOpen(true);
  };

  // Export handlers
  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, `finance-tracking-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrintReport = () => {
    const currentMonthName = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    printFinancialReport(filteredTransactions, {
      totalIncome,
      totalExpense,
      totalBalance,
      monthName: currentMonthName,
    });
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
      {/* Top Navigation */}
      <Navbar
        onOpenIncomeModal={handleOpenIncome}
        onOpenExpenseModal={handleOpenExpense}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Animated Mascot & Live Mood Section */}
        <AnimatedMascot balance={totalBalance} />

        {/* 2. KPI Summary Cards Grid */}
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
          <StatCard
            title="Tingkat Tabungan"
            amount={savingsRate}
            icon={Percent}
            variant="purple"
            subtitle="Persentase dari Pemasukan"
            badge={`${savingsRate}%`}
          />
        </div>

        {/* 3. Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cashflow Chart (2 Columns) */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Arus Kas (Pemasukan vs Pengeluaran)</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Grafik tren transaksi real-time</span>
                </div>
              </div>
            </div>
            <CashflowChart transactions={transactions} />
          </div>

          {/* Category Donut Breakdown Chart (1 Column) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-sm dark:shadow-xl transition-colors duration-200">
            <CategoryPieChart transactions={transactions} />
          </div>
        </div>

        {/* 4. Transactions List & Filter Section */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-5 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Riwayat Transaksi</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredTransactions.length} dari total {transactions.length} transaksi
                </span>
              </div>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={handleOpenExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
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
            onEdit={handleEditTransaction}
            onDelete={deleteTransaction}
            onAddNew={handleOpenExpense}
          />
        </div>
      </main>

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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
export default App;
