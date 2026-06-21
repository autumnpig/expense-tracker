import Dexie, { type Table } from 'dexie';
import type { Account, Category, Transaction, Budget } from '@/types';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@/lib/constants';

export class ExpenseDB extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('expenseTracker');

    this.version(1).stores({
      accounts: 'id, name, sortOrder',
      categories: 'id, name, type, sortOrder',
      transactions: 'id, type, date, accountId, categoryId, fromAccountId, toAccountId',
      budgets: 'id, year, month, [year+month]',
    });

    // v2: add importedFrom index for re-import detection and dedup
    this.version(2).stores({
      transactions: 'id, type, date, accountId, categoryId, fromAccountId, toAccountId, importedFrom',
    });
  }

  private seeded = false;

  /** Seed default data if database is empty. Idempotent — safe to call multiple times. */
  async seedDefaults(): Promise<void> {
    if (this.seeded) return;

    const accountCount = await this.accounts.count();
    if (accountCount === 0) {
      const now = new Date();
      const accounts = DEFAULT_ACCOUNTS.map((a, i) => ({
        ...a,
        id: `default-account-${i}`,
        createdAt: now,
      }));
      try {
        await this.accounts.bulkAdd(accounts);
      } catch {
        // Race condition: another call already seeded
      }
    }

    const categoryCount = await this.categories.count();
    if (categoryCount === 0) {
      const now = new Date();
      const expenseCats = DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
        ...c,
        id: `default-expense-${i}`,
        createdAt: now,
      }));
      const incomeCats = DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
        ...c,
        id: `default-income-${i}`,
        createdAt: now,
      }));
      try {
        await this.categories.bulkAdd([...expenseCats, ...incomeCats]);
      } catch {
        // Race condition: another call already seeded
      }
    }

    this.seeded = true;
  }
}

export const db = new ExpenseDB();
