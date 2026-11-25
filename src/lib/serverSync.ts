import { supabase } from './supabase';
import {
  BudgetingMode,
  BudgetModeActivation,
  ClassInvestment,
  CurrencyCode,
  DebtItem,
  EmergencyFundPreference,
  GoldTransaction,
  ManualInvestment,
  MonthlyBudgetConfig,
  MonthPostSettlement,
  SavingsTargetItem,
  SimpleBudgetConfig,
  UserServerState,
} from '../types';

export const createEmptyServerState = (): UserServerState => ({
  version: 2,
  budgetMode: null,
  needsModeConfirmation: false,
  budgetModeHistory: [],
  simpleBudgetConfigs: [],
  budgetConfigs: [],
  postSettlements: [],
  savingsTargets: [],
  debts: [],
  manualInvestments: [],
  classInvestments: [],
  goldTransactions: [],
  emergencyFundPref: null,
  updatedAt: new Date().toISOString(),
});

const safeParseJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/**
 * Collects legacy localStorage data for ONE-TIME migration to Supabase server.
 * Returns null if no meaningful local data exists.
 */
export const collectLegacyLocalState = (userId: string): UserServerState | null => {
  if (typeof localStorage === 'undefined') return null;

  const budgetConfigs = safeParseJson<MonthlyBudgetConfig[]>(
    localStorage.getItem(`ft_budget_configs_${userId}`),
    []
  );
  const simpleBudgetConfigs = safeParseJson<SimpleBudgetConfig[]>(
    localStorage.getItem(`ft_simple_budget_configs_${userId}`),
    []
  );
  const postSettlements = safeParseJson<MonthPostSettlement[]>(
    localStorage.getItem(`ft_post_settlements_${userId}`),
    []
  );
  const savingsTargets = safeParseJson<SavingsTargetItem[]>(
    localStorage.getItem(`ft_savings_target_items_${userId}`),
    []
  );
  const debts = safeParseJson<DebtItem[]>(
    localStorage.getItem(`ft_debts_${userId}`),
    []
  );
  const manualInvestments = safeParseJson<ManualInvestment[]>(
    localStorage.getItem(`ft_manual_investments_${userId}`),
    []
  );
  const classInvestments = safeParseJson<ClassInvestment[]>(
    localStorage.getItem(`ft_class_investments_${userId}`),
    []
  );
  const goldTransactions = safeParseJson<GoldTransaction[]>(
    localStorage.getItem(`ft_gold_transactions_${userId}`),
    []
  );
  const emergencyFundPref = safeParseJson<EmergencyFundPreference | null>(
    localStorage.getItem(`ft_emergency_fund_pref_${userId}`),
    null
  );
  const savedThresholds = safeParseJson<{ safe: number; warning: number } | null>(
    localStorage.getItem(`ft_balance_thresholds_${userId}`),
    null
  );
  const savedTargetStr = localStorage.getItem(`ft_savings_target_${userId}`);
  const savedCurrency = localStorage.getItem('ft_app_currency') as CurrencyCode | null;

  const hasMeaningfulData =
    budgetConfigs.length > 0 ||
    simpleBudgetConfigs.length > 0 ||
    savingsTargets.length > 0 ||
    debts.length > 0 ||
    manualInvestments.length > 0 ||
    classInvestments.length > 0 ||
    goldTransactions.length > 0 ||
    postSettlements.length > 0 ||
    emergencyFundPref !== null;

  if (!hasMeaningfulData) return null;

  const nowIso = new Date().toISOString();
  let budgetMode: BudgetingMode | null = null;
  let needsModeConfirmation = false;
  const budgetModeHistory: BudgetModeActivation[] = [];

  if (budgetConfigs.length > 0) {
    budgetMode = 'complete';
    needsModeConfirmation = true;
    const earliest = [...budgetConfigs].sort((a, b) =>
      a.effectiveFrom.localeCompare(b.effectiveFrom)
    )[0];
    budgetModeHistory.push({
      effectiveFrom: earliest.effectiveFrom,
      mode: 'complete',
      updatedAt: nowIso,
    });
  } else if (simpleBudgetConfigs.length > 0) {
    budgetMode = 'simple';
    const earliest = [...simpleBudgetConfigs].sort((a, b) =>
      a.effectiveFrom.localeCompare(b.effectiveFrom)
    )[0];
    budgetModeHistory.push({
      effectiveFrom: earliest.effectiveFrom,
      mode: 'simple',
      updatedAt: nowIso,
    });
  }

  return {
    version: 2,
    budgetMode,
    needsModeConfirmation,
    budgetModeHistory,
    simpleBudgetConfigs,
    budgetConfigs,
    postSettlements,
    savingsTargets,
    debts,
    manualInvestments,
    classInvestments,
    goldTransactions,
    emergencyFundPref,
    ...(savedThresholds ? { balanceThresholds: savedThresholds } : {}),
    ...(savedTargetStr ? { monthlySavingsTarget: Number(savedTargetStr) } : {}),
    ...(savedCurrency ? { appCurrency: savedCurrency } : {}),
    updatedAt: nowIso,
  };
};

