import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAccountStore } from '@/stores/accountStore';
import PageHeader from '@/components/shared/PageHeader';
import TransactionListItem from '@/components/business/TransactionListItem';
import EmptyState from '@/components/shared/EmptyState';
import { Upload, Filter, Search, ArrowUpDown, X } from 'lucide-react';
import type { TransactionType } from '@/types';

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

type FilterOptions = {
  type: TransactionType | 'all';
  accountId: string;
  categoryId: string;
};

export default function TransactionList() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const load = useTransactionStore((s) => s.load);
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.load);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);

  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date-desc');
  const [filters, setFilters] = useState<FilterOptions>({ type: 'all', accountId: '', categoryId: '' });

  useEffect(() => {
    load();
    loadCategories();
    loadAccounts();
  }, [load, loadCategories, loadAccounts]);

  const filtered = useMemo(() => {
    let result = transactions;
    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.note?.toLowerCase().includes(q));
    }
    // Type
    if (filters.type !== 'all') result = result.filter((t) => t.type === filters.type);
    // Account
    if (filters.accountId) {
      result = result.filter((t) =>
        [t.accountId, t.fromAccountId, t.toAccountId].includes(filters.accountId),
      );
    }
    // Category
    if (filters.categoryId) {
      result = result.filter((t) => t.categoryId === filters.categoryId);
    }
    // Sort
    switch (sort) {
      case 'date-asc':
        result = [...result].sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'amount-desc':
        result = [...result].sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result = [...result].sort((a, b) => a.amount - b.amount);
        break;
      default: // date-desc
        result = [...result].sort((a, b) => b.date.localeCompare(a.date));
    }
    return result;
  }, [transactions, search, filters, sort]);

  const sortLabels: Record<SortKey, string> = {
    'date-desc': '最新',
    'date-asc': '最早',
    'amount-desc': '金额↓',
    'amount-asc': '金额↑',
  };

  const hasFilters = filters.type !== 'all' || filters.accountId || filters.categoryId || search.trim();

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
              className={`p-2 ${hasFilters ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <Filter size={18} />
            </button>
          </div>
        }
      />

      {/* Search bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索描述..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Sort toggle */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{filtered.length} 条记录</span>
        <button
          onClick={() => {
            const keys: SortKey[] = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'];
            const idx = keys.indexOf(sort);
            setSort(keys[(idx + 1) % keys.length]);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowUpDown size={12} />
          {sortLabels[sort]}
        </button>
      </div>

      {/* Filters */}
      {filterOpen && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">类型</label>
            <div className="flex gap-2 flex-wrap">
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
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">分类</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilters((f) => ({ ...f, categoryId: '' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !filters.categoryId ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                }`}
              >
                全部
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilters((f) => ({ ...f, categoryId: c.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.categoryId === c.id ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'
                  }`}
                >
                  {c.name}
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
            title="没有找到记录"
            description={hasFilters ? '尝试调整搜索或筛选条件' : '去记一笔或导入账单'}
            action={
              !hasFilters ? (
                <button
                  onClick={() => navigate('/add')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  记一笔
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
