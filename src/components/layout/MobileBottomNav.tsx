import React, { useState } from 'react';
import {
  Home,
  BarChart3,
  Receipt,
  Target,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Tags,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type TabType = 'home' | 'rekap' | 'history' | 'tabungan';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenSavingsModal?: () => void;
  onOpenCategoryManager: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenSavingsModal,
  onOpenCategoryManager,
}) => {
  const [showInputMenu, setShowInputMenu] = useState(false);

  const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 },
    { id: 'history', label: 'History', icon: Receipt },
    { id: 'tabungan', label: 'Tabungan', icon: Target },
  ];

  return (
    <>
      {/* Floating Action Menu Overlay (Input options) */}
      <AnimatePresence>
        {showInputMenu && (
          <div className="fixed inset-0 z-50 md:hidden pointer-events-auto flex flex-col justify-end pb-24 px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInputMenu(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Quick Action Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative z-10 mx-auto w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xl space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Menu Input Data
                </span>
                <button
                  onClick={() => setShowInputMenu(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowInputMenu(false);
                  onOpenExpenseModal();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all text-left font-bold text-xs border border-rose-500/20 shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white">Tambah Pengeluaran</p>
                  <p className="text-[10px] text-slate-500 dark:text-rose-300/70 font-normal">Catat belanja, tagihan & biaya</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowInputMenu(false);
                  onOpenIncomeModal();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-left font-bold text-xs border border-emerald-500/20 shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white">Tambah Pemasukan</p>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 font-normal">Catat gaji, bonus & omset</p>
                </div>
              </button>

              {onOpenSavingsModal && (
                <button
                  onClick={() => {
                    setShowInputMenu(false);
                    onOpenSavingsModal();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all text-left font-bold text-xs border border-cyan-500/20 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/30">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">Tabungan (Setor / Tarik)</p>
                    <p className="text-[10px] text-slate-500 dark:text-cyan-300/70 font-normal">Pilih pos tabungan & setor/tarik</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setShowInputMenu(false);
                  onOpenCategoryManager();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all text-left font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-500 text-white flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white">Kelola Kategori</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Tambah/hapus kategori transaksi</p>
                </div>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Nav Container */}
      <div className="fixed bottom-3 left-3 right-3 z-40 md:hidden pointer-events-none">
        <div className="max-w-md mx-auto relative flex items-center justify-between">
          
          {/* Floating Pink FAB Button */}
          <div className="absolute -top-14 right-2 pointer-events-auto">
            <button
              onClick={() => setShowInputMenu(!showInputMenu)}
              title="Input Data Baru"
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white dark:border-slate-900"
            >
              <Plus className={`w-7 h-7 transition-transform duration-200 ${showInputMenu ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {/* Bottom Bar Navigation */}
          <div className="w-full pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/60 flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-pink-600 dark:text-pink-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveTab"
                      className="absolute inset-0 bg-pink-500/10 dark:bg-pink-500/20 rounded-xl border border-pink-500/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] tracking-tight relative z-10 mt-0.5">{item.label}</span>
                </button>
              );
            })}

            {/* Input Menu Tab trigger */}
            <button
              onClick={() => setShowInputMenu(true)}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-all"
            >
              <Plus className="w-5 h-5 relative z-10" />
              <span className="text-[10px] tracking-tight relative z-10 mt-0.5">Input</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
