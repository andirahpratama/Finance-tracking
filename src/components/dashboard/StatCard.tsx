import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatRupiah } from '../../lib/formatters';

interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant: 'emerald' | 'rose' | 'blue' | 'purple';
  subtitle?: string;
  badge?: string;
  isNegative?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  icon: Icon,
  variant,
  subtitle,
  badge,
  isNegative,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          accent: 'text-emerald-400',
          glow: 'hover:border-emerald-500/40 hover:shadow-emerald-950/40',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          accent: 'text-rose-400',
          glow: 'hover:border-rose-500/40 hover:shadow-rose-950/40',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          accent: 'text-purple-400',
          glow: 'hover:border-purple-500/40 hover:shadow-purple-950/40',
        };
      case 'blue':
      default:
        return {
          iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
          accent: 'text-blue-400',
          glow: 'hover:border-blue-500/40 hover:shadow-blue-950/40',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${styles.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className={`text-2xl font-extrabold tracking-tight ${styles.accent}`}>
          {isNegative && '-'}
          {formatRupiah(Math.abs(amount))}
        </h3>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>{subtitle || 'Real-time sync'}</span>
          {badge && (
            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
