import { useEffect, useMemo } from 'react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUIStore } from '@/stores/uiStore';
import PageHeader from '@/components/shared/PageHeader';
import MonthPicker from '@/components/shared/MonthPicker';
import BudgetProgressBar from '@/components/business/BudgetProgressBar';
import PieChart from '@/components/shared/PieChart';
import ProgressBar from '@/components/shared/ProgressBar';
import { generateMonthlyReport } from '@/services/reportGenerator';
import { calcCategoryExpense, getCategoryBudget } from '@/services/budgetCalculator';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTx = useTransactionStore((s) => s.load);
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.load);
  const budgets = useBudgetStore((s) => s.budgets);
  const loadBudgets = useBudgetStore((s) => s.load);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);

  useEffect(() => {
    loadTx();
    loadCategories();
    loadBudgets();
  }, [loadTx, loadCategories, loadBudgets]);

  const [year, month] = selectedMonth.split('-').map(Number);
  const budget = budgets.find((b) => b.year === year && b.month === month);

  const report = useMemo(
    () =>
      generateMonthlyReport(
        transactions,
        categories.map((c) => ({ id: c.id, name: c.name })),
        budget,
        year,
        month,
      ),
    [transactions, categories, budget, year, month],
  );

  const budgetedCategories = useMemo(() => {
    return categories
      .filter((c) => {
        if (c.type !== 'expense') return false;
        const catBudget = budget?.categoryBudgets?.[c.id];
        return catBudget && catBudget > 0;
      })
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        spent: calcCategoryExpense(transactions, year, month, cat.id),
        budgetAmount: getCategoryBudget(budget, cat.id),
      }));
  }, [categories, transactions, year, month, budget]);

  // Top 5 spending categories
  const topCategories = useMemo(() => {
    const prefix = selectedMonth;
    const expenseTxs = transactions.filter((t) => t.date.startsWith(prefix) && t.type === 'expense' && t.categoryId);
    const byCat = new Map<string, number>();
    for (const t of expenseTxs) {
      byCat.set(t.categoryId!, (byCat.get(t.categoryId!) ?? 0) + t.amount);
    }
    const sorted = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([catId, amt]) => ({
      name: categories.find((c) => c.id === catId)?.name ?? '其他',
      amount: amt,
      width: (amt / max) * 100,
    }));
  }, [transactions, selectedMonth, categories]);

  // 7-day trend sparkline
  const trend = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const amt = transactions
        .filter((t) => t.date === ds && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { day: d.getDate(), expense: amt };
    });
  }, [transactions]);
  const maxTrend = Math.max(...trend.map((d) => d.expense), 1);

  return (
    <div>
      <PageHeader
        title="报表"
        rightAction={
          <button
            onClick={() => navigate('/budget')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings size={20} />
          </button>
        }
      />

      <div className="p-4 space-y-5">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">支出</p>
            <p className="text-base font-bold text-destructive">
              ¥{report.totalExpense.toFixed(0)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">收入</p>
            <p className="text-base font-bold text-emerald-600">
              ¥{report.totalIncome.toFixed(0)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">结余</p>
            <p className={`text-base font-bold ${report.remaining >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              ¥{report.remaining.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Trend sparkline */}
        {report.totalExpense > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-2">近7天支出趋势</h3>
            <div className="flex items-end gap-1 h-20">
              {trend.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {d.expense > 0 ? `¥${d.expense.toFixed(0)}` : ''}
                  </span>
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: `${(d.expense / maxTrend) * 100}%`,
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

        {/* Budget progress */}
        {report.totalBudget > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">月度预算进度</h3>
            <ProgressBar value={report.totalExpense} max={report.totalBudget} />
          </div>
        )}

        {/* Category budget details */}
        {budgetedCategories.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-4">
            <h3 className="text-sm font-semibold">分类预算</h3>
            {budgetedCategories.map((cat) => (
              <BudgetProgressBar
                key={cat.categoryId}
                categoryName={cat.categoryName}
                spent={cat.spent}
                budgetAmount={cat.budgetAmount}
              />
            ))}
          </div>
        )}

        {/* Category pie chart */}
        {report.categorySummaries.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">分类占比</h3>
            <PieChart data={report.categorySummaries} />
          </div>
        )}

        {/* Top 5 ranking */}
        {topCategories.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">支出排行 Top 5</h3>
            <div className="space-y-3">
              {topCategories.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground/50 w-5">#{i + 1}</span>
                  <span className="text-sm text-muted-foreground w-14">{cat.name}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${cat.width}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-medium">¥{cat.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
