export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default?: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  monthly_savings_target?: number;
  balance_safe_threshold?: number;   // default 100_000 (Rp/hari) — mood: happy
  balance_warning_threshold?: number; // default 50_000 (Rp/hari) — mood: neutral
  balance_critical_threshold?: number; // below warning — mood: sad
  created_at?: string;
}

export interface BalanceThresholds {
  safe: number;     // daily balance rate > safe => happy (default: 100,000 IDR/day)
  warning: number;  // daily balance rate >= warning && <= safe => neutral (default: 50,000 IDR/day)
  // daily balance rate < warning => sad
}

export type MascotMood = 'happy' | 'neutral' | 'sad';

export interface MascotState {
  mood: MascotMood;
  title: string;
  quote: string;
  color: string;
  badge: string;
}

export interface FilterOptions {
  searchTerm: string;
  type: 'all' | 'income' | 'expense' | 'savings';
  categoryId: string;
  period: 'all' | 'daily' | 'monthly' | 'yearly' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate?: string;
  endDate?: string;
  selectedYear?: number;
  selectedMonth?: number;
  selectedDay?: number;
}

export type ChartViewMode = 'daily' | 'monthly' | 'yearly';

export interface MonthlyCashflowItem {
  monthIndex: number; // 0-11
  monthName: string; // "Jan", "Feb", etc.
  fullMonthName: string; // "Januari 2026", etc.
  income: number;
  expense: number;
  net: number;
  cumulativeSavings: number;
  targetSavings: number;
  hasData: boolean;
}

export interface YearlyCashflowSummary {
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  monthlyTarget: number;
  yearlyTarget: number;
  savingsRate: number;
  targetAchievementRate: number;
  averageMonthlySavings: number;
  months: MonthlyCashflowItem[];
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  total: number;
  percentage: number;
}

export interface SavingsTargetItem {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number; // Target per bulan
  current_amount: number; // Jumlah yang sudah terkumpul saat ini
  target_date?: string;
  category_icon?: string;
  color?: string;
  is_default_preset?: boolean;
  created_at?: string;
}

export type InputModalTab = 'expense' | 'income' | 'savings';
export type SavingsActionType = 'deposit' | 'withdraw';

export interface PrintReportOptions {
  periodType: 'this_month' | 'specific_month' | 'yearly';
  year: number;
  monthIndex?: number; // 0-11
}

