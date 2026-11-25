import {
  BudgetPost,
  BudgetPostKind,
  FinancialVerdict,
  GoldTransaction,
  ManualInvestment,
  MonthlyBudgetConfig,
  MonthPostSettlement,
  SavingsTargetItem,
  Transaction,
} from '../types';
import { formatRupiah } from './formatters';
import { isSavingsTransaction, parseTransferMeta } from './savingsUtils';

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
  if (lower.includes('biaya') || lower.includes('bulanan') || lower.includes('kebutuhan') || lower.includes('belanja') || lower.includes('hidup')) {
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
 * Forward-only budget config resolution:
 * Finds the most recent config where config.effectiveFrom <= targetMonthKey.
 * Saving a config in month M sets effectiveFrom = M so months < M are NEVER altered.
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

export interface MonthlyBudgetStatus {
  monthKey: string;
  config: MonthlyBudgetConfig | null;
  plannedIncome: number;
  actualIncome: number;
  actualExpense: number;
  actualNetSavingsDeposit: number;
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
  configs,
  settlements,
  transactions,
  goldTransactions = [],
  manualInvestments = [],
}: {
  monthKey: string;
  configs: MonthlyBudgetConfig[];
  settlements: MonthPostSettlement[];
  transactions: Transaction[];
  goldTransactions?: GoldTransaction[];
  manualInvestments?: ManualInvestment[];
}): MonthlyBudgetStatus => {
  const config = getBudgetConfigForMonth(configs, monthKey);
  const prevMonthKey = getPreviousMonthKey(monthKey);

  const monthTxs = transactions.filter((t) => getTxMonthKey(t.date) === monthKey);

  let actualIncome = 0;
  let actualExpense = 0;
  let savingsDeposit = 0;
  let savingsWithdraw = 0;

  const categoryTotals = new Map<string, MonthlyExpenseCategoryBreakdown>();

  // Track transfers per budget post ID or name
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

  // Investment spending this month (gold buys + manual investments purchased this month)
  const goldBoughtThisMonth = goldTransactions
    .filter((g) => g.type === 'BUY' && getTxMonthKey(g.date) === monthKey)
    .reduce((s, g) => s + (Number(g.total_amount) || 0), 0);

  const manualInvestThisMonth = manualInvestments
    .filter((m) => getTxMonthKey(m.purchase_date) === monthKey)
    .reduce((s, m) => s + (Number(m.invested_amount) || 0), 0);

  const totalInvestmentSpentThisMonth = goldBoughtThisMonth + manualInvestThisMonth;
  const actualNetSavingsDeposit = Math.max(0, savingsDeposit - savingsWithdraw);

  const postsList: BudgetPost[] = config?.posts || [];
  // Identify primary expense post (first post with kind === 'expense', or first post matching 'biaya')
  const primaryExpensePostId =
    postsList.find((p) => p.kind === 'expense')?.id ||
    postsList.find((p) => p.name.toLowerCase().includes('biaya'))?.id ||
    postsList[0]?.id;

  const primarySavingsPostId =
    postsList.find((p) => p.kind === 'savings')?.id ||
    postsList.find((p) => p.name.toLowerCase().includes('nabung') || p.name.toLowerCase().includes('tabung'))?.id;

  const primaryInvestmentPostId =
    postsList.find((p) => p.kind === 'investment')?.id ||
    postsList.find((p) => p.name.toLowerCase().includes('invest'))?.id;

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
    const effectiveBudget = Math.max(0, allocated + rolloverIn + transferIn);

    let spent = transferOut;
    if (post.id === primaryExpensePostId) {
      spent += actualExpense;
    } else if (post.id === primarySavingsPostId) {
      // Transfers into savings targets count as fulfilling the Nabung post
      spent += savingsDeposit;
    } else if (post.id === primaryInvestmentPostId) {
      spent += totalInvestmentSpentThisMonth;
    }

    const remaining = effectiveBudget - spent;
    const percentUsed = effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0;
    const settlement = settlements.find(
      (s) => s.monthKey === monthKey && s.postId === post.id
    );

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

  return {
    monthKey,
    config,
    plannedIncome: config?.monthlyIncome || 0,
    actualIncome,
    actualExpense,
    actualNetSavingsDeposit,
    posts: postSummaries,
    primaryExpensePost,
    expenseCategories,
  };
};

