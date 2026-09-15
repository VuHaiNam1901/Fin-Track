"use client"

import {
  Briefcase,
  Laptop,
  TrendingUp,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Heart,
  Home,
  Plane,
  Gift,
  Wallet,
  CreditCard,
  DollarSign,
  type LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  zap: Zap,
  film: Film,
  heart: Heart,
  home: Home,
  plane: Plane,
  gift: Gift,
  wallet: Wallet,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
}

export const AVAILABLE_ICONS = Object.keys(iconMap)

interface CategoryIconProps extends LucideProps {
  iconName: string
}

export function CategoryIcon({ iconName, ...props }: CategoryIconProps) {
  const Icon = iconMap[iconName] || DollarSign
  return <Icon {...props} />
}
