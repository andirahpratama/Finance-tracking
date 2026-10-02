import { CurrencyCode } from '../types';

/**
 * Utility formatters for multi-currency, numbers, and dates
 */

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'IDR', symbol: 'IDR', name: 'Rupiah' },
  { code: 'USD', symbol: 'USD', name: 'US Dollar' },
  { code: 'JPY', symbol: 'JPY', name: 'Yen' },
  { code: 'CNY', symbol: 'CNY', name: 'Yuan' },
  { code: 'SAR', symbol: 'SAR', name: 'Real Arab Saudi' },
  { code: 'AUD', symbol: 'AUD', name: 'Australia Dollar' },
  { code: 'MYR', symbol: 'MYR', name: 'Ringgit' },
  { code: 'SGD', symbol: 'SGD', name: 'Singapore Dollar' },
  { code: 'EUR', symbol: 'EUR', name: 'Euro' },
];

export const getAppCurrency = (): CurrencyCode => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('ft_app_currency') : null;
  if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
    return saved as CurrencyCode;
  }
  return 'IDR';
};

export const setAppCurrency = (code: CurrencyCode): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ft_app_currency', code);
    window.dispatchEvent(new CustomEvent('app-currency-changed', { detail: code }));
  }
};

export const formatCurrency = (amount: number, overrideCode?: CurrencyCode | any): string => {
  const code = (typeof overrideCode === 'string' ? overrideCode : null) || getAppCurrency();
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const numStr = abs.toLocaleString('id-ID');
  return `${sign}${code} ${numStr}`;
};

// Alias formatRupiah to formatCurrency for backward compatibility
export const formatRupiah = (amount: number, overrideCode?: CurrencyCode | any): string => {
  return formatCurrency(amount, overrideCode);
};

export const formatCompactCurrency = (amount: number, overrideCode?: CurrencyCode | any): string => {
  const code = (typeof overrideCode === 'string' ? overrideCode : null) || getAppCurrency();
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${code} ${(abs / 1_000_000_000).toFixed(1)} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${code} ${(abs / 1_000_000).toFixed(1)} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${code} ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return formatCurrency(amount, code);
};

// Alias formatCompactRupiah to formatCompactCurrency
export const formatCompactRupiah = (amount: number, overrideCode?: CurrencyCode | any): string => {
  return formatCompactCurrency(amount, overrideCode);
};

export const parseRupiahInput = (value: string): number => {
  // Strip non-digit characters
  const clean = value.replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  const [yStr, mStr, dStr] = dateStr.split('T')[0].split('-');
  const date = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateFullIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  const [yStr, mStr, dStr] = dateStr.split('T')[0].split('-');
  const date = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const getTodayDateInput = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatNotesForDisplay = (rawNotes?: string): string => {
  if (!rawNotes) return '';

  // Strip internal metadata tag (sav_target:...)
  let clean = rawNotes.replace(/\(sav_target:[^)]+\)/gi, '').trim();

  // Match pattern: [Setor Ke/Tarik Dari Tabungan: TargetName] UserNote
  const bracketMatch = clean.match(/^\[(Setor Ke|Tarik Dari)(?: Tabungan)?:?\s*([^\]]+)\]\s*(.*)$/i);

  if (bracketMatch) {
    const action = bracketMatch[1].toLowerCase().includes('setor') ? 'Setor ke' : 'Tarik dari';
    const targetName = bracketMatch[2].trim();
    const extraNotes = bracketMatch[3].replace(/^[•\s\-\:]+/, '').trim();

    return extraNotes ? `${action} ${targetName} • ${extraNotes}` : `${action} ${targetName}`;
  }

  clean = clean.replace(/\[\s*\]/g, '').replace(/\s+/g, ' ').trim();
  return clean;
};
