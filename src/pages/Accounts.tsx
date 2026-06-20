import { useEffect, useState } from 'react';
import { useAccountStore } from '@/stores/accountStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { calcAccountBalance } from '@/services/budgetCalculator';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getLucideIcon } from '@/lib/utils';

export default function Accounts() {
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);
  const add = useAccountStore((s) => s.add);
  const update = useAccountStore((s) => s.update);
  const remove = useAccountStore((s) => s.remove);
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTx = useTransactionStore((s) => s.load);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('wallet');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
    loadTx();
  }, [loadAccounts, loadTx]);

  function openAdd() {
    setEditingId(null);
    setFormName('');
    setFormIcon('wallet');
    setFormColor('#3b82f6');
    setShowForm(true);
  }

  function openEdit(id: string) {
    const a = accounts.find((a) => a.id === id);
    if (!a) return;
    setEditingId(id);
    setFormName(a.name);
    setFormIcon(a.icon);
    setFormColor(a.color);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    if (editingId) {
      await update(editingId, { name: formName, icon: formIcon, color: formColor });
    } else {
      await add({ name: formName, icon: formIcon, color: formColor, sortOrder: accounts.length });
    }
    setShowForm(false);
  }

  async function handleDelete() {
    if (deleteId) {
      await remove(deleteId);
      setDeleteId(null);
    }
  }

  const iconOptions = ['wallet', 'credit-card', 'message-circle', 'landmark', 'smartphone'];

  return (
    <div>
      <PageHeader
        title="账户管理"
        showBack
        rightAction={
          <button onClick={openAdd} className="text-primary">
            <Plus size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-3">
        {accounts.map((a) => {
          const balance = calcAccountBalance(a.id, transactions);
          const Icon = getLucideIcon(a.icon);
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: a.color + '20' }}
              >
                <Icon size={20} style={{ color: a.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.name}</p>
                <p className={`text-sm font-semibold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  ¥{balance.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => openEdit(a.id)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteId(a.id)}
                className="p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">暂无账户</p>
        )}
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-lg font-semibold">
              {editingId ? '编辑账户' : '新增账户'}
            </h3>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">名称</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                placeholder="如：微信、银行卡"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">图标</label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((icon) => {
                  const I = getLucideIcon(icon);
                  return (
                    <button
                      key={icon}
                      onClick={() => setFormIcon(icon)}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        formIcon === icon
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <I size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">颜色</label>
              <div className="flex gap-2">
                {['#07c160', '#3b82f6', '#1677ff', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ),
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-input text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="删除账户"
        message="删除账户不会删除关联的交易记录，但余额计算会受影响。确定删除吗？"
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
