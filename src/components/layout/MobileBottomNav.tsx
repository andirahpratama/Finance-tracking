import React, { useState } from 'react';
import {
  Home,
  BarChart3,
  Receipt,
  Target,
  Calculator,
  Plus,
  Tags,
  X,
  TrendingUp,
  PieChart,
  MoreHorizontal,
  HandCoins,
  Settings,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type TabType =
  | 'home'
  | 'budgeting'
  | 'tabungan'
  | 'investasi'
  | 'utang'
  | 'rekap'
  | 'history'
  | 'kalkulator';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenSavingsModal?: () => void;
  onOpenCategoryManager: () => void;
  onOpenProfileSettings?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenExpenseModal,
  onOpenCategoryManager,
  onOpenProfileSettings,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreMenuTabs: { id: TabType; label: string; desc: string; icon: React.ElementType; color: string }[] = [
    { id: 'rekap', label: 'Rekap Grafik', desc: 'Analisis arus kas & kategori', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
    { id: 'history', label: 'History Catatan', desc: 'Riwayat & ekspor transaksi', icon: Receipt, color: 'text-cyan-600 bg-cyan-50' },
    { id: 'investasi', label: 'Investasi', desc: 'Emas, Saham & Kripto, Properti, Kelas', icon: TrendingUp, color: 'text-gold-600 bg-gold-50' },
    { id: 'utang', label: 'Utang Piutang', desc: 'Buku catatan utang & piutang', icon: HandCoins, color: 'text-rose-600 bg-rose-50' },
    { id: 'kalkulator', label: 'Kalkulator', desc: 'Dana Darurat, KPR, Pendidikan', icon: Calculator, color: 'text-finance-600 bg-finance-50' },
  ];

  const isLainnyaActive = ['rekap', 'history', 'investasi', 'utang', 'kalkulator'].includes(activeTab);

  return (
    <>
      {/* "Lainnya" Drawer Sheet (Mobile) */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="fixed inset-0 z-50 lg:hidden pointer-events-auto flex flex-col justify-end pb-24 px-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="relative z-10 mx-auto w-full max-w-md bg-white dark:bg-slate-900 border border-finance-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xl space-y-2.5 max-h-[75vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-finance-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Menu Lainnya
                </span>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {moreMenuTabs.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowMoreMenu(false);
                        onSelectTab(item.id);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        active
                          ? 'bg-finance-50 dark:bg-finance-950/30 border-finance-400'
                          : 'bg-cream-50 dark:bg-slate-950/50 border-finance-100 dark:border-slate-800 hover:border-finance-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-finance-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenCategoryManager();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-cream-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <Tags className="w-3.5 h-3.5 text-finance-600" />
                  Kategori
                </button>
                {onOpenProfileSettings && (
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenProfileSettings();
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-finance-50 dark:bg-slate-800 text-xs font-bold text-finance-700 dark:text-finance-300"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Profil & Budget
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Thumb-friendly Floating Catat Cepat Button + 5-item Bottom Nav */}
      <div className="fixed bottom-2.5 left-2.5 right-2.5 z-40 lg:hidden pointer-events-none">
        <div className="max-w-md mx-auto relative">
          {/* Floating Quick Record FAB */}
          <div className="absolute -top-14 right-1.5 pointer-events-auto">
            <button
              onClick={onOpenExpenseModal}
              title="Catat Cepat"
              className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-finance-600 hover:bg-finance-700 text-white font-extrabold text-xs shadow-lg shadow-finance-700/30 active:scale-95 transition-all border-2 border-white dark:border-slate-900"
            >
              <Zap className="w-4 h-4 text-gold-300" />
              <span>Catat Cepat</span>
            </button>
          </div>

          {/* 5-Tab Bottom Bar: Home, Catat, Budgeting, Tabungan, Lainnya */}
          <div className="w-full pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-finance-200 dark:border-slate-800 rounded-2xl p-1 shadow-xl flex items-center justify-between">
            <button
              onClick={() => onSelectTab('home')}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl min-h-[52px] transition-all ${
                activeTab === 'home'
                  ? 'text-finance-700 dark:text-finance-300 font-extrabold bg-finance-50 dark:bg-finance-950/40'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Home</span>
            </button>

            <button
              onClick={onOpenExpenseModal}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl min-h-[52px] text-finance-700 dark:text-finance-300 font-bold hover:bg-finance-50 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Catat</span>
            </button>

            <button
              onClick={() => onSelectTab('budgeting')}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl min-h-[52px] transition-all ${
                activeTab === 'budgeting'
                  ? 'text-finance-700 dark:text-finance-300 font-extrabold bg-finance-50 dark:bg-finance-950/40'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <PieChart className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Budgeting</span>
            </button>

            <button
              onClick={() => onSelectTab('tabungan')}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl min-h-[52px] transition-all ${
                activeTab === 'tabungan'
                  ? 'text-finance-700 dark:text-finance-300 font-extrabold bg-finance-50 dark:bg-finance-950/40'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Tabungan</span>
            </button>

            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl min-h-[52px] transition-all ${
                isLainnyaActive || showMoreMenu
                  ? 'text-finance-700 dark:text-finance-300 font-extrabold bg-finance-50 dark:bg-finance-950/40'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Lainnya</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
