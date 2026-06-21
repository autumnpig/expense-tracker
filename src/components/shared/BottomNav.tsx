import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { calcMonthExpense } from '@/services/budgetCalculator';
import { Home, PlusCircle, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { label: '首页', icon: Home, path: '/' },
  { label: '记账', icon: PlusCircle, path: '/add' },
  { label: '报表', icon: BarChart3, path: '/reports' },
  { label: '我的', icon: Settings, path: '/settings' },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);

  // Budget alert: if it's past day 15 and ANY category > 70% of budget
  const budgetAlert = useMemo(() => {
    const now = new Date();
    if (now.getDate() < 15) return false;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const budget = budgets.find((b) => b.year === year && b.month === month);
    if (!budget || budget.totalBudget <= 0) return false;

    // Check total budget
    const totalSpent = calcMonthExpense(transactions, year, month);
    if (totalSpent > budget.totalBudget * 0.7) return true;

    // Check per-category
    if (budget.categoryBudgets) {
      for (const [catId, catBudget] of Object.entries(budget.categoryBudgets)) {
        if (catBudget <= 0) continue;
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.categoryId === catId &&
            t.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
          .reduce((s, t) => s + t.amount, 0);
        if (spent > catBudget * 0.7) return true;
      }
    }

    return false;
  }, [transactions, budgets]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const showAlert = item.path === '/reports' && budgetAlert;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors relative ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {showAlert && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
