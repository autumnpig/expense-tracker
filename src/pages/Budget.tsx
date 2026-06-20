import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUIStore } from '@/stores/uiStore';
import PageHeader from '@/components/shared/PageHeader';
import MonthPicker from '@/components/shared/MonthPicker';
import AmountInput from '@/components/shared/AmountInput';
import EmptyState from '@/components/shared/EmptyState';
import { DollarSign } from 'lucide-react';

export default function Budget() {
  const navigate = useNavigate();
  const { categories, load: loadCategories } = useCategoryStore();
  const { budgets, load: loadBudgets, setTotalBudget, setCategoryBudget } = useBudgetStore();
  const { selectedMonth, setSelectedMonth } = useUIStore();

  const [year, month] = selectedMonth.split('-').map(Number);
  const budget = budgets.find((b) => b.year === year && b.month === month);

  const [totalBudget, setTotalBudgetLocal] = useState<number | ''>('');
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, number | ''>>({});

  useEffect(() => {
    loadCategories();
    loadBudgets();
  }, []);

  useEffect(() => {
    if (budget) {
      setTotalBudgetLocal(budget.totalBudget);
      setCategoryAmounts(budget.categoryBudgets || {});
    } else {
      setTotalBudgetLocal('');
      setCategoryAmounts({});
    }
  }, [budget?.id]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  async function handleSaveTotal() {
    if (totalBudget === '' || totalBudget <= 0) return;
    await setTotalBudget(year, month, totalBudget as number);
    await loadBudgets();
  }

  async function handleSaveCategory(categoryId: string) {
    const amount = categoryAmounts[categoryId];
    if (amount === '' || amount === undefined || amount <= 0) {
      // Remove budget for this category
      await setCategoryBudget(year, month, categoryId, 0);
    } else {
      await setCategoryBudget(year, month, categoryId, amount as number);
    }
    await loadBudgets();
  }

  return (
    <div>
      <PageHeader title="预算管理" showBack />

      <div className="p-4 space-y-5">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

        {/* Total budget */}
        <div className="bg-card rounded-xl p-4 border border-border space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            月度总预算
          </h3>
          <AmountInput
            value={totalBudget}
            onChange={setTotalBudgetLocal}
            placeholder="5000"
          />
          <button
            onClick={handleSaveTotal}
            disabled={totalBudget === '' || (totalBudget as number) <= 0}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            保存总预算
          </button>
        </div>

        {/* Category budgets */}
        <div className="bg-card rounded-xl p-4 border border-border space-y-4">
          <h3 className="text-sm font-semibold">分类预算</h3>
          {expenseCategories.length > 0 ? (
            expenseCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-sm min-w-[60px]">{cat.name}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">¥</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={categoryAmounts[cat.id] ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                        setCategoryAmounts((prev) => ({
                          ...prev,
                          [cat.id]: raw === '' ? '' : Number(raw),
                        }));
                      }
                    }}
                    placeholder="0"
                    className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm text-center"
                  />
                  <button
                    onClick={() => handleSaveCategory(cat.id)}
                    className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium"
                  >
                    保存
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="暂无支出分类" description="请先在设置中添加分类" />
          )}
        </div>
      </div>
    </div>
  );
}
