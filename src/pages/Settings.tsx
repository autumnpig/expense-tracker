import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { exportToExcel, exportBackup, parseBackupFile } from '@/services/exportService';
import { db } from '@/db/database';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Wallet,
  Tags,
  Trash2,
  ChevronRight,
} from 'lucide-react';

/** Calculate lifetime balance for each account from all transactions */
function calcAccountBalances(
  transactions: Array<{ type: string; amount: number; accountId?: string; fromAccountId?: string; toAccountId?: string }>,
  accounts: Array<{ id: string; name: string; color: string }>,
): Array<{ id: string; name: string; color: string; balance: number }> {
  const balanceMap = new Map<string, number>();
  for (const a of accounts) balanceMap.set(a.id, 0);

  for (const t of transactions) {
    if (t.type === 'expense' && t.accountId) {
      balanceMap.set(t.accountId, (balanceMap.get(t.accountId) ?? 0) - t.amount);
    } else if (t.type === 'income' && t.accountId) {
      balanceMap.set(t.accountId, (balanceMap.get(t.accountId) ?? 0) + t.amount);
    } else if (t.type === 'transfer') {
      if (t.fromAccountId) balanceMap.set(t.fromAccountId, (balanceMap.get(t.fromAccountId) ?? 0) - t.amount);
      if (t.toAccountId) balanceMap.set(t.toAccountId, (balanceMap.get(t.toAccountId) ?? 0) + t.amount);
    }
  }

  return accounts
    .map((a) => ({ ...a, balance: balanceMap.get(a.id) ?? 0 }))
    .sort((a, b) => b.balance - a.balance);
}

export default function Settings() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);
  const loadTx = useTransactionStore((s) => s.load);
  const loadAccounts = useAccountStore((s) => s.load);
  const loadCategories = useCategoryStore((s) => s.load);

  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTx();
    loadAccounts();
    loadCategories();
  }, [loadTx, loadAccounts, loadCategories]);

  // Account balances
  const accountBalances = useMemo(
    () => calcAccountBalances(transactions, accounts),
    [transactions, accounts],
  );
  const totalAssets = accountBalances.reduce((s, a) => s + a.balance, 0);

  async function handleExportExcel() {
    exportToExcel(transactions, accounts, categories);
  }

  async function handleBackup() {
    await exportBackup(transactions, accounts, categories);
  }

  async function handleRestore(file: File) {
    try {
      const data = await parseBackupFile(file);
      // Clear existing and import
      await db.transactions.clear();
      await db.accounts.clear();
      await db.categories.clear();

      if (data.accounts.length > 0) await db.accounts.bulkAdd(data.accounts);
      if (data.categories.length > 0) await db.categories.bulkAdd(data.categories);
      if (data.transactions.length > 0) await db.transactions.bulkAdd(data.transactions);

      await loadTx();
      await loadAccounts();
      await loadCategories();
      alert('数据恢复成功！');
    } catch (err: any) {
      alert(err.message || '恢复失败');
    }
  }

  async function handleClearAll() {
    await db.transactions.clear();
    await loadTx();
    setConfirmClear(false);
  }

  const menuItems = [
    {
      icon: Wallet,
      label: '账户管理',
      desc: `${accounts.length} 个账户`,
      onClick: () => navigate('/accounts'),
    },
    {
      icon: Tags,
      label: '分类管理',
      desc: `${categories.length} 个分类`,
      onClick: () => navigate('/budget'),
    },
    {
      icon: FileSpreadsheet,
      label: '导出 Excel',
      desc: '交易记录导出为表格',
      onClick: handleExportExcel,
    },
    {
      icon: Download,
      label: '数据备份',
      desc: '备份完整数据为 JSON 文件',
      onClick: handleBackup,
    },
    {
      icon: Upload,
      label: '数据恢复',
      desc: '从备份文件恢复数据',
      onClick: () => fileInputRef.current?.click(),
    },
    {
      icon: Trash2,
      label: '清空数据',
      desc: '删除所有交易记录',
      onClick: () => setConfirmClear(true),
      danger: true,
    },
  ];

  return (
    <div>
      <PageHeader title="我的" />

      <div className="p-4 space-y-4">
        {/* Total assets */}
        {accounts.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">总资产</span>
              <span className="text-lg font-bold">¥{totalAssets.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {accountBalances.map((a) => (
                <div key={a.id} className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                  </div>
                  <p className={`text-sm font-semibold ${a.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    ¥{a.balance.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-colors ${
              i > 0 ? '' : ''
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                item.danger
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-muted'
              }`}
            >
              <item.icon
                size={18}
                className={item.danger ? 'text-destructive' : 'text-foreground'}
              />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${item.danger ? 'text-destructive' : ''}`}>
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleRestore(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Version */}
      <div className="text-center py-8">
        <p className="text-xs text-muted-foreground">记账本 v1.0 · PWA 离线可用</p>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="清空所有数据"
        message="此操作不可撤销，确定要删除所有交易记录吗？建议先导出备份。"
        confirmLabel="清空"
        variant="destructive"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
      </div>
    </div>
  );
}
