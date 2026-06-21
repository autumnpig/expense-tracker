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
import { Plus, Upload, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

/** Calculate lifetime balance for each account from all transactions */
function calcAccountBalances(
  transactions: Array<{ type: string; amount: number; accountId?: string; fromAccountId?: string; toAccountId?: string }>,
  accounts: Array<{ id: string; name: string; color: string }>,
): Array<{ id: string; name: string; color: string; balance: number }> {
  const balanceMap = new Map<string, number>();
  for (const a of accounts) balanceMap.set(a.id, 0);

  for (const t of transactions) {
    if (t.type === 'expense' && t.accountId) {
      balanceMap.set(t.accountId, (balanceMap.get(t.accountId) ?? 0) - t.amount);
    } else if (t.type === 'income' && t.accountId) {
      balanceMap.set(t.accountId, (balanceMap.get(t.accountId) ?? 0) + t.amount);
    } else if (t.type === 'transfer') {
      if (t.fromAccountId) balanceMap.set(t.fromAccountId, (balanceMap.get(t.fromAccountId) ?? 0) - t.amount);
      if (t.toAccountId) balanceMap.set(t.toAccountId, (balanceMap.get(t.toAccountId) ?? 0) + t.amount);
    }
  }

  return accounts
    .map((a) => ({ ...a, balance: balanceMap.get(a.id) ?? 0 }))
    .sort((a, b) => b.balance - a.balance);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTx = useTransactionStore((s) => s.load);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);
  const categories = useCategoryStore((s) => s.categories);
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

  // Daily average this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = Math.min(new Date().getDate(), daysInMonth);
  const dailyAvg = daysElapsed > 0 ? totalExpense / daysElapsed : 0;

  // Account balances (lifetime)
  const accountBalances = useMemo(
    () => calcAccountBalances(transactions, accounts),
    [transactions, accounts],
  );
  const totalAssets = accountBalances.reduce((s, a) => s + a.balance, 0);

  // Category top 3 this month
  const topCategories = useMemo(() => {
    const expenseTxs = transactions.filter((t) => t.date.startsWith(selectedMonth) && t.type === 'expense' && t.categoryId);
    const byCat = new Map<string, number>();
    for (const t of expenseTxs) {
      byCat.set(t.categoryId!, (byCat.get(t.categoryId!) ?? 0) + t.amount);
    }
    return Array.from(byCat.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId, amt]) => ({
        name: categories.find((c) => c.id === catId)?.name ?? '其他',
        amount: amt,
      }));
  }, [transactions, selectedMonth, categories]);

  // Yesterday summary
  const yesterdaySummary = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const yday = `${y}-${m}-${day}`;
    const dayTxs = transactions.filter((t) => t.date === yday);
    if (dayTxs.length === 0) return null;
    return {
      date: yday,
      expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      count: dayTxs.length,
    };
  }, [transactions]);

  // Monthly daily trend (last 7 days within this month)
  const dailyTrend = useMemo(() => {
    const today = new Date();
    const days: Array<{ day: number; expense: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const amt = transactions
        .filter((t) => t.date === ds && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      days.push({ day: d.getDate(), expense: amt });
    }
    return days;
  }, [transactions]);

  const maxTrendExpense = Math.max(...dailyTrend.map((d) => d.expense), 1);

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

        {/* Total assets */}
        {accounts.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">总资产</span>
              <span className="text-lg font-bold">¥{totalAssets.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {accountBalances.map((a) => (
                <div key={a.id} className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                  </div>
                  <p className={`text-sm font-semibold ${a.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    ¥{a.balance.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="本月支出" amount={totalExpense} color="text-destructive" />
          <StatCard label="本月收入" amount={totalIncome} color="text-emerald-600" />
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">日均支出</p>
            <p className="text-base font-bold text-muted-foreground">
              ¥{dailyAvg.toFixed(0)}
            </p>
          </div>
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

        {/* Yesterday summary */}
        {yesterdaySummary && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-2">
              昨日 {yesterdaySummary.date.slice(5)} 摘要
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span>📝 {yesterdaySummary.count} 笔</span>
              <span className="text-destructive">
                <TrendingDown size={14} className="inline mr-0.5" />
                ¥{yesterdaySummary.expense.toFixed(2)}
              </span>
              {yesterdaySummary.income > 0 && (
                <span className="text-emerald-600">
                  <TrendingUp size={14} className="inline mr-0.5" />
                  ¥{yesterdaySummary.income.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Category top 3 */}
        {topCategories.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">支出排行</h3>
            <div className="space-y-2">
              {topCategories.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="text-xs font-bold text-muted-foreground/50 mr-2">#{i + 1}</span>
                    {cat.name}
                  </span>
                  <span className="font-mono font-medium">¥{cat.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily trend sparkline */}
        {totalExpense > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-2">近7天支出趋势</h3>
            <div className="flex items-end gap-1 h-20">
              {dailyTrend.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {d.expense > 0 ? `¥${d.expense.toFixed(0)}` : ''}
                  </span>
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${(d.expense / maxTrendExpense) * 100}%`,
                      minHeight: d.expense > 0 ? '4px' : '1px',
                      backgroundColor: d.expense > 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      opacity: d.expense > 0 ? 1 : 0.3,
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
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
              description="点击「记一笔」或「导入账单」开始记账"
              action={
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/add')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                  >
                    <Plus size={16} />
                    记一笔
                  </button>
                  <button
                    onClick={() => navigate('/import')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    <Upload size={16} />
                    导入账单
                  </button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
