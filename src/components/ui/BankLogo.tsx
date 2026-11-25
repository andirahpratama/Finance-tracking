import React from 'react';
import { INDONESIAN_BANKS } from '../../lib/defaultData';

interface BankLogoProps {
  bankName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const BankLogo: React.FC<BankLogoProps> = ({
  bankName,
  size = 'md',
  showLabel = false,
}) => {
  if (!bankName) return null;

  const bank = INDONESIAN_BANKS.find(
    (b) => b.id.toLowerCase() === bankName.toLowerCase() || b.name.toLowerCase() === bankName.toLowerCase()
  );

  const color = bank?.color || '#4a8c67';
  const short = bank?.short || bankName.slice(0, 4).toUpperCase();
  const isLightBg = bank?.id === 'Maybank' || bank?.id === 'Bank Jago';
  const textColor = isLightBg ? '#1e293b' : '#ffffff';

  const dimClass =
    size === 'sm'
      ? 'h-6 min-w-[34px] px-1.5 text-[9px] rounded-md'
      : size === 'lg'
      ? 'h-9 min-w-[52px] px-2.5 text-xs rounded-xl'
      : 'h-7 min-w-[42px] px-2 text-[10px] rounded-lg';

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <span
        className={`inline-flex items-center justify-center font-black tracking-tight shadow-xs border border-black/10 ${dimClass}`}
        style={{ backgroundColor: color, color: textColor }}
        title={bank?.name || bankName}
      >
        {short}
      </span>
      {showLabel && (
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
          {bank?.id || bankName}
        </span>
      )}
    </div>
  );
};