export const writeLocalCache = (userId: string, state: UserServerState) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`ft_server_cache_${userId}`, JSON.stringify(state));
    localStorage.setItem(`ft_budget_configs_${userId}`, JSON.stringify(state.budgetConfigs || []));
    localStorage.setItem(`ft_simple_budget_configs_${userId}`, JSON.stringify(state.simpleBudgetConfigs || []));
    localStorage.setItem(`ft_post_settlements_${userId}`, JSON.stringify(state.postSettlements || []));
    localStorage.setItem(`ft_savings_target_items_${userId}`, JSON.stringify(state.savingsTargets || []));
    localStorage.setItem(`ft_debts_${userId}`, JSON.stringify(state.debts || []));
    localStorage.setItem(`ft_manual_investments_${userId}`, JSON.stringify(state.manualInvestments || []));
    localStorage.setItem(`ft_class_investments_${userId}`, JSON.stringify(state.classInvestments || []));
    localStorage.setItem(`ft_gold_transactions_${userId}`, JSON.stringify(state.goldTransactions || []));
    if (state.emergencyFundPref) {
      localStorage.setItem(`ft_emergency_fund_pref_${userId}`, JSON.stringify(state.emergencyFundPref));
    }
  } catch {
    // ignore storage quota errors
  }
};

export const readLocalCache = (userId: string): UserServerState | null => {
  if (typeof localStorage === 'undefined') return null;
  return safeParseJson<UserServerState | null>(
    localStorage.getItem(`ft_server_cache_${userId}`),
    null
  );
};

/**
 * Fetches authoritative account state from Supabase server (auth user_metadata + profiles).
 * Server ALWAYS wins over local cache.
 */
export const fetchServerState = async (
  userId: string
): Promise<{
  serverState: UserServerState | null;
  profileRow: any | null;
}> => {
  if (!supabase) return { serverState: null, profileRow: null };

  let metaState: UserServerState | null = null;
  let profileRow: any | null = null;

  try {
    const [userRes, profileRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);

    if (userRes.data?.user?.user_metadata?.ft_state) {
      metaState = userRes.data.user.user_metadata.ft_state as UserServerState;
    }

    if (profileRes.data) {
      profileRow = profileRes.data;
    }
  } catch (err) {
    console.warn('Error fetching server state:', err);
  }

  const profileAppState =
    profileRow && profileRow.app_state && typeof profileRow.app_state === 'object'
      ? (profileRow.app_state as UserServerState)
      : null;

  let chosen: UserServerState | null = null;
  if (metaState && profileAppState) {
    chosen =
      (profileAppState.updatedAt || '') > (metaState.updatedAt || '')
        ? profileAppState
        : metaState;
  } else {
    chosen = profileAppState || metaState;
  }

  if (chosen) {
    writeLocalCache(userId, chosen);
  }

  return { serverState: chosen, profileRow };
};

/**
 * Persists authoritative account state to Supabase server.
 */
export const pushServerState = async (
  userId: string,
  state: UserServerState
): Promise<{ error: string | null }> => {
  writeLocalCache(userId, state);

  if (!supabase) return { error: null };

  try {
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ft_state: state,
      },
    });

    // Also update profiles columns (and app_state if column exists)
    const profilePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (state.monthlySavingsTarget !== undefined) {
      profilePayload.monthly_savings_target = state.monthlySavingsTarget;
    }
    if (state.balanceThresholds) {
      profilePayload.balance_safe_threshold = state.balanceThresholds.safe;
      profilePayload.balance_warning_threshold = state.balanceThresholds.warning;
    }

    await supabase.from('profiles').update(profilePayload).eq('id', userId);

    // Best-effort save to profiles.app_state if schema migration has been applied
    await supabase
      .from('profiles')
      .update({ app_state: state })
      .eq('id', userId)
      .then(() => null, () => null);

    if (authError) {
      return { error: authError.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Gagal sinkronisasi ke server' };
  }
};
