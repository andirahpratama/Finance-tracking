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
  MessageSquare,
  Calculator,
  TrendingUp,
  PieChart,
  HandCoins,
  ArrowLeftRight,
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
  onOpenFeedbackModal?: () => void;
  customLogo?: string;
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
  onOpenFeedbackModal,
  customLogo,
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
    { id: 'input', label: 'Catat', icon: PlusCircle },
    { id: 'budgeting', label: 'Budgeting', icon: PieChart },
    { id: 'tabungan', label: 'Tabungan', icon: Target },
    { id: 'investasi', label: 'Investasi', icon: TrendingUp },
    { id: 'utang', label: 'Utang', icon: HandCoins },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 },
    { id: 'history', label: 'History', icon: Receipt },
    { id: 'kalkulator', label: 'Kalkulator', icon: Calculator },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-finance-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-all duration-200 ${
        isScrolled ? 'shadow-md shadow-finance-900/5' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-finance-600 to-finance-400 flex items-center justify-center shadow-sm cursor-pointer overflow-hidden"
              onClick={() => onSelectTab('home')}
            >
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <div className="min-w-0 cursor-pointer" onClick={() => onSelectTab('home')}>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight truncate">
                  Finance Tracking
                </span>
                {isConfigured && !isGuest ? (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-finance-100 text-finance-700 font-semibold">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-finance-600" />
                    Realtime
                  </span>
                ) : (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-100 text-amber-800 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-gold-500" />
                    Demo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:block truncate">
                Keuangan Pribadi & Keluarga
              </p>
            </div>
          </div>

          {/* DESKTOP Navigation */}
          <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-cream-100 dark:bg-slate-900/80 border border-finance-200/70 dark:border-slate-800 gap-0.5">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              if (tab.id === 'input') {
                return (
                  <div key={tab.id} className="relative">
                    <button
                      onClick={() => setShowInputDropdown(!showInputDropdown)}
                      className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        showInputDropdown
                          ? 'bg-finance-600 text-white shadow-sm'
                          : 'text-finance-700 dark:text-finance-300 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>

                    {showInputDropdown && (
                      <div
                        className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-2 shadow-2xl z-50"
                        onClick={() => setShowInputDropdown(false)}
                      >
                        <button
                          onClick={onOpenExpenseModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left"
                        >
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                          Catat Pengeluaran
                        </button>
                        <button
                          onClick={onOpenIncomeModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-finance-700 hover:bg-finance-50 dark:hover:bg-finance-950/30 text-left"
                        >
                          <ArrowUpRight className="w-4 h-4 text-finance-600" />
                          Catat Pemasukan
                        </button>
                        {onOpenSavingsModal && (
                          <button
                            onClick={onOpenSavingsModal}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-left"
                          >
                            <ArrowLeftRight className="w-4 h-4 text-teal-600" />
                            Transfer Kas / Tabungan
                          </button>
                        )}
                        <button
                          onClick={onOpenCategoryManager}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-cream-100 dark:hover:bg-slate-800 text-left"
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
                  className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="desktopActiveHeaderTab"
                      className="absolute inset-0 bg-finance-600 rounded-xl shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isSelected ? 'text-white' : ''}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* DESKTOP Right Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />

            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-cream-100 hover:bg-finance-50 dark:bg-slate-900 border border-finance-200/80 dark:border-slate-800"
                  >
                    <div className="w-7 h-7 rounded-lg bg-finance-600 flex items-center justify-center text-white font-bold text-xs">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none truncate max-w-[90px]">
                        {user.full_name}
                      </p>
                      <span className="text-[10px] text-slate-500">{isGuest ? 'Tamu' : 'Online'}</span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 p-2 shadow-2xl z-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="p-2.5 border-b border-finance-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      {isGuest && (
                        <button
                          onClick={onOpenAuthModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-finance-700 hover:bg-finance-50 text-left"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Hubungkan Akun / Login
                        </button>
                      )}

                      {onOpenProfileSettings && (
                        <button
                          onClick={onOpenProfileSettings}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-cream-100 dark:hover:bg-slate-800 text-left"
                        >
                          <Settings className="w-3.5 h-3.5 text-finance-600" />
                          Profil & Budgeting
                        </button>
                      )}

                      {onOpenFeedbackModal && (
                        <button
                          onClick={onOpenFeedbackModal}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-cream-100 dark:hover:bg-slate-800 text-left"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-500" />
                          Kirim Saran & Masukan
                        </button>
                      )}

                      <button
                        onClick={resetToDefaultData}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-cream-100 dark:hover:bg-slate-800 text-left"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-gold-500" />
                        Reset Contoh Data
                      </button>

                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-100 border border-finance-200 text-xs font-semibold text-slate-800"
                >
                  <LogIn className="w-4 h-4 text-finance-600" />
                  Masuk
                </button>
              )}
            </div>
          </div>

          {/* MOBILE Header Controls */}
          <div className="flex lg:hidden items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-cream-100 dark:bg-slate-900 border border-finance-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
              aria-label="Buka Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 w-screen h-[100dvh] z-50 lg:hidden overflow-hidden pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 border-l border-finance-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-finance-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-finance-600 flex items-center justify-center text-white">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">Menu Aplikasi</span>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {user && (
                  <div className="p-3 rounded-xl bg-cream-50 dark:bg-slate-950/70 border border-finance-100 dark:border-slate-800 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-finance-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name || 'Pengguna'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {[
                    { id: 'home' as TabType, label: 'Home (Dashboard)', icon: Home },
                    { id: 'budgeting' as TabType, label: 'Budgeting Bulanan', icon: PieChart },
                    { id: 'tabungan' as TabType, label: 'Pos Tabungan', icon: Target },
                    { id: 'investasi' as TabType, label: 'Investasi (Emas, Saham, Properti, Kelas)', icon: TrendingUp },
                    { id: 'utang' as TabType, label: 'Buku Utang & Piutang', icon: HandCoins },
                    { id: 'rekap' as TabType, label: 'Rekap Grafik', icon: BarChart3 },
                    { id: 'history' as TabType, label: 'History Catatan', icon: Receipt },
                    { id: 'kalkulator' as TabType, label: 'Kalkulator Keuangan', icon: Calculator },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          closeMobileMenu();
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                          activeTab === item.id
                            ? 'bg-finance-50 text-finance-700 font-bold'
                            : 'hover:bg-cream-50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-finance-600" />
                          <span className="text-xs">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1 pt-3 border-t border-finance-100 dark:border-slate-800">
                  {onOpenProfileSettings && (
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        onOpenProfileSettings();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-finance-600" />
                        <span className="text-xs font-bold">Pengaturan Profil & Budgeting</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onOpenSavingsTargetModal && (
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        onOpenSavingsTargetModal();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-finance-600" />
                        <span className="text-xs font-bold">Kelola Pos Tabungan</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      closeMobileMenu();
                      onOpenCategoryManager();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Tags className="w-4 h-4 text-finance-600" />
                      <span className="text-xs font-bold">Kelola Kategori</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {onOpenFeedbackModal && (
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        onOpenFeedbackModal();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-finance-600" />
                        <span className="text-xs font-bold">Kirim Saran & Masukan</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-finance-100 dark:border-slate-800 space-y-2">
                {user ? (
                  <>
                    {isGuest && (
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-finance-50 text-finance-700 text-xs font-bold border border-finance-200"
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200"
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-finance-600 text-white text-xs font-bold"
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
