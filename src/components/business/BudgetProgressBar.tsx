import ProgressBar from '@/components/shared/ProgressBar';
import { AlertTriangle } from 'lucide-react';

interface BudgetProgressBarProps {
  categoryName: string;
  spent: number;
  budgetAmount: number;
}

export default function BudgetProgressBar({ categoryName, spent, budgetAmount }: BudgetProgressBarProps) {
  if (budgetAmount <= 0) return null;

  const isOver = spent > budgetAmount;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{categoryName}</span>
        {isOver && <AlertTriangle size={14} className="text-destructive" />}
      </div>
      <ProgressBar value={spent} max={budgetAmount} showLabel size="sm" />
    </div>
  );
}
