import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Transaction, Account, Category } from '@/types';

/**
 * Export transactions to Excel file
 */
export function exportToExcel(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  filename?: string,
): void {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const rows = transactions.map((t) => ({
    日期: t.date,
    类型: t.type === 'expense' ? '支出' : t.type === 'income' ? '收入' : '转账',
    金额: t.type === 'transfer' ? t.amount : t.amount,
    分类: t.categoryId ? categoryMap.get(t.categoryId) || '' : '',
    账户: t.accountId ? accountMap.get(t.accountId) || '' : '',
    转出账户: t.fromAccountId ? accountMap.get(t.fromAccountId) || '' : '',
    转入账户: t.toAccountId ? accountMap.get(t.toAccountId) || '' : '',
    备注: t.note,
    导入来源: t.importedFrom || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '交易记录');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, filename || `记账记录_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export full database as JSON backup
 */
export async function exportBackup(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
): Promise<void> {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    accounts,
    categories,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  saveAs(blob, `记账备份_${new Date().toISOString().slice(0, 10)}.json`);
}

/**
 * Parse a JSON backup file and return the data
 */
export function parseBackupFile(file: File): Promise<{
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target!.result as string);
        if (!data.version || !data.transactions) {
          reject(new Error('无效的备份文件'));
          return;
        }
        resolve({
          transactions: data.transactions,
          accounts: data.accounts || [],
          categories: data.categories || [],
        });
      } catch {
        reject(new Error('备份文件解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
