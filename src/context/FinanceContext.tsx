import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, Transaction, TransactionType, YearlyCashflowSummary, MonthlyCashflowItem, BalanceThresholds, SavingsTargetItem, SavingsActionType } from '../types';
import { INITIAL_CATEGORIES, getInitialDemoTransactions, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../lib/defaultData';

export const DEFAULT_SAVINGS_TARGETS: SavingsTargetItem[] = [
  {
    id: 'preset-liburan',
    name: 'Tabungan Liburan',
    target_amount: 1000000,
    current_amount: 2500000,
    category_icon: 'Palmtree',
    color: '#06b6d4',
    is_default_preset: true,
  },
  {
    id: 'preset-pendidikan',
    name: 'Tabungan Pendidikan',
    target_amount: 2000000,
    current_amount: 5000000,
    category_icon: 'GraduationCap',
    color: '#3b82f6',
    is_default_preset: true,
  },
  {
    id: 'preset-darurat',
    name: 'Tabungan Dana Darurat',
    target_amount: 1500000,
    current_amount: 4500000,
    category_icon: 'ShieldAlert',
    color: '#10b981',
    is_default_preset: true,
  },
  {
    id: 'preset-pensiun',
    name: 'Tabungan Pensiun',
    target_amount: 2500000,
    current_amount: 8000000,
    category_icon: 'PiggyBank',
    color: '#8b5cf6',
    is_default_preset: true,
  },
];

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  savingsTargets: SavingsTargetItem[];
  isLoading: boolean;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  thisMonthSavings: number;
  savingsRate: number;
  monthlySavingsTarget: number;
  balanceThresholds: BalanceThresholds;
  thisMonthSavingsProgress: number;
  yearlySavingsTotal: number;
  yearlyTargetTotal: number;
  yearlySavingsProgress: number;
  availableYears: number[];
  getYearlySummary: (year: number) => YearlyCashflowSummary;
  updateSavingsTarget: (newTarget: number) => Promise<{ error: string | null }>;
  updateBalanceThresholds: (thresholds: BalanceThresholds) => Promise<{ error: string | null }>;
  addCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<{ error: string | null }>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<{ error: string | null }>;
  deleteCategory: (id: string) => Promise<{ error: string | null }>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<{ error: string | null }>;
  deleteTransaction: (id: string) => Promise<{ error: string | null }>;
  // Savings Target Items CRUD
  addSavingsTargetItem: (item: Omit<SavingsTargetItem, 'id' | 'user_id'>) => Promise<{ error: string | null }>;
  updateSavingsTargetItem: (id: string, partial: Partial<SavingsTargetItem>) => Promise<{ error: string | null }>;
  deleteSavingsTargetItem: (id: string) => Promise<{ error: string | null }>;
  recordSavingsTransaction: (targetId: string, amount: number, action: SavingsActionType, date: string, notes?: string) => Promise<{ error: string | null }>;
  resetToDefaultData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_SAVINGS_TARGET = 1500000;
const DEFAULT_BALANCE_SAFE = 100000; // Rp 100.000 / hari
const DEFAULT_BALANCE_WARNING = 50000; // Rp 50.000 / hari

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTargetItem[]>([]);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState<number>(DEFAULT_SAVINGS_TARGET);
  const [balanceThresholds, setBalanceThresholds] = useState<BalanceThresholds>({
    safe: DEFAULT_BALANCE_SAFE,
    warning: DEFAULT_BALANCE_WARNING,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  const getStorageKey = useCallback((prefix: string) => {
    return `ft_${prefix}_${user?.id || 'default'}`;
  }, [user?.id]);

  const loadData = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setTransactions([]);
      setSavingsTargets([]);
      setMonthlySavingsTarget(DEFAULT_SAVINGS_TARGET);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (configured && supabase && !isGuest) {
      try {
        // 1. Profile & Settings
        const { data: profileData } = await supabase
          .from('profiles')
          .select('monthly_savings_target, balance_safe_threshold, balance_warning_threshold')
          .eq('id', user.id)
          .single();

        if (profileData && profileData.monthly_savings_target) {
          setMonthlySavingsTarget(Number(profileData.monthly_savings_target));
        } else {
          const savedTarget = localStorage.getItem(getStorageKey('savings_target'));
          setMonthlySavingsTarget(savedTarget ? Number(savedTarget) : DEFAULT_SAVINGS_TARGET);
        }

        const safeVal = profileData?.balance_safe_threshold;
        const warnVal = profileData?.balance_warning_threshold;
        if (safeVal != null && warnVal != null) {
          setBalanceThresholds({ safe: Number(safeVal), warning: Number(warnVal) });
        }

        // 2. Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (catError) throw catError;
        let userCategories: Category[] = catData || [];

        if (userCategories.length === 0) {
          const defaultItems = [
            ...DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, user_id: user.id })),
            ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, user_id: user.id })),
          ];
          const { data: seeded } = await supabase
            .from('categories')
            .insert(defaultItems)
            .select();
          if (seeded) userCategories = seeded;
        }
        setCategories(userCategories);

        // 3. Transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*, categories(name, icon, color)')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (txError) throw txError;

        const formattedTx: Transaction[] = (txData || []).map((t: any) => ({
          id: t.id,
          user_id: t.user_id,
          category_id: t.category_id,
          category_name: t.categories?.name || 'Lainnya',
          category_icon: t.categories?.icon || 'Wallet',
          category_color: t.categories?.color || '#64748B',
          type: t.type as TransactionType,
          amount: Number(t.amount),
          date: t.date,
          notes: t.notes || '',
          created_at: t.created_at,
        }));
        setTransactions(formattedTx);

        // 4. Savings Targets (Local Storage or DB Fallback)
        const savedTargetsStr = localStorage.getItem(getStorageKey('savings_target_items'));
        if (savedTargetsStr) {
          try {
            setSavingsTargets(JSON.parse(savedTargetsStr));
          } catch {
            setSavingsTargets(DEFAULT_SAVINGS_TARGETS.map(t => ({ ...t, user_id: user.id })));
          }
        } else {
          const initialTargets = DEFAULT_SAVINGS_TARGETS.map(t => ({ ...t, user_id: user.id }));
          setSavingsTargets(initialTargets);
          localStorage.setItem(getStorageKey('savings_target_items'), JSON.stringify(initialTargets));
        }

      } catch (err) {
        console.error('Error loading Supabase data:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Demo / Local storage mode
      const catKey = getStorageKey('categories');
      const txKey = getStorageKey('transactions');
      const targetKey = getStorageKey('savings_target');
      const thresholdsKey = getStorageKey('balance_thresholds');
      const savingsItemsKey = getStorageKey('savings_target_items');

      const savedTarget = localStorage.getItem(targetKey);
      setMonthlySavingsTarget(savedTarget ? Number(savedTarget) : DEFAULT_SAVINGS_TARGET);

      const savedThresholds = localStorage.getItem(thresholdsKey);
      if (savedThresholds) {
        try { setBalanceThresholds(JSON.parse(savedThresholds)); } catch { /* ignore */ }
      }

      const savedCategories = localStorage.getItem(catKey);
      if (savedCategories) {
        try { setCategories(JSON.parse(savedCategories)); } catch { setCategories(INITIAL_CATEGORIES); }
      } else {
        setCategories(INITIAL_CATEGORIES);
      }

      const savedTransactions = localStorage.getItem(txKey);
      if (savedTransactions) {
        try { setTransactions(JSON.parse(savedTransactions)); } catch { setTransactions(getInitialDemoTransactions(user.id)); }
      } else {
        const initial = getInitialDemoTransactions(user.id);
        setTransactions(initial);
        localStorage.setItem(txKey, JSON.stringify(initial));
      }

      // Savings Targets
      const savedTargetsStr = localStorage.getItem(savingsItemsKey);
      if (savedTargetsStr) {
        try {
          setSavingsTargets(JSON.parse(savedTargetsStr));
        } catch {
          const defaultItems = DEFAULT_SAVINGS_TARGETS.map(t => ({ ...t, user_id: user.id }));
          setSavingsTargets(defaultItems);
          localStorage.setItem(savingsItemsKey, JSON.stringify(defaultItems));
        }
      } else {
        const defaultItems = DEFAULT_SAVINGS_TARGETS.map(t => ({ ...t, user_id: user.id }));
        setSavingsTargets(defaultItems);
        localStorage.setItem(savingsItemsKey, JSON.stringify(defaultItems));
      }

      setIsLoading(false);
    }
  }, [user, isGuest, configured, getStorageKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // SAVINGS TARGET ITEMS CRUD & STORAGE
  const saveSavingsTargetsState = useCallback((newItems: SavingsTargetItem[]) => {
    setSavingsTargets(newItems);
    localStorage.setItem(getStorageKey('savings_target_items'), JSON.stringify(newItems));
  }, [getStorageKey]);

  const addSavingsTargetItem = async (item: Omit<SavingsTargetItem, 'id' | 'user_id'>) => {
    if (!user) return { error: 'Pengguna belum login' };

    const newItem: SavingsTargetItem = {
      ...item,
      id: 'sav-' + Date.now(),
      user_id: user.id,
      current_amount: item.current_amount || 0,
      created_at: new Date().toISOString(),
    };

    const updated = [...savingsTargets, newItem];
    saveSavingsTargetsState(updated);
    return { error: null };
  };

  const updateSavingsTargetItem = async (id: string, partial: Partial<SavingsTargetItem>) => {
    if (!user) return { error: 'Pengguna belum login' };

    const updated = savingsTargets.map(t => (t.id === id ? { ...t, ...partial } : t));
    saveSavingsTargetsState(updated);
    return { error: null };
  };

  const deleteSavingsTargetItem = async (id: string) => {
    if (!user) return { error: 'Pengguna belum login' };

    const updated = savingsTargets.filter(t => t.id !== id);
    saveSavingsTargetsState(updated);
    return { error: null };
  };

  // RECORD DEPOSIT OR WITHDRAWAL TO SPECIFIC SAVINGS TARGET
  const recordSavingsTransaction = async (
    targetId: string,
    amount: number,
    action: SavingsActionType,
    date: string,
    notes?: string
  ) => {
    if (!user) return { error: 'Pengguna belum login' };
    if (amount <= 0) return { error: 'Jumlah harus lebih besar dari Rp 0' };

    const targetItem = savingsTargets.find(t => t.id === targetId);
    if (!targetItem) return { error: 'Target tabungan tidak ditemukan' };

    // Update saved amount for target
    const currentVal = targetItem.current_amount || 0;
    const newVal = action === 'deposit' ? currentVal + amount : Math.max(0, currentVal - amount);
    await updateSavingsTargetItem(targetId, { current_amount: newVal });

    // Also record a transaction so main history remains accurate
    // Setor tabungan => Pengeluaran dari dompet utama ke Tabungan
    // Tarik tabungan => Pemasukan ke dompet utama dari Tabungan
    const txType: TransactionType = action === 'deposit' ? 'expense' : 'income';

    let savingsCategory = categories.find(c => c.name.toLowerCase().includes('tabungan'));
    if (!savingsCategory) {
      savingsCategory = categories[0];
    }

    const actionText = action === 'deposit' ? 'Setor Ke' : 'Tarik Dari';
    const txNotes = `[${actionText} ${targetItem.name}] ${notes || ''}`.trim();

    await addTransaction({
      category_id: savingsCategory?.id || '',
      type: txType,
      amount,
      date: date || new Date().toISOString().split('T')[0],
      notes: txNotes,
    });

    return { error: null };
  };

  // GLOBAL SAVINGS TARGET UPDATE
  const updateSavingsTarget = async (newTarget: number): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Pengguna belum login' };
    if (newTarget < 0) return { error: 'Target menabung tidak boleh negatif' };

    setMonthlySavingsTarget(newTarget);
    localStorage.setItem(getStorageKey('savings_target'), newTarget.toString());
    return { error: null };
  };

  // BALANCE THRESHOLDS UPDATE
  const updateBalanceThresholds = async (thresholds: BalanceThresholds): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Pengguna belum login' };
    setBalanceThresholds(thresholds);
    localStorage.setItem(getStorageKey('balance_thresholds'), JSON.stringify(thresholds));
    return { error: null };
  };

  // CATEGORY OPERATIONS
  const addCategory = async (cat: Omit<Category, 'id' | 'user_id'>) => {
    if (!user) return { error: 'Pengguna belum login' };

    if (configured && supabase && !isGuest) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert([{ ...cat, user_id: user.id, is_default: false }])
          .select()
          .single();

        if (error) return { error: error.message };
        if (data) setCategories(prev => [...prev, data]);
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    } else {
      const newCat: Category = {
        ...cat,
        id: 'cat-custom-' + Date.now(),
        user_id: user.id,
        is_default: false,
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem(getStorageKey('categories'), JSON.stringify(updated));
      return { error: null };
    }
  };

  const updateCategory = async (id: string, partialCat: Partial<Category>) => {
    if (!user) return { error: 'Pengguna belum login' };
    const updated = categories.map(c => (c.id === id ? { ...c, ...partialCat } : c));
    setCategories(updated);
    localStorage.setItem(getStorageKey('categories'), JSON.stringify(updated));
    return { error: null };
  };

  const deleteCategory = async (id: string) => {
    if (!user) return { error: 'Pengguna belum login' };
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    localStorage.setItem(getStorageKey('categories'), JSON.stringify(updated));
    return { error: null };
  };

  // TRANSACTION OPERATIONS
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: 'Pengguna belum login' };

    const selectedCategory = categories.find(c => c.id === tx.category_id);

    if (configured && supabase && !isGuest) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([
            {
              user_id: user.id,
              category_id: tx.category_id,
              type: tx.type,
              amount: tx.amount,
              date: tx.date,
              notes: tx.notes || '',
            },
          ])
          .select('*, categories(name, icon, color)')
          .single();

        if (error) return { error: error.message };
        if (data) {
          const newTx: Transaction = {
            id: data.id,
            user_id: data.user_id,
            category_id: data.category_id,
            category_name: data.categories?.name || selectedCategory?.name || 'Lainnya',
            category_icon: data.categories?.icon || selectedCategory?.icon || 'Wallet',
            category_color: data.categories?.color || selectedCategory?.color || '#64748B',
            type: data.type as TransactionType,
            amount: Number(data.amount),
            date: data.date,
            notes: data.notes || '',
            created_at: data.created_at,
          };
          setTransactions(prev => [newTx, ...prev]);
        }
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    } else {
      const newTx: Transaction = {
        ...tx,
        id: 'tx-' + Date.now(),
        user_id: user.id,
        category_name: selectedCategory?.name || 'Lainnya',
        category_icon: selectedCategory?.icon || 'Wallet',
        category_color: selectedCategory?.color || '#64748B',
        created_at: new Date().toISOString(),
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      localStorage.setItem(getStorageKey('transactions'), JSON.stringify(updated));
      return { error: null };
    }
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    if (!user) return { error: 'Pengguna belum login' };
    const selectedCategory = tx.category_id ? categories.find(c => c.id === tx.category_id) : undefined;

    const updated = transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...tx,
          ...(selectedCategory && {
            category_name: selectedCategory.name,
            category_icon: selectedCategory.icon,
            category_color: selectedCategory.color,
          }),
        };
      }
      return t;
    });
    setTransactions(updated);
    localStorage.setItem(getStorageKey('transactions'), JSON.stringify(updated));
    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: 'Pengguna belum login' };
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(getStorageKey('transactions'), JSON.stringify(updated));
    return { error: null };
  };

  const resetToDefaultData = () => {
    if (!user) return;
    const clonedCats = INITIAL_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
    setCategories(clonedCats);
    const demo = getInitialDemoTransactions(user.id);
    setTransactions(demo);
    setMonthlySavingsTarget(DEFAULT_SAVINGS_TARGET);

    const defaultItems = DEFAULT_SAVINGS_TARGETS.map(t => ({ ...t, user_id: user.id }));
    setSavingsTargets(defaultItems);

    localStorage.setItem(getStorageKey('categories'), JSON.stringify(clonedCats));
    localStorage.setItem(getStorageKey('transactions'), JSON.stringify(demo));
    localStorage.setItem(getStorageKey('savings_target'), DEFAULT_SAVINGS_TARGET.toString());
    localStorage.setItem(getStorageKey('savings_target_items'), JSON.stringify(defaultItems));
  };

  // KPI Calculations & Analytics
  const {
    totalIncome,
    totalExpense,
    totalBalance,
    thisMonthIncome,
    thisMonthExpense,
    thisMonthSavings,
    savingsRate,
    thisMonthSavingsProgress,
    yearlySavingsTotal,
    yearlyTargetTotal,
    yearlySavingsProgress,
    availableYears,
  } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let mInc = 0;
    let mExp = 0;
    let yInc = 0;
    let yExp = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const yearsSet = new Set<number>([currentYear]);

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        inc += amount;
      } else {
        exp += amount;
      }

      const txDate = new Date(t.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      if (!isNaN(txYear)) {
        yearsSet.add(txYear);
      }

      if (txYear === currentYear && txMonth === currentMonth) {
        if (t.type === 'income') {
          mInc += amount;
        } else {
          mExp += amount;
        }
      }

      if (txYear === currentYear) {
        if (t.type === 'income') {
          yInc += amount;
        } else {
          yExp += amount;
        }
      }
    });

    const bal = inc - exp;
    const rate = inc > 0 ? Math.max(0, Math.round(((inc - exp) / inc) * 100)) : 0;
    const mSavings = mInc - mExp;

    // Calculate monthly savings target total from active target items
    const totalMonthlyTargetFromItems = savingsTargets.reduce((sum, item) => sum + (item.target_amount || 0), 0);
    const activeMonthlyTarget = totalMonthlyTargetFromItems > 0 ? totalMonthlyTargetFromItems : monthlySavingsTarget;

    const mSavingsProgress = activeMonthlyTarget > 0 ? Math.round((mSavings / activeMonthlyTarget) * 100) : 0;

    const ySavings = yInc - yExp;
    const yTarget = activeMonthlyTarget * 12;
    const ySavingsProgress = yTarget > 0 ? Math.round((ySavings / yTarget) * 100) : 0;

    return {
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: bal,
      thisMonthIncome: mInc,
      thisMonthExpense: mExp,
      thisMonthSavings: mSavings,
      savingsRate: rate,
      thisMonthSavingsProgress: mSavingsProgress,
      yearlySavingsTotal: ySavings,
      yearlyTargetTotal: yTarget,
      yearlySavingsProgress: ySavingsProgress,
      availableYears: Array.from(yearsSet).sort((a, b) => b - a),
    };
  }, [transactions, monthlySavingsTarget, savingsTargets]);

  const getYearlySummary = useCallback(
    (year: number): YearlyCashflowSummary => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const fullMonthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];

      const monthlyData: { income: number; expense: number; hasData: boolean }[] = Array.from(
        { length: 12 },
        () => ({ income: 0, expense: 0, hasData: false })
      );

      let totalYInc = 0;
      let totalYExp = 0;

      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === year) {
          const m = d.getMonth();
          const amount = Number(t.amount) || 0;
          if (m >= 0 && m < 12) {
            monthlyData[m].hasData = true;
            if (t.type === 'income') {
              monthlyData[m].income += amount;
              totalYInc += amount;
            } else {
              monthlyData[m].expense += amount;
              totalYExp += amount;
            }
          }
        }
      });

      let cumulative = 0;
      const months: MonthlyCashflowItem[] = monthlyData.map((data, idx) => {
        const net = data.income - data.expense;
        cumulative += net;
        const targetCumulative = monthlySavingsTarget * (idx + 1);

        return {
          monthIndex: idx,
          monthName: monthNames[idx],
          fullMonthName: `${fullMonthNames[idx]} ${year}`,
          income: data.income,
          expense: data.expense,
          net,
          cumulativeSavings: cumulative,
          targetSavings: targetCumulative,
          hasData: data.hasData,
        };
      });

      const totalSavings = totalYInc - totalYExp;
      const yearlyTarget = monthlySavingsTarget * 12;
      const rate = totalYInc > 0 ? Math.max(0, Math.round((totalSavings / totalYInc) * 100)) : 0;
      const targetAchievement = yearlyTarget > 0 ? Math.round((totalSavings / yearlyTarget) * 100) : 0;
      const avgMonthly = Math.round(totalSavings / 12);

      return {
        year,
        totalIncome: totalYInc,
        totalExpense: totalYExp,
        totalSavings,
        monthlyTarget: monthlySavingsTarget,
        yearlyTarget,
        savingsRate: rate,
        targetAchievementRate: targetAchievement,
        averageMonthlySavings: avgMonthly,
        months,
      };
    },
    [transactions, monthlySavingsTarget]
  );

  return (
    <FinanceContext.Provider
      value={{
        categories,
        transactions,
        savingsTargets,
        isLoading,
        totalIncome,
        totalExpense,
        totalBalance,
        thisMonthIncome,
        thisMonthExpense,
        thisMonthSavings,
        savingsRate,
        monthlySavingsTarget,
        balanceThresholds,
        thisMonthSavingsProgress,
        yearlySavingsTotal,
        yearlyTargetTotal,
        yearlySavingsProgress,
        availableYears,
        getYearlySummary,
        updateSavingsTarget,
        updateBalanceThresholds,
        addCategory,
        updateCategory,
        deleteCategory,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addSavingsTargetItem,
        updateSavingsTargetItem,
        deleteSavingsTargetItem,
        recordSavingsTransaction,
        resetToDefaultData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
