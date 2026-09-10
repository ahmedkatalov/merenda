import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { Availability, Category, Menu } from '@merenda/shared';
import { Input, Select, Tabs } from '@/components/ui';

export interface ProductListFilters {
  q: string;
  menuId: string;
  categoryId: string;
  availability: Availability | '';
}

export function ProductsToolbar({ filters, onChange, menus, categories, counts }: { filters: ProductListFilters; onChange: (next: Partial<ProductListFilters>) => void; menus: Menu[]; categories: Category[]; counts?: Record<Availability | 'all', number> }) {
  const [q, setQ] = useState(filters.q);
  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== filters.q) onChange({ q });
    }, 300);
    return () => clearTimeout(t);
  }, [q, filters.q, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input type="search" prefix={<Search />} placeholder="Поиск по названию…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs md:flex-1" aria-label="Поиск" />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select aria-label="Меню" value={filters.menuId} onChange={(e) => onChange({ menuId: e.target.value, categoryId: '' })} className="md:w-44" placeholder="Все меню" options={menus.map((m) => ({ value: m.id, label: m.name }))} />
          <Select aria-label="Категория" value={filters.categoryId} onChange={(e) => onChange({ categoryId: e.target.value })} className="md:w-52" placeholder="Все категории" options={categories.map((c) => ({ value: c.id, label: c.name }))} disabled={!filters.menuId && categories.length === 0} />
        </div>
      </div>
      <Tabs<Availability | ''>
        variant="pills"
        size="sm"
        value={filters.availability}
        onChange={(v) => onChange({ availability: v })}
        items={[
          { value: '', label: 'Все', badge: counts?.all },
          { value: 'available', label: 'В наличии', badge: counts?.available },
          { value: 'unavailable', label: 'Нет в наличии', badge: counts?.unavailable },
          { value: 'hidden', label: 'Скрыто', badge: counts?.hidden },
        ]}
      />
    </div>
  );
}
