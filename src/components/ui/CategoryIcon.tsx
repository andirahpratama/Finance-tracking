import React from 'react';
import {
  Wallet,
  Briefcase,
  TrendingUp,
  LineChart,
  Utensils,
  ShoppingCart,
  Car,
  Baby,
  Coffee,
  GraduationCap,
  HeartPulse,
  Home,
  Tv,
  Smartphone,
  Gift,
  PiggyBank,
  Tag,
  CircleDollarSign,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Wallet':
      return <Wallet {...props} />;
    case 'Briefcase':
      return <Briefcase {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'LineChart':
      return <LineChart {...props} />;
    case 'Utensils':
      return <Utensils {...props} />;
    case 'ShoppingCart':
      return <ShoppingCart {...props} />;
    case 'Car':
      return <Car {...props} />;
    case 'Baby':
      return <Baby {...props} />;
    case 'Coffee':
      return <Coffee {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'Home':
      return <Home {...props} />;
    case 'Tv':
      return <Tv {...props} />;
    case 'Smartphone':
      return <Smartphone {...props} />;
    case 'Gift':
      return <Gift {...props} />;
    case 'PiggyBank':
      return <PiggyBank {...props} />;
    case 'CircleDollarSign':
      return <CircleDollarSign {...props} />;
    default:
      return <Tag {...props} />;
  }
};
