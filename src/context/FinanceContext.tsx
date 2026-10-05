import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, Transaction, TransactionType, YearlyCashflowSummary, MonthlyCashflowItem, BalanceThresholds, SavingsTargetItem, SavingsActionType, CurrencyCode, GoldTransaction, GoldPortfolio, GoldPrices, GoldBrand } from '../types';
import { INITIAL_CATEGORIES, getInitialDemoTransactions, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, getInitialDemoGoldTransactions } from '../lib/defaultData';
import { getAppCurrency, setAppCurrency as setGlobalAppCurrency } from '../lib/formatters';
import { isSavingsTransaction, calculateSavingsProgress } from '../lib/savingsUtils';
import { fetchLiveGoldPrices, calculateGoldPortfolio, saveStoredManualPrices, clearStoredManualPrices, DEFAULT_GOLD_PRICES } from '../lib/goldPriceService';

const currentYearNow = new Date().getFullYear();

export const DEFAULT_SAVINGS_TARGETS: SavingsTargetItem[] = [
  {
    id: 'preset-liburan',
    name: 'Tabungan Liburan',
    target_amount: 15000000,
    current_amount: 0,
    deadline_date: `${currentYearNow}-12-31`,
    auto_calculate_monthly: true,
    category_icon: 'Palmtree',
    color: '#06b6d4',
    is_default_preset: true,
  },
  {
    id: 'preset-pendidikan',
    name: 'Tabungan Pendidikan',
    target_amount: 35000000,
    current_amount: 0,
    deadline_date: `${currentYearNow + 2}-07-31`,
    auto_calculate_monthly: true,
    category_icon: 'GraduationCap',
    color: '#3b82f6',
    is_default_preset: true,
  },
  {
    id: 'preset-darurat',
    name: 'Tabungan Dana Darurat',
    target_amount: 25000000,
    current_amount: 0,
    deadline_date: `${currentYearNow + 1}-12-31`,
    auto_calculate_monthly: true,
    category_icon: 'ShieldAlert',
    color: '#10b981',
    is_default_preset: true,
  },
  {
    id: 'preset-pensiun',
    name: 'Tabungan Pensiun',
    target_amount: 100000000,
    current_amount: 0,
    deadline_date: `${currentYearNow + 5}-12-31`,
    auto_calculate_monthly: true,
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
  // Gold Investment & Portfolio CRUD
  goldTransactions: GoldTransaction[];
  goldPortfolio: GoldPortfolio;
  goldPrices: GoldPrices;
  isGoldPricesLoading: boolean;
  buyGold: (params: { brand: GoldBrand; gram: number; price_per_gram: number; date: string; notes?: string }) => Promise<{ error: string | null }>;
  sellGold: (params: { brand: GoldBrand; gram: number; price_per_gram: number; date: string; notes?: string }) => Promise<{ error: string | null }>;
  deleteGoldTransaction: (id: string) => Promise<{ error: string | null }>;
  refreshGoldPrices: () => Promise<void>;
  updateManualGoldPrice: (prices: GoldPrices) => void;
  resetManualGoldPrice: () => Promise<void>;
  resetToDefaultData: () => void;
  appCurrency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
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
  const [appCurrency, setAppCurrencyState] = useState<CurrencyCode>(getAppCurrency());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  // Gold Investment States
  const [goldTransactions, setGoldTransactions] = useState<GoldTransaction[]>([]);
  const [goldPrices, setGoldPrices] = useState<GoldPrices>(DEFAULT_GOLD_PRICES);
  const [isGoldPricesLoading, setIsGoldPricesLoading] = useState<boolean>(false);

  // Compute portfolio metrics using Average Cost Method
  const goldPortfolio = useMemo(() => {
    return calculateGoldPortfolio(goldTransactions);
  }, [goldTransactions]);

  // Listen to currency change events across the application
  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      if (e.detail) {
        setAppCurrencyState(e.detail);
      }
    };
    window.addEventListener('app-currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('app-currency-changed', handleCurrencyChange);
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setAppCurrencyState(code);
    setGlobalAppCurrency(code);
  }, []);

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
          is_savings_transfer: isSavingsTransaction(t),
          created_at: t.created_at,
        }));
        setTransactions(formattedTx);

        // 4. Savings Targets (Local Storage or DB Fallback)
        const savedTargetsStr = localStorage.getItem(getStorageKey('savings_target_items'));
        if (savedTargetsStr) {
          try {
            const parsed = JSON.parse(savedTargetsStr);
            const cleaned = parsed.map((t: any) => {
              if (t.is_default_preset && (t.current_amount === 2500000 || t.current_amount === 5000000 || t.current_amount === 4500000 || t.current_amount === 8000000)) {
                return { ...t, current_amount: 0 };
              }
              return t;
            });
            setSavingsTargets(cleaned);
          } catch {
            setSavingsTargets([]);
          }
        } else {
          setSavingsTargets([]);
          localStorage.setItem(getStorageKey('savings_target_items'), JSON.stringify([]));
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
        try {
          let parsed: Transaction[] = JSON.parse(savedTransactions);
          // Clean legacy demo transactions in current month so month begins clean at 0
          const now = new Date();
          const curY = now.getFullYear();
          const curM = now.getMonth();
          const cleaned = parsed.filter(t => {
            if (t.id && t.id.startsWith('tx-demo-')) {
              const [yStr, mStr] = t.date.split('T')[0].split('-');
              const y = parseInt(yStr, 10);
              const m = parseInt(mStr, 10) - 1;
              if (y === curY && m === curM) {
                return false;
              }
            }
            return true;
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(txKey, JSON.stringify(cleaned));
            parsed = cleaned;
          }
          setTransactions(parsed);
        } catch {
          setTransactions(getInitialDemoTransactions(user.id));
        }
      } else {
        const initial = getInitialDemoTransactions(user.id);
        setTransactions(initial);
        localStorage.setItem(txKey, JSON.stringify(initial));
      }

      // Savings Targets
      const savedTargetsStr = localStorage.getItem(savingsItemsKey);
      if (savedTargetsStr) {
        try {
          const parsed = JSON.parse(savedTargetsStr);
          const cleaned = parsed.map((t: any) => {
            if (t.is_default_preset && (t.current_amount === 2500000 || t.current_amount === 5000000 || t.current_amount === 4500000 || t.current_amount === 8000000)) {
              return { ...t, current_amount: 0 };
            }
            return t;
          });
          setSavingsTargets(cleaned);
        } catch {
          setSavingsTargets([]);
        }
      } else {
        setSavingsTargets([]);
        localStorage.setItem(savingsItemsKey, JSON.stringify([]));
      }

      // Gold Transactions (stored locally per user)
      const goldKey = getStorageKey('gold_transactions');
      const savedGoldStr = localStorage.getItem(goldKey);
      if (savedGoldStr) {
        try {
          setGoldTransactions(JSON.parse(savedGoldStr));
        } catch {
          setGoldTransactions([]);
        }
      } else {
        const initialGold = getInitialDemoGoldTransactions(user.id);
        setGoldTransactions(initialGold);
        localStorage.setItem(goldKey, JSON.stringify(initialGold));
      }

      setIsLoading(false);
    }
  }, [user, isGuest, configured, getStorageKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // GOLD PRICES SERVICE & REFRESH
  const refreshGoldPrices = useCallback(async () => {
    setIsGoldPricesLoading(true);
    try {
      const prices = await fetchLiveGoldPrices();
      setGoldPrices(prices);
    } catch (err) {
      console.warn('Failed to refresh gold prices:', err);
    } finally {
      setIsGoldPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGoldPrices();
  }, [refreshGoldPrices]);

  // GOLD TRANSACTIONS CRUD
  const saveGoldTransactionsState = useCallback((newItems: GoldTransaction[]) => {
    setGoldTransactions(newItems);
    localStorage.setItem(getStorageKey('gold_transactions'), JSON.stringify(newItems));
  }, [getStorageKey]);

  const buyGold = async ({
    brand,
    gram,
    price_per_gram,
    date,
    notes,
  }: {
    brand: GoldBrand;
    gram: number;
    price_per_gram: number;
    date: string;
    notes?: string;
  }) => {
    if (!user) return { error: 'Pengguna belum login' };
    if (gram <= 0) return { error: 'Jumlah gram harus lebih dari 0' };
    if (price_per_gram <= 0) return { error: 'Harga per gram tidak valid' };

    const total_amount = Math.round(gram * price_per_gram);
    const newTx: GoldTransaction = {
      id: 'gtx-' + Date.now(),
      user_id: user.id,
      type: 'BUY',
      brand,
      date,
      gram: Number(gram),
      price_per_gram: Number(price_per_gram),
      total_amount,
      notes: notes || `Beli ${gram}g emas ${brand}`,
      created_at: new Date().toISOString(),
    };

    const updated = [newTx, ...goldTransactions];
    saveGoldTransactionsState(updated);
    // Per PRD guardrails: Transaksi Beli TIDAK memotong saldo kas utama
    return { error: null };
  };

  const sellGold = async ({
    brand,
    gram,
    price_per_gram,
    date,
    notes,
  }: {
    brand: GoldBrand;
    gram: number;
    price_per_gram: number;
    date: string;
    notes?: string;
  }) => {
    if (!user) return { error: 'Pengguna belum login' };
    if (gram <= 0) return { error: 'Jumlah gram harus lebih dari 0' };
    if (price_per_gram <= 0) return { error: 'Harga per gram tidak valid' };
    if (gram > goldPortfolio.total_gram) {
      return { error: `Gram yang ingin dijual (${gram}g) melebihi kepemilikan aset (${goldPortfolio.total_gram}g)` };
    }

    const total_amount = Math.round(gram * price_per_gram);
    const newTx: GoldTransaction = {
      id: 'gtx-' + Date.now(),
      user_id: user.id,
      type: 'SELL',
      brand,
      date,
      gram: Number(gram),
      price_per_gram: Number(price_per_gram),
      total_amount,
      notes: notes || `Jual ${gram}g emas ${brand}`,
      created_at: new Date().toISOString(),
    };

    const updated = [newTx, ...goldTransactions];
    saveGoldTransactionsState(updated);

    // Cross-Module Action (PRD requirement):
    // Otomatis masukkan hasil penjualan sebagai Pemasukan di kas utama
    const investCat = categories.find(c => c.type === 'income' && (c.name.toLowerCase().includes('investasi') || c.name.toLowerCase().includes('emas')));
    const fallbackCat = categories.find(c => c.type === 'income') || categories[0];
    const categoryId = investCat?.id || fallbackCat?.id || 'cat-custom-emas';

    await addTransaction({
      category_id: categoryId,
      type: 'income',
      amount: total_amount,
      date,
      notes: notes ? `Pencairan Emas: ${notes}` : `Pencairan ${gram} gram emas ${brand}`,
    });

    return { error: null };
  };

  const deleteGoldTransaction = async (id: string) => {
    if (!user) return { error: 'Pengguna belum login' };
    const updated = goldTransactions.filter(t => t.id !== id);
    saveGoldTransactionsState(updated);
    return { error: null };
  };

  const updateManualGoldPrice = useCallback((prices: GoldPrices) => {
    saveStoredManualPrices(prices);
    setGoldPrices(prices);
  }, []);

  const resetManualGoldPrice = useCallback(async () => {
    clearStoredManualPrices();
    await refreshGoldPrices();
  }, [refreshGoldPrices]);

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

    // Transaction direction:
    // Setor ke Tabungan => Pengeluaran (expense) dari dompet utama ke Tabungan (target savings balance increases)
    // Tarik Tabungan => Pemasukan (income) ke dompet utama dari Tabungan (target savings balance decreases)
    const txType: TransactionType = action === 'deposit' ? 'expense' : 'income';

    let savingsCategory = categories.find(c => c.type === txType && c.name.toLowerCase().includes('tabungan'));
    if (!savingsCategory) {
      savingsCategory = categories.find(c => c.name.toLowerCase().includes('tabungan'));
    }

    let categoryIdToUse = savingsCategory?.id || '';

    // If still no category ID found, auto add Tabungan category for txType
    if (!categoryIdToUse) {
      await addCategory({
        name: 'Tabungan',
        type: txType,
        icon: 'PiggyBank',
        color: '#06B6D4',
        is_default: true,
      });
      const newlyCreated = categories.find(c => c.type === txType && c.name.toLowerCase().includes('tabungan'));
      if (newlyCreated) {
        categoryIdToUse = newlyCreated.id;
      }
    }

    const actionText = action === 'deposit' ? 'Setor Ke Tabungan' : 'Tarik Dari Tabungan';
    const txNotes = `[${actionText}: ${targetItem.name}] (sav_target:${targetItem.id}) ${notes || ''}`.trim();

    await addTransaction({
      category_id: categoryIdToUse || (txType === 'income' ? 'cat-inc-sav' : 'cat-exp-sav'),
      type: txType,
      amount,
      date: date || new Date().toISOString().split('T')[0],
      notes: txNotes,
      is_savings_transfer: true,
      savings_target_id: targetItem.id,
      savings_action: action,
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
    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('categories')
          .update(partialCat)
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) return { error: error.message };
      } catch (err: any) {
        return { error: err.message };
      }
    }
    const updated = categories.map(c => (c.id === id ? { ...c, ...partialCat } : c));
    setCategories(updated);
    localStorage.setItem(getStorageKey('categories'), JSON.stringify(updated));
    return { error: null };
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
      } catch (err: any) {
        return { error: err.message };
      }
    }
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
            category_name: data.categories?.name || selectedCategory?.name || 'Tabungan',
            category_icon: data.categories?.icon || selectedCategory?.icon || 'PiggyBank',
            category_color: data.categories?.color || selectedCategory?.color || '#06B6D4',
            type: data.type as TransactionType,
            amount: Number(data.amount),
            date: data.date,
            notes: data.notes || '',
            is_savings_transfer: tx.is_savings_transfer ?? isSavingsTransaction({ ...data, notes: data.notes || tx.notes }),
            savings_target_id: tx.savings_target_id,
            savings_action: tx.savings_action,
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
        category_name: selectedCategory?.name || 'Tabungan',
        category_icon: selectedCategory?.icon || 'PiggyBank',
        category_color: selectedCategory?.color || '#06B6D4',
        is_savings_transfer: tx.is_savings_transfer ?? isSavingsTransaction(tx as any),
        savings_target_id: tx.savings_target_id,
        savings_action: tx.savings_action,
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
    const targetTx = transactions.find(t => t.id === id);

    if (configured && supabase && !isGuest) {
      try {
        const updatePayload: any = {};
        if (tx.category_id !== undefined) updatePayload.category_id = tx.category_id;
        if (tx.type !== undefined) updatePayload.type = tx.type;
        if (tx.amount !== undefined) updatePayload.amount = tx.amount;
        if (tx.date !== undefined) updatePayload.date = tx.date;
        if (tx.notes !== undefined) updatePayload.notes = tx.notes;

        const { error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating transaction in Supabase:', error);
          return { error: error.message };
        }
      } catch (err: any) {
        console.error('Error updating transaction:', err);
        return { error: err.message || 'Gagal mengupdate transaksi' };
      }
    }

    // Adjust savings target balance if amount changed for a savings transaction
    if (targetTx && tx.amount !== undefined && Number(tx.amount) !== Number(targetTx.amount) && targetTx.notes) {
      let matchedTarget = savingsTargets.find(s => targetTx.notes?.includes(`sav_target:${s.id}`));
      if (!matchedTarget) {
        matchedTarget = savingsTargets.find(s => targetTx.notes?.includes(s.name));
      }

      if (matchedTarget) {
        const currentVal = matchedTarget.current_amount || 0;
        const oldAmount = Number(targetTx.amount) || 0;
        const newAmount = Number(tx.amount) || 0;
        const diff = newAmount - oldAmount;

        let newVal = currentVal;
        if (targetTx.notes.includes('Setor')) {
          newVal = Math.max(0, currentVal + diff);
        } else if (targetTx.notes.includes('Tarik')) {
          newVal = Math.max(0, currentVal - diff);
        }

        if (newVal !== currentVal) {
          await updateSavingsTargetItem(matchedTarget.id, { current_amount: newVal });
        }
      }
    }

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

    const targetTx = transactions.find(t => t.id === id);

    if (configured && supabase && !isGuest) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting transaction from Supabase:', error);
          return { error: error.message };
        }
      } catch (err: any) {
        console.error('Error deleting transaction:', err);
        return { error: err.message || 'Gagal menghapus transaksi dari database' };
      }
    }

    // Reverse savings target amount if this was a savings transaction
    if (targetTx && targetTx.notes) {
      let matchedTarget = savingsTargets.find(s => targetTx.notes?.includes(`sav_target:${s.id}`));
      if (!matchedTarget) {
        matchedTarget = savingsTargets.find(s => targetTx.notes?.includes(s.name));
      }

      if (matchedTarget) {
        const currentVal = matchedTarget.current_amount || 0;
        const txAmount = Number(targetTx.amount) || 0;
        const isDeposit = targetTx.notes.includes('Setor') || targetTx.type === 'expense';

        let newVal = currentVal;
        if (targetTx.notes.includes('Setor') || (isDeposit && !targetTx.notes.includes('Tarik'))) {
          // Reversing a deposit: subtract amount from target balance
          newVal = Math.max(0, currentVal - txAmount);
        } else if (targetTx.notes.includes('Tarik')) {
          // Reversing a withdrawal: add amount back to target balance
          newVal = currentVal + txAmount;
        }

        if (newVal !== currentVal) {
          await updateSavingsTargetItem(matchedTarget.id, { current_amount: newVal });
        }
      }
    }

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

    setSavingsTargets([]);

    const defaultGold = getInitialDemoGoldTransactions(user.id);
    setGoldTransactions(defaultGold);

    localStorage.setItem(getStorageKey('categories'), JSON.stringify(clonedCats));
    localStorage.setItem(getStorageKey('transactions'), JSON.stringify(demo));
    localStorage.setItem(getStorageKey('savings_target'), DEFAULT_SAVINGS_TARGET.toString());
    localStorage.setItem(getStorageKey('savings_target_items'), JSON.stringify([]));
    localStorage.setItem(getStorageKey('gold_transactions'), JSON.stringify(defaultGold));
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
    let pureInc = 0;
    let pureExp = 0;
    let mPureInc = 0;
    let mPureExp = 0;
    let yPureInc = 0;
    let yPureExp = 0;

    let totalSavingsDeposit = 0;
    let totalSavingsWithdraw = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const yearsSet = new Set<number>([currentYear]);

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const isSav = isSavingsTransaction(t);
      const isDeposit = t.notes?.includes('Setor') || t.savings_action === 'deposit' || (isSav && t.type === 'expense');
      const isWithdraw = t.notes?.includes('Tarik') || t.savings_action === 'withdraw' || (isSav && t.type === 'income');

      const [yStr, mStr] = t.date.split('T')[0].split('-');
      const txYear = parseInt(yStr, 10);
      const txMonth = parseInt(mStr, 10) - 1;

      if (!isNaN(txYear)) {
        yearsSet.add(txYear);
      }

      if (isSav) {
        if (isDeposit) {
          totalSavingsDeposit += amount;
        } else if (isWithdraw) {
          totalSavingsWithdraw += amount;
        }
      } else {
        if (t.type === 'income') {
          pureInc += amount;
        } else {
          pureExp += amount;
        }

        if (txYear === currentYear && txMonth === currentMonth) {
          if (t.type === 'income') {
            mPureInc += amount;
          } else {
            mPureExp += amount;
          }
        }

        if (txYear === currentYear) {
          if (t.type === 'income') {
            yPureInc += amount;
          } else {
            yPureExp += amount;
          }
        }
      }
    });

    // Saldo kas utama berkurang saat setor ke pos tabungan dan bertambah saat tarik tabungan
    const bal = pureInc - pureExp - totalSavingsDeposit + totalSavingsWithdraw;
    const rate = pureInc > 0 ? Math.max(0, Math.round(((pureInc - pureExp) / pureInc) * 100)) : 0;
    const mSavings = mPureInc - mPureExp;

    // Hitung total target bulanan dari semua pos tabungan aktif berdasarkan formula deadline
    const totalMonthlyTargetFromItems = savingsTargets.reduce((sum, item) => {
      const prog = calculateSavingsProgress(item);
      return sum + prog.monthlyTarget;
    }, 0);
    const activeMonthlyTarget = totalMonthlyTargetFromItems > 0 ? totalMonthlyTargetFromItems : monthlySavingsTarget;

    const mSavingsProgress = activeMonthlyTarget > 0 ? Math.round((mSavings / activeMonthlyTarget) * 100) : 0;

    const ySavings = yPureInc - yPureExp;
    const yTarget = activeMonthlyTarget * 12;
    const ySavingsProgress = yTarget > 0 ? Math.round((ySavings / yTarget) * 100) : 0;

    return {
      totalIncome: pureInc,
      totalExpense: pureExp,
      totalBalance: bal,
      thisMonthIncome: mPureInc,
      thisMonthExpense: mPureExp,
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
        // Exclude savings transfers so they don't distort operational cashflow chart
        if (isSavingsTransaction(t)) return;

        const [yStr, mStr] = t.date.split('T')[0].split('-');
        const txYear = parseInt(yStr, 10);
        const txMonth = parseInt(mStr, 10) - 1;
        if (txYear === year) {
          const amount = Number(t.amount) || 0;
          if (txMonth >= 0 && txMonth < 12) {
            monthlyData[txMonth].hasData = true;
            if (t.type === 'income') {
              monthlyData[txMonth].income += amount;
              totalYInc += amount;
            } else {
              monthlyData[txMonth].expense += amount;
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
        resetToDefaultData,
        appCurrency,
        setCurrency,
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
