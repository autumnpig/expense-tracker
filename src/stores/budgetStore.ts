import { create } from 'zustand';
import { db } from '@/db/database';
import type { Budget } from '@/types';
import { DEFAULT_MONTHLY_BUDGET } from '@/lib/constants';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;

  load: () => Promise<void>;
  getByMonth: (year: number, month: number) => Budget | undefined;
  getOrCreate: (year: number, month: number) => Promise<Budget>;
  setTotalBudget: (year: number, month: number, amount: number) => Promise<void>;
  setCategoryBudget: (year: number, month: number, categoryId: string, amount: number) => Promise<void>;
  removeCategoryBudget: (year: number, month: number, categoryId: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const budgets = await db.budgets.toArray();
    set({ budgets, loading: false });
  },

  getByMonth: (year, month) => {
    return get().budgets.find((b) => b.year === year && b.month === month);
  },

  getOrCreate: async (year, month) => {
    const existing = get().getByMonth(year, month);
    if (existing) return existing;

    const budget: Budget = {
      id: crypto.randomUUID(),
      year,
      month,
      totalBudget: DEFAULT_MONTHLY_BUDGET,
      categoryBudgets: {},
    };
    await db.budgets.add(budget);
    set((s) => ({ budgets: [...s.budgets, budget] }));
    return budget;
  },

  setTotalBudget: async (year, month, amount) => {
    const budget = await get().getOrCreate(year, month);
    await db.budgets.update(budget.id, { totalBudget: amount });
    set((s) => ({
      budgets: s.budgets.map((b) =>
        b.id === budget.id ? { ...b, totalBudget: amount } : b,
      ),
    }));
  },

  setCategoryBudget: async (year, month, categoryId, amount) => {
    const budget = await get().getOrCreate(year, month);
    const updated = { ...budget.categoryBudgets, [categoryId]: amount };
    await db.budgets.update(budget.id, { categoryBudgets: updated });
    set((s) => ({
      budgets: s.budgets.map((b) =>
        b.id === budget.id ? { ...b, categoryBudgets: updated } : b,
      ),
    }));
  },

  removeCategoryBudget: async (year, month, categoryId) => {
    const budget = await get().getOrCreate(year, month);
    const updated = { ...budget.categoryBudgets };
    delete updated[categoryId];
    await db.budgets.update(budget.id, { categoryBudgets: updated });
    set((s) => ({
      budgets: s.budgets.map((b) =>
        b.id === budget.id ? { ...b, categoryBudgets: updated } : b,
      ),
    }));
  },
}));
