import { useMemo } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { getLucideIcon } from '@/lib/utils';

interface CategorySelectorProps {
  type: 'expense' | 'income';
  value: string; // categoryId
  onChange: (categoryId: string) => void;
}

export default function CategorySelector({ type, value, onChange }: CategorySelectorProps) {
  // BUGFIX: Use raw categories (stable ref) + useMemo, NOT getExpense()/getIncome()
  // because they return new arrays every call → Zustand Object.is fails → infinite re-render → white screen
  const allCategories = useCategoryStore((s) => s.categories);
  const categories = useMemo(
    () =>
      allCategories
        .filter((c) => c.type === type)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [allCategories, type],
  );

  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((cat) => {
        const isSelected = value === cat.id;
        const Icon = getLucideIcon(cat.icon);
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
              isSelected
                ? 'bg-primary/10 ring-2 ring-primary text-primary'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            <Icon size={22} strokeWidth={isSelected ? 2.5 : 1.8} />
            <span className="text-xs font-medium">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// Re-export for backward compat
export { getLucideIcon as getCategoryIcon } from '@/lib/utils';
