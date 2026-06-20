import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAccountStore } from '@/stores/accountStore';
import PageHeader from '@/components/shared/PageHeader';
import TransactionListItem from '@/components/business/TransactionListItem';
import EmptyState from '@/components/shared/EmptyState';
import { Upload, Filter } from 'lucide-react';
import type { TransactionType } from '@/types';

type FilterOptions = {
  type: TransactionType | 'all';
  accountId: string;
};

export default function TransactionList() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const load = useTransactionStore((s) => s.load);
  const loadCategories = useCategoryStore((s) => s.load);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ type: 'all', accountId: '' });

  useEffect(() => {
    load();
    loadCategories();
    loadAccounts();
  }, [load, loadCategories, loadAccounts]);

  const filtered = transactions.filter((t) => {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.accountId) {
      if (![t.accountId, t.fromAccountId, t.toAccountId].includes(filters.accountId)) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="交易记录"
        showBack
        rightAction={
          <div className="flex gap-1">
            <button
              onClick={() => navigate('/import')}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 ${filters.type !== 'all' || filters.accountId ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <Filter size={18} />
            </button>
          </div>
        }
      />

      {/* Filters */}
      {filterOpen && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">类型</label>
            <div className="flex gap-2">
              {(['all', 'expense', 'income', 'transfer'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.type === t ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                  }`}
                >
                  {t === 'all' ? '全部' : t === 'expense' ? '支出' : t === 'income' ? '收入' : '转账'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">账户</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilters((f) => ({ ...f, accountId: '' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !filters.accountId ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                全部
              </button>
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setFilters((f) => ({ ...f, accountId: a.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.accountId === a.id ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div>
        {filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map((t) => (
              <TransactionListItem key={t.id} transaction={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有交易记录"
            description={filters.type !== 'all' || filters.accountId ? '尝试调整筛选条件' : '去记一笔或导入账单'}
            action={
              <button
                onClick={() => navigate('/add')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                记一笔
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
