import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTsModule(relPath, mocks = {}) {
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
