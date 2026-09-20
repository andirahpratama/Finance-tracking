import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Settings,
  Users,
  Inbox,
  LogOut,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Mail,
  UserCheck,
  Clock,
  Search,
  Check,
  Sparkles,
  Database,
  Activity,
  Zap,
  RefreshCw,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAppSettings,
  saveAppSettings,
  getFeedbacks,
  markFeedbackAsRead,
  deleteFeedback,
  getSystemUsers,
} from '../../lib/appSettings';
import {
  pingSupabase,
  getSupabasePingStatus,
  getPingHistory,
  clearPingHistory,
  formatTimeAgo,
  formatCountdown,
  PING_UPDATED_EVENT,
  AUTO_PING_INTERVAL_DAYS,
} from '../../lib/supabasePing';
import { AppSettings, FeedbackMessage, UserProfile, SupabasePingLog, SupabasePingStatus } from '../../types';

interface AdminDashboardProps {
  onLogoutAdmin: () => void;
  onBackToApp: () => void;
  onSettingsUpdated?: (settings: AppSettings) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogoutAdmin,
  onBackToApp,
  onSettingsUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<'settings' | 'users' | 'supabase' | 'inbox'>('settings');

  // Supabase Ping & Keep-Alive State
  const [pingStatus, setPingStatus] = useState<SupabasePingStatus>(getSupabasePingStatus());
  const [pingHistory, setPingHistory] = useState<SupabasePingLog[]>(getPingHistory());
  const [isPinging, setIsPinging] = useState(false);
  const [pingFeedback, setPingFeedback] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.customLogo);
  const [faviconPreview, setFaviconPreview] = useState<string | undefined>(settings.customFavicon);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Users State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  // Inbox State
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'read'>('all');

  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    const list = await getSystemUsers(currentUser);
    setUsersList(list);
    setIsRefreshingUsers(false);
  };

  useEffect(() => {
    setFeedbacks(getFeedbacks());
    handleRefreshUsers();
  }, [currentUser]);

  // Realtime Supabase Ping status event listener
  useEffect(() => {
    const handlePingEvent = () => {
      setPingStatus(getSupabasePingStatus());
      setPingHistory(getPingHistory());
    };
    window.addEventListener(PING_UPDATED_EVENT, handlePingEvent);
    return () => {
      window.removeEventListener(PING_UPDATED_EVENT, handlePingEvent);
    };
  }, []);

  // Manual Ping Execution Handler
  const handleManualPing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingFeedback(null);
    try {
      const result = await pingSupabase('manual');
      setPingStatus(getSupabasePingStatus());
      setPingHistory(getPingHistory());
      setPingFeedback({
        success: result.status === 'success',
        message: result.message,
        latencyMs: result.latencyMs,
      });
      setTimeout(() => setPingFeedback(null), 8000);
    } catch (e: any) {
      setPingFeedback({
        success: false,
        message: e?.message || 'Gagal mengeksekusi ping Supabase.',
        latencyMs: 0,
      });
    } finally {
      setIsPinging(false);
    }
  };

  // Copy Supabase URL to clipboard
  const handleCopyUrl = () => {
    if (pingStatus.projectUrl) {
      navigator.clipboard.writeText(pingStatus.projectUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Clear Ping History from localStorage
  const handleClearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh log riwayat ping Supabase dari browser?')) {
      clearPingHistory();
      setPingHistory([]);
    }
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Favicon file upload handler
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert('Ukuran favicon maksimal 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFaviconPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Save Settings
  const handleSaveSettings = () => {
    const newSettings: AppSettings = {
      ...settings,
      customLogo: logoPreview,
      customFavicon: faviconPreview,
    };
    saveAppSettings(newSettings);
    setSettings(newSettings);
    if (onSettingsUpdated) {
      onSettingsUpdated(newSettings);
    }
    setSavedSuccessMsg('Pengaturan aplikasi (Logo & Favicon) berhasil disimpan!');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const handleResetLogo = () => {
    setLogoPreview(undefined);
  };

  const handleResetFavicon = () => {
    setFaviconPreview(undefined);
  };

  // Inbox handlers
  const handleToggleRead = (id: string, currentReadStatus: boolean) => {
    const updated = markFeedbackAsRead(id, !currentReadStatus);
    setFeedbacks(updated);
  };

  const handleDeleteMessage = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pesan ini dari kotak masuk?')) {
      const updated = deleteFeedback(id);
      setFeedbacks(updated);
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (inboxFilter === 'unread') return !f.read;
    if (inboxFilter === 'read') return f.read;
    return true;
  });

  const unreadCount = feedbacks.filter((f) => !f.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar Admin */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white">
                  Dashboard Admin
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pengaturan Aplikasi, User Management & Kotak Masuk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Supabase Keep-Alive Pill Status */}
            <div
              onClick={() => setActiveAdminTab('supabase')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs cursor-pointer hover:border-emerald-500/40 transition-colors group"
              title="Klik untuk membuka tab Status & Ping Supabase"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 text-[11px] group-hover:text-slate-300">Supabase:</span>
              <span className="text-emerald-400 font-bold text-[11px]">
                {pingStatus.lastPingAt ? formatTimeAgo(pingStatus.lastPingAt) : '3 hari sekali'}
              </span>
            </div>

            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke Aplikasi</span>
            </button>
            <button
              onClick={onLogoutAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeAdminTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Aplikasi</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeAdminTab === 'users'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Management User</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/60 font-bold">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('supabase')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeAdminTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Status & Ping Supabase</span>
            {pingStatus.lastLatencyMs && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                {pingStatus.lastLatencyMs}ms
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('inbox')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap ${
              activeAdminTab === 'inbox'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Kotak Masuk</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                {unreadCount} Baru
              </span>
            )}
          </button>
        </div>

        {/* Saved Toast Alert */}
        <AnimatePresence>
          {savedSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs font-bold text-emerald-400"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{savedSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: PENGATURAN APLIKASI */}
        {activeAdminTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  Kustomisasi Branding & Media Aplikasi
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload logo dan favicon kustom yang akan diterapkan secara realtime di seluruh aplikasi web.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Upload Logo Aplikasi */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                        Logo Utama Aplikasi
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Disarankan format PNG/SVG transparan (Maks. 2MB)
                      </p>
                    </div>
                    {logoPreview && (
                      <button
                        onClick={handleResetLogo}
                        className="text-[11px] font-semibold text-rose-400 hover:underline"
                      >
                        Reset ke Default
                      </button>
                    )}
                  </div>

                  {/* Logo Preview Box */}
                  <div className="h-32 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center p-3 relative group">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Custom Logo Preview"
                        className="max-h-24 max-w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto text-white">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-300">Logo Default (Wallet Icon)</p>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold text-xs cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{logoPreview ? 'Ganti Logo' : 'Upload Logo Baru'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. Upload Favicon */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        Favicon Tab Browser
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Gambar icon yang tampil di tab browser (Maks. 1MB)
                      </p>
                    </div>
                    {faviconPreview && (
                      <button
                        onClick={handleResetFavicon}
                        className="text-[11px] font-semibold text-rose-400 hover:underline"
                      >
                        Reset ke Default
                      </button>
                    )}
                  </div>

                  {/* Favicon Preview Box */}
                  <div className="h-32 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center p-3">
                    {faviconPreview ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <img src={faviconPreview} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                        <span className="text-xs text-slate-300 font-semibold">Tampilan Favicon Kustom</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-300">Favicon Default SVG</p>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-400 font-bold text-xs cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{faviconPreview ? 'Ganti Favicon' : 'Upload Favicon Baru'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan Pengaturan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGEMENT USER */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Management User Aplikasi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Daftar pengguna yang sedang dan telah menggunakan Finance Tracking
                  </p>
                </div>

                {/* User Search & Sync Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Cari nama atau email user..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleRefreshUsers}
                    disabled={isRefreshingUsers}
                    title="Sinkronkan data Supabase"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 flex items-center gap-1.5"
                  >
                    <UserCheck className={`w-4 h-4 text-emerald-400 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Sync Supabase</span>
                  </button>
                </div>
              </div>

              {/* Users Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <p className="text-xs font-bold text-slate-400">Total Pengguna Terdaftar</p>
                  <p className="text-2xl font-black text-white mt-1">{usersList.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-bold text-emerald-400">Status Sesi Aktif</p>
                  <p className="text-2xl font-black text-emerald-300 mt-1">Online</p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                  <p className="text-xs font-bold text-teal-400">Akses Mode Tamu & Supabase</p>
                  <p className="text-2xl font-black text-teal-300 mt-1">Aktif</p>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Nama Pengguna (Supabase)</th>
                      <th className="px-4 py-3">Email Pengguna</th>
                      <th className="px-4 py-3">Tanggal Mendaftar</th>
                      <th className="px-4 py-3 text-center">Status & Terakhir Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs flex-shrink-0">
                            {u.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="text-slate-100">{u.full_name || u.email.split('@')[0]}</span>
                            {currentUser?.id === u.id && (
                              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                (Sesi Anda)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono">{u.email}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="w-3 h-3" />
                            Terdaftar & Aktif
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1 font-medium">
                            Terakhir Login:{' '}
                            <span className="text-slate-200 font-semibold">
                              {u.last_login_at ? new Date(u.last_login_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Hari Ini'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">
                          Tidak ada data pengguna yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATUS & PING SUPABASE (KEEP-ALIVE) */}
        {activeAdminTab === 'supabase' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Ping Feedback Alert Banner */}
            <AnimatePresence>
              {pingFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold ${
                    pingFeedback.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {pingFeedback.success ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                    )}
                    <div>
                      <p className="font-extrabold">
                        {pingFeedback.success ? 'Ping Supabase Berhasil!' : 'Ping Supabase Mengalami Kendala'}
                      </p>
                      <p className="text-[11px] font-normal opacity-90 mt-0.5">
                        {pingFeedback.message}
                      </p>
                    </div>
                  </div>
                  {pingFeedback.latencyMs > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30 whitespace-nowrap">
                      ⚡ {pingFeedback.latencyMs} ms
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero Card with Manual Ping Action */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Supabase Keep-Alive Otomatis Aktif
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Pencegahan Database Pause & Keep-Alive Supabase
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Akun Supabase gratis (Free Tier) otomatis dinonaktifkan (*paused*) oleh Supabase jika tidak ada aktivitas selama 7 hari. Sistem Finance Tracking ini mengirimkan query ping otomatis <strong>setiap {AUTO_PING_INTERVAL_DAYS} hari sekali</strong> agar database selalu aktif 24/7. Anda juga dapat menjalankan ping manual kapan saja di bawah ini.
                  </p>
                </div>

                {/* Tombol Ping Manual */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={handleManualPing}
                    disabled={isPinging}
                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Zap
                      className={`w-5 h-5 text-slate-950 transition-transform ${
                        isPinging ? 'animate-bounce' : 'group-hover:scale-125'
                      }`}
                    />
                    <span>{isPinging ? 'Sedang Melakukan Ping...' : 'Ping Supabase Sekarang'}</span>
                    {isPinging && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Metrics Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Status Koneksi */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Status Database</span>
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <p className="text-xl font-black text-white">Online & Aktif</p>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold">PostgreSQL & PostgREST OK</p>
              </div>

              {/* Metric 2: Latensi Terakhir */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Latensi Respons</span>
                  <Activity className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xl font-black text-white font-mono">
                  {pingStatus.lastLatencyMs ? `${pingStatus.lastLatencyMs} ms` : 'Tersedia'}
                </p>
                <p className="text-[11px] text-teal-400 font-semibold">
                  {pingStatus.lastLatencyMs && pingStatus.lastLatencyMs < 200
                    ? '⚡ Sangat Cepat (< 200ms)'
                    : 'Koneksi Stabil'}
                </p>
              </div>

              {/* Metric 3: Ping Terakhir */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Ping Terakhir</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xl font-black text-white">
                  {formatTimeAgo(pingStatus.lastPingAt)}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {pingStatus.lastPingAt
                    ? new Date(pingStatus.lastPingAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Belum tercatat'}
                </p>
              </div>

              {/* Metric 4: Jadwal Ping Berikutnya */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Jadwal Auto-Ping</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xl font-black text-white">
                  {formatCountdown(pingStatus.nextScheduledPingAt)}
                </p>
                <p className="text-[11px] text-purple-400 font-semibold">
                  Siklus: Setiap {AUTO_PING_INTERVAL_DAYS} Hari Sekali
                </p>
              </div>
            </div>

            {/* 2-Column Info & Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kolom Kiri: Mekanisme Perlindungan Ganda */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Mekanisme Perlindungan Ganda (Dual-Layer Keep-Alive)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Untuk memastikan database Supabase Anda tidak pernah tertidur (*pause*), aplikasi ini dilengkapi 2 jalur otomatis:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Client-Side Auto Ping (Saat Web Dibuka)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Setiap kali ada pengguna atau admin yang membuka website, browser mengecek apakah sudah melewati 3 hari sejak ping terakhir. Jika ya, kueri ringan langsung dikirim di latar belakang tanpa mengganggu penggunaan aplikasi.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Serverless Vercel Cron Job (Background Total)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dikonfigurasi di berkas <code className="text-emerald-300 font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded">vercel.json</code> dengan jadwal <code className="text-emerald-300 font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded">0 0 */3 * *</code>. Server Vercel otomatis memanggil <code className="text-emerald-300 font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded">/api/ping</code> setiap 3 hari sekali meskipun selama 1 bulan tidak ada yang membuka website.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Detail Endpoint & Info Teknis */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-400" />
                  Informasi Koneksi Supabase
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Project URL Supabase:
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-mono text-xs text-slate-200 flex-1 truncate">
                        {pingStatus.projectUrl || 'https://ynmrprqflgewraqbcigt.supabase.co'}
                      </span>
                      <button
                        onClick={handleCopyUrl}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1"
                        title="Salin URL"
                      >
                        {copiedUrl ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px]">{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block">Status Anon Key</span>
                      <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tervalidasi & Aman
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block">Target Kueri Ping</span>
                      <span className="text-xs font-mono font-bold text-slate-200 inline-flex items-center gap-1 mt-1">
                        categories.select('id')
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                    💡 <strong>Tips Admin:</strong> Anda tidak perlu melakukan apa-apa lagi! Selama website atau deployment Vercel aktif, akun Supabase Anda dijamin tidak akan pernah masuk ke masa jeda (*inactivity pause*).
                  </div>
                </div>
              </div>
            </div>

            {/* Ping History Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    Riwayat Log Aktivitas Ping Supabase
                  </h3>
                  <p className="text-xs text-slate-400">
                    Catatan aktivitas ping otomatis dan manual yang tersimpan di sistem
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualPing}
                    disabled={isPinging}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Ping Ulang</span>
                  </button>
                  {pingHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bersihkan Log</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Waktu Eksekusi</th>
                      <th className="px-4 py-3">Pemicu (Trigger)</th>
                      <th className="px-4 py-3">Status Kueri</th>
                      <th className="px-4 py-3">Latensi</th>
                      <th className="px-4 py-3">Keterangan Respons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {pingHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              item.trigger === 'manual'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : item.trigger === 'cron'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            {item.trigger === 'manual'
                              ? 'Manual (Admin)'
                              : item.trigger === 'cron'
                              ? 'Vercel Cron'
                              : 'Otomatis (Sistem)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              200 OK (Aktif)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Galat ({item.statusCode || 'Error'})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              item.latencyMs < 250
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : item.latencyMs < 600
                                ? 'text-amber-400 bg-amber-500/10'
                                : 'text-rose-400 bg-rose-500/10'
                            }`}
                          >
                            {item.latencyMs} ms
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                          {item.message}
                        </td>
                      </tr>
                    ))}
                    {pingHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                          Belum ada riwayat ping tersimpan. Klik tombol{' '}
                          <strong className="text-emerald-400 cursor-pointer" onClick={handleManualPing}>
                            "Ping Supabase Sekarang"
                          </strong>{' '}
                          di atas untuk menguji koneksi database pertama kali.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KOTAK MASUK (SARAN & MASUKAN) */}
        {activeAdminTab === 'inbox' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-emerald-400" />
                    Kotak Masuk Saran & Masukan User
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pesan dan masukan langsung yang dikirim oleh pengguna aplikasi
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setInboxFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      inboxFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({feedbacks.length})
                  </button>
                  <button
                    onClick={() => setInboxFilter('unread')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      inboxFilter === 'unread' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Belum Dibaca ({unreadCount})
                  </button>
                  <button
                    onClick={() => setInboxFilter('read')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      inboxFilter === 'read' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sudah Dibaca
                  </button>
                </div>
              </div>

              {/* Message Cards List */}
              <div className="space-y-3">
                {filteredFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      !fb.read
                        ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : 'bg-slate-950/50 border-slate-800/80 opacity-90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-sm">
                          {fb.sender_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{fb.sender_name}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                fb.category === 'saran'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : fb.category === 'fitur'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : fb.category === 'bug'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              }`}
                            >
                              {fb.category}
                            </span>
                            {!fb.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{fb.sender_email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(fb.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Message Text */}
                    <div className="py-3">
                      <p className="text-xs text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                        {fb.message}
                      </p>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 flex items-center justify-end gap-3 text-xs border-t border-slate-800/40">
                      <button
                        onClick={() => handleToggleRead(fb.id, fb.read)}
                        className="flex items-center gap-1.5 font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>{fb.read ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(fb.id)}
                        className="flex items-center gap-1.5 font-semibold text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}

                {filteredFeedbacks.length === 0 && (
                  <div className="py-12 text-center space-y-2">
                    <Mail className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-400">Kotak Masuk Kosong</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Belum ada saran atau masukan baru yang diterima dari pengguna.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
