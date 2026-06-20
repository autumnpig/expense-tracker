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
  }

  /** Seed default data if database is empty */
  async seedDefaults(): Promise<void> {
    const accountCount = await this.accounts.count();
    if (accountCount === 0) {
      const now = new Date();
      const accounts = DEFAULT_ACCOUNTS.map((a, i) => ({
        ...a,
        id: `default-account-${i}`,
        createdAt: now,
      }));
      await this.accounts.bulkAdd(accounts);
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
      await this.categories.bulkAdd([...expenseCats, ...incomeCats]);
    }
  }
}

export const db = new ExpenseDB();
