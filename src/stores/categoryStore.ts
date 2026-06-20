import { create } from 'zustand';
import { db } from '@/db/database';
import type { Category } from '@/types';

interface CategoryState {
  categories: Category[];
  loading: boolean;

  load: () => Promise<void>;
  getExpense: () => Category[];
  getIncome: () => Category[];
  getById: (id: string) => Category | undefined;
  add: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  update: (id: string, data: Partial<Category>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    await db.seedDefaults();
    const categories = await db.categories.orderBy('sortOrder').toArray();
    set({ categories, loading: false });
  },

  getExpense: () =>
    get()
      .categories.filter((c) => c.type === 'expense')
      .sort((a, b) => a.sortOrder - b.sortOrder),

  getIncome: () =>
    get()
      .categories.filter((c) => c.type === 'income')
      .sort((a, b) => a.sortOrder - b.sortOrder),

  getById: (id) => get().categories.find((c) => c.id === id),

  add: async (data) => {
    const category: Category = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    await db.categories.add(category);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  update: async (id, data) => {
    await db.categories.update(id, data);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  remove: async (id) => {
    await db.categories.delete(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
