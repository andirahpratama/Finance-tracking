import {
  BudgetingMode,
  BudgetModeActivation,
  BudgetPost,
  BudgetPostKind,
  FinancialVerdict,
  GoldTransaction,
  ManualInvestment,
  MonthlyBudgetConfig,
  MonthPostSettlement,
  SavingsTargetItem,
  SimpleBudgetConfig,
  Transaction,
} from '../types';
import { formatRupiah } from './formatters';
import { isSavingsTransaction, parseTransferMeta } from './savingsUtils';

export const FIXED_BUDGET_RULE_TEXT =
  'Budget bulanan hanya berubah bila kamu mengubahnya sendiri. Pemasukan naik tidak pernah menaikkan budget otomatis.';

export const getMonthKey = (year: number, monthIndex: number): string => {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
};

export const getCurrentMonthKey = (): string => {
  const now = new Date();
  return getMonthKey(now.getFullYear(), now.getMonth());
};

export const getPreviousMonthKey = (monthKey: string): string => {
  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const prev = new Date(y, m - 1, 1);
  return getMonthKey(prev.getFullYear(), prev.getMonth());
};

export const formatMonthKeyLabel = (monthKey: string): string => {
  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${monthNames[m] || mStr} ${y}`;
};

export const detectPostKind = (name: string): BudgetPostKind => {
  const lower = name.toLowerCase();
  if (lower.includes('nabung') || lower.includes('tabung') || lower.includes('darurat')) {
    return 'savings';
  }
  if (lower.includes('invest') || lower.includes('emas') || lower.includes('saham')) {
    return 'investment';
  }
  if (
    lower.includes('biaya') ||
    lower.includes('bulanan') ||
    lower.includes('kebutuhan') ||
    lower.includes('belanja') ||
    lower.includes('hidup')
  ) {
    return 'expense';
  }
  return 'custom';
};

export const createSuggestedBudgetPosts = (monthlyIncome: number): BudgetPost[] => {
  const income = Math.max(0, monthlyIncome);
  return [
    {
      id: 'pos-biaya-bulanan',
      name: 'Biaya Bulanan',
      percent: 50,
      amount: Math.round(income * 0.5),
      kind: 'expense',
      color: '#4a8c67',
    },
    {
      id: 'pos-investasi',
      name: 'Investasi',
      percent: 30,
      amount: Math.round(income * 0.3),
      kind: 'investment',
      color: '#d49a22',
    },
    {
      id: 'pos-nabung',
      name: 'Nabung',
      percent: 20,
      amount: Math.round(income * 0.2),
      kind: 'savings',
      color: '#0d9488',
    },
  ];
};

/**
 * Forward-only budget mode resolution for a given monthKey.
 */
export const getBudgetModeForMonth = (
  modeHistory: BudgetModeActivation[],
  fallbackMode: BudgetingMode | null,
  targetMonthKey: string
): BudgetingMode | null => {
  if (modeHistory && modeHistory.length > 0) {
    const applicable = modeHistory
      .filter((m) => m.effectiveFrom <= targetMonthKey)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    if (applicable[0]) return applicable[0].mode;
    return null;
  }
  return fallbackMode;
};

/**
 * Forward-only Complete Mode config resolution.
 */
export const getBudgetConfigForMonth = (
  configs: MonthlyBudgetConfig[],
  targetMonthKey: string
): MonthlyBudgetConfig | null => {
  if (!configs || configs.length === 0) return null;
  const applicable = configs
    .filter((c) => c.effectiveFrom <= targetMonthKey)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return applicable[0] || null;
};

/**
 * Forward-only Simple Mode config resolution.
 */
export const getSimpleBudgetConfigForMonth = (
  configs: SimpleBudgetConfig[],
  targetMonthKey: string
): SimpleBudgetConfig | null => {
  if (!configs || configs.length === 0) return null;
  const applicable = configs
    .filter((c) => c.effectiveFrom <= targetMonthKey)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return applicable[0] || null;
};

export interface PostUsageSummary {
  post: BudgetPost;
  allocated: number;
  rolloverIn: number;
  transferIn: number;
  transferOut: number;
  effectiveBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  settlement?: MonthPostSettlement;
}

export interface MonthlyExpenseCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentOfExpense: number;
}

export interface SimpleModeSummary {
  monthlyBudget: number; // Tetap (tidak pernah naik otomatis karena pemasukan naik)
  rolloverIn: number;
  transferIn: number;
  effectiveBudget: number;
  spent: number;
  budgetRemaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  recordedIncome: number;
  sisaPemasukan: number; // Pemasukan - Budget Bulanan
  investPercent: number;
  savingsPercent: number;
  plannedInvestAmount: number;
  plannedSavingsAmount: number;
  investRealized: number;
  savingsRealized: number;
  noSisaWarning: boolean; // true jika Pemasukan <= Budget Bulanan
  settlement?: MonthPostSettlement;
}

export interface ExtraIncomeAllocation {
  extraAmount: number; // max(0, actualIncome - plannedIncome)
  toInvestment: number;
  toSavings: number;
  unallocated: number;
  hasInvestmentPost: boolean;
  hasSavingsPost: boolean;
  investmentPostName?: string;
  savingsPostName?: string;
}

export interface MonthlyBudgetStatus {
  monthKey: string;
  mode: BudgetingMode | null;
  config: MonthlyBudgetConfig | null;
  simpleConfig: SimpleBudgetConfig | null;
  simpleSummary: SimpleModeSummary | null;
  extraIncomeAllocation: ExtraIncomeAllocation | null;
  plannedIncome: number;
  actualIncome: number;
  actualExpense: number;
  actualNetSavingsDeposit: number;
  actualSavingsDepositGross: number;
  actualInvestmentSpent: number;
  posts: PostUsageSummary[];
  primaryExpensePost: PostUsageSummary | null;
  expenseCategories: MonthlyExpenseCategoryBreakdown[];
}

const getTxMonthKey = (dateStr: string): string => {
  const clean = dateStr.split('T')[0];
  return clean.slice(0, 7);
};

export const calculateMonthlyBudgetStatus = ({
  monthKey,
  modeHistory = [],
  activeMode = null,
  configs,
  simpleConfigs = [],
  settlements,
  transactions,
  goldTransactions = [],
  manualInvestments = [],
}: {
  monthKey: string;
  modeHistory?: BudgetModeActivation[];
  activeMode?: BudgetingMode | null;
  configs: MonthlyBudgetConfig[];
  simpleConfigs?: SimpleBudgetConfig[];
  settlements: MonthPostSettlement[];
  transactions: Transaction[];
  goldTransactions?: GoldTransaction[];
  manualInvestments?: ManualInvestment[];
}): MonthlyBudgetStatus => {
  const completeConfig = getBudgetConfigForMonth(configs, monthKey);
  const simpleConfig = getSimpleBudgetConfigForMonth(simpleConfigs, monthKey);

  let resolvedMode = getBudgetModeForMonth(modeHistory, activeMode, monthKey);
  if (!resolvedMode) {
    // Fallback if config exists for that month without modeHistory entry
    if (simpleConfig && !completeConfig) resolvedMode = 'simple';
    else if (completeConfig) resolvedMode = 'complete';
  }
  // Ensure resolvedMode actually has a config for this month, otherwise fallback to whichever exists
  if (resolvedMode === 'simple' && !simpleConfig && completeConfig) {
    resolvedMode = 'complete';
  } else if (resolvedMode === 'complete' && !completeConfig && simpleConfig) {
    resolvedMode = 'simple';
  }

  const prevMonthKey = getPreviousMonthKey(monthKey);
  const monthTxs = transactions.filter((t) => getTxMonthKey(t.date) === monthKey);

  let actualIncome = 0;
  let actualExpense = 0;
  let savingsDeposit = 0;
  let savingsWithdraw = 0;

  const categoryTotals = new Map<string, MonthlyExpenseCategoryBreakdown>();
  const transferInMap = new Map<string, number>();
  const transferOutMap = new Map<string, number>();

  monthTxs.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const isSav = isSavingsTransaction(t);

    if (isSav) {
      const meta = parseTransferMeta(t.notes);
      if (meta) {
        if (meta.fromType === 'budget_post') {
          transferOutMap.set(meta.fromId, (transferOutMap.get(meta.fromId) || 0) + amt);
        }
        if (meta.toType === 'budget_post') {
          transferInMap.set(meta.toId, (transferInMap.get(meta.toId) || 0) + amt);
        }
        if (meta.toType === 'savings_target') {
          savingsDeposit += amt;
        }
        if (meta.fromType === 'savings_target') {
          savingsWithdraw += amt;
        }
      } else {
        const isDeposit =
          t.savings_action === 'deposit' ||
          t.notes?.includes('Setor') ||
          t.type === 'expense';
        const isWithdraw =
          t.savings_action === 'withdraw' ||
          t.notes?.includes('Tarik') ||
          t.type === 'income';
        if (isDeposit) savingsDeposit += amt;
        else if (isWithdraw) savingsWithdraw += amt;
      }
      return;
    }

    if (t.type === 'income') {
      actualIncome += amt;
    } else if (t.type === 'expense') {
      actualExpense += amt;
      const catKey = t.category_id || t.category_name || 'lainnya';
      const existing = categoryTotals.get(catKey) || {
        categoryId: catKey,
        categoryName: t.category_name || 'Lainnya',
        categoryIcon: t.category_icon || 'Wallet',
        categoryColor: t.category_color || '#64748B',
        total: 0,
        percentOfExpense: 0,
      };
      existing.total += amt;
      categoryTotals.set(catKey, existing);
    }
  });

  const expenseCategories = Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      ...c,
      percentOfExpense: actualExpense > 0 ? Number(((c.total / actualExpense) * 100).toFixed(1)) : 0,
    }));

  const goldBoughtThisMonth = goldTransactions
    .filter((g) => g.type === 'BUY' && getTxMonthKey(g.date) === monthKey)
    .reduce((s, g) => s + (Number(g.total_amount) || 0), 0);

  const manualInvestThisMonth = manualInvestments
    .filter((m) => getTxMonthKey(m.purchase_date) === monthKey)
    .reduce((s, m) => s + (Number(m.invested_amount) || 0), 0);

  const totalInvestmentSpentThisMonth = goldBoughtThisMonth + manualInvestThisMonth;
  const actualNetSavingsDeposit = Math.max(0, savingsDeposit - savingsWithdraw);

  // ==================== MODE SEDERHANA ====================
  let simpleSummary: SimpleModeSummary | null = null;
  if (resolvedMode === 'simple' && simpleConfig) {
    const monthlyBudget = Number(simpleConfig.monthlyBudget) || 0;
    const rolloverIn = settlements
      .filter((s) => s.monthKey === prevMonthKey && s.action === 'rollover' && s.postId === 'simple-budget')
      .reduce((sum, s) => sum + s.amount, 0);
    const transferIn = transferInMap.get('simple-budget') || 0;
    const effectiveBudget = Math.max(0, monthlyBudget + rolloverIn + transferIn);
    const budgetRemaining = effectiveBudget - actualExpense;
    const percentUsed = effectiveBudget > 0 ? Math.round((actualExpense / effectiveBudget) * 100) : 0;

    // Sisa = Pemasukan - Budget Bulanan (Budget tetap, tidak pernah naik otomatis!)
    const rawSisa = actualIncome - monthlyBudget;
    const sisaPemasukan = Math.max(0, rawSisa);
    const investPct = Number(simpleConfig.investPercent) || 0;
    const savingsPct = Number(simpleConfig.savingsPercent) || 0;
    const plannedInvestAmount = sisaPemasukan > 0 ? Math.round((sisaPemasukan * investPct) / 100) : 0;
    const plannedSavingsAmount = sisaPemasukan > 0 ? Math.max(0, sisaPemasukan - plannedInvestAmount) : 0;

    const settlement = settlements.find((s) => s.monthKey === monthKey && s.postId === 'simple-budget');

    simpleSummary = {
      monthlyBudget,
      rolloverIn,
      transferIn,
      effectiveBudget,
      spent: actualExpense,
      budgetRemaining,
      percentUsed,
      isOverBudget: actualExpense > effectiveBudget && effectiveBudget > 0,
      recordedIncome: actualIncome,
      sisaPemasukan,
      investPercent: investPct,
      savingsPercent: savingsPct,
      plannedInvestAmount,
      plannedSavingsAmount,
      investRealized: totalInvestmentSpentThisMonth,
      savingsRealized: savingsDeposit,
      noSisaWarning: rawSisa <= 0,
      settlement,
    };
  }

  // ==================== MODE LENGKAP ====================
  const postsList: BudgetPost[] = resolvedMode === 'complete' && completeConfig ? completeConfig.posts : [];
  const primaryExpensePostId =
    postsList.find((p) => p.kind === 'expense')?.id ||
    postsList.find((p) => p.name.toLowerCase().includes('biaya'))?.id ||
    postsList[0]?.id;

  const primarySavingsPost =
    postsList.find((p) => p.kind === 'savings') ||
    postsList.find((p) => p.name.toLowerCase().includes('nabung') || p.name.toLowerCase().includes('tabung'));

  const primaryInvestmentPost =
    postsList.find((p) => p.kind === 'investment') ||
    postsList.find((p) => p.name.toLowerCase().includes('invest'));

  const postSummaries: PostUsageSummary[] = postsList.map((post) => {
    const rolloverIn = settlements
      .filter(
        (s) =>
          s.monthKey === prevMonthKey &&
          s.action === 'rollover' &&
          (s.postId === post.id || s.postName.toLowerCase() === post.name.toLowerCase())
      )
      .reduce((sum, s) => sum + s.amount, 0);

    const transferIn = transferInMap.get(post.id) || 0;
    const transferOut = transferOutMap.get(post.id) || 0;
    const allocated = Number(post.amount) || 0;
    // Budget bulanan tetap sebesar rencana (plus rollover manual atau transfer masuk manual), TIDAK naik karena pemasukan tambahan
    const effectiveBudget = Math.max(0, allocated + rolloverIn + transferIn);

    let spent = transferOut;
    if (post.id === primaryExpensePostId) {
      spent += actualExpense;
    } else if (primarySavingsPost && post.id === primarySavingsPost.id) {
      spent += savingsDeposit;
    } else if (primaryInvestmentPost && post.id === primaryInvestmentPost.id) {
      spent += totalInvestmentSpentThisMonth;
    }

    const remaining = effectiveBudget - spent;
    const percentUsed = effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0;
    const settlement = settlements.find((s) => s.monthKey === monthKey && s.postId === post.id);

    return {
      post,
      allocated,
      rolloverIn,
      transferIn,
      transferOut,
      effectiveBudget,
      spent,
      remaining,
      percentUsed,
      isOverBudget: spent > effectiveBudget && effectiveBudget > 0,
      settlement,
    };
  });

  const primaryExpensePost =
    postSummaries.find((p) => p.post.id === primaryExpensePostId) || null;

  // Pemasukan Tambahan rule for Mode Lengkap:
  // Pemasukan Tambahan = Pemasukan Tercatat - Total Pemasukan yang direncanakan
  // Tidak pernah menaikkan Biaya Bulanan! Dialokasikan ke Investasi & Nabung sesuai rasio persen keduanya.
  let extraIncomeAllocation: ExtraIncomeAllocation | null = null;
  if (resolvedMode === 'complete' && completeConfig) {
    const extraAmount = Math.max(0, actualIncome - (completeConfig.monthlyIncome || 0));
    const invPct = primaryInvestmentPost ? Number(primaryInvestmentPost.percent) || 0 : 0;
    const savPct = primarySavingsPost ? Number(primarySavingsPost.percent) || 0 : 0;
    const hasInvestmentPost = Boolean(primaryInvestmentPost);
    const hasSavingsPost = Boolean(primarySavingsPost);

    let toInvestment = 0;
    let toSavings = 0;
    let unallocated = 0;

    if (extraAmount > 0) {
      if (hasInvestmentPost && hasSavingsPost) {
        const sumPct = invPct + savPct;
        if (sumPct > 0) {
          toInvestment = Math.round((extraAmount * invPct) / sumPct);
          toSavings = extraAmount - toInvestment;
        } else {
          toInvestment = Math.round(extraAmount / 2);
          toSavings = extraAmount - toInvestment;
        }
      } else if (hasInvestmentPost) {
        toInvestment = extraAmount;
      } else if (hasSavingsPost) {
        toSavings = extraAmount;
      } else {
        unallocated = extraAmount;
      }
    }

    extraIncomeAllocation = {
      extraAmount,
      toInvestment,
      toSavings,
      unallocated,
      hasInvestmentPost,
      hasSavingsPost,
      investmentPostName: primaryInvestmentPost?.name,
      savingsPostName: primarySavingsPost?.name,
    };
  }

  return {
    monthKey,
    mode: resolvedMode,
    config: resolvedMode === 'complete' ? completeConfig : null,
    simpleConfig: resolvedMode === 'simple' ? simpleConfig : null,
    simpleSummary,
    extraIncomeAllocation,
    plannedIncome: resolvedMode === 'complete' ? completeConfig?.monthlyIncome || 0 : 0,
    actualIncome,
    actualExpense,
    actualNetSavingsDeposit,
    actualSavingsDepositGross: savingsDeposit,
    actualInvestmentSpent: totalInvestmentSpentThisMonth,
    posts: postSummaries,
    primaryExpensePost,
    expenseCategories,
  };
};

/**
 * Verdict Perencanaan Bulanan sesuai mode aktif (Sederhana vs Lengkap):
 * - Mode Sederhana:
 *   Baik -> belanja <= Budget Bulanan AND sisa teralokasi (atau tabungan/investasi terpenuhi)
 *   Waspada -> belanja melebihi Budget Bulanan OR pemasukan <= Budget Bulanan OR sisa belum teralokasi
 *   Buruk -> total pengeluaran > pemasukan bulan ini OR tabungan 0 dua bulan berturut-turut
 * - Mode Lengkap:
 *   Baik -> semua pos dalam alokasi AND tabungan/sisa dialokasikan
 *   Waspada -> ada pos melebihi budget OR tabungan di bawah target OR ada pemasukan tambahan belum dialokasikan
 *   Buruk -> total pengeluaran > pemasukan bulan ini OR tabungan 0 dua bulan berturut-turut
 */
export const computeMonthlyVerdict = ({
  monthKey,
  budgetStatus,
  transactions,
  monthlySavingsTarget,
  savingsTargets,
}: {
  monthKey: string;
  budgetStatus: MonthlyBudgetStatus;
  transactions: Transaction[];
  monthlySavingsTarget: number;
  savingsTargets: SavingsTargetItem[];
}): FinancialVerdict => {
  const prevMonthKey = getPreviousMonthKey(monthKey);
  const prevMonthTxs = transactions.filter((t) => getTxMonthKey(t.date) === prevMonthKey);

  let prevSavingsDeposit = 0;
  let prevInc = 0;
  let prevExp = 0;
  prevMonthTxs.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (isSavingsTransaction(t)) {
      if (t.savings_action === 'deposit' || t.notes?.includes('Setor') || t.type === 'expense') {
        prevSavingsDeposit += amt;
      }
    } else {
      if (t.type === 'income') prevInc += amt;
      else prevExp += amt;
    }
  });

  const thisMonthSaved = budgetStatus.actualSavingsDepositGross;
  const prevMonthSaved = prevSavingsDeposit > 0 ? prevSavingsDeposit : Math.max(0, prevInc - prevExp);

  const incomeExceeded =
    budgetStatus.actualIncome > 0 && budgetStatus.actualExpense > budgetStatus.actualIncome;
  const zeroSavingsTwoMonths =
    prevMonthTxs.length > 0 &&
    thisMonthSaved <= 0 &&
    prevMonthSaved <= 0 &&
    budgetStatus.actualIncome - budgetStatus.actualExpense <= 0;

  // Build Money Trail
  let expenseByPost = budgetStatus.posts.map((p) => ({
    postId: p.post.id,
    postName: p.post.name,
    allocated: p.effectiveBudget,
    used: p.spent,
    remaining: p.remaining,
  }));

  let effectiveSavingsTarget = monthlySavingsTarget || 0;

  if (budgetStatus.mode === 'simple' && budgetStatus.simpleSummary) {
    const ss = budgetStatus.simpleSummary;
    effectiveSavingsTarget = ss.plannedSavingsAmount;
    expenseByPost = [
      {
        postId: 'simple-budget',
        postName: 'Budget Bulanan',
        allocated: ss.effectiveBudget,
        used: ss.spent,
        remaining: ss.budgetRemaining,
      },
      {
        postId: 'simple-invest',
        postName: `Rencana Investasi (${ss.investPercent}%)`,
        allocated: ss.plannedInvestAmount,
        used: ss.investRealized,
        remaining: ss.plannedInvestAmount - ss.investRealized,
      },
      {
        postId: 'simple-savings',
        postName: `Rencana Tabungan (${ss.savingsPercent}%)`,
        allocated: ss.plannedSavingsAmount,
        used: ss.savingsRealized,
        remaining: ss.plannedSavingsAmount - ss.savingsRealized,
      },
    ];
  } else {
    const nabungPost = budgetStatus.posts.find(
      (p) => p.post.kind === 'savings' || p.post.name.toLowerCase().includes('nabung')
    );
    const savingsTargetFromGoals = savingsTargets.reduce((sum, s) => {
      const rem = Math.max(0, s.target_amount - (s.current_amount || 0));
      if (rem <= 0) return sum;
      return sum + Math.ceil(rem / 12);
    }, 0);
    effectiveSavingsTarget =
      nabungPost?.allocated || savingsTargetFromGoals || monthlySavingsTarget || 0;
  }

  const moneyTrail = {
    income: budgetStatus.actualIncome,
    expenseTotal: budgetStatus.actualExpense,
    expenseByPost,
    savedThisMonth: thisMonthSaved,
    savingsTargetThisMonth: effectiveSavingsTarget,
  };

  const reasons: string[] = [];

  // 1. Kondisi BURUK (berlaku di kedua mode)
  if (incomeExceeded || zeroSavingsTwoMonths) {
    if (incomeExceeded) {
      reasons.push(
        `Pengeluaran bulan ini (${formatRupiah(budgetStatus.actualExpense)}) melebihi pemasukan (${formatRupiah(budgetStatus.actualIncome)}).`
      );
    }
    if (zeroSavingsTwoMonths) {
      reasons.push('Tabungan Rp 0 selama dua bulan berturut-turut.');
    }
    if (budgetStatus.mode === 'simple' && budgetStatus.simpleSummary?.isOverBudget) {
      reasons.push(
        `Belanja melewati Budget Bulanan tetap (${formatRupiah(budgetStatus.simpleSummary.effectiveBudget)}).`
      );
    }
    return {
      level: 'Buruk',
      mood: 'sad',
      headline: 'Kondisi Kritis — Perlu Rem Pengeluaran',
      reasons,
      moneyTrail,
    };
  }

  // 2. Belum ada mode / pengaturan budgeting
  if (!budgetStatus.mode || (!budgetStatus.simpleSummary && !budgetStatus.config)) {
    return {
      level: 'Waspada',
      mood: 'neutral',
      headline: 'Budgeting Belum Diatur',
      reasons: ['Pilih Mode Sederhana atau Mode Lengkap di Profil & Budgeting untuk mulai memantau anggaran.'],
      moneyTrail,
    };
  }

  // 3. Evaluasi MODE SEDERHANA
  if (budgetStatus.mode === 'simple' && budgetStatus.simpleSummary) {
    const ss = budgetStatus.simpleSummary;
    const unallocatedSavings = ss.plannedSavingsAmount > 0 && ss.savingsRealized < ss.plannedSavingsAmount;
    const unallocatedInvest = ss.plannedInvestAmount > 0 && ss.investRealized < ss.plannedInvestAmount;

    if (ss.isOverBudget || ss.noSisaWarning || unallocatedSavings || unallocatedInvest) {
      if (ss.isOverBudget) {
        reasons.push(
          `Belanja (${formatRupiah(ss.spent)}) melewati Budget Bulanan (${formatRupiah(ss.effectiveBudget)}).`
        );
      }
      if (ss.noSisaWarning) {
        reasons.push(
          `Pemasukan bulan ini (${formatRupiah(ss.recordedIncome)}) tidak melebihi Budget Bulanan (${formatRupiah(ss.monthlyBudget)}) sehingga belum ada sisa untuk Investasi & Tabungan.`
        );
      } else {
        if (unallocatedSavings) {
          reasons.push(
            `Rencana Tabungan (${formatRupiah(ss.plannedSavingsAmount)}) baru terealisasi ${formatRupiah(ss.savingsRealized)}.`
          );
        }
        if (unallocatedInvest) {
          reasons.push(
            `Rencana Investasi (${formatRupiah(ss.plannedInvestAmount)}) baru terealisasi ${formatRupiah(ss.investRealized)}.`
          );
        }
      }
      return {
        level: 'Waspada',
        mood: 'neutral',
        headline: 'Perlu Penyesuaian Mode Sederhana',
        reasons,
        moneyTrail,
      };
    }

    reasons.push(
      `Belanja (${formatRupiah(ss.spent)}) masih aman di dalam Budget Bulanan (${formatRupiah(ss.effectiveBudget)}).`
    );
    if (ss.sisaPemasukan > 0) {
      reasons.push(
        `Sisa ${formatRupiah(ss.sisaPemasukan)} sudah teralokasi ke Investasi (${ss.investPercent}%) & Tabungan (${ss.savingsPercent}%).`
      );
    }
    return {
      level: 'Baik',
      mood: 'happy',
      headline: 'Keuangan Keluarga Terkendali!',
      reasons,
      moneyTrail,
    };
  }

  // 4. Evaluasi MODE LENGKAP
  const overBudgetPosts = budgetStatus.posts.filter((p) => p.isOverBudget);
  const extraUnallocated = (budgetStatus.extraIncomeAllocation?.unallocated || 0) > 0;
  const savingsBelowTarget =
    effectiveSavingsTarget > 0 &&
    thisMonthSaved < effectiveSavingsTarget &&
    Math.max(0, budgetStatus.actualIncome - budgetStatus.actualExpense) < effectiveSavingsTarget;

  if (overBudgetPosts.length > 0 || savingsBelowTarget || extraUnallocated) {
    if (overBudgetPosts.length > 0) {
      reasons.push(
        `Pos ${overBudgetPosts.map((p) => p.post.name).join(', ')} sudah melewati batas alokasi.`
      );
    }
    if (savingsBelowTarget) {
      reasons.push(
        `Setoran tabungan bulan ini (${formatRupiah(thisMonthSaved)}) masih di bawah target (${formatRupiah(effectiveSavingsTarget)}).`
      );
    }
    if (extraUnallocated && budgetStatus.extraIncomeAllocation) {
      reasons.push(
        `Ada Pemasukan Tambahan ${formatRupiah(budgetStatus.extraIncomeAllocation.unallocated)} yang belum dialokasikan.`
      );
    }
    return {
      level: 'Waspada',
      mood: 'neutral',
      headline: 'Cukup Terkendali, Tetap Waspada',
      reasons,
      moneyTrail,
    };
  }

  reasons.push('Semua pos masih berada di dalam batas alokasi rencana.');
  if (effectiveSavingsTarget > 0) {
    reasons.push(
      `Tabungan bulan ini terjaga (${formatRupiah(Math.max(thisMonthSaved, budgetStatus.actualIncome - budgetStatus.actualExpense))} terhadap target ${formatRupiah(effectiveSavingsTarget)}).`
    );
  }
  return {
    level: 'Baik',
    mood: 'happy',
    headline: 'Perencanaan Keuangan Sehat!',
    reasons,
    moneyTrail,
  };
};

export interface MonthlyInsightTip {
  id: string;
  title: string;
  description: string;
  tone: 'good' | 'warn' | 'bad' | 'info';
}

export const generateMonthlyInsights = ({
  monthKey,
  budgetStatus,
  verdict,
  transactions,
}: {
  monthKey: string;
  budgetStatus: MonthlyBudgetStatus;
  verdict: FinancialVerdict;
  transactions: Transaction[];
}): MonthlyInsightTip[] => {
  const tips: MonthlyInsightTip[] = [];

  // 1. Kategori pengeluaran terbesar
  const topCat = budgetStatus.expenseCategories[0];
  if (topCat) {
    tips.push({
      id: 'top-category',
      title: `Pengeluaran Terbesar: ${topCat.categoryName}`,
      description: `Menghabiskan ${formatRupiah(topCat.total)} (${topCat.percentOfExpense}% dari total pengeluaran bulan ini).`,
      tone: topCat.percentOfExpense >= 45 ? 'warn' : 'info',
    });
  } else {
    tips.push({
      id: 'top-category-empty',
      title: 'Belum Ada Pengeluaran Tercatat',
      description: 'Catat pengeluaran harianmu agar analisa kategori otomatis bisa membantu memantau pos terbesarmu.',
      tone: 'info',
    });
  }

  // 2. Status budget sesuai mode aktif
  if (budgetStatus.mode === 'simple' && budgetStatus.simpleSummary) {
    const ss = budgetStatus.simpleSummary;
    if (ss.isOverBudget) {
      tips.push({
        id: 'simple-over',
        title: `Belanja Melewati Budget Bulanan`,
        description: `Terpakai ${formatRupiah(ss.spent)} dari Budget Bulanan tetap ${formatRupiah(ss.effectiveBudget)}.`,
        tone: 'bad',
      });
    } else if (ss.noSisaWarning) {
      tips.push({
        id: 'simple-no-sisa',
        title: 'Pemasukan Belum Melebihi Budget',
        description: `Pemasukan ${formatRupiah(ss.recordedIncome)} masih ≤ Budget Bulanan ${formatRupiah(ss.monthlyBudget)}.`,
        tone: 'warn',
      });
    } else {
      tips.push({
        id: 'simple-ok',
        title: 'Budget Bulanan Tetap Aman',
        description: `Sisa Budget belanja ${formatRupiah(ss.budgetRemaining)}. Sisa pemasukan ${formatRupiah(ss.sisaPemasukan)} siap dialokasikan ke Investasi & Tabungan.`,
        tone: 'good',
      });
    }
  } else {
    const overPosts = budgetStatus.posts.filter((p) => p.isOverBudget);
    const nearLimitPosts = budgetStatus.posts.filter(
      (p) => !p.isOverBudget && p.percentUsed >= 85 && p.effectiveBudget > 0
    );
    if (overPosts.length > 0) {
      tips.push({
        id: 'over-budget',
        title: `Pos Melebihi Budget: ${overPosts.map((p) => p.post.name).join(', ')}`,
        description: `Pos ${overPosts[0].post.name} sudah terpakai ${overPosts[0].percentUsed}% (${formatRupiah(overPosts[0].spent)} dari ${formatRupiah(overPosts[0].effectiveBudget)}).`,
        tone: 'bad',
      });
    } else if (nearLimitPosts.length > 0) {
      tips.push({
        id: 'near-limit',
        title: `Pos Mendekati Batas: ${nearLimitPosts[0].post.name}`,
        description: `Sudah terpakai ${nearLimitPosts[0].percentUsed}%, tersisa ${formatRupiah(nearLimitPosts[0].remaining)} sampai akhir bulan.`,
        tone: 'warn',
      });
    } else if (budgetStatus.config) {
      tips.push({
        id: 'budget-on-track',
        title: 'Semua Pos Masih Sesuai Rencana',
        description: 'Belum ada pos yang melewati anggaran bulan ini.',
        tone: 'good',
      });
    }
  }

  // 3. Tingkat tabungan bulan ini vs target
  const { savedThisMonth, savingsTargetThisMonth } = verdict.moneyTrail;
  if (savingsTargetThisMonth > 0) {
    const pct = Math.round((savedThisMonth / savingsTargetThisMonth) * 100);
    tips.push({
      id: 'savings-rate',
      title: `Setoran Tabungan: ${pct}% dari Target`,
      description:
        savedThisMonth >= savingsTargetThisMonth
          ? `Sudah menyetor ${formatRupiah(savedThisMonth)} — mencapai target ${formatRupiah(savingsTargetThisMonth)} bulan ini.`
          : `Baru menyetor ${formatRupiah(savedThisMonth)} dari target ${formatRupiah(savingsTargetThisMonth)}. Kurang ${formatRupiah(savingsTargetThisMonth - savedThisMonth)} lagi.`,
      tone: savedThisMonth >= savingsTargetThisMonth ? 'good' : 'warn',
    });
  }

  // 4. Perbandingan dengan bulan lalu
  const prevMonthKey = getPreviousMonthKey(monthKey);
  const prevExpense = transactions
    .filter((t) => !isSavingsTransaction(t) && t.type === 'expense' && getTxMonthKey(t.date) === prevMonthKey)
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  if (prevExpense > 0 && budgetStatus.actualExpense > 0) {
    const diff = budgetStatus.actualExpense - prevExpense;
    const diffPct = Math.round((Math.abs(diff) / prevExpense) * 100);
    if (diff > 0) {
      tips.push({
        id: 'mom-compare',
        title: `Pengeluaran Naik ${diffPct}% dari Bulan Lalu`,
        description: `Bulan ini ${formatRupiah(budgetStatus.actualExpense)} dibanding ${formatRupiah(prevExpense)} di ${formatMonthKeyLabel(prevMonthKey)}.`,
        tone: diffPct >= 20 ? 'warn' : 'info',
      });
    } else if (diff < 0) {
      tips.push({
        id: 'mom-compare',
        title: `Pengeluaran Lebih Hemat ${diffPct}% dari Bulan Lalu`,
        description: `Bulan ini ${formatRupiah(budgetStatus.actualExpense)} dibanding ${formatRupiah(prevExpense)} di ${formatMonthKeyLabel(prevMonthKey)}.`,
        tone: 'good',
      });
    }
  }

  return tips;
};
