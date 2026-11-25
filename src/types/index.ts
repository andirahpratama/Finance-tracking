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
  is_savings_transfer?: boolean;
  savings_target_id?: string;
  savings_action?: SavingsActionType;
  created_at?: string;
}

export type CurrencyCode =
  | 'IDR'
  | 'USD'
  | 'JPY'
  | 'CNY'
  | 'SAR'
  | 'AUD'
  | 'MYR'
  | 'SGD'
  | 'EUR';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  currency?: CurrencyCode;
  monthly_savings_target?: number;
  balance_safe_threshold?: number;   // default 100_000 — mood: happy
  balance_warning_threshold?: number; // default 50_000 — mood: neutral
  balance_critical_threshold?: number; // below warning — mood: sad
  created_at?: string;
  last_login_at?: string;
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

export type IndonesianBank =
  | 'BCA'
  | 'Mandiri'
  | 'BRI'
  | 'BNI'
  | 'CIMB Niaga'
  | 'Danamon'
  | 'Permata'
  | 'BTN'
  | 'BSI'
  | 'Jenius'
  | 'Blu'
  | 'SeaBank'
  | 'Bank Jago'
  | 'OCBC'
  | 'Maybank';

export interface SavingsTargetItem {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number; // Total target dana yang ingin dicapai (misal: Rp 50.000.000)
  current_amount: number; // Jumlah yang sudah terkumpul saat ini (= initial_balance + setor - tarik)
  initial_balance?: number; // Saldo awal opsional (boleh kosong, bisa diisi belakangan)
  bank_name?: IndonesianBank | string; // Nama bank Indonesia (tanpa nomor rekening)
  deadline_date?: string; // Tanggal target pencapaian (YYYY-MM atau YYYY-MM-DD)
  auto_calculate_monthly?: boolean; // Jika true, sistem otomatis menghitung target bulanan
  target_date?: string; // legacy support
  category_icon?: string;
  color?: string;
  is_default_preset?: boolean;
  created_at?: string;
}

export type InputModalTab = 'expense' | 'income' | 'savings';
export type SavingsActionType = 'deposit' | 'withdraw';

// ==================== BUDGETING & TRANSFER TYPES ====================
export type BudgetPostKind = 'expense' | 'savings' | 'investment' | 'custom';

export interface BudgetPost {
  id: string;
  name: string;
  percent: number;
  amount: number;
  kind: BudgetPostKind;
  color?: string;
}

export interface MonthlyBudgetConfig {
  effectiveFrom: string; // YYYY-MM (berlaku ke depan saja mulai bulan ini)
  monthlyIncome: number;
  posts: BudgetPost[];
  updatedAt: string;
}

export type RemainderActionType = 'to_savings' | 'rollover' | 'withdraw_free';

export interface MonthPostSettlement {
  monthKey: string; // YYYY-MM
  postId: string;
  postName: string;
  amount: number;
  action: RemainderActionType;
  targetSavingsId?: string;
  targetSavingsName?: string;
  settledAt: string;
}

export type TransferNodeType = 'main_wallet' | 'budget_post' | 'savings_target';

export interface TransferNodeRef {
  type: TransferNodeType;
  id: string;
  label: string;
}

export interface PosTransferPayload {
  from: TransferNodeRef;
  to: TransferNodeRef;
  amount: number;
  date: string;
  notes?: string;
}

export interface SplitSavingsAllocation {
  targetId: string;
  amount: number;
}

// ==================== VERDICT & INSIGHTS TYPES ====================
export type FinancialVerdictLevel = 'Baik' | 'Waspada' | 'Buruk';

export interface FinancialVerdict {
  level: FinancialVerdictLevel;
  mood: MascotMood; // happy | neutral | sad
  headline: string;
  reasons: string[];
  moneyTrail: {
    income: number;
    expenseTotal: number;
    expenseByPost: { postId: string; postName: string; allocated: number; used: number; remaining: number }[];
    savedThisMonth: number;
    savingsTargetThisMonth: number;
  };
}

// ==================== UTANG PIUTANG TYPES ====================
export type DebtKind = 'utang' | 'piutang';
export type DebtStatus = 'belum_lunas' | 'lunas';

export interface DebtItem {
  id: string;
  user_id?: string;
  kind: DebtKind;
  person_name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD opsional
  notes?: string;
  status: DebtStatus;
  paid_at?: string;
  created_at: string;
}

// ==================== MANUAL & CLASS INVESTMENT TYPES ====================
export type ManualAssetType = 'Saham' | 'Kripto' | 'Properti' | 'Lainnya';

export interface ManualInvestment {
  id: string;
  user_id?: string;
  name: string;
  asset_type: ManualAssetType;
  invested_amount: number;
  purchase_date: string; // YYYY-MM-DD
  current_value: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type ClassStatus = 'Belum' | 'Selesai';

export interface ClassInvestment {
  id: string;
  user_id?: string;
  class_name: string;
  cost: number;
  date: string; // YYYY-MM-DD
  status: ClassStatus;
  notes?: string;
  created_at: string;
}

export interface EmergencyFundPreference {
  multiplier: number;
  targetAmount: number;
  monthlyExpenseBasis?: number;
  updatedAt: string;
}

export interface PrintReportOptions {
  periodType: 'this_month' | 'specific_month' | 'yearly';
  year: number;
  monthIndex?: number; // 0-11
}

export type FeedbackCategory = 'saran' | 'fitur' | 'bug' | 'lainnya';

export interface FeedbackMessage {
  id: string;
  user_id?: string;
  sender_name: string;
  sender_email: string;
  category: FeedbackCategory;
  message: string;
  created_at: string;
  read: boolean;
}

export interface AppSettings {
  appName: string;
  customLogo?: string; // base64 Data URL or SVG string
  customFavicon?: string; // base64 Data URL or SVG string
}

export type PingTriggerType = 'auto' | 'manual' | 'cron';

export interface SupabasePingLog {
  id: string;
  timestamp: string; // ISO string
  trigger: PingTriggerType;
  status: 'success' | 'error';
  latencyMs: number;
  message: string;
  statusCode?: number;
}

export interface SupabasePingStatus {
  isConfigured: boolean;
  projectUrl: string;
  lastPingAt: string | null;
  lastLatencyMs: number | null;
  nextScheduledPingAt: string | null;
  lastStatus: 'success' | 'error' | 'idle';
  autoPingIntervalDays: number;
}

// ==================== GOLD INVESTMENT TYPES ====================
export type GoldTransactionType = 'BUY' | 'SELL';
export type GoldBrand = 'Antam' | 'UBS' | 'Hartadinata' | 'Galeri24' | 'Lainnya';

export interface GoldTransaction {
  id: string;
  user_id?: string;
  type: GoldTransactionType;
  brand: GoldBrand;
  date: string; // YYYY-MM-DD
  gram: number; // float
  price_per_gram: number;
  total_amount: number; // gram * price_per_gram
  notes?: string;
  created_at?: string;
}

export interface GoldPortfolio {
  total_gram: number; // Akumulasi gram BUY dikurangi SELL
  total_invested_capital: number; // Modal Rupiah murni yang masih mengendap
  average_buy_price: number; // total_invested_capital / total_gram
}

export interface GoldPriceItem {
  buy: number;
  sell: number; // buyback price
}

export interface GoldPrices {
  antam: GoldPriceItem;
  ubs: GoldPriceItem;
  source: 'api-internal' | 'public-api' | 'manual' | 'mock';
  last_updated: string;
}


