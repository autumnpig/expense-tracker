import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { generateDailyReport, getYesterday } from '@/services/reportGenerator';
import { generateMonthlyReport } from '@/services/reportGenerator';
import PieChart from '@/components/shared/PieChart';
import StatCard from '@/components/shared/StatCard';
import ProgressBar from '@/components/shared/ProgressBar';
import TransactionListItem from '@/components/business/TransactionListItem';
import EmptyState from '@/components/shared/EmptyState';
import { Calendar } from 'lucide-react';

export default function DailyReportCard() {
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const budget = useBudgetStore((s) => {
    const now = new Date();
    return s.getByMonth(now.getFullYear(), now.getMonth() + 1);
  });

  const yesterday = getYesterday();
  const now = new Date();

  const daily = useMemo(
    () => generateDailyReport(transactions, yesterday),
    [transactions, yesterday],
  );

  const monthly = useMemo(
    () =>
      generateMonthlyReport(
        transactions,
        categories.map((c) => ({ id: c.id, name: c.name })),
        budget,
        now.getFullYear(),
        now.getMonth() + 1,
      ),
    [transactions, categories, budget, now],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Calendar size={18} className="text-muted-foreground" />
        <h3 className="text-base font-semibold">
          {yesterday.slice(5)} 昨日报告
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="昨日支出"
          amount={daily.totalExpense}
          color="text-destructive"
        />
        <StatCard
          label="昨日收入"
          amount={daily.totalIncome}
          color="text-emerald-600"
        />
      </div>

      {/* Monthly budget progress */}
      {monthly.totalBudget > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted-foreground">本月预算</span>
            <span className={`text-xs font-semibold ${monthly.remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
              {monthly.remaining >= 0 ? `剩余 ¥${monthly.remaining.toFixed(0)}` : `超支 ¥${Math.abs(monthly.remaining).toFixed(0)}`}
            </span>
          </div>
          <ProgressBar value={monthly.totalExpense} max={monthly.totalBudget} />
        </div>
      )}

      {/* Category breakdown */}
      {monthly.categorySummaries.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="text-sm font-semibold mb-3">本月分类占比</h4>
          <PieChart data={monthly.categorySummaries} showLegend={false} />
        </div>
      )}

      {/* Yesterday's transactions */}
      <div>
        <h4 className="text-sm font-semibold px-1 mb-2">昨日明细</h4>
        {daily.expenses.length > 0 ? (
          <div className="divide-y divide-border bg-card rounded-xl border border-border overflow-hidden">
            {daily.expenses.map((t) => (
              <TransactionListItem key={t.id} transaction={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="昨日无消费记录"
            description="今天还没有记过账"
          />
        )}
      </div>
    </div>
  );
}
