import type { Transaction, Budget } from '@/types';

/**
 * Calculate total expenses for a given month (excludes transfers)
 */
export function calcMonthExpense(transactions: Transaction[], year: number, month: number): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(prefix))
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total income for a given month (excludes transfers)
 */
export function calcMonthIncome(transactions: Transaction[], year: number, month: number): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(prefix))
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate expense for a specific category in a given month
 */
export function calcCategoryExpense(
  transactions: Transaction[],
  year: number,
  month: number,
  categoryId: string,
): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(prefix) && t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate remaining budget
 */
export function calcRemainingBudget(budget: Budget | undefined, totalExpense: number): number {
  if (!budget) return 0;
  return budget.totalBudget - totalExpense;
}

/**
 * Calculate account balance based on transactions
 */
export function calcAccountBalance(
  accountId: string,
  transactions: Transaction[],
): number {
  let balance = 0;
  for (const t of transactions) {
    if (t.type === 'expense' && t.accountId === accountId) {
      balance -= t.amount;
    } else if (t.type === 'income' && t.accountId === accountId) {
      balance += t.amount;
    } else if (t.type === 'transfer') {
      if (t.fromAccountId === accountId) balance -= t.amount;
      if (t.toAccountId === accountId) balance += t.amount;
    }
  }
  return balance;
}

/**
 * Get category budget for a specific category from a budget object
 */
export function getCategoryBudget(budget: Budget | undefined, categoryId: string): number {
  if (!budget) return 0;
  return budget.categoryBudgets[categoryId] ?? 0;
}
