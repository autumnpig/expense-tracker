import type { Transaction, DailyReport, MonthlyReport, CategorySummary } from '@/types';
import { CHART_COLORS } from '@/lib/constants';
import { calcMonthExpense, calcMonthIncome, calcCategoryExpense, calcRemainingBudget } from './budgetCalculator';
import type { Budget } from '@/types';

/**
 * Generate daily report for a specific date
 */
export function generateDailyReport(
  transactions: Transaction[],
  date: string, // "YYYY-MM-DD"
): DailyReport {
  const dayTx = transactions.filter((t) => t.date === date);
  const expenses = dayTx.filter((t) => t.type === 'expense');
  const incomes = dayTx.filter((t) => t.type === 'income');

  return {
    date,
    expenses,
    totalExpense: expenses.reduce((sum, t) => sum + t.amount, 0),
    totalIncome: incomes.reduce((sum, t) => sum + t.amount, 0),
  };
}

/**
 * Generate monthly report with category summaries
 */
export function generateMonthlyReport(
  transactions: Transaction[],
  categories: { id: string; name: string }[],
  budget: Budget | undefined,
  year: number,
  month: number,
): MonthlyReport {
  const totalExpense = calcMonthExpense(transactions, year, month);
  const totalIncome = calcMonthIncome(transactions, year, month);
  const remaining = calcRemainingBudget(budget, totalExpense);

  // Category summaries for expenses only
  const expenseCategories = categories.filter((c) => {
    // only include categories that have expenses this month
    const exp = calcCategoryExpense(transactions, year, month, c.id);
    return exp > 0;
  });

  const categorySummaries: CategorySummary[] = expenseCategories
    .map((cat, i) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      amount: calcCategoryExpense(transactions, year, month, cat.id),
      percentage: totalExpense > 0
        ? (calcCategoryExpense(transactions, year, month, cat.id) / totalExpense) * 100
        : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    year,
    month,
    totalExpense,
    totalIncome,
    totalBudget: budget?.totalBudget ?? 0,
    remaining,
    categorySummaries,
  };
}

/**
 * Get yesterday's date string
 */
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get today's date string
 */
export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
