import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, Transaction, TransactionType } from '../types';
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
  savingsRate: number;
  addCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<{ error: string | null }>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<{ error: string | null }>;
  deleteCategory: (id: string) => Promise<{ error: string | null }>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<{ error: string | null }>;
  deleteTransaction: (id: string) => Promise<{ error: string | null }>;
  resetToDefaultData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (configured && supabase && !isGuest) {
      try {
        // 1. Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (catError) throw catError;

        let userCategories: Category[] = catData || [];

        // If user has no categories yet, initialize default ones
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

        // 2. Fetch Transactions
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
      // Demo / Guest mode fallback using localStorage
      const catKey = getStorageKey('categories');
      const txKey = getStorageKey('transactions');

      const savedCategories = localStorage.getItem(catKey);
      const savedTransactions = localStorage.getItem(txKey);

      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories));
        } catch {
          setCategories(INITIAL_CATEGORIES);
        }
      } else {
        setCategories(INITIAL_CATEGORIES);
        localStorage.setItem(catKey, JSON.stringify(INITIAL_CATEGORIES));
      }

      if (savedTransactions) {
        try {
          setTransactions(JSON.parse(savedTransactions));
        } catch {
          const initial = getInitialDemoTransactions();
          setTransactions(initial);
          localStorage.setItem(txKey, JSON.stringify(initial));
        }
      } else {
        const initial = getInitialDemoTransactions();
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

    // Create channel for real-time postgres changes
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
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [configured, user, isGuest, loadData]);

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
    setCategories(INITIAL_CATEGORIES);
    const demo = getInitialDemoTransactions();
    setTransactions(demo);
    localStorage.setItem(getStorageKey('categories'), JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(getStorageKey('transactions'), JSON.stringify(demo));
  };

  // KPI Calculations
  const { totalIncome, totalExpense, totalBalance, thisMonthIncome, thisMonthExpense, savingsRate } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let mInc = 0;
    let mExp = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        inc += amount;
      } else {
        exp += amount;
      }

      const txDate = new Date(t.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (t.type === 'income') {
          mInc += amount;
        } else {
          mExp += amount;
        }
      }
    });

    const bal = inc - exp;
    const rate = inc > 0 ? Math.max(0, Math.round(((inc - exp) / inc) * 100)) : 0;

    return {
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: bal,
      thisMonthIncome: mInc,
      thisMonthExpense: mExp,
      savingsRate: rate,
    };
  }, [transactions]);

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
        savingsRate,
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
