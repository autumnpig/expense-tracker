import React, { useMemo, useState } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import type { ParsedRecord } from '@/types';

interface ImportPreviewTableProps {
  records: ParsedRecord[];
  onChangeCategory: (index: number, categoryId: string) => void;
  onChangeType: (index: number, type: 'expense' | 'income') => void;
}

export default function ImportPreviewTable({
  records,
  onChangeCategory,
  onChangeType,
}: ImportPreviewTableProps) {
  // BUGFIX: Use raw categories + useMemo, NOT getExpense()/getIncome()
  // They return new arrays → Zustand Object.is fails → infinite re-render
  const allCategories = useCategoryStore((s) => s.categories);
  const expenseCategories = useMemo(
    () => allCategories.filter((c) => c.type === 'expense').sort((a, b) => a.sortOrder - b.sortOrder),
    [allCategories],
  );
  const incomeCategories = useMemo(
    () => allCategories.filter((c) => c.type === 'income').sort((a, b) => a.sortOrder - b.sortOrder),
    [allCategories],
  );

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  /** Check if a record's auto-matched category is uncertain (fell back to default) */
  const isUncertain = (categoryId?: string): boolean => {
    if (!categoryId) return true; // no category selected at all
    const cat = allCategories.find((c) => c.id === categoryId);
    return !cat || cat.name === '其他' || cat.name === '其他收入';
  };

  if (records.length === 0) {
    return <p className="text-center text-muted-foreground text-sm py-8">未解析到记录</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 px-2 font-medium">日期</th>
            <th className="py-2 px-2 font-medium">类型</th>
            <th className="py-2 px-2 font-medium">金额</th>
            <th className="py-2 px-2 font-medium">分类</th>
            <th className="py-2 px-2 font-medium">描述</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const uncertain = isUncertain(r.categoryId);
            const isTransfer = !!(r.transferFromAccount || r.transferToAccount);
            const isFromMemory = r.fromMemory;
            return (
            <React.Fragment key={i}>
            <tr
              className={`border-b border-border/50 transition-colors ${
                isTransfer
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-l-2 border-l-blue-500'
                  : isFromMemory
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500'
                    : uncertain
                      ? 'bg-amber-100/60 dark:bg-amber-950/40 border-l-2 border-l-amber-500'
                      : 'hover:bg-muted/30'
              }`}
            >
              <td className="py-2 px-2 whitespace-nowrap">{r.date}</td>
              <td className="py-2 px-2">
                {isTransfer ? (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">转账</span>
                ) : (
                  <select
                    value={r.type}
                    onChange={(e) => onChangeType(i, e.target.value as 'expense' | 'income')}
                    className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                )}
              </td>
              <td className={`py-2 px-2 font-mono whitespace-nowrap ${
                isTransfer ? 'text-blue-600 dark:text-blue-400' : r.type === 'expense' ? 'text-destructive' : 'text-emerald-600'
              }`}>
                ¥{r.amount.toFixed(2)}
              </td>
              <td className="py-2 px-2">
                {isTransfer ? (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {r.transferFromAccount ? `${r.transferFromAccount} → 银行卡` : `银行卡 → ${r.transferToAccount}`}
                  </span>
                ) : (
                  <select
                    className="text-xs bg-transparent border border-border rounded px-1 py-0.5 max-w-[80px]"
                    value={r.categoryId || ''}
                    onChange={(e) => onChangeCategory(i, e.target.value)}
                  >
                    <option value="">选择</option>
                    {(r.type === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td
                className="py-2 px-2 text-xs text-muted-foreground max-w-[120px] truncate cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                title={r.description}
              >
                {r.description}
              </td>
            </tr>
            {expandedIndex === i && (
              <tr key={`${i}-expanded`} className="border-b border-border/50 bg-muted/20">
                <td colSpan={5} className="py-2 px-4 text-xs text-muted-foreground whitespace-pre-wrap break-all">
                  {r.description}
                </td>
              </tr>
            )}
            </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
