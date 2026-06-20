import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAccountStore } from '@/stores/accountStore';
import PageHeader from '@/components/shared/PageHeader';
import AccountSelector from '@/components/shared/AccountSelector';
import ImportPreviewTable from '@/components/business/ImportPreviewTable';
import TransferDetectBanner from '@/components/business/TransferDetectBanner';
import { parseBillFile } from '@/services/importParser';
import { detectTransfers, type TransferMatch } from '@/services/transferDetector';
import type { ParsedRecord, Transaction } from '@/types';
import { FileSpreadsheet } from 'lucide-react';

export default function ImportBill() {
  const navigate = useNavigate();
  const { addMany } = useTransactionStore();
  const { accounts, load: loadAccounts } = useAccountStore();

  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [accountId, setAccountId] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferMatches, setTransferMatches] = useState<TransferMatch[]>([]);
  const [, setIgnoredMatches] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accounts.length === 0) loadAccounts();
  }, []);

  async function handleFile(file: File) {
    setLoading(true);
    setError('');
    setFileName(file.name);
    try {
      const parsed = await parseBillFile(file);
      setRecords(parsed);
      if (parsed.length === 0) {
        setError('未能从文件中解析到交易记录，请检查文件格式');
      }
    } catch (err: any) {
      setError(err.message || '解析失败');
      setRecords([]);
    }
    setLoading(false);
  }

  function updateRecord(index: number, changes: Partial<ParsedRecord>) {
    setRecords((prev) => prev.map((r, i) => (i === index ? { ...r, ...changes } : r)));
    // Clear transfer matches when records change
    setTransferMatches([]);
    setIgnoredMatches(new Set());
  }

  function runTransferDetection() {
    // Build account name map: each record gets account name from selected account
    const accountMap = new Map<number, string>();
    const selectedAccount = accounts.find((a) => a.id === accountId);
    records.forEach((_, i) => {
      accountMap.set(i, selectedAccount?.name || '当前账户');
    });
    const matches = detectTransfers(records, accountMap);
    setTransferMatches(matches);
  }

  function handleConfirmTransfer(match: TransferMatch) {
    // Mark the two records — they'll be converted to a transfer when saving
    setIgnoredMatches((prev) => {
      const next = new Set(prev);
      next.add(`${match.fromIndex}-${match.toIndex}`);
      return next;
    });
    // Remove from pending matches
    setTransferMatches((prev) => prev.filter((m) => m !== match));
  }

  function handleIgnoreTransfer(match: TransferMatch) {
    setTransferMatches((prev) => prev.filter((m) => m !== match));
  }

  function handleConfirmAll() {
    setTransferMatches([]);
  }

  async function handleImport() {
    const validRecords = records.filter((r) => r.date && r.amount > 0);

    const txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = validRecords.map(
      (r) => ({
        type: r.type,
        amount: r.amount,
        date: r.date,
        accountId: accountId,
        categoryId: r.rawRow['__categoryId'] || '',
        note: r.description,
        importedFrom: fileName,
      }),
    );

    if (txData.length === 0) {
      setError('没有有效的交易记录');
      return;
    }

    await addMany(txData);
    navigate('/', { replace: true });
  }

  return (
    <div>
      <PageHeader title="导入账单" showBack />

      <div className="p-4 space-y-4">
        {/* File upload */}
        {records.length === 0 && (
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 py-12 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <FileSpreadsheet size={28} className="text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">点击上传账单文件</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 .xlsx、.csv 格式
                </p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        {/* Preview */}
        {records.length > 0 && (
          <div className="space-y-4">
            {/* Account selector for import source */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                选择来源账户
              </label>
              <AccountSelector value={accountId} onChange={setAccountId} />
            </div>

            {/* File info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet size={16} />
              <span>{fileName}</span>
              <span>·</span>
              <span>{records.length} 条记录</span>
            </div>

            {/* Detect transfers button */}
            {accountId && (
              <button
                onClick={runTransferDetection}
                className="w-full py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                检测转账
              </button>
            )}

            {/* Transfer detection results */}
            <TransferDetectBanner
              matches={transferMatches}
              onConfirm={handleConfirmTransfer}
              onIgnore={handleIgnoreTransfer}
              onConfirmAll={handleConfirmAll}
            />

            {/* Preview table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">预览</span>
              </div>
              <ImportPreviewTable
                records={records}
                onChangeCategory={(i, catId) =>
                  updateRecord(i, { rawRow: { ...records[i].rawRow, __categoryId: catId } })
                }
                onChangeType={(i, type) => updateRecord(i, { type })}
              />
            </div>

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={!accountId}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                accountId
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              确认导入 {records.length} 条记录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
