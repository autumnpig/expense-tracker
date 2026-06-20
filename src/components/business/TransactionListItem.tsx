import type { Transaction } from '@/types';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { getLucideIcon } from '@/lib/utils';
import { ArrowLeftRight } from 'lucide-react';

interface TransactionListItemProps {
  transaction: Transaction;
  onClick?: () => void;
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

    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <ArrowLeftRight size={16} className="text-blue-600" />
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
  const CategoryIcon = category ? getLucideIcon(category.icon) : getLucideIcon('help-circle');
  const isExpense = t.type === 'expense';

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          isExpense ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
        }`}
      >
        <CategoryIcon size={16} className={isExpense ? 'text-red-600' : 'text-emerald-600'} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {category?.name || '未分类'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {account?.name || ''}{t.note ? ` · ${t.note}` : ''}
        </p>
      </div>

      <div className="text-right">
        <p className={`text-sm font-semibold whitespace-nowrap ${isExpense ? 'text-foreground' : 'text-emerald-600'}`}>
          {isExpense ? '-' : '+'}{formatMoney(t.amount)}
        </p>
        <p className="text-xs text-muted-foreground">{t.date.slice(5)}</p>
      </div>
    </div>
  );
}
