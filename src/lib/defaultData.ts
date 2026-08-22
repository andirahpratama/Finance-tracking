import { Category, Transaction } from '../types';

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Gaji Suami',
    type: 'income',
    icon: 'Wallet',
    color: '#10B981', // Emerald
    is_default: true,
  },
  {
    name: 'Gaji Istri',
    type: 'income',
    icon: 'Briefcase',
    color: '#06B6D4', // Cyan
    is_default: true,
  },
  {
    name: 'Bisnis',
    type: 'income',
    icon: 'TrendingUp',
    color: '#8B5CF6', // Purple
    is_default: true,
  },
  {
    name: 'Investasi',
    type: 'income',
    icon: 'LineChart',
    color: '#F59E0B', // Amber
    is_default: true,
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Belanja Makanan',
    type: 'expense',
    icon: 'Utensils',
    color: '#EF4444', // Red
    is_default: true,
  },
  {
    name: 'Belanja Kebutuhan Harian',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#F97316', // Orange
    is_default: true,
  },
  {
    name: 'Transportasi',
    type: 'expense',
    icon: 'Car',
    color: '#3B82F6', // Blue
    is_default: true,
  },
  {
    name: 'Jajan Anak',
    type: 'expense',
    icon: 'Baby',
    color: '#EC4899', // Pink
    is_default: true,
  },
  {
    name: 'Jajan Orang Tua',
    type: 'expense',
    icon: 'Coffee',
    color: '#A855F7', // Violet
    is_default: true,
  },
  {
    name: 'Sekolah Anak',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#14B8A6', // Teal
    is_default: true,
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-inc-1', name: 'Gaji Suami', type: 'income', icon: 'Wallet', color: '#10B981', is_default: true },
  { id: 'cat-inc-2', name: 'Gaji Istri', type: 'income', icon: 'Briefcase', color: '#06B6D4', is_default: true },
  { id: 'cat-inc-3', name: 'Bisnis', type: 'income', icon: 'TrendingUp', color: '#8B5CF6', is_default: true },
  { id: 'cat-inc-4', name: 'Investasi', type: 'income', icon: 'LineChart', color: '#F59E0B', is_default: true },
  { id: 'cat-exp-1', name: 'Belanja Makanan', type: 'expense', icon: 'Utensils', color: '#EF4444', is_default: true },
  { id: 'cat-exp-2', name: 'Belanja Kebutuhan Harian', type: 'expense', icon: 'ShoppingCart', color: '#F97316', is_default: true },
  { id: 'cat-exp-3', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#3B82F6', is_default: true },
  { id: 'cat-exp-4', name: 'Jajan Anak', type: 'expense', icon: 'Baby', color: '#EC4899', is_default: true },
  { id: 'cat-exp-5', name: 'Jajan Orang Tua', type: 'expense', icon: 'Coffee', color: '#A855F7', is_default: true },
  { id: 'cat-exp-6', name: 'Sekolah Anak', type: 'expense', icon: 'GraduationCap', color: '#14B8A6', is_default: true },
];

export const AVAILABLE_ICONS = [
  { name: 'Wallet', label: 'Dompet' },
  { name: 'Briefcase', label: 'Tas Kerja' },
  { name: 'TrendingUp', label: 'Bisnis/Grafik' },
  { name: 'LineChart', label: 'Investasi' },
  { name: 'Utensils', label: 'Makanan' },
  { name: 'ShoppingCart', label: 'Belanja' },
  { name: 'Car', label: 'Transportasi' },
  { name: 'Baby', label: 'Anak' },
  { name: 'Coffee', label: 'Kopi / Santai' },
  { name: 'GraduationCap', label: 'Pendidikan' },
  { name: 'HeartPulse', label: 'Kesehatan' },
  { name: 'Home', label: 'Rumah & Properti' },
  { name: 'Tv', label: 'Hiburan' },
  { name: 'Smartphone', label: 'Pulsa / Internet' },
  { name: 'Gift', label: 'Hadiah / Sedekah' },
  { name: 'PiggyBank', label: 'Tabungan' },
];

export const AVAILABLE_COLORS = [
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#A855F7', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#64748B', // Slate
];

// Helper to generate dynamic demo transactions relative to current date
export const getInitialDemoTransactions = (): Transaction[] => {
  const today = new Date();
  const formatIsoDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'tx-1',
      category_id: 'cat-inc-1',
      category_name: 'Gaji Suami',
      category_icon: 'Wallet',
      category_color: '#10B981',
      type: 'income',
      amount: 4500000,
      date: formatIsoDate(5),
      notes: 'Gaji pokok bulanan',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      category_id: 'cat-inc-2',
      category_name: 'Gaji Istri',
      category_icon: 'Briefcase',
      category_color: '#06B6D4',
      type: 'income',
      amount: 3500000,
      date: formatIsoDate(5),
      notes: 'Gaji pokok bulanan',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      category_id: 'cat-inc-3',
      category_name: 'Bisnis',
      category_icon: 'TrendingUp',
      category_color: '#8B5CF6',
      type: 'income',
      amount: 1250000,
      date: formatIsoDate(3),
      notes: 'Profit penjualan online store',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      category_id: 'cat-exp-6',
      category_name: 'Sekolah Anak',
      category_icon: 'GraduationCap',
      category_color: '#14B8A6',
      type: 'expense',
      amount: 1200000,
      date: formatIsoDate(4),
      notes: 'SPP dan buku les matematika',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      category_id: 'cat-exp-2',
      category_name: 'Belanja Kebutuhan Harian',
      category_icon: 'ShoppingCart',
      category_color: '#F97316',
      type: 'expense',
      amount: 850000,
      date: formatIsoDate(3),
      notes: 'Belanja bulanan supermarket',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      category_id: 'cat-exp-1',
      category_name: 'Belanja Makanan',
      category_icon: 'Utensils',
      category_color: '#EF4444',
      type: 'expense',
      amount: 450000,
      date: formatIsoDate(2),
      notes: 'Bahan masakan mingguan & sayur segar',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      category_id: 'cat-exp-3',
      category_name: 'Transportasi',
      category_icon: 'Car',
      category_color: '#3B82F6',
      type: 'expense',
      amount: 300000,
      date: formatIsoDate(1),
      notes: 'Bensin & saldo e-toll',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-8',
      category_id: 'cat-exp-4',
      category_name: 'Jajan Anak',
      category_icon: 'Baby',
      category_color: '#EC4899',
      type: 'expense',
      amount: 150000,
      date: formatIsoDate(0),
      notes: 'Es krim & mainan edukasi',
      created_at: new Date().toISOString(),
    },
  ];
};
