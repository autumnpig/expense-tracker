import { useMemo } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ParsedRecord } from '@/types';

interface ImportPreviewTableProps {
  records: ParsedRecord[];
  onChangeCategory: (index: number, categoryId: string) => void;
  onChangeType: (index: number, type: 'expense' | 'income') => void;
}

function getIcon(name: string): LucideIcon {
  const Icon = (Icons as Record<string, LucideIcon>)[name];
  return Icon || Icons.HelpCircle;
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
          {records.map((r, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-2 whitespace-nowrap">{r.date}</td>
              <td className="py-2 px-2">
                <select
                  value={r.type}
                  onChange={(e) => onChangeType(i, e.target.value as 'expense' | 'income')}
                  className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
                >
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                </select>
              </td>
              <td className={`py-2 px-2 font-mono whitespace-nowrap ${r.type === 'expense' ? 'text-destructive' : 'text-emerald-600'}`}>
                ¥{r.amount.toFixed(2)}
              </td>
              <td className="py-2 px-2">
                {/* Simple category picker per row */}
                <select
                  className="text-xs bg-transparent border border-border rounded px-1 py-0.5 max-w-[80px]"
                  onChange={(e) => onChangeCategory(i, e.target.value)}
                >
                  <option value="">选择</option>
                  {(r.type === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2 px-2 text-xs text-muted-foreground max-w-[120px] truncate">
                {r.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
