import { useState } from 'react';
import TypeToggle from '@/components/shared/TypeToggle';
import AmountInput from '@/components/shared/AmountInput';
import AccountSelector from '@/components/shared/AccountSelector';
import CategorySelector from '@/components/shared/CategorySelector';
import DatePicker from '@/components/shared/DatePicker';
import { getToday } from '@/services/reportGenerator';
import type { Transaction } from '@/types';

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Partial<Transaction>;
}

export default function TransactionForm({ onSubmit, initialData }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type as 'expense' | 'income' || 'expense');
  const [amount, setAmount] = useState<number | ''>(initialData?.amount ?? '');
  const [accountId, setAccountId] = useState(initialData?.accountId ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [date, setDate] = useState(initialData?.date ?? getToday());
  const [note, setNote] = useState(initialData?.note ?? '');

  const canSubmit = amount && amount > 0 && accountId && categoryId;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      type,
      amount: amount as number,
      accountId,
      categoryId,
      date,
      note,
    });
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Type toggle */}
      <TypeToggle value={type} onChange={setType} />

      {/* Amount */}
      <div className="py-4">
        <AmountInput value={amount} onChange={setAmount} />
        {amount === '' && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            输入金额
          </p>
        )}
      </div>

      {/* Account */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          账户
        </label>
        <AccountSelector value={accountId} onChange={setAccountId} />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          分类
        </label>
        <CategorySelector type={type} value={categoryId} onChange={setCategoryId} />
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          日期
        </label>
        <DatePicker value={date} onChange={setDate} />
      </div>

      {/* Note */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          备注（可选）
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="添加备注..."
          className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
          canSubmit
            ? type === 'expense'
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {type === 'expense' ? '记录支出' : '记录收入'}
      </button>
    </div>
  );
}
