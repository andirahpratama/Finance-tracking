/**
 * Utility formatters for Indonesian currency, numbers, and dates
 */

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactRupiah = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount);
};

export const parseRupiahInput = (value: string): number => {
  // Strip non-digit characters
  const clean = value.replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateFullIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
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
