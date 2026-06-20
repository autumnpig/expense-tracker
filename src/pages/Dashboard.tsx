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
import TransactionListItem from '@/components/business/TransactionListItem';
import EmptyState from '@/components/shared/EmptyState';
import {
  calcMonthExpense,
  calcMonthIncome,
  calcRemainingBudget,
} from '@/services/budgetCalculator';
import { Plus, Upload, Wallet } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTx = useTransactionStore((s) => s.load);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);
  const loadCategories = useCategoryStore((s) => s.load);
  const budgets = useBudgetStore((s) => s.budgets);
  const loadBudgets = useBudgetStore((s) => s.load);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);

  // Load all data
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

  // Recent transactions for this month (last 5)
  const recentTx = useMemo(() => {
    const prefix = selectedMonth;
    return transactions
      .filter((t) => t.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  }, [transactions, selectedMonth]);

  return (
    <div>
      <PageHeader title="记账本" />

      <div className="p-4 space-y-4">
        {/* Month picker */}
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="本月支出"
            amount={totalExpense}
            color="text-destructive"
          />
          <StatCard
            label="本月收入"
            amount={totalIncome}
            color="text-emerald-600"
          />
        </div>

        {/* Budget progress */}
        {budget && budget.totalBudget > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">月度预算</span>
              <span className={`text-sm font-semibold ${remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                {remaining >= 0
                  ? `剩余 ¥${remaining.toFixed(0)}`
                  : `超支 ¥${Math.abs(remaining).toFixed(0)}`}
              </span>
            </div>
            <ProgressBar value={totalExpense} max={budget.totalBudget} />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/add')}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
          >
            <Plus size={20} className="text-primary" />
            <span className="text-xs font-medium text-primary">记一笔</span>
          </button>
          <button
            onClick={() => navigate('/import')}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Upload size={20} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-600">导入账单</span>
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
          >
            <Wallet size={20} className="text-foreground" />
            <span className="text-xs font-medium">全部记录</span>
          </button>
        </div>

        {/* Account balances */}
        {accounts.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">账户</h3>
            <div className="flex gap-3 overflow-x-auto">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: a.color }}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">{a.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">最近记录</h3>
            {recentTx.length > 0 && (
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs text-primary font-medium"
              >
                查看全部
              </button>
            )}
          </div>
          {recentTx.length > 0 ? (
            <div className="divide-y divide-border bg-card rounded-xl border border-border overflow-hidden">
              {recentTx.map((t) => (
                <TransactionListItem key={t.id} transaction={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="本月还没有记录"
              description="点击「记一笔」开始记录你的第一笔消费"
              action={
                <button
                  onClick={() => navigate('/add')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  <Plus size={16} />
                  记一笔
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