/**
 * Computes monthly financial verdict with transparent rules:
 * - 'Baik': all posts within budget AND savings meets target this month
 * - 'Waspada': one post exceeds budget OR savings is below target
 * - 'Buruk': total expenses exceed income this month OR savings is 0 for 2 consecutive months
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

  // Check if previous month had any net savings (either deposit to savings target or income - expense > 0)
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

  const thisMonthSaved = budgetStatus.actualNetSavingsDeposit;
  const prevMonthSaved = prevSavingsDeposit > 0 ? prevSavingsDeposit : Math.max(0, prevInc - prevExp);

  // Determine active savings target for the month:
  // If user configured a Nabung budget post, use its allocation; otherwise fallback to savingsTargets monthly sum or monthlySavingsTarget
  const nabungPost = budgetStatus.posts.find(
    (p) => p.post.kind === 'savings' || p.post.name.toLowerCase().includes('nabung')
  );
  const savingsTargetFromGoals = savingsTargets.reduce((sum, s) => {
    const rem = Math.max(0, s.target_amount - (s.current_amount || 0));
    if (rem <= 0) return sum;
    return sum + Math.ceil(rem / 12);
  }, 0);

  const effectiveSavingsTarget =
    nabungPost?.allocated || savingsTargetFromGoals || monthlySavingsTarget || 0;

  const overBudgetPosts = budgetStatus.posts.filter((p) => p.isOverBudget);
  const incomeExceeded =
    budgetStatus.actualIncome > 0 && budgetStatus.actualExpense > budgetStatus.actualIncome;
  const zeroSavingsTwoMonths =
    prevMonthTxs.length > 0 &&
    thisMonthSaved <= 0 &&
    prevMonthSaved <= 0 &&
    (budgetStatus.actualIncome - budgetStatus.actualExpense) <= 0;

  const expenseByPost = budgetStatus.posts.map((p) => ({
    postId: p.post.id,
    postName: p.post.name,
    allocated: p.effectiveBudget,
    used: p.spent,
    remaining: p.remaining,
  }));

  const moneyTrail = {
    income: budgetStatus.actualIncome,
    expenseTotal: budgetStatus.actualExpense,
    expenseByPost,
    savedThisMonth: thisMonthSaved,
    savingsTargetThisMonth: effectiveSavingsTarget,
  };

  const reasons: string[] = [];

  if (incomeExceeded || zeroSavingsTwoMonths) {
    if (incomeExceeded) {
      reasons.push(
        `Pengeluaran bulan ini (${formatRupiah(budgetStatus.actualExpense)}) melebihi pemasukan (${formatRupiah(budgetStatus.actualIncome)}).`
      );
    }
    if (zeroSavingsTwoMonths) {
      reasons.push('Tabungan Rp 0 selama dua bulan berturut-turut.');
    }
    if (overBudgetPosts.length > 0) {
      reasons.push(
        `Pos melebihi anggaran: ${overBudgetPosts.map((p) => p.post.name).join(', ')}.`
      );
    }
    return {
      level: 'Buruk',
      mood: 'sad',
      headline: 'Perlu Perhatian Segera',
      reasons,
      moneyTrail,
    };
  }

  const savingsBelowTarget =
    effectiveSavingsTarget > 0 &&
    thisMonthSaved < effectiveSavingsTarget &&
    Math.max(0, budgetStatus.actualIncome - budgetStatus.actualExpense) < effectiveSavingsTarget;

  if (overBudgetPosts.length > 0 || savingsBelowTarget || !budgetStatus.config) {
    if (!budgetStatus.config) {
      reasons.push('Anggaran bulanan belum diatur di Profil — atur dulu agar pantauan lebih akurat.');
    }
    if (overBudgetPosts.length > 0) {
      reasons.push(
        `Pos ${overBudgetPosts.map((p) => p.post.name).join(', ')} sudah melewati batas anggaran.`
      );
    }
    if (savingsBelowTarget) {
      reasons.push(
        `Setoran tabungan bulan ini (${formatRupiah(thisMonthSaved)}) masih di bawah target (${formatRupiah(effectiveSavingsTarget)}).`
      );
    }
    if (reasons.length === 0) {
      reasons.push('Tetap pantau pengeluaran agar sesuai rencana bulanan.');
    }
    return {
      level: 'Waspada',
      mood: 'neutral',
      headline: 'Cukup Terkendali, Tetap Waspada',
      reasons,
      moneyTrail,
    };
  }

  reasons.push('Semua pos pengeluaran masih berada di dalam batas anggaran.');
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

  // 2. Pos yang melebihi budget (atau hampir habis)
  const overPosts = budgetStatus.posts.filter((p) => p.isOverBudget);
  const nearLimitPosts = budgetStatus.posts.filter(
    (p) => !p.isOverBudget && p.percentUsed >= 85 && p.effectiveBudget > 0
  );
  if (overPosts.length > 0) {
    tips.push({
      id: 'over-budget',
      title: `Pos Melebihi Budget: ${overPosts.map((p) => p.post.name).join(', ')}`,
      description: `Pos ${overPosts[0].post.name} sudah terpakai ${overPosts[0].percentUsed}% (${formatRupiah(overPosts[0].spent)} dari ${formatRupiah(overPosts[0].effectiveBudget)}). Pertimbangkan menahan belanja non-pokok atau ambil dari tabungan jika mendesak.`,
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
      description: 'Belum ada pos yang melewati anggaran bulan ini. Pertahankan disiplin alokasi.',
      tone: 'good',
    });
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
    } else {
      tips.push({
        id: 'mom-compare',
        title: 'Pengeluaran Sama dengan Bulan Lalu',
        description: `Total pengeluaran sama di angka ${formatRupiah(budgetStatus.actualExpense)}.`,
        tone: 'info',
      });
    }
  }

  return tips;
};
