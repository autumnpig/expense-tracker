import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUIStore } from '@/stores/uiStore';
import PageHeader from '@/components/shared/PageHeader';
import MonthPicker from '@/components/shared/MonthPicker';
import StatCard from '@/components/shared/StatCard';
import ProgressBar from '@/components/shared/ProgressBar';
import DailyGroupedList from '@/components/business/DailyGroupedList';
import {
  calcMonthExpense,
  calcMonthIncome,
  calcRemainingBudget,
} from '@/services/budgetCalculator';
import { Plus, Upload, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTx = useTransactionStore((s) => s.load);
  const loadAccounts = useAccountStore((s) => s.load);
  const loadCategories = useCategoryStore((s) => s.load);
  const budgets = useBudgetStore((s) => s.budgets);
  const loadBudgets = useBudgetStore((s) => s.load);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);

  useEffect(() => {
    loadTx();
    loadAccounts();
    loadCategories();
    loadBudgets();
  }, [loadTx, loadAccounts, loadCategories, loadBudgets]);

  const [year, month] = selectedMonth.split('-').map(Number);
  const budget = budgets.find((b) => b.year === year && b.month === month);

  const totalExpense = useMemo(
    () => calcMonthExpense(transactions, year, month),
    [transactions, year, month],
  );
  const totalIncome = useMemo(
    () => calcMonthIncome(transactions, year, month),
    [transactions, year, month],
  );
  const remaining = calcRemainingBudget(budget, totalExpense);

  return (
    <div className="flex flex-col h-dvh">
      <PageHeader title="记账本" />

      <div className="px-4 space-y-3 flex-shrink-0">
        {/* Month picker */}
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

        {/* Expense / Income cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="本月支出" amount={totalExpense} color="text-destructive" />
          <StatCard label="本月收入" amount={totalIncome} color="text-emerald-600" />
        </div>

        {/* Budget progress */}
        {budget && budget.totalBudget > 0 && (
          <div className="bg-card rounded-xl p-3 border border-border">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">月度预算</span>
              <span className={`text-xs font-semibold ${remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                {remaining >= 0
                  ? `剩余 ¥${remaining.toFixed(0)}`
                  : `超支 ¥${Math.abs(remaining).toFixed(0)}`}
              </span>
            </div>
            <ProgressBar value={totalExpense} max={budget.totalBudget} />
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 flex-shrink-0">
        <button
          onClick={() => navigate('/add')}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Plus size={16} className="text-primary" />
          <span className="text-xs font-medium text-primary">记一笔</span>
        </button>
        <button
          onClick={() => navigate('/import')}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Upload size={16} className="text-blue-600" />
          <span className="text-xs font-medium text-blue-600">导入账单</span>
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        >
          <BarChart3 size={16} className="text-foreground" />
          <span className="text-xs font-medium">报表</span>
        </button>
      </div>

      {/* Daily grouped list — fills remaining space, scrollable */}
      <div className="flex-1 overflow-y-auto border-t border-border">
        <DailyGroupedList transactions={transactions} selectedMonth={selectedMonth} />
      </div>
    </div>
  );
}
