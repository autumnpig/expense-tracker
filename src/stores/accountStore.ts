import { create } from 'zustand';
import { db } from '@/db/database';
import type { Account } from '@/types';

interface AccountState {
  accounts: Account[];
  loading: boolean;

  load: () => Promise<void>;
  add: (data: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>;
  update: (id: string, data: Partial<Account>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Account | undefined;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    await db.seedDefaults();
    const accounts = await db.accounts.orderBy('sortOrder').toArray();
    set({ accounts, loading: false });
  },

  add: async (data) => {
    const account: Account = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    await db.accounts.add(account);
    set((s) => ({ accounts: [...s.accounts, account].sort((a, b) => a.sortOrder - b.sortOrder) }));
    return account;
  },

  update: async (id, data) => {
    await db.accounts.update(id, data);
    const accounts = await db.accounts.orderBy('sortOrder').toArray();
    set({ accounts });
  },

  remove: async (id) => {
    await db.accounts.delete(id);
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
  },

  getById: (id) => get().accounts.find((a) => a.id === id),
}));
