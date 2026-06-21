import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { X, Trash2 } from 'lucide-react';
import type { Transaction } from '@/types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionEditSheet({ transaction, onClose }: Props) {
  const updateTx = useTransactionStore((s) => s.update);
  const removeTx = useTransactionStore((s) => s.remove);
  const allCategories = useCategoryStore((s) => s.categories);

  const expenseCategories = useMemo(
    () => allCategories.filter((c) => c.type === 'expense').sort((a, b) => a.sortOrder - b.sortOrder),
    [allCategories],
  );
  const incomeCategories = useMemo(
    () => allCategories.filter((c) => c.type === 'income').sort((a, b) => a.sortOrder - b.sortOrder),
    [allCategories],
  );

  const [type, setType] = useState<'expense' | 'income'>(transaction.type as 'expense' | 'income');
  const [categoryId, setCategoryId] = useState(transaction.categoryId || '');
  const [amount, setAmount] = useState(String(transaction.amount));
  const [note, setNote] = useState(transaction.note || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // Trap scroll on body
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    await updateTx(transaction.id, {
      type,
      categoryId: categoryId || undefined,
      amount: num,
      note: note || '',
      updatedAt: new Date(),
    });
    onClose();
  };

  const handleDelete = async () => {
    await removeTx(transaction.id);
    onClose();
  };

  const isTransfer = transaction.type === 'transfer';

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-card rounded-t-2xl max-h-[75vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-base font-semibold">
            {isTransfer ? '转账详情' : '编辑记录'}
          </h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date (read-only) */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">日期</label>
            <p className="text-sm font-medium">{transaction.date}</p>
          </div>

          {isTransfer ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">类型</label>
                <p className="text-sm font-medium text-blue-600">转账</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">金额</label>
                <p className="text-sm font-semibold">¥{transaction.amount.toFixed(2)}</p>
              </div>
              {transaction.note && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">备注</label>
                  <p className="text-sm">{transaction.note}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Type toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">类型</label>
                <div className="flex gap-2">
                  {(['expense', 'income'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setType(t); setCategoryId(''); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        type === t
                          ? t === 'expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t === 'expense' ? '支出' : '收入'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category select */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">分类</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">未分类</option>
                  {(type === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">金额</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">备注</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                  placeholder="添加备注..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  保存
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2.5 text-destructive hover:bg-destructive/10 rounded-lg text-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Delete confirmation */}
              {confirmDelete && (
                <div className="flex items-center gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  <span className="text-sm text-destructive flex-1">确定删除？</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded text-xs font-medium"
                  >
                    删除
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-muted rounded text-xs"
                  >
                    取消
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Animation style */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>
    </div>,
    document.body,
  );
}
