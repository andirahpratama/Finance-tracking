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
  created_at?: string;
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
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  period: 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate?: string;
  endDate?: string;
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
