import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { calcCategoryExpense } from '@/services/budgetCalculator';
import { getCategoryBudget } from '@/services/budgetCalculator';
import ProgressBar from '@/components/shared/ProgressBar';
import { AlertTriangle } from 'lucide-react';

interface BudgetProgressBarProps {
  year: number;
  month: number;
  categoryId: string;
}

export default function BudgetProgressBar({ year, month, categoryId }: BudgetProgressBarProps) {
  const transactions = useTransactionStore((s) => s.transactions);
  const category = useCategoryStore((s) => s.getById(categoryId));
  const budget = useBudgetStore((s) => s.getByMonth(year, month));

  const spent = useMemo(
    () => calcCategoryExpense(transactions, year, month, categoryId),
    [transactions, year, month, categoryId],
  );
  const budgetAmount = getCategoryBudget(budget, categoryId);

  if (!category || budgetAmount <= 0) return null;

  const isOver = spent > budgetAmount;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{category.name}</span>
        {isOver && <AlertTriangle size={14} className="text-destructive" />}
      </div>
      <ProgressBar value={spent} max={budgetAmount} showLabel size="sm" />
    </div>
  );
}
