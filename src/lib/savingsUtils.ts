import { SavingsTargetItem, Transaction } from '../types';

export interface SavingsProgressCalculation {
  monthlyTarget: number;
  remainingMonths: number;
  remainingAmount: number;
  isAchieved: boolean;
  isOnTrack: boolean;
  progressPercent: number;
  expectedAmountToDate: number;
}

/**
 * Checks if a transaction is an internal transfer between cash wallet and savings
 */
export const isSavingsTransaction = (t: Transaction): boolean => {
  if (t.is_savings_transfer === true) return true;
  if (t.notes && (
    t.notes.includes('sav_target:') ||
    t.notes.includes('[Setor Ke Tabungan') ||
    t.notes.includes('[Tarik Dari Tabungan') ||
    t.notes.includes('Transfer Ke Tabungan') ||
    t.notes.includes('Tarik Tabungan')
  )) {
    return true;
  }
  return false;
};

/**
 * Calculates goal-based monthly target and on-track status for a savings target
 */
export const calculateSavingsProgress = (item: SavingsTargetItem): SavingsProgressCalculation => {
  const targetTotal = Number(item.target_amount) || 0;
  const currentSaved = Number(item.current_amount) || 0;
  const remainingAmount = Math.max(0, targetTotal - currentSaved);
  const progressPercent = targetTotal > 0 ? Math.min(100, Math.round((currentSaved / targetTotal) * 100)) : 0;
  const isAchieved = targetTotal > 0 && currentSaved >= targetTotal;

  if (isAchieved) {
    return {
      monthlyTarget: 0,
      remainingMonths: 0,
      remainingAmount: 0,
      isAchieved: true,
      isOnTrack: true,
      progressPercent: 100,
      expectedAmountToDate: targetTotal,
    };
  }

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-11

  let remainingMonths = 1;
  let totalSpanMonths = 12;
  let elapsedMonths = 0;

  if (item.deadline_date) {
    const parts = item.deadline_date.split('-');
    const targetYear = parseInt(parts[0], 10);
    const targetMonth = parseInt(parts[1], 10) - 1; // 0-11

    // Difference in months from now to target deadline (inclusive of target month)
    const diff = (targetYear - curYear) * 12 + (targetMonth - curMonth);
    remainingMonths = Math.max(1, diff + 1);

    // Calculate elapsed months since item creation for on-track evaluation
    const createdDate = item.created_at ? new Date(item.created_at) : new Date(curYear, 0, 1);
    const createdYear = createdDate.getFullYear();
    const createdMonth = createdDate.getMonth();

    totalSpanMonths = Math.max(1, (targetYear - createdYear) * 12 + (targetMonth - createdMonth) + 1);
    elapsedMonths = Math.max(0, (curYear - createdYear) * 12 + (curMonth - createdMonth));
  } else {
    // If no deadline, default remaining to 12 months
    remainingMonths = 12;
    totalSpanMonths = 12;
    elapsedMonths = 1;
  }

  // Formula per PRD: (target_amount - current_balance) / sisa_bulan_menuju_deadline
  const monthlyTarget = Math.ceil(remainingAmount / remainingMonths);

  // Expected accumulation to date based on elapsed duration
  const expectedAmountToDate = Math.round((targetTotal / totalSpanMonths) * Math.min(totalSpanMonths, elapsedMonths));

  // On-track if current saved amount meets or exceeds linear expected accumulation or >= 100%
  const isOnTrack = currentSaved >= expectedAmountToDate || progressPercent >= 100;

  return {
    monthlyTarget,
    remainingMonths,
    remainingAmount,
    isAchieved,
    isOnTrack,
    progressPercent,
    expectedAmountToDate,
  };
};
