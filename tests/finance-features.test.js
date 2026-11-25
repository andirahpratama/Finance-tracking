import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTsModule(relPath, mocks = {}, customGlobals = {}) {
  const fullUrl = new URL(relPath, import.meta.url);
  const tsSource = readFileSync(fullUrl, 'utf8');
  const jsSource = ts.transpileModule(tsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const module = { exports: {} };
  const fakeRequire = (specifier) => {
    for (const [key, val] of Object.entries(mocks)) {
      if (specifier.endsWith(key)) return val;
    }
    throw new Error(`Unmocked require: ${specifier}`);
  };

  vm.runInNewContext(jsSource, {
    module,
    exports: module.exports,
    require: fakeRequire,
    Date,
    Math,
    Number,
    String,
    Array,
    Object,
    Map,
    Set,
    JSON,
    Intl,
    encodeURIComponent,
    decodeURIComponent,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console,
    ...customGlobals,
  });

  return module.exports;
}

const formatters = loadTsModule('../src/lib/formatters.ts');
const savingsUtils = loadTsModule('../src/lib/savingsUtils.ts');
const budgetUtils = loadTsModule('../src/lib/budgetUtils.ts', {
  formatters,
  savingsUtils,
});
const goldService = loadTsModule('../src/lib/goldPriceService.ts');

test('forward-only budget resolution does not alter previous months', () => {
  const configs = [
    {
      effectiveFrom: '2026-11',
      monthlyIncome: 20000000,
      posts: budgetUtils.createSuggestedBudgetPosts(20000000),
      updatedAt: '2026-11-25T10:00:00Z',
    },
  ];

  assert.equal(budgetUtils.getBudgetConfigForMonth(configs, '2026-10'), null);
  assert.equal(budgetUtils.getBudgetConfigForMonth(configs, '2026-11')?.monthlyIncome, 20000000);
  assert.equal(budgetUtils.getBudgetConfigForMonth(configs, '2026-12')?.monthlyIncome, 20000000);
});

test('monthly budget status tracks Biaya Bulanan, excludes Transfer Kas, and applies transfer-in', () => {
  const configs = [
    {
      effectiveFrom: '2026-11',
      monthlyIncome: 20000000,
      posts: budgetUtils.createSuggestedBudgetPosts(20000000),
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];
  const metaTag = savingsUtils.buildTransferMetaTag({
    fromType: 'savings_target',
    fromId: 'sav-1',
    fromLabel: 'Dana Darurat',
    toType: 'budget_post',
    toId: 'pos-biaya-bulanan',
    toLabel: 'Biaya Bulanan',
  });

  const transactions = [
    { id: '1', category_id: 'inc-1', category_name: 'Gaji Suami', type: 'income', amount: 20000000, date: '2026-11-01', notes: '' },
    { id: '2', category_id: 'exp-1', category_name: 'Belanja Makanan', type: 'expense', amount: 3000000, date: '2026-11-05', notes: '' },
    { id: '3', category_id: 'exp-2', category_name: 'Sekolah Anak', type: 'expense', amount: 6000000, date: '2026-11-10', notes: '' },
    // Transfer from savings into Biaya Bulanan should NOT count as income/expense, should increase effectiveBudget
    { id: '4', category_id: '', type: 'income', amount: 500000, date: '2026-11-20', notes: `[Transfer Kas: Dana Darurat -> Biaya Bulanan] ${metaTag}`, is_savings_transfer: true },
  ];

  const status = budgetUtils.calculateMonthlyBudgetStatus({
    monthKey: '2026-11',
    configs,
    settlements: [],
    transactions,
  });

  assert.equal(status.actualIncome, 20000000);
  assert.equal(status.actualExpense, 9000000);
  assert.equal(status.primaryExpensePost?.allocated, 10000000);
  assert.equal(status.primaryExpensePost?.transferIn, 500000);
  assert.equal(status.primaryExpensePost?.effectiveBudget, 10500000);
  assert.equal(status.primaryExpensePost?.spent, 9000000);
  assert.equal(status.primaryExpensePost?.remaining, 1500000);
});

test('verdict engine assigns Baik, Waspada, and Buruk accurately', () => {
  const configs = [
    {
      effectiveFrom: '2026-11',
      monthlyIncome: 10000000,
      posts: budgetUtils.createSuggestedBudgetPosts(10000000),
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];
  const savMeta = savingsUtils.buildTransferMetaTag({
    fromType: 'main_wallet',
    fromId: 'main_wallet',
    fromLabel: 'Dompet Utama',
    toType: 'savings_target',
    toId: 'sav-1',
    toLabel: 'Dana Darurat',
  });

  // 1. Baik: all posts within budget + savings target met
  const goodTxs = [
    { id: '1', category_id: 'inc-1', type: 'income', amount: 10000000, date: '2026-11-01', notes: '' },
    { id: '2', category_id: 'exp-1', type: 'expense', amount: 4000000, date: '2026-11-05', notes: '' },
    { id: '3', category_id: '', type: 'expense', amount: 2000000, date: '2026-11-06', notes: `[Transfer Kas: Dompet -> Dana Darurat] ${savMeta}`, is_savings_transfer: true },
  ];
  const goodStatus = budgetUtils.calculateMonthlyBudgetStatus({ monthKey: '2026-11', configs, settlements: [], transactions: goodTxs });
  const goodVerdict = budgetUtils.computeMonthlyVerdict({
    monthKey: '2026-11',
    budgetStatus: goodStatus,
    transactions: goodTxs,
    monthlySavingsTarget: 2000000,
    savingsTargets: [],
  });
  assert.equal(goodVerdict.level, 'Baik');
  assert.equal(goodVerdict.mood, 'happy');

  // 2. Buruk: expenses exceed income
  const badTxs = [
    { id: '1', category_id: 'inc-1', type: 'income', amount: 5000000, date: '2026-11-01', notes: '' },
    { id: '2', category_id: 'exp-1', type: 'expense', amount: 6500000, date: '2026-11-05', notes: '' },
  ];
  const badStatus = budgetUtils.calculateMonthlyBudgetStatus({ monthKey: '2026-11', configs, settlements: [], transactions: badTxs });
  const badVerdict = budgetUtils.computeMonthlyVerdict({
    monthKey: '2026-11',
    budgetStatus: badStatus,
    transactions: badTxs,
    monthlySavingsTarget: 2000000,
    savingsTargets: [],
  });
  assert.equal(badVerdict.level, 'Buruk');
  assert.equal(badVerdict.mood, 'sad');
});

test('gold portfolio per-lot P/L and selling reduction match specification', () => {
  const prices = {
    antam: { buy: 2329000, sell: 2500000 },
    ubs: { buy: 2351000, sell: 2166000 },
    source: 'mock',
    last_updated: '2026-11-25T00:00:00Z',
  };

  const txs = [
    {
      id: 'g1',
      type: 'BUY',
      brand: 'Antam',
      date: '2026-11-20',
      gram: 2,
      price_per_gram: 2329000,
      total_amount: 4658000,
    },
  ];

  const report = goldService.calculateGoldPortfolioWithLots(txs, prices);
  assert.equal(report.totalGram, 2);
  assert.equal(report.totalCapital, 4658000);
  assert.equal(report.totalCurrentValue, 5000000);
  assert.equal(report.totalProfitLoss, 342000);

  // Selling 0.5 gram reduces totalGram to 1.5
  const afterSell = goldService.calculateGoldPortfolioWithLots(
    [
      ...txs,
      { id: 'g2', type: 'SELL', brand: 'Antam', date: '2026-11-25', gram: 0.5, price_per_gram: 2500000, total_amount: 1250000 },
    ],
    prices
  );
  assert.equal(afterSell.totalGram, 1.5);
});

test('savings progress formula uses (target - current) / remainingMonths', () => {
  const now = new Date();
  const futureYear = now.getFullYear() + 1;
  const futureMonth = String(now.getMonth() + 1).padStart(2, '0');
  // Exactly 13 months inclusive (diff = 12 -> remainingMonths = 13)
  const item = {
    id: 'sav-1',
    name: 'Dana Darurat',
    target_amount: 26000000,
    current_amount: 13000000,
    initial_balance: 13000000,
    deadline_date: `${futureYear}-${futureMonth}`,
  };
  const prog = savingsUtils.calculateSavingsProgress(item);
  assert.equal(prog.progressPercent, 50);
  assert.equal(prog.remainingAmount, 13000000);
  assert.equal(prog.remainingMonths, 13);
  assert.equal(prog.monthlyTarget, 1000000);
});

test('transfer notes formatting strips internal tags cleanly', () => {
  const raw = '[Transfer Kas: Biaya Bulanan → Nabung] (sav_target:sav-1) (transfer_meta:budget_post|pos-1|Biaya%20Bulanan|savings_target|sav-1|Nabung) Sisa bulan';
  const cleaned = formatters.formatNotesForDisplay(raw);
  assert.equal(cleaned, 'Biaya Bulanan → Nabung • Sisa bulan');
  assert.equal(savingsUtils.isSavingsTransaction({ notes: raw }), true);
});

test('Mode Sederhana calculates sisa & auto Invest/Tabungan split, warns when income <= budget, and avoids fixed-budget inflation', () => {
  const simpleConfigs = [
    {
      effectiveFrom: '2026-11',
      monthlyBudget: 7000000,
      investPercent: 60,
      savingsPercent: 40,
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];
  const modeHistory = [{ effectiveFrom: '2026-11', mode: 'simple', updatedAt: '2026-11-01T00:00:00Z' }];

  // Case 1: Pemasukan 10jt, Budget 7jt, Belanja 5jt -> Sisa 3jt (1.8jt Invest, 1.2jt Tabungan), Baik
  const txsGood = [
    { id: '1', category_id: 'inc-1', type: 'income', amount: 10000000, date: '2026-11-01', notes: '' },
    { id: '2', category_id: 'exp-1', type: 'expense', amount: 5000000, date: '2026-11-10', notes: '' },
  ];
  const statusGood = budgetUtils.calculateMonthlyBudgetStatus({
    monthKey: '2026-11',
    modeHistory,
    activeMode: 'simple',
    configs: [],
    simpleConfigs,
    settlements: [],
    transactions: txsGood,
  });

  assert.equal(statusGood.mode, 'simple');
  assert.equal(statusGood.simpleSummary?.monthlyBudget, 7000000);
  assert.equal(statusGood.simpleSummary?.sisaPemasukan, 3000000);
  assert.equal(statusGood.simpleSummary?.plannedInvestAmount, 1800000);
  assert.equal(statusGood.simpleSummary?.plannedSavingsAmount, 1200000);
  assert.equal(statusGood.simpleSummary?.noSisaWarning, false);

  // Add realized savings transfer so Mode Sederhana verdict can evaluate Baik cleanly
  const savMeta = savingsUtils.buildTransferMetaTag({
    fromType: 'main_wallet',
    fromId: 'main_wallet',
    fromLabel: 'Dompet Utama',
    toType: 'savings_target',
    toId: 'sav-1',
    toLabel: 'Tabungan Keluarga',
  });
  const txsGoodSaved = [
    ...txsGood,
    { id: '3', category_id: '', type: 'expense', amount: 1200000, date: '2026-11-12', notes: `[Transfer Kas: Dompet -> Tabungan Keluarga] ${savMeta}`, is_savings_transfer: true },
  ];
  const statusGoodSaved = budgetUtils.calculateMonthlyBudgetStatus({
    monthKey: '2026-11',
    modeHistory,
    activeMode: 'simple',
    configs: [],
    simpleConfigs,
    settlements: [],
    transactions: txsGoodSaved,
    manualInvestments: [
      { id: 'inv-1', user_id: 'u1', name: 'RDN', category: 'Reksa Dana', invested_amount: 1800000, current_value: 1800000, purchase_date: '2026-11-12', notes: '', created_at: '2026-11-12T00:00:00Z' },
    ],
  });

  // Also check Waspada before allocation is realized
  const verdictBeforeAlloc = budgetUtils.computeMonthlyVerdict({
    monthKey: '2026-11',
    budgetStatus: statusGood,
    transactions: txsGood,
    monthlySavingsTarget: 1000000,
    savingsTargets: [],
  });
  assert.equal(verdictBeforeAlloc.level, 'Waspada');
  assert.equal(verdictBeforeAlloc.mood, 'neutral');

  const verdictGood = budgetUtils.computeMonthlyVerdict({
    monthKey: '2026-11',
    budgetStatus: statusGoodSaved,
    transactions: txsGoodSaved,
    monthlySavingsTarget: 1000000,
    savingsTargets: [],
  });
  assert.equal(verdictGood.level, 'Baik');
  assert.equal(verdictGood.mood, 'happy');

  // Case 2: Pemasukan 6.5jt <= Budget 7jt, Belanja 7.5jt -> noSisaWarning & expenditure > income -> Buruk
  const txsShort = [
    { id: '1', category_id: 'inc-1', type: 'income', amount: 6500000, date: '2026-11-01', notes: '' },
    { id: '2', category_id: 'exp-1', type: 'expense', amount: 7500000, date: '2026-11-10', notes: '' },
  ];
  const statusShort = budgetUtils.calculateMonthlyBudgetStatus({
    monthKey: '2026-11',
    modeHistory,
    activeMode: 'simple',
    configs: [],
    simpleConfigs,
    settlements: [],
    transactions: txsShort,
  });

  assert.equal(statusShort.simpleSummary?.sisaPemasukan, 0);
  assert.equal(statusShort.simpleSummary?.noSisaWarning, true);
  assert.equal(statusShort.actualExpense > statusShort.actualIncome, true);
  assert.equal(statusShort.simpleSummary?.monthlyBudget, 7000000);

  const verdictShort = budgetUtils.computeMonthlyVerdict({
    monthKey: '2026-11',
    budgetStatus: statusShort,
    transactions: txsShort,
    monthlySavingsTarget: 1000000,
    savingsTargets: [],
  });
  assert.equal(verdictShort.level, 'Buruk');
  assert.equal(verdictShort.mood, 'sad');
});

test('Mode Lengkap Pemasukan Tambahan never inflates Biaya Bulanan and allocates proportionally to Invest/Nabung', () => {
  const configs = [
    {
      effectiveFrom: '2026-11',
      monthlyIncome: 8500000,
      posts: [
        { id: 'pos-biaya', name: 'Biaya Bulanan', percent: 50, amount: 4250000, kind: 'expense', color: '#ef4444' },
        { id: 'pos-invest', name: 'Investasi', percent: 30, amount: 2550000, kind: 'investment', color: '#8b5cf6' },
        { id: 'pos-nabung', name: 'Nabung', percent: 20, amount: 1700000, kind: 'savings', color: '#10b981' },
      ],
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];
  const modeHistory = [{ effectiveFrom: '2026-11', mode: 'complete', updatedAt: '2026-11-01T00:00:00Z' }];
  const txs = [
    { id: '1', category_id: 'inc-1', type: 'income', amount: 10000000, date: '2026-11-01', notes: '' },
    { id: '2', category_id: 'exp-1', type: 'expense', amount: 3000000, date: '2026-11-05', notes: '' },
  ];

  const status = budgetUtils.calculateMonthlyBudgetStatus({
    monthKey: '2026-11',
    modeHistory,
    activeMode: 'complete',
    configs,
    settlements: [],
    transactions: txs,
  });

  // Biaya Bulanan MUST remain 50% of 8.5jt = 4.25jt, NOT 50% of 10jt!
  assert.equal(status.primaryExpensePost?.allocated, 4250000);
  assert.equal(status.extraIncomeAllocation?.extraAmount, 1500000);
  assert.equal(status.extraIncomeAllocation?.unallocated, 0);
  assert.equal(status.extraIncomeAllocation?.toInvestment, 900000);
  assert.equal(status.extraIncomeAllocation?.toSavings, 600000);

  // Without Investasi/Nabung post, falls back to unallocated
  const configsNoSav = [
    {
      effectiveFrom: '2026-11',
      monthlyIncome: 8500000,
      posts: [
        { id: 'pos-biaya', name: 'Biaya Bulanan', percent: 100, amount: 8500000, kind: 'expense', color: '#ef4444' },
      ],
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];
  const statusNoSav = budgetUtils.calculateMonthlyBudgetStatus({
    monthKey: '2026-11',
    modeHistory,
    activeMode: 'complete',
    configs: configsNoSav,
    settlements: [],
    transactions: txs,
  });
  assert.equal(statusNoSav.extraIncomeAllocation?.extraAmount, 1500000);
  assert.equal(statusNoSav.extraIncomeAllocation?.unallocated, 1500000);
});

test('getBudgetModeForMonth applies switches prospectively without altering prior months', () => {
  const modeHistory = [
    { effectiveFrom: '2026-10', mode: 'complete', updatedAt: '2026-10-01T00:00:00Z' },
    { effectiveFrom: '2026-12', mode: 'simple', updatedAt: '2026-12-01T00:00:00Z' },
  ];

  assert.equal(budgetUtils.getBudgetModeForMonth(modeHistory, 'simple', '2026-10'), 'complete');
  assert.equal(budgetUtils.getBudgetModeForMonth(modeHistory, 'simple', '2026-11'), 'complete');
  assert.equal(budgetUtils.getBudgetModeForMonth(modeHistory, 'simple', '2026-12'), 'simple');
  assert.equal(budgetUtils.getBudgetModeForMonth(modeHistory, 'simple', '2027-01'), 'simple');
});

test('collectLegacyLocalState imports old localStorage into Mode Lengkap with confirmation flag, or returns null when empty', () => {
  const storeEmpty = new Map();
  const emptySync = loadTsModule(
    '../src/lib/serverSync.ts',
    { supabase: { supabase: null } },
    {
      localStorage: {
        getItem: (k) => storeEmpty.get(k) ?? null,
        setItem: (k, v) => storeEmpty.set(k, v),
      },
    }
  );
  assert.equal(emptySync.collectLegacyLocalState('user-1'), null);

  const storeLegacy = new Map([
    [
      'ft_budget_configs_user-1',
      JSON.stringify([
        { effectiveFrom: '2026-11', monthlyIncome: 12000000, posts: [], updatedAt: '2026-11-01T00:00:00Z' },
      ]),
    ],
    [
      'ft_savings_target_items_user-1',
      JSON.stringify([{ id: 's1', name: 'Dana Darurat', target_amount: 50000000, current_amount: 10000000 }]),
    ],
  ]);
  const legacySync = loadTsModule(
    '../src/lib/serverSync.ts',
    { supabase: { supabase: null } },
    {
      localStorage: {
        getItem: (k) => storeLegacy.get(k) ?? null,
        setItem: (k, v) => storeLegacy.set(k, v),
      },
    }
  );
  const migrated = legacySync.collectLegacyLocalState('user-1');
  assert.ok(migrated);
  assert.equal(migrated.budgetMode, 'complete');
  assert.equal(migrated.needsModeConfirmation, true);
  assert.equal(migrated.budgetConfigs.length, 1);
  assert.equal(migrated.savingsTargets.length, 1);
});
