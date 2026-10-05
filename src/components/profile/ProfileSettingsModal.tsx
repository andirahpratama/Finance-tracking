import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, SUPPORTED_CURRENCIES } from '../../lib/formatters';
import { CurrencyCode } from '../../types';
import { getStoredAgentApiKey, regenerateAgentApiKey } from '../../lib/agentApiKey';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { balanceThresholds, updateBalanceThresholds, totalBalance, appCurrency, setCurrency } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'agent'>('profile');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(appCurrency);
  const [safeInput, setSafeInput] = useState<string>(balanceThresholds.safe.toString());
  const [warningInput, setWarningInput] = useState<string>(balanceThresholds.warning.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // AI Agent & MCP State
  const [agentApiKey, setAgentApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [agentSnippetTab, setAgentSnippetTab] = useState<'mcp' | 'curl' | 'prompt'>('mcp');

  // Sync inputs when modal opens or thresholds change
  useEffect(() => {
    if (isOpen) {
      setFullName(user?.full_name || '');
      setSelectedCurrency(appCurrency);
      setSafeInput(balanceThresholds.safe.toString());
      setWarningInput(balanceThresholds.warning.toString());
      setSuccessMsg('');
      setErrorMsg('');
      const key = getStoredAgentApiKey(user?.id || 'demo-user');
      setAgentApiKey(key);
    }
  }, [isOpen, balanceThresholds, user, appCurrency]);

  const safeVal = Math.max(0, parseInt(safeInput.replace(/\D/g, ''), 10) || 0);
  const warningVal = Math.max(0, parseInt(warningInput.replace(/\D/g, ''), 10) || 0);

  // Calculate remaining days for live preview
  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);
  const dailyRate = Math.round(totalBalance / remainingDays);

  const previewMood = dailyRate > safeVal
    ? 'happy'
    : dailyRate >= warningVal
    ? 'neutral'
    : 'sad';

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleRegenerateKey = () => {
    if (confirm('Apakah Anda yakin ingin membuat ulang API Key? API Key lama yang sudah terpasang di AI agent tidak akan berlaku lagi.')) {
      const newKey = regenerateAgentApiKey(user?.id || 'demo-user');
      setAgentApiKey(newKey);
      setSuccessMsg('API Key baru berhasil dibuat!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // MCP Configuration JSON snippet
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://finance-tracking-olive.vercel.app';
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

  // Curl command example
  const curlExample = `curl -X POST ${originUrl}/api/agent \\
  -H "Authorization: Bearer ${agentApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "expense",
    "amount": 35000,
    "category": "Belanja Makanan",
    "notes": "Makan siang nasi padang"
  }'`;

  // System Prompt for Custom AI Agent (ChatGPT, Claude, Cursor)
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl z-10 text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md text-white">
                  {activeTab === 'profile' ? <Sparkles className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Pengaturan Akun & Integrasi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kelola profil, mata uang, emosi Finny, dan koneksi AI Agent
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

            {/* Sub-Tabs: Profil vs AI Agent */}
            <div className="grid grid-cols-2 gap-1.5 p-1 mt-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profil & Finny</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('agent')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'agent'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-teal-500" />
                <span className="flex items-center gap-1.5">
                  AI Agent & MCP
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                </span>
              </button>
            </div>

            {/* Notification messages */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ================= TAB 1: PROFILE & FINNY ================= */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="mt-4 space-y-5 animate-in fade-in duration-200">
                {/* SECTION 1: User Profile Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Currency Settings */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      Pilihan Mata Uang
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-2 h-2 stroke-[3]" />
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

                {/* SECTION 3: Finny Thresholds */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1">
                      <Smile className="w-3.5 h-3.5 text-emerald-500" />
                      Acuan Emosi Finny (Per Hari)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sisa Saldo Harian = Total Saldo / Sisa Hari di Bulan Ini ({remainingDays} hari).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Smile className="w-3.5 h-3.5 text-emerald-500" />
                          Batas Aman (Senang)
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {selectedCurrency}
                        </span>
                        <input
                          type="text"
                          value={safeInput}
                          onChange={(e) => setSafeInput(e.target.value)}
                          className="w-full pl-12 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          Batas Waspada (Panik)
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {selectedCurrency}
                        </span>
                        <input
                          type="text"
                          value={warningInput}
                          onChange={(e) => setWarningInput(e.target.value)}
                          className="w-full pl-12 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                      Sisa Saldo Rata-Rata Saat Ini:
                    </span>
                    <strong className="text-slate-900 dark:text-white font-black text-sm">
                      {formatRupiah(dailyRate, selectedCurrency)} / hari
                    </strong>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    previewMood === 'happy'
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : previewMood === 'neutral'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                  }`}>
                    {previewMood === 'happy' ? 'Senang 🥳' : previewMood === 'neutral' ? 'Waspada 🧐' : 'Sedih 🥺'}
                  </span>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-105 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 2: AI AGENT & MCP ================= */}
            {activeTab === 'agent' && (
              <div className="mt-4 space-y-5 animate-in fade-in duration-200">
                {/* Intro Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 border border-teal-500/20 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-300 mb-1">
                    <Cpu className="w-4 h-4 text-teal-500" />
                    <span>Integrasi AI Agent Mandiri (Autonomous Finance)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Hubungkan Claude Desktop, Cursor, Antigravity, ChatGPT, atau AI Agent Anda sendiri. AI Anda bisa membaca saldo, melihat kategori, dan <strong>otomatis mencatat pengeluaran/pemasukan</strong> tanpa Anda perlu membuka aplikasi web ini.
                  </p>
                </div>

                {/* API Key Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      Personal API Key / Access Token Anda:
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Aktif & Siap Digunakan
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        readOnly
                        value={agentApiKey}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(agentApiKey, 'key')}
                      className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      title="Salin API Key"
                    >
                      {copiedType === 'key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedType === 'key' ? 'Disalin!' : 'Salin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Buat ulang API Key baru"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Integration Snippets Tabs */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pilihan Cara Menghubungkan:
                    </span>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setAgentSnippetTab('mcp')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                          agentSnippetTab === 'mcp'
                            ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        MCP Server
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgentSnippetTab('curl')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                          agentSnippetTab === 'curl'
                            ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        REST / cURL
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgentSnippetTab('prompt')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                          agentSnippetTab === 'prompt'
                            ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        AI Prompt
                      </button>
                    </div>
                  </div>

                  {/* 1. MCP Server Config */}
                  {agentSnippetTab === 'mcp' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Tambahkan ke <code>claude_desktop_config.json</code> atau pengaturan MCP Cursor:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(mcpConfigJson, 'mcp')}
                          className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedType === 'mcp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedType === 'mcp' ? 'Tersalin!' : 'Salin JSON'}
                        </button>
                      </div>

                      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48">
                        <pre>{mcpConfigJson}</pre>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Tools yang disediakan MCP:</strong> <code>add_transaction</code>, <code>get_financial_summary</code>, <code>list_categories</code>, dan <code>get_gold_portfolio</code>.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. cURL / Webhook */}
                  {agentSnippetTab === 'curl' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Contoh mencatat pengeluaran via terminal / webhook:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(curlExample, 'curl')}
                          className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedType === 'curl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedType === 'curl' ? 'Tersalin!' : 'Salin cURL'}
                        </button>
                      </div>

                      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48">
                        <pre>{curlExample}</pre>
                      </div>
                    </div>
                  )}

                  {/* 3. AI Assistant Prompt */}
                  {agentSnippetTab === 'prompt' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Tempelkan instruksi ini ke Custom GPT / ChatGPT / Siri Shortcut Anda:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(aiSystemPrompt, 'prompt')}
                          className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedType === 'prompt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedType === 'prompt' ? 'Tersalin!' : 'Salin Prompt'}
                        </button>
                      </div>

                      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-slate-300 font-sans text-[11px] overflow-y-auto leading-relaxed max-h-48 whitespace-pre-wrap">
                        {aiSystemPrompt}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:brightness-105 transition-all"
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
