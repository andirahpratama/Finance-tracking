import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, Transaction, TransactionType, YearlyCashflowSummary, MonthlyCashflowItem, BalanceThresholds } from '../types';
import { INITIAL_CATEGORIES, getInitialDemoTransactions, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../lib/defaultData';

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
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
  resetToDefaultData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_SAVINGS_TARGET = 1500000; // Default Rp 1.500.000 / bulan
const DEFAULT_BALANCE_SAFE = 1000000;    // > 1jt => happy
const DEFAULT_BALANCE_WARNING = 500000;  // >= 500rb => neutral, below => sad

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState<number>(DEFAULT_SAVINGS_TARGET);
  const [balanceThresholds, setBalanceThresholds] = useState<BalanceThresholds>({
    safe: DEFAULT_BALANCE_SAFE,
    warning: DEFAULT_BALANCE_WARNING,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  // Helper storage keys for guest/demo mode
  const getStorageKey = useCallback((prefix: string) => {
    return `ft_${prefix}_${user?.id || 'default'}`;
  }, [user?.id]);

  // Load Initial Data (Supabase or Local Storage)
  const loadData = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setTransactions([]);
      setMonthlySavingsTarget(DEFAULT_SAVINGS_TARGET);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (configured && supabase && !isGuest) {
      try {
        // 1. Fetch Profile & Savings Target + Thresholds
        const { data: profileData } = await supabase
          .from('profiles')
          .select('monthly_savings_target, balance_safe_threshold, balance_warning_threshold')
          .eq('id', user.id)
          .single();

        if (profileData && profileData.monthly_savings_target) {
          setMonthlySavingsTarget(Number(profileData.monthly_savings_target));
        } else {
          // Fallback to local storage or default
          const savedTarget = localStorage.getItem(getStorageKey('savings_target'));
          if (savedTarget) {
            setMonthlySavingsTarget(Number(savedTarget) || DEFAULT_SAVINGS_TARGET);
          } else {
            setMonthlySavingsTarget(DEFAULT_SAVINGS_TARGET);
          }
        }

        // Load balance thresholds from profile or localStorage fallback
        const safeVal = profileData?.balance_safe_threshold;
        const warnVal = profileData?.balance_warning_threshold;
        if (safeVal != null && warnVal != null) {
          setBalanceThresholds({ safe: Number(safeVal), warning: Number(warnVal) });
        } else {
          const savedThresholds = localStorage.getItem(getStorageKey('balance_thresholds'));
          if (savedThresholds) {
            try { setBalanceThresholds(JSON.parse(savedThresholds)); } catch { /* ignore */ }
          }
        }

        // 2. Fetch Categories (Strictly user_id scoped)
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (catError) throw catError;

        let userCategories: Category[] = catData || [];

        // If user has no categories yet, initialize default ones for this user
        if (userCategories.length === 0) {
          const defaultItems = [
            ...DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, user_id: user.id })),
            ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, user_id: user.id })),
          ];
          const { data: seeded, error: seedError } = await supabase
            .from('categories')
            .insert(defaultItems)
            .select();

          if (!seedError && seeded) {
            userCategories = seeded;
          }
        }

        setCategories(userCategories);

        // 3. Fetch Transactions (Strictly user_id scoped)
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
      } catch (err) {
        console.error('Error loading Supabase data:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Demo / Guest mode fallback using localStorage strictly scoped to user.id
      const catKey = getStorageKey('categories');
      const txKey = getStorageKey('transactions');
      const targetKey = getStorageKey('savings_target');
      const thresholdsKey = getStorageKey('balance_thresholds');

      // Load savings target
      const savedTarget = localStorage.getItem(targetKey);
      if (savedTarget) {
        setMonthlySavingsTarget(Number(savedTarget) || DEFAULT_SAVINGS_TARGET);
      } else {
        setMonthlySavingsTarget(DEFAULT_SAVINGS_TARGET);
        localStorage.setItem(targetKey, DEFAULT_SAVINGS_TARGET.toString());
      }

      // Load balance thresholds
      const savedThresholds = localStorage.getItem(thresholdsKey);
      if (savedThresholds) {
        try { setBalanceThresholds(JSON.parse(savedThresholds)); } catch { /* ignore */ }
      } else {
        const defaultThresh = { safe: DEFAULT_BALANCE_SAFE, warning: DEFAULT_BALANCE_WARNING };
        setBalanceThresholds(defaultThresh);
        localStorage.setItem(thresholdsKey, JSON.stringify(defaultThresh));
      }

      // Load categories
      const savedCategories = localStorage.getItem(catKey);
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          setCategories(parsed);
        } catch {
          const cloned = INITIAL_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
          setCategories(cloned);
          localStorage.setItem(catKey, JSON.stringify(cloned));
        }
      } else {
        const cloned = INITIAL_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
        setCategories(cloned);
        localStorage.setItem(catKey, JSON.stringify(cloned));
      }

      // Load transactions
      const savedTransactions = localStorage.getItem(txKey);
      if (savedTransactions) {
        try {
          const parsed = JSON.parse(savedTransactions);
          setTransactions(parsed);
        } catch {
          const initial = getInitialDemoTransactions(user.id);
          setTransactions(initial);
          localStorage.setItem(txKey, JSON.stringify(initial));
        }
      } else {
        const initial = getInitialDemoTransactions(user.id);
        setTransactions(initial);
        localStorage.setItem(txKey, JSON.stringify(initial));
      }

      setIsLoading(false);
    }
  }, [user, isGuest, configured, getStorageKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!configured || !supabase || !user || isGuest) return;

    const channel = supabase
      .channel(`realtime-finance-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [configured, user, isGuest, loadData]);

  // SAVINGS TARGET UPDATE
  const updateSavingsTarget = async (newTarget: number): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Pengguna belum login' };
    if (newTarget < 0) return { error: 'Target menabung tidak boleh negatif' };

    setMonthlySavingsTarget(newTarget);
    localStorage.setItem(getStorageKey('savings_target'), newTarget.toString());

    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ monthly_savings_target: newTarget })
          .eq('id', user.id);

        if (error) {
          console.warn('Could not update monthly_savings_target in Supabase:', error.message);
        }
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    return { error: null };
  };

  // BALANCE THRESHOLDS UPDATE
  const updateBalanceThresholds = async (thresholds: BalanceThresholds): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Pengguna belum login' };
    if (thresholds.safe <= 0 || thresholds.warning <= 0)
      return { error: 'Batas saldo harus lebih dari 0' };
    if (thresholds.warning >= thresholds.safe)
      return { error: 'Batas waspada harus lebih kecil dari batas aman' };

    setBalanceThresholds(thresholds);
    localStorage.setItem(getStorageKey('balance_thresholds'), JSON.stringify(thresholds));

    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            balance_safe_threshold: thresholds.safe,
            balance_warning_threshold: thresholds.warning,
          })
          .eq('id', user.id);

        if (error) {
          console.warn('Could not update balance thresholds in Supabase:', error.message);
        }
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    return { error: null };
  };

  // CATEGORY OPERATIONS (Strictly Isolated per user)
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
        if (data) {
          setCategories(prev => [...prev, data]);
        }
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

    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('categories')
          .update(partialCat)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) return { error: error.message };
        setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...partialCat } : c)));
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    } else {
      const updated = categories.map(c => (c.id === id ? { ...c, ...partialCat } : c));
      setCategories(updated);
      localStorage.setItem(getStorageKey('categories'), JSON.stringify(updated));
      return { error: null };
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return { error: 'Pengguna belum login' };

    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) return { error: error.message };
        setCategories(prev => prev.filter(c => c.id !== id));
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    } else {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      localStorage.setItem(getStorageKey('categories'), JSON.stringify(updated));
      return { error: null };
    }
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

    if (configured && supabase && !isGuest) {
      try {
        const updatePayload: any = { ...tx };
        delete updatePayload.category_name;
        delete updatePayload.category_icon;
        delete updatePayload.category_color;
        delete updatePayload.id;
        delete updatePayload.user_id;

        const { error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) return { error: error.message };

        setTransactions(prev =>
          prev.map(t => {
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
          })
        );
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    } else {
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
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: 'Pengguna belum login' };

    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) return { error: error.message };
        setTransactions(prev => prev.filter(t => t.id !== id));
        return { error: null };
      } catch (err: any) {
        return { error: err.message };
      }
    } else {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem(getStorageKey('transactions'), JSON.stringify(updated));
      return { error: null };
    }
  };

  const resetToDefaultData = () => {
    if (!user) return;
    const clonedCats = INITIAL_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
    setCategories(clonedCats);
    const demo = getInitialDemoTransactions(user.id);
    setTransactions(demo);
    setMonthlySavingsTarget(DEFAULT_SAVINGS_TARGET);
    localStorage.setItem(getStorageKey('categories'), JSON.stringify(clonedCats));
    localStorage.setItem(getStorageKey('transactions'), JSON.stringify(demo));
    localStorage.setItem(getStorageKey('savings_target'), DEFAULT_SAVINGS_TARGET.toString());
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

      // Current Month
      if (txYear === currentYear && txMonth === currentMonth) {
        if (t.type === 'income') {
          mInc += amount;
        } else {
          mExp += amount;
        }
      }

      // Current Year
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
    const mSavingsProgress = monthlySavingsTarget > 0 ? Math.round((mSavings / monthlySavingsTarget) * 100) : 0;

    const ySavings = yInc - yExp;
    const yTarget = monthlySavingsTarget * 12;
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
  }, [transactions, monthlySavingsTarget]);

  // Method to get 12-month cashflow breakdown for any specific year
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

