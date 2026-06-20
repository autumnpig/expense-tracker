import { useEffect, useMemo } from 'react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUIStore } from '@/stores/uiStore';
import PageHeader from '@/components/shared/PageHeader';
import MonthPicker from '@/components/shared/MonthPicker';
import DailyReportCard from '@/components/business/DailyReportCard';
import BudgetProgressBar from '@/components/business/BudgetProgressBar';
import PieChart from '@/components/shared/PieChart';
import ProgressBar from '@/components/shared/ProgressBar';
import { generateMonthlyReport } from '@/services/reportGenerator';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const { transactions, load: loadTx } = useTransactionStore();
  const { categories, load: loadCategories } = useCategoryStore();
  const { budgets, load: loadBudgets } = useBudgetStore();
  const { selectedMonth, setSelectedMonth } = useUIStore();

  useEffect(() => {
    loadTx();
    loadCategories();
    loadBudgets();
  }, []);

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

  // Categories with budgets set
  const budgetedCategories = categories.filter((c) => {
    if (c.type !== 'expense') return false;
    const catBudget = budget?.categoryBudgets?.[c.id];
    return catBudget && catBudget > 0;
  });

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
                key={cat.id}
                year={year}
                month={month}
                categoryId={cat.id}
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

        {/* Daily report */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <DailyReportCard />
        </div>
      </div>
    </div>
  );
}
