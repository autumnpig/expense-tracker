import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import PageHeader from '@/components/shared/PageHeader';
import AccountSelector from '@/components/shared/AccountSelector';
import ImportPreviewTable from '@/components/business/ImportPreviewTable';
import TransferDetectBanner from '@/components/business/TransferDetectBanner';
import { parseBillFile } from '@/services/importParser';
import { matchCategory } from '@/services/categoryMatcher';
import { getRememberedCategory, rememberCategory } from '@/services/categoryMemory';
import { detectTransfers, type TransferMatch } from '@/services/transferDetector';
import type { ParsedRecord, Transaction } from '@/types';
import { FileSpreadsheet } from 'lucide-react';

export default function ImportBill() {
  const navigate = useNavigate();
  const addMany = useTransactionStore((s) => s.addMany);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);
  const categories = useCategoryStore((s) => s.categories);

  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [accountId, setAccountId] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferMatches, setTransferMatches] = useState<TransferMatch[]>([]);
  const [confirmedTransfers, setConfirmedTransfers] = useState<TransferMatch[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [skippedBankPaid, setSkippedBankPaid] = useState(0);
  const [oldImportCount, setOldImportCount] = useState(0);
  const [showReimport, setShowReimport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accounts.length === 0) loadAccounts();
  }, []);

  function resetState() {
    setRecords([]);
    setError('');
    setFileName('');
    setTransferMatches([]);
    setConfirmedTransfers([]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleFile(file: File) {
    setLoading(true);
    setError('');
    setFileName(file.name);
    setSkippedBankPaid(0);
    setShowReimport(false);
    try {
      const parsed = await parseBillFile(file);

      // Filter: Alipay records paid via bank card → skip (bank bill covers them)
      let skippedBankCount = 0;
      const filtered = parsed.filter((r) => {
        const raw = r.rawRow;
        const payment = raw['收付款方式'] || raw['收/付款方式'] || '';
        if (payment && /建设银行|储蓄卡/.test(payment)) {
          skippedBankCount++;
          return false;
        }
        return true;
      });
      setSkippedBankPaid(skippedBankCount);

      // Auto-match categories + detect internal transfers
      const categorized = filtered.map((r) => {
        const raw = r.rawRow;
        const desc = raw['商品说明'] || raw['商品'] || raw['交易地点/附言'] || r.description || '';
        const party = raw['交易对方'] || raw['对方账号与户名'] || '';
        const billCat = raw['交易分类'] || raw['交易类型'] || raw['摘要'] || '';
        // Priority: memory > keyword matching > bill category fallback
        const rememberedId = getRememberedCategory(desc);
        let catName: string | null = null;
        let fromMemory = false;
        if (rememberedId) {
          const rememberedCat = categories.find((c) => c.id === rememberedId);
          if (rememberedCat && rememberedCat.type === r.type) {
            catName = rememberedCat.name;
            fromMemory = true;
          }
        }
        if (!catName) {
          catName = matchCategory(desc, party, billCat, r.type);
        }
        const cat = categories.find((c) => c.name === catName && c.type === r.type);
        const result: ParsedRecord = cat ? { ...r, categoryId: cat.id, fromMemory } : { ...r };

        // Auto-detect internal transfers from bank bill descriptions
        const searchDesc = (desc + ' ' + (r.description || '')).toLowerCase();
        if (searchDesc.includes('微信零钱提现') || searchDesc.includes('微信提现')) {
          result.transferFromAccount = '微信零钱';
        } else if (searchDesc.includes('支付宝提现')) {
          result.transferFromAccount = '支付宝';
        } else if (searchDesc.includes('财付通') && searchDesc.includes('微信零钱充值')) {
          result.transferToAccount = '微信零钱';
        }

        return result;
      });
      setRecords(categorized);

      // Check if this file was imported before
      const existingCount = await useTransactionStore.getState().countByImportedFrom(file.name);
      if (existingCount > 0) {
        setOldImportCount(existingCount);
        setShowReimport(true);
      }

      if (categorized.length === 0 && skippedBankCount === 0) {
        setError('未能从文件中解析到交易记录，请检查文件格式');
      }
    } catch (err: any) {
      setError(err.message || '解析失败');
      setRecords([]);
    }
    setLoading(false);
  }

  async function handleClearOldImport() {
    setLoading(true);
    try {
      await useTransactionStore.getState().removeByImportedFrom(fileName);
      setOldImportCount(0);
      setShowReimport(false);
    } catch (err: any) {
      setError(err.message || '清除失败');
    }
    setLoading(false);
  }

  function updateRecord(index: number, changes: Partial<ParsedRecord>) {
    setRecords((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, ...changes };
      // Remember user's category choice for future imports
      if (changes.categoryId && r.description) {
        rememberCategory(r.description, changes.categoryId);
      }
      return updated;
    }));
    // Clear transfer matches when records change
    setTransferMatches([]);
    setConfirmedTransfers([]);
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
    // Mark as confirmed — will be saved as a transfer transaction on import
    setConfirmedTransfers((prev) => [...prev, match]);
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
    // Collect indices of records merged into transfers (both confirmed + auto-detected)
    const transferIndices = new Set<number>();
    confirmedTransfers.forEach((m) => {
      transferIndices.add(m.fromIndex);
      transferIndices.add(m.toIndex);
    });

    // Auto-detect transfers from ParsedRecord hints
    const autoTransferTxs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    records.forEach((r, i) => {
      if (r.transferFromAccount) {
        const fromAcc = accounts.find((a) => a.name === r.transferFromAccount);
        autoTransferTxs.push({
          type: 'transfer' as const,
          amount: r.amount,
          date: r.date,
          note: `自动检测: ${r.transferFromAccount} → 银行卡`,
          fromAccountId: fromAcc?.id || '',
          toAccountId: accountId,
          importedFrom: fileName,
        });
        transferIndices.add(i);
      } else if (r.transferToAccount) {
        const toAcc = accounts.find((a) => a.name === r.transferToAccount);
        autoTransferTxs.push({
          type: 'transfer' as const,
          amount: r.amount,
          date: r.date,
          note: `自动检测: 银行卡 → ${r.transferToAccount}`,
          fromAccountId: accountId,
          toAccountId: toAcc?.id || '',
          importedFrom: fileName,
        });
        transferIndices.add(i);
      }
    });

    // Build transfer transactions from confirmed pairs
    const confirmedTransferTxs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = confirmedTransfers.map(
      (m) => {
        const fromAccountName = m.fromAccount;
        const toAccountName = m.toAccount;
        const fromAcc = accounts.find((a) => a.name === fromAccountName);
        const toAcc = accounts.find((a) => a.name === toAccountName);
        return {
          type: 'transfer' as const,
          amount: m.amount,
          date: m.date,
          note: `转账: ${fromAccountName} → ${toAccountName}`,
          fromAccountId: fromAcc?.id || accountId,
          toAccountId: toAcc?.id || '',
          importedFrom: fileName,
        };
      },
    );

    // Build individual transactions (exclude those merged into transfers)
    const individualTxs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = records
      .filter((r, i) => r.date && !transferIndices.has(i))
      .map((r) => ({
        type: r.type,
        amount: r.amount,
        date: r.date,
        accountId: accountId,
        categoryId: r.categoryId || '',
        note: r.description,
        importedFrom: fileName,
      }));

    const allTxs = [...autoTransferTxs, ...confirmedTransferTxs, ...individualTxs];

    if (allTxs.length === 0) {
      setError('没有有效的交易记录');
      return;
    }

    setLoading(true);
    try {
      await addMany(allTxs);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || '导入失败');
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="导入账单" showBack />

      <div className="p-4 space-y-4">
        {/* File upload — always visible, supports drag & drop */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center gap-2 py-6 border-2 border-dashed rounded-2xl transition-colors cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5'
              : records.length === 0
                ? 'border-border hover:border-primary/50'
                : 'border-border/50 hover:border-border'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <FileSpreadsheet size={22} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            {records.length === 0 ? (
              <>
                <p className="text-sm font-medium">拖拽或点击上传账单文件</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  支持 .xlsx、.xls、.csv 格式
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                拖拽或点击更换文件
              </p>
            )}
          </div>
        </div>
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

            {/* Re-import warning */}
            {showReimport && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  已导入过 {oldImportCount} 条记录，是否清除后重新导入？
                </span>
                <button
                  onClick={handleClearOldImport}
                  className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                >
                  清除旧记录
                </button>
              </div>
            )}

            {/* File info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <FileSpreadsheet size={16} />
              <span>{fileName}</span>
              <span>·</span>
              <span>{records.length} 条记录</span>
              {skippedBankPaid > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    跳过 {skippedBankPaid} 条银行卡付款（由银行账单导入）
                  </span>
                </>
              )}
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
                onChangeCategory={(i, catId) => updateRecord(i, { categoryId: catId })}
                onChangeType={(i, type) => updateRecord(i, { type })}
              />
            </div>

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={!accountId || loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                accountId && !loading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              )}
              {loading ? '导入中...' : `确认导入 ${records.length} 条记录`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
