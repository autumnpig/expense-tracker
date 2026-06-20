import { create } from 'zustand';
import { db } from '@/db/database';
import type { Transaction, TransactionType } from '@/types';

interface TransactionFilters {
  month?: string; // "2026-06"
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
}

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  filters: TransactionFilters;

  load: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  getFiltered: () => Transaction[];
  getByMonth: (year: number, month: number) => Transaction[];
  getByDate: (date: string) => Transaction[];
  add: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  addMany: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<Transaction[]>;
  update: (id: string, data: Partial<Transaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeMany: (ids: string[]) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  filters: {},

  load: async () => {
    set({ loading: true });
    const transactions = await db.transactions.orderBy('date').reverse().toArray();
    set({ transactions, loading: false });
  },

  setFilters: (filters) => set({ filters }),

  getFiltered: () => {
    const { transactions, filters } = get();
    let result = [...transactions];

    if (filters.month) {
      result = result.filter((t) => t.date.startsWith(filters.month!));
    }
    if (filters.categoryId) {
      result = result.filter((t) => t.categoryId === filters.categoryId);
    }
    if (filters.accountId) {
      result = result.filter(
        (t) => t.accountId === filters.accountId || t.fromAccountId === filters.accountId || t.toAccountId === filters.accountId,
      );
    }
    if (filters.type) {
      result = result.filter((t) => t.type === filters.type);
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  },

  getByMonth: (year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return get().transactions.filter((t) => t.date.startsWith(prefix));
  },

  getByDate: (date) => {
    return get().transactions.filter((t) => t.date === date);
  },

  add: async (data) => {
    const now = new Date();
    const transaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.transactions.add(transaction);
    set((s) => ({ transactions: [transaction, ...s.transactions] }));
    return transaction;
  },

  addMany: async (dataList) => {
    const now = new Date();
    const transactions: Transaction[] = dataList.map((data) => ({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));
    await db.transactions.bulkAdd(transactions);
    set((s) => ({ transactions: [...transactions, ...s.transactions] }));
    return transactions;
  },

  update: async (id, data) => {
    await db.transactions.update(id, { ...data, updatedAt: new Date() });
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date() } : t,
      ),
    }));
  },

  remove: async (id) => {
    await db.transactions.delete(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  removeMany: async (ids) => {
    await db.transactions.bulkDelete(ids);
    const idSet = new Set(ids);
    set((s) => ({ transactions: s.transactions.filter((t) => !idSet.has(t.id)) }));
  },
}));
