import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavbarProps {
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenCategoryManager: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenIncomeModal,
  onOpenExpenseModal,
  onOpenCategoryManager,
  onOpenAuthModal,
}) => {
  const { user, isGuest, isConfigured, signOut } = useAuth();
  const { resetToDefaultData } = useFinance();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950">
              <Wallet className="w-5 h-5 text-white dark:text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                  Finance Tracking
                </span>
                {isConfigured && !isGuest ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                    Supabase Realtime
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Pencatatan Keuangan Pribadi & Keluarga
              </p>
            </div>
          </div>

          {/* Action Buttons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Tambah Pengeluaran */}
            <button
              onClick={onOpenExpenseModal}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/20 dark:shadow-rose-950 transition-all active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span className="hidden md:inline">Tambah</span> Pengeluaran
            </button>

            {/* Quick Action: Tambah Pemasukan */}
            <button
              onClick={onOpenIncomeModal}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 dark:shadow-emerald-950 transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span className="hidden md:inline">Tambah</span> Pemasukan
            </button>

            {/* Category Manager Button */}
            <button
              onClick={onOpenCategoryManager}
              title="Kelola Kategori"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Tags className="w-4 h-4" />
            </button>

            {/* Dark/Light Mode Switcher */}
            <ThemeToggle />

            {/* User Profile / Auth */}
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
        </div>
      </div>
    </header>
  );
};

