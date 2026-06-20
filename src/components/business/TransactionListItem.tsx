import type { Transaction } from '@/types';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { getCategoryIcon } from '@/components/shared/CategorySelector';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TransactionListItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

function getAccountIcon(name: string): LucideIcon {
  const Icon = (Icons as Record<string, LucideIcon>)[name];
  return Icon || Icons.HelpCircle;
}

function formatMoney(n: number): string {
  return `¥${n.toFixed(2)}`;
}

export default function TransactionListItem({ transaction, onClick }: TransactionListItemProps) {
  const getAccount = useAccountStore((s) => s.getById);
  const getCategory = useCategoryStore((s) => s.getById);

  const t = transaction;

  // Transfer display
  if (t.type === 'transfer') {
    const from = getAccount(t.fromAccountId || '');
    const to = getAccount(t.toAccountId || '');
    const FromIcon = from ? getAccountIcon(from.icon) : Icons.ArrowRight;
    const ToIcon = to ? getAccountIcon(to.icon) : Icons.ArrowRight;

    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Icons.ArrowLeftRight size={16} className="text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            转账 {from?.name || '?'} → {to?.name || '?'}
          </p>
          <p className="text-xs text-muted-foreground">{t.date}</p>
        </div>
        <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
          {formatMoney(t.amount)}
        </span>
      </div>
    );
  }

  // Expense / Income
  const account = getAccount(t.accountId || '');
  const category = getCategory(t.categoryId || '');
  const CategoryIcon = category ? getCategoryIcon(category.icon) : Icons.HelpCircle;
  const isExpense = t.type === 'expense';

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      {/* Category icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          isExpense ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
        }`}
      >
        <CategoryIcon size={16} className={isExpense ? 'text-red-600' : 'text-emerald-600'} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {category?.name || '未分类'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {account?.name || ''}{t.note ? ` · ${t.note}` : ''}
        </p>
      </div>

      {/* Amount + date */}
      <div className="text-right">
        <p className={`text-sm font-semibold whitespace-nowrap ${isExpense ? 'text-foreground' : 'text-emerald-600'}`}>
          {isExpense ? '-' : '+'}{formatMoney(t.amount)}
        </p>
        <p className="text-xs text-muted-foreground">{t.date.slice(5)}</p>
      </div>
    </div>
  );
}
