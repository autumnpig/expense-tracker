import { useMemo, useState, useCallback } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAccountStore } from '@/stores/accountStore';
import TransactionListItem from '@/components/business/TransactionListItem';
import TransactionEditSheet from '@/components/business/TransactionEditSheet';
import EmptyState from '@/components/shared/EmptyState';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/types';

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface Props {
  transactions: Transaction[];
  selectedMonth: string; // "YYYY-MM"
}

export default function DailyGroupedList({ transactions, selectedMonth }: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Group transactions by date
  const dayGroups = useMemo(() => {
    const prefix = selectedMonth;
    const monthTxs = transactions.filter((t) => t.date.startsWith(prefix));
    const groups = new Map<string, Transaction[]>();
    for (const t of monthTxs) {
      const list = groups.get(t.date) || [];
      list.push(t);
      groups.set(t.date, list);
    }
    // Sort by date descending, within each day sort by createdAt desc
    const sorted = Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
    for (const [, list] of sorted) {
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return sorted;
  }, [transactions, selectedMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const getDayLabel = (dateStr: string) => {
    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';
    const d = new Date(dateStr.replace(/-/g, '/'));
    return WEEKDAY[d.getDay()];
  };

  const toggleDay = useCallback((date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }, []);

  if (dayGroups.length === 0) {
    return (
      <EmptyState
        title="本月还没有记录"
        description="记一笔或导入账单开始记账"
      />
    );
  }

  return (
    <div>
      {dayGroups.map(([date, txs]) => {
        const totalExpense = txs
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0);
        const totalIncome = txs
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0);
        const isExpanded = expandedDays.has(date);
        const year = date.slice(0, 4);
        const md = date.slice(5);

        return (
          <div key={date} className="border-b border-border/50">
            {/* Day header */}
            <button
              onClick={() => toggleDay(date)}
              className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/20 transition-colors ${
                date === todayStr ? 'bg-accent/20' : ''
              }`}
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
              )}
              <span className="flex-1 text-sm">
                <span className="font-medium">{md}</span>
                <span className={`ml-2 text-xs ${date === todayStr ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {getDayLabel(date)}
                </span>
              </span>
              {totalExpense > 0 && (
                <span className="text-sm font-mono text-destructive">
                  -¥{totalExpense.toFixed(0)}
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-2">{txs.length}笔</span>
            </button>

            {/* Expanded transaction list */}
            {isExpanded && (
              <div className="bg-muted/10">
                {txs.map((t) => (
                  <TransactionListItem
                    key={t.id}
                    transaction={t}
                    onClick={() => setEditingTx(t)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit sheet */}
      {editingTx && (
        <TransactionEditSheet
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
