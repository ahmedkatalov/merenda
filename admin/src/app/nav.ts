import { ChefHat, Clock, FolderTree, Image, LayoutDashboard, LayoutTemplate, MessageCircle, Palette, Settings, Shield, ShoppingBag, Utensils, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Show new-orders count badge. */
  ordersBadge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard },
  { to: '/menus', label: 'Меню', icon: Utensils },
  { to: '/categories', label: 'Категории', icon: FolderTree },
  { to: '/products', label: 'Блюда', icon: ChefHat },
  { to: '/orders', label: 'Заказы', icon: ShoppingBag, ordersBadge: true },
  { to: '/hours', label: 'Режим работы', icon: Clock },
  { to: '/appearance', label: 'Внешний вид', icon: Palette },
  { to: '/builder', label: 'Конструктор сайта', icon: LayoutTemplate },
  { to: '/media', label: 'Медиа', icon: Image },
  { to: '/whatsapp', label: 'WhatsApp / Заказы', icon: MessageCircle },
  { to: '/settings', label: 'Настройки', icon: Settings },
  { to: '/security', label: 'Безопасность', icon: Shield },
];

export const PAGE_TITLES: { pattern: RegExp; title: string }[] = [
  { pattern: /^\/products\/new$/, title: 'Новое блюдо' },
  { pattern: /^\/products\/[^/]+$/, title: 'Блюдо' },
  { pattern: /^\/orders\/[^/]+$/, title: 'Заказ' },
];

export function pageTitle(pathname: string): string {
  const special = PAGE_TITLES.find((p) => p.pattern.test(pathname));
  if (special) return special.title;
  const item = NAV_ITEMS.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));
  return item?.label ?? 'Merenda Admin';
}
