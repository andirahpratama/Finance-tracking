import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Smile,
  AlertTriangle,
  Save,
  Sparkles,
  CheckCircle2,
  Coins,
  Check,
  Bot,
  Key,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Cpu,
  Info,
  PieChart,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, SUPPORTED_CURRENCIES, parseRupiahInput } from '../../lib/formatters';
import { BudgetPost, CurrencyCode } from '../../types';
import { getStoredAgentApiKey, regenerateAgentApiKey } from '../../lib/agentApiKey';
import { createSuggestedBudgetPosts, detectPostKind, getCurrentMonthKey, formatMonthKeyLabel } from '../../lib/budgetUtils';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'budgeting' | 'agent';
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { user } = useAuth();
  const {
    balanceThresholds,
    updateBalanceThresholds,
    totalBalance,
    appCurrency,
    setCurrency,
    currentMonthBudgetStatus,
    saveBudgetConfigForward,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'budgeting' | 'agent'>(initialTab);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(appCurrency);
  const [safeInput, setSafeInput] = useState<string>(balanceThresholds.safe.toString());
  const [warningInput, setWarningInput] = useState<string>(balanceThresholds.warning.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Budgeting Form State
  const [budgetIncomeRaw, setBudgetIncomeRaw] = useState<string>('20000000');
  const [budgetPosts, setBudgetPosts] = useState<BudgetPost[]>([]);

  // AI Agent & MCP State
  const [agentApiKey, setAgentApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [agentSnippetTab, setAgentSnippetTab] = useState<'mcp' | 'curl' | 'prompt'>('mcp');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFullName(user?.full_name || '');
      setSelectedCurrency(appCurrency);
      setSafeInput(balanceThresholds.safe.toString());
      setWarningInput(balanceThresholds.warning.toString());
      setSuccessMsg('');
      setErrorMsg('');
      const key = getStoredAgentApiKey(user?.id || 'demo-user');
      setAgentApiKey(key);

      // Load current month budgeting config or sensible editable starter
      if (currentMonthBudgetStatus.config) {
        setBudgetIncomeRaw(String(currentMonthBudgetStatus.config.monthlyIncome));
        setBudgetPosts(currentMonthBudgetStatus.config.posts.map((p) => ({ ...p })));
      } else {
        setBudgetIncomeRaw('20000000');
        setBudgetPosts(createSuggestedBudgetPosts(20000000));
      }
    }
  }, [isOpen, initialTab, balanceThresholds, user, appCurrency, currentMonthBudgetStatus.config]);

  const budgetIncome = parseRupiahInput(budgetIncomeRaw);

  const budgetTotals = useMemo(() => {
    const totalAmount = budgetPosts.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalPercent = budgetPosts.reduce((s, p) => s + (Number(p.percent) || 0), 0);
    const unallocatedAmount = budgetIncome - totalAmount;
    const unallocatedPercent = Number((100 - totalPercent).toFixed(2));
    const isExact100 =
      budgetIncome > 0 &&
      Math.abs(unallocatedAmount) <= 10 &&
      Math.abs(unallocatedPercent) <= 0.1;
    return {
      totalAmount,
      totalPercent: Number(totalPercent.toFixed(2)),
      unallocatedAmount,
      unallocatedPercent,
      isExact100,
    };
  }, [budgetPosts, budgetIncome]);

  const handleBudgetIncomeChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, '');
    setBudgetIncomeRaw(clean);
    const newInc = clean ? parseInt(clean, 10) : 0;
    setBudgetPosts((prev) =>
      prev.map((p) => ({
        ...p,
        amount: Math.round((newInc * (Number(p.percent) || 0)) / 100),
      }))
    );
  };

  const handlePostNameChange = (id: string, name: string) => {
    setBudgetPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, kind: detectPostKind(name) } : p))
    );
  };

  const handlePostPercentChange = (id: string, rawVal: string) => {
    const num = Math.max(0, Math.min(100, parseFloat(rawVal) || 0));
    setBudgetPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              percent: num,
              amount: Math.round((budgetIncome * num) / 100),
            }
          : p
      )
    );
  };

  const handlePostAmountChange = (id: string, rawVal: string) => {
    const clean = rawVal.replace(/[^\d]/g, '');
    const amt = clean ? parseInt(clean, 10) : 0;
    const pct = budgetIncome > 0 ? Number(((amt / budgetIncome) * 100).toFixed(2)) : 0;
    setBudgetPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, amount: amt, percent: pct } : p))
    );
  };

  const handleAddBudgetPost = () => {
    const remainingAmt = Math.max(0, budgetTotals.unallocatedAmount);
    const remainingPct = Math.max(0, budgetTotals.unallocatedPercent);
    setBudgetPosts((prev) => [
      ...prev,
      {
        id: 'pos-' + Date.now(),
        name: '',
        percent: remainingPct,
        amount: remainingAmt,
        kind: 'custom',
        color: '#4a8c67',
      },
    ]);
  };

  const handleDeleteBudgetPost = (id: string) => {
    setBudgetPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFillRemainingToPost = (id: string) => {
    setBudgetPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newAmt = Math.max(0, (p.amount || 0) + budgetTotals.unallocatedAmount);
        const newPct = budgetIncome > 0 ? Number(((newAmt / budgetIncome) * 100).toFixed(2)) : 0;
        return { ...p, amount: newAmt, percent: newPct };
      })
    );
  };

  const handleSaveBudgeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (budgetIncome <= 0) {
      setErrorMsg('Total pemasukan bulanan harus lebih dari 0.');
      return;
    }
    if (budgetPosts.length === 0) {
      setErrorMsg('Tambahkan minimal satu pos anggaran.');
      return;
    }
    if (budgetPosts.some((p) => !p.name.trim())) {
      setErrorMsg('Semua pos harus memiliki nama.');
      return;
    }
    if (!budgetTotals.isExact100) {
      setErrorMsg(
        `Total alokasi harus 100% (${formatRupiah(budgetIncome)}). Saat ini ${budgetTotals.totalPercent}% (${formatRupiah(budgetTotals.totalAmount)}).`
      );
      return;
    }

    const cleanedPosts = budgetPosts.map((p) => ({
      ...p,
      name: p.name.trim(),
      kind: detectPostKind(p.name.trim()),
    }));

    setIsSubmitting(true);
    const res = await saveBudgetConfigForward(budgetIncome, cleanedPosts);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(
        `Budgeting berhasil disimpan dan berlaku mulai ${formatMonthKeyLabel(getCurrentMonthKey())} ke depan!`
      );
    }
  };

  const safeVal = Math.max(0, parseInt(safeInput.replace(/\D/g, ''), 10) || 0);
  const warningVal = Math.max(0, parseInt(warningInput.replace(/\D/g, ''), 10) || 0);

  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);
  const dailyRate = Math.round(totalBalance / remainingDays);

  const previewMood =
    dailyRate > safeVal ? 'happy' : dailyRate >= warningVal ? 'neutral' : 'sad';

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleRegenerateKey = () => {
    if (
      confirm(
        'Apakah Anda yakin ingin membuat ulang API Key? API Key lama yang sudah terpasang di AI agent tidak akan berlaku lagi.'
      )
    ) {
      const newKey = regenerateAgentApiKey(user?.id || 'demo-user');
      setAgentApiKey(newKey);
      setSuccessMsg('API Key baru berhasil dibuat!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (warningVal >= safeVal) {
      setErrorMsg('Batas Waspada harus lebih kecil dari Batas Aman (Senang)');
      return;
    }

    setIsSubmitting(true);

    try {
      setCurrency(selectedCurrency);
      const res = await updateBalanceThresholds({
        safe: safeVal,
        warning: warningVal,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Pengaturan profil & mata uang berhasil disimpan!');
        setTimeout(() => {
          onClose();
        }, 1100);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://finance-tracking-olive.vercel.app';
  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        'finance-tracking': {
          url: `${originUrl}/api/mcp?apiKey=${agentApiKey}`,
          headers: {
            Authorization: `Bearer ${agentApiKey}`,
          },
        },
      },
    },
    null,
    2
  );

  const curlExample = `curl -X POST ${originUrl}/api/agent \\
  -H "Authorization: Bearer ${agentApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "expense",
    "amount": 35000,
    "category": "Belanja Makanan",
    "notes": "Makan siang nasi padang"
  }'`;

  const aiSystemPrompt = `Kamu adalah asisten keuangan pribadi saya. Gunakan endpoint API Finance Tracking untuk mencatat transaksi tanpa saya harus membuka web app.

Setiap kali saya menulis pengeluaran atau pemasukan (misal: "catat kopi 25rb" atau "dapat bonus 1jt"):
Kirim HTTP POST ke: ${originUrl}/api/agent
Headers:
  Authorization: Bearer ${agentApiKey}
  Content-Type: application/json
Body JSON:
  {
    "type": "expense" | "income",
    "amount": number,
    "category": "string (opsional)",
    "notes": "keterangan transaksi"
  }

Untuk mengecek saldo kas saat ini, kirim GET ke: ${originUrl}/api/agent?apiKey=${agentApiKey}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl z-10 text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-finance-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-finance-600 to-finance-400 flex items-center justify-center shadow-md text-white">
                  {activeTab === 'budgeting' ? (
                    <PieChart className="w-5 h-5" />
                  ) : activeTab === 'profile' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Pengaturan Profil, Budgeting & Integrasi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kelola profil, pembagian pos budgeting bulanan, mata uang, & AI Agent
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 mt-4 rounded-2xl bg-cream-100 dark:bg-slate-800/80 border border-finance-200/70 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-slate-900 text-finance-700 dark:text-finance-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profil</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('budgeting');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'budgeting'
                    ? 'bg-white dark:bg-slate-900 text-finance-700 dark:text-finance-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Budgeting</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('agent');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'agent'
                    ? 'bg-white dark:bg-slate-900 text-finance-700 dark:text-finance-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="truncate">AI Agent</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-finance-500/10 border border-finance-500/30 text-finance-700 dark:text-finance-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ================= TAB 1: PROFILE & FINNY ================= */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmitProfile} className="mt-4 space-y-5">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Informasi Pengguna
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Pengguna
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama Anda"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-finance-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Akun
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || 'Mode Tamu (Local Storage)'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-3 pt-3 border-t border-finance-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-gold-500" />
                      Pilihan Mata Uang
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-finance-500/10 text-finance-700 dark:text-finance-300 border border-finance-500/20">
                      Aktif: {selectedCurrency}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {SUPPORTED_CURRENCIES.map((c) => {
                      const isSelected = selectedCurrency === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSelectedCurrency(c.code)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all relative ${
                            isSelected
                              ? 'bg-finance-500/10 border-finance-500 text-finance-700 dark:text-finance-300 shadow-sm'
                              : 'bg-cream-50 dark:bg-slate-950/60 border-finance-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-finance-500 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                          <span className="text-xs font-extrabold">{c.code}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Balance Thresholds */}
                <div className="space-y-3 pt-3 border-t border-finance-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                      <Smile className="w-3.5 h-3.5 text-finance-500" />
                      Acuan Sisa Saldo Harian
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sisa Saldo Harian = Total Saldo / Sisa Hari di Bulan Ini ({remainingDays} hari). Ekspresi Finny mengikuti Verdict Bulanan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-finance-50/70 dark:bg-finance-950/20 border border-finance-200 dark:border-finance-800 space-y-1.5">
                      <span className="text-xs font-bold text-finance-700 dark:text-finance-300 flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-finance-500" />
                        Batas Aman
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {selectedCurrency}
                        </span>
                        <input
                          type="text"
                          value={safeInput}
                          onChange={(e) => setSafeInput(e.target.value)}
                          className="w-full pl-12 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-finance-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-gold-50 dark:bg-amber-950/20 border border-gold-200 dark:border-amber-800 space-y-1.5">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-gold-500" />
                        Batas Waspada
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {selectedCurrency}
                        </span>
                        <input
                          type="text"
                          value={warningInput}
                          onChange={(e) => setWarningInput(e.target.value)}
                          className="w-full pl-12 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gold-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-cream-100 dark:bg-slate-950 border border-finance-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Sisa Saldo Harian Saat Ini:</span>
                    <strong className="text-slate-900 dark:text-white font-black text-sm">
                      {formatRupiah(dailyRate, selectedCurrency)} / hari
                    </strong>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      previewMood === 'happy'
                        ? 'bg-finance-100 text-finance-700 border border-finance-300'
                        : previewMood === 'neutral'
                        ? 'bg-gold-100 text-amber-700 border border-gold-300'
                        : 'bg-rose-100 text-rose-700 border border-rose-300'
                    }`}
                  >
                    {previewMood === 'happy' ? 'Aman' : previewMood === 'neutral' ? 'Waspada' : 'Kritis'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 2: BUDGETING (BERLAKU KE DEPAN SAJA) ================= */}
            {activeTab === 'budgeting' && (
              <form onSubmit={handleSaveBudgeting} className="mt-4 space-y-4">
                <div className="p-3.5 rounded-2xl bg-finance-50 dark:bg-finance-950/30 border border-finance-200 dark:border-finance-800 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-finance-600 shrink-0 mt-0.5" />
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Aturan Berlaku ke Depan Saja:</strong> Pengaturan budgeting ini berlaku mulai{' '}
                    <strong>{formatMonthKeyLabel(getCurrentMonthKey())}</strong> dan bulan-bulan selanjutnya. Riwayat transaksi serta budgeting bulan-bulan sebelumnya <strong>tidak berubah</strong>.
                  </div>
                </div>

                {/* Total Pemasukan Bulanan Manual */}
                <div className="p-4 rounded-2xl bg-cream-100/80 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-white">
                    Total Pemasukan Bulanan (Isi Manual)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {appCurrency}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetIncomeRaw ? Number(budgetIncomeRaw).toLocaleString('id-ID') : ''}
                      onChange={(e) => handleBudgetIncomeChange(e.target.value)}
                      placeholder="20.000.000"
                      className="w-full pl-14 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Contoh: Rp20.000.000 — lalu bagi ke pos-pos sesuai kebutuhan keluargamu.
                  </p>
                </div>

                {/* Pos List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Daftar Pos Budgeting ({budgetPosts.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBudgetPosts(createSuggestedBudgetPosts(budgetIncome))}
                        className="text-[11px] font-bold text-finance-700 dark:text-finance-300 hover:underline"
                      >
                        Reset Contoh (50/30/20)
                      </button>
                      <button
                        type="button"
                        onClick={handleAddBudgetPost}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Pos
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {budgetPosts.map((post, idx) => (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-finance-200 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={post.name}
                            onChange={(e) => handlePostNameChange(post.id, e.target.value)}
                            placeholder={`Nama Pos ${idx + 1} (misal: Biaya Bulanan, Investasi, Nabung)`}
                            className="flex-1 px-3 py-2 rounded-xl bg-cream-50 dark:bg-slate-900 border border-finance-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                          />
                          {budgetPosts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBudgetPost(post.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              title="Hapus pos"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Persen (%) — otomatis hitung nominal
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={post.percent}
                                onChange={(e) => handlePostPercentChange(post.id, e.target.value)}
                                className="w-full px-3 py-2 pr-8 rounded-xl bg-cream-50 dark:bg-slate-900 border border-finance-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                %
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Nominal ({appCurrency}) — otomatis hitung persen
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                                {appCurrency}
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={post.amount ? Number(post.amount).toLocaleString('id-ID') : ''}
                                onChange={(e) => handlePostAmountChange(post.id, e.target.value)}
                                placeholder="0"
                                className="w-full pl-12 pr-3 py-2 rounded-xl bg-cream-50 dark:bg-slate-900 border border-finance-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-finance-500"
                              />
                            </div>
                          </div>
                        </div>

                        {!budgetTotals.isExact100 && budgetTotals.unallocatedAmount !== 0 && idx === budgetPosts.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleFillRemainingToPost(post.id)}
                            className="text-[11px] font-bold text-finance-600 hover:underline"
                          >
                            + Sesuaikan sisa alokasi ({formatRupiah(budgetTotals.unallocatedAmount)}) ke pos ini
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Allocation Status */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                    budgetTotals.isExact100
                      ? 'bg-finance-50 dark:bg-finance-950/30 border-finance-300 text-finance-800 dark:text-finance-200'
                      : 'bg-gold-50 dark:bg-amber-950/20 border-gold-300 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-extrabold">
                    <span>Total Alokasi: {budgetTotals.totalPercent}%</span>
                    <span>
                      {formatRupiah(budgetTotals.totalAmount)} / {formatRupiah(budgetIncome)}
                    </span>
                  </div>
                  {!budgetTotals.isExact100 && (
                    <p className="text-[11px] font-semibold">
                      {budgetTotals.unallocatedAmount > 0
                        ? `Sisa belum dialokasi: ${formatRupiah(budgetTotals.unallocatedAmount)} (${budgetTotals.unallocatedPercent}%)`
                        : `Melebihi total pemasukan sebesar ${formatRupiah(Math.abs(budgetTotals.unallocatedAmount))} (${Math.abs(budgetTotals.unallocatedPercent)}%)`}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !budgetTotals.isExact100}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-finance-600 hover:bg-finance-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Budgeting'}
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 3: AI AGENT & MCP ================= */}
            {activeTab === 'agent' && (
              <div className="mt-4 space-y-5">
                <div className="p-3.5 rounded-2xl bg-finance-50 dark:bg-finance-950/20 border border-finance-200 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-finance-700 dark:text-finance-300 mb-1">
                    <Cpu className="w-4 h-4 text-finance-500" />
                    <span>Integrasi AI Agent Mandiri</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Hubungkan Claude Desktop, Cursor, Antigravity, atau ChatGPT untuk mencatat transaksi otomatis.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-gold-500" />
                      Personal API Key:
                    </label>
                    <span className="text-[10px] font-bold text-finance-700 bg-finance-500/10 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        readOnly
                        value={agentApiKey}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 dark:bg-slate-950 border border-finance-200 dark:border-slate-800 text-xs font-mono font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-slate-400"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(agentApiKey, 'key')}
                      className="px-3.5 py-2.5 rounded-xl bg-finance-600 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {copiedType === 'key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedType === 'key' ? 'Disalin' : 'Salin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-finance-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cara Menghubungkan:
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-cream-100 dark:bg-slate-800">
                      {(['mcp', 'curl', 'prompt'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAgentSnippetTab(t)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                            agentSnippetTab === t
                              ? 'bg-white dark:bg-slate-900 text-finance-700 shadow-xs'
                              : 'text-slate-500'
                          }`}
                        >
                          {t === 'mcp' ? 'MCP' : t === 'curl' ? 'cURL' : 'Prompt'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {agentSnippetTab === 'mcp' && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopy(mcpConfigJson, 'mcp')}
                          className="text-[11px] font-bold text-finance-600 hover:underline flex items-center gap-1"
                        >
                          {copiedType === 'mcp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedType === 'mcp' ? 'Tersalin!' : 'Salin JSON'}
                        </button>
                      </div>
                      <pre className="rounded-2xl bg-slate-950 p-3.5 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48">
                        {mcpConfigJson}
                      </pre>
                    </div>
                  )}

                  {agentSnippetTab === 'curl' && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopy(curlExample, 'curl')}
                          className="text-[11px] font-bold text-finance-600 hover:underline flex items-center gap-1"
                        >
                          {copiedType === 'curl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedType === 'curl' ? 'Tersalin!' : 'Salin cURL'}
                        </button>
                      </div>
                      <pre className="rounded-2xl bg-slate-950 p-3.5 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                        {curlExample}
                      </pre>
                    </div>
                  )}

                  {agentSnippetTab === 'prompt' && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopy(aiSystemPrompt, 'prompt')}
                          className="text-[11px] font-bold text-finance-600 hover:underline flex items-center gap-1"
                        >
                          {copiedType === 'prompt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedType === 'prompt' ? 'Tersalin!' : 'Salin Prompt'}
                        </button>
                      </div>
                      <div className="rounded-2xl bg-slate-950 p-3.5 text-slate-300 text-[11px] overflow-y-auto max-h-48 whitespace-pre-wrap">
                        {aiSystemPrompt}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-finance-600 text-white text-xs font-bold"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
