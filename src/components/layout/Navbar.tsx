import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Tags,
  LogIn,
  LogOut,
  Radio,
  Sparkles,
  RotateCcw,
  Menu,
  X,
  Target,
  ChevronRight,
  Home,
  BarChart3,
  Receipt,
  PlusCircle,
  Settings,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { TabType } from './MobileBottomNav';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenSavingsModal?: () => void;
  onOpenCategoryManager: () => void;
  onOpenAuthModal: () => void;
  onOpenSavingsTargetModal?: () => void;
  onOpenProfileSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenIncomeModal,
  onOpenExpenseModal,
  onOpenSavingsModal,
  onOpenCategoryManager,
  onOpenAuthModal,
  onOpenSavingsTargetModal,
  onOpenProfileSettings,
}) => {
  const { user, isGuest, isConfigured, signOut } = useAuth();
  const { resetToDefaultData } = useFinance();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showInputDropdown, setShowInputDropdown] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const desktopTabs: { id: TabType | 'input'; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'input', label: 'Input', icon: PlusCircle },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 },
    { id: 'history', label: 'History', icon: Receipt },
    { id: 'tabungan', label: 'Tabungan', icon: Target },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-all duration-200 ${isScrolled ? 'shadow-md shadow-slate-200/60 dark:shadow-slate-950/60' : ''}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-emerald-950/20 dark:shadow-emerald-950 cursor-pointer" onClick={() => onSelectTab('home')}>
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white dark:text-slate-950" />
            </div>
            <div className="min-w-0 cursor-pointer" onClick={() => onSelectTab('home')}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                  Finance Tracking
                </span>
                {isConfigured && !isGuest ? (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                    Realtime
                  </span>
                ) : (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Demo
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                Pencatatan Keuangan Pribadi & Keluarga
              </p>
            </div>
          </div>

          {/* DESKTOP Floating Header Tab Menu */}
          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-inner gap-1">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              if (tab.id === 'input') {
                return (
                  <div key={tab.id} className="relative">
                    <button
                      onClick={() => setShowInputDropdown(!showInputDropdown)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        showInputDropdown
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-pink-500" />
                      <span>{tab.label}</span>
                    </button>

                    {/* Input Quick Action Dropdown */}
                    {showInputDropdown && (
                      <div
                        className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                        onClick={() => setShowInputDropdown(false)}
                      >
                        <button
                          onClick={onOpenExpenseModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                          Catat Pengeluaran
                        </button>
                        <button
                          onClick={onOpenIncomeModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left"
                        >
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          Catat Pemasukan
                        </button>
                        {onOpenSavingsModal && (
                          <button
                            onClick={onOpenSavingsModal}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors text-left"
                          >
                            <Target className="w-4 h-4 text-cyan-500" />
                            Setor/Tarik Tabungan
                          </button>
                        )}
                        <button
                          onClick={onOpenCategoryManager}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <Tags className="w-4 h-4 text-slate-500" />
                          Kelola Kategori
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id as TabType)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="desktopActiveHeaderTab"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl shadow-md shadow-emerald-600/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isSelected ? 'text-white' : ''}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* DESKTOP Right Actions & Profile */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Dark/Light Mode Switcher */}
            <ThemeToggle />

            {/* User Profile / Auth Dropdown */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white dark:text-slate-950 font-bold text-xs">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none truncate max-w-[100px]">
                        {user.full_name}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{isGuest ? 'Mode Tamu' : 'Online'}</span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>

                      {isGuest && (
                        <button
                          onClick={onOpenAuthModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Hubungkan Akun / Login
                        </button>
                      )}

                      {onOpenProfileSettings && (
                        <button
                          onClick={onOpenProfileSettings}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <Settings className="w-3.5 h-3.5 text-emerald-500" />
                          Pengaturan Profil & Finny
                        </button>
                      )}

                      <button
                        onClick={resetToDefaultData}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        Reset Contoh Data
                      </button>

                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar (Sign Out)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4 text-emerald-500" />
                  Masuk
                </button>
              )}
            </div>
          </div>

          {/* MOBILE Header Controls (< md) - Compact */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
              aria-label="Buka Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 w-screen h-[100dvh] z-50 md:hidden overflow-hidden pointer-events-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10"
            >
              <div className="space-y-5">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">Finance Menu</span>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Greeting & Status Card in Drawer */}
                {user && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.full_name || 'Pengguna'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                        {isGuest ? 'Mode Tamu (Offline)' : 'Online (Supabase)'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mobile Drawer Menu Links */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                    Navigasi Halaman
                  </span>

                  <button
                    onClick={() => {
                      onSelectTab('home');
                      closeMobileMenu();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                      activeTab === 'home' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Home className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs">Home (Saldo & Ringkasan)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('rekap');
                      closeMobileMenu();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                      activeTab === 'rekap' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <span className="text-xs">Rekap (Grafik Keuangan)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('history');
                      closeMobileMenu();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                      activeTab === 'history' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs">History (Catatan Arus Kas)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('tabungan');
                      closeMobileMenu();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                      activeTab === 'tabungan' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs">Tabungan (Target Menabung)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Features & Settings in Drawer */}
                <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                    Fitur Tambahan
                  </span>

                  {/* Pengaturan Profil & Finny Link */}
                  {onOpenProfileSettings && (
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        onOpenProfileSettings();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Pengaturan Profil & Finny</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Atur profil & acuan emosi maskot</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {/* Target Menabung Modal Link */}
                  {onOpenSavingsTargetModal && (
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        onOpenSavingsTargetModal();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Atur Target Menabung</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Atur komitmen tabungan</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {/* Kelola Kategori Link */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      onOpenCategoryManager();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        <Tags className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Kelola Kategori</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Tambah / ubah kategori</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Reset Demo Data Link */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      resetToDefaultData();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Reset Contoh Data</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Kembalikan data demo awal</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Drawer Footer Auth Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {user ? (
                  <>
                    {isGuest && (
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20"
                      >
                        <LogIn className="w-4 h-4" />
                        Hubungkan Akun / Login
                      </button>
                    )}
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        signOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Sign Out)
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      onOpenAuthModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-950/20"
                  >
                    <LogIn className="w-4 h-4" />
                    Masuk ke Akun
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
