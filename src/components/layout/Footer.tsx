import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 mt-16 pt-8 pb-24 md:pb-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-300">Finance Tracking</span>
          <span>•</span>
          <span>Pencatatan Keuangan Realtime</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> untuk manajemen finansial keluarga
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Supabase DB & RLS Protected
          </span>
        </div>
      </div>
    </footer>
  );
};

