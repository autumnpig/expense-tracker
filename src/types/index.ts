// ========== Account ==========
export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
}

// ========== Category ==========
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
}

// ========== Transaction ==========
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;

  // common
  amount: number;
  date: string; // "2026-06-20"
  note: string;

  // expense / income
  accountId?: string;
  categoryId?: string;

  // transfer
  fromAccountId?: string;
  toAccountId?: string;
  fee?: number;

  // meta
  importedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========== Budget ==========
export interface Budget {
  id: string;
  year: number;
  month: number;
  totalBudget: number;
  categoryBudgets: Record<string, number>; // categoryId -> amount
}

// ========== Import ==========
export interface ParsedRecord {
  date: string;
  amount: number;
  description: string;
  type: 'expense' | 'income';
  rawRow: Record<string, string>;
}

// ========== Report ==========
export interface DailyReport {
  date: string;
  expenses: Transaction[];
  totalExpense: number;
  totalIncome: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalExpense: number;
  totalIncome: number;
  totalBudget: number;
  remaining: number;
  categorySummaries: CategorySummary[];
}
