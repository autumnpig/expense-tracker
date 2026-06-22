import type { ParsedRecord } from '@/types';
import * as XLSX from 'xlsx';

// ========== Deduplication ==========

interface DupKey {
  date: string;
  amount: number;
  type: 'expense' | 'income';
}

const DEDUP_AMOUNT_TOLERANCE = 1; // 1 yuan tolerance for same-source matching
const CROSS_BILL_TOLERANCE = 0.1; // strict tolerance for cross-bill matching (Alipay↔Bank)
const BATCH_DEDUP_TOLERANCE = 0.005; // sub-cent tolerance: only exact duplicates within same file

/**
 * Check if two records are duplicates: same date + similar amount + same direction.
 *
 * Cross-bill matching (Alipay ↔ Bank):
 *   Alipay 收付款方式 = "建设银行储蓄卡"  →  current note
 *   Bank 交易地点 = "支付宝-消费-xxx"     →  current desc / db note
 *   When BOTH sides confirm → exact match (0.1 tolerance).
 *   When only ONE side hints → fall back to single-source tolerance.
 */
export function isDuplicate(a: DupKey, b: DupKey, currentDesc?: string, dbNote?: string): boolean {
  if (a.date !== b.date || a.type !== b.type) return false;
  const diff = Math.abs(a.amount - b.amount);

  const curHasAlipay = currentDesc?.includes('支付宝') || currentDesc?.includes('财付通');
  const curHasBank = currentDesc?.includes('建设银行') || currentDesc?.includes('储蓄卡') || currentDesc?.includes('银行');
  const dbHasAlipay = dbNote?.includes('支付宝') || dbNote?.includes('财付通');
  const dbHasBank = dbNote?.includes('建设银行') || dbNote?.includes('储蓄卡') || dbNote?.includes('银行');

  // Bidirectional evidence: Alipay ↔ Bank cross-reference confirmed on both sides
  if ((curHasAlipay && dbHasBank) || (curHasBank && dbHasAlipay)) {
    return diff <= CROSS_BILL_TOLERANCE;
  }

  // Single-direction hint: one side suggests cross-bill
  if (curHasAlipay || curHasBank) {
    return diff <= CROSS_BILL_TOLERANCE;
  }

  // No cross-bill evidence: use default tolerance
  return diff <= DEDUP_AMOUNT_TOLERANCE;
}

/**
 * Remove duplicates within a batch. Uses sub-cent tolerance — only catches exact duplicates
 * (same transaction exported twice in the same file). First occurrence wins.
 */
export function dedupBatch(records: ParsedRecord[]): { unique: ParsedRecord[]; removedCount: number } {
  const unique: ParsedRecord[] = [];
  let removedCount = 0;

  for (const r of records) {
    const dup = unique.find((u) =>
      u.date === r.date &&
      u.type === r.type &&
      Math.abs(u.amount - r.amount) <= BATCH_DEDUP_TOLERANCE &&
      u.description === r.description, // same merchant/description = same row exported twice
    );
    if (dup) {
      removedCount++;
    } else {
      unique.push(r);
    }
  }

  return { unique, removedCount };
}

/**
 * Find indices of records in the batch that already exist in the database.
 * Returns a Set of indices to skip.
 * Accepts optional descriptions for cross-bill matching (Alipay↔Bank bidirectional).
 */
export function findDuplicatesInDB(
  records: DupKey[],
  existing: Array<{ date: string; amount: number; type: string; note?: string }>,
  descriptions?: string[],
): Set<number> {
  const dupIndices = new Set<number>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const desc = descriptions?.[i];
    for (const e of existing) {
      if (isDuplicate(r, { date: e.date, amount: e.amount, type: e.type as 'expense' | 'income' }, desc, e.note)) {
        dupIndices.add(i);
        break;
      }
    }
  }
  return dupIndices;
}

// ========== File Parsing ==========

/**
 * Parse an uploaded Excel/CSV file into ParsedRecord[]
 * Handles files with metadata rows before the actual header (common in bank/Alipay/WeChat exports).
 */
/**
 * Decode ArrayBuffer to string, auto-detecting GBK vs UTF-8.
 * Alipay exports are GBK; WeChat/Bank exports are usually UTF-8.
 */
function decodeBuffer(data: Uint8Array): string {
  // Try UTF-8 first
  const utf8 = new TextDecoder('utf-8', { fatal: true });
  try {
    return utf8.decode(data);
  } catch {
    // UTF-8 decoding failed — likely GBK
  }
  // Try GBK (Code Page 936) for Chinese CSV exports
  try {
    return new TextDecoder('gbk').decode(data);
  } catch {
    // Fallback: treat as latin-1 then re-encode (handles some edge cases)
    return new TextDecoder('utf-8').decode(data);
  }
}

export function parseBillFile(file: File): Promise<ParsedRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const fileName = file.name.toLowerCase();
        const isCsv = fileName.endsWith('.csv');

        // CSV: decode with GBK auto-detection (Alipay exports are GBK)
        // XLS/XLSX: pass as binary array (XLSX handles encoding internally)
        const workbook = isCsv
          ? XLSX.read(decodeBuffer(data), { type: 'string' })
          : XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Read as array-of-arrays so we can find the real header row
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

        // Find the actual header row (skip metadata at top)
        const headerIndex = findHeaderRow(rawRows);
        if (headerIndex < 0) {
          resolve([]);
          return;
        }

        const headers = rawRows[headerIndex].map((h) => String(h || '').trim());

        // Parse data rows after the header
        const records: ParsedRecord[] = [];
        for (let i = headerIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every((c) => !c)) continue; // skip empty rows
          const rowObj: Record<string, string> = {};
          for (let j = 0; j < headers.length; j++) {
            rowObj[headers[j]] = String(row[j] ?? '');
          }
          const record = parseRow(rowObj);
          if (record) records.push(record);
        }
        resolve(records);
      } catch (err) {
        reject(new Error('文件解析失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/** Column keywords that indicate a header row */
const HEADER_KEYWORDS = [
  '交易时间', '交易日期', '交易分类', '交易类型',
  '金额', '交易金额', '金额(元)',
  '收/支', '收支', '类型',
  '商品说明', '商品', '交易说明',
  '交易对方', '对方', '商户名称',
  '备注', '支付方式', '交易状态',
  'date', 'amount', 'type', 'note', 'description',
];

/**
 * Scan the first 50 rows for the one with the most column-header-like keywords.
 * Requires at least 2 keyword matches to qualify as a header row.
 */
function findHeaderRow(rows: string[][]): number {
  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowStr = row.map((c) => String(c || '')).join('\n');
    let score = 0;
    for (const kw of HEADER_KEYWORDS) {
      if (rowStr.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestScore >= 2 ? bestIndex : -1;
}

/**
 * Try to extract date, amount, description from a row.
 * Handles common WeChat/Alipay/Bank export formats.
 */
function parseRow(row: Record<string, string>): ParsedRecord | null {
  // Normalize keys — trim and lowercase
  const keys = Object.keys(row);
  const normalized: Record<string, string> = {};
  for (const k of keys) {
    normalized[k.trim().toLowerCase()] = (row[k] || '').trim();
  }

  // Try to find date column
  let date = '';
  const dateKeys = ['date', '日期', '交易时间', 'time', '时间', '记账日期', '交易日期', '付款时间'];
  for (const dk of dateKeys) {
    const v = normalized[dk] || row[dk]; // also try original key
    if (v) {
      date = normalizeDate(v);
      if (date) break;
    }
  }
  // Also try looking for any column that has date-like content
  if (!date) {
    for (const k of keys) {
      const d = normalizeDate(row[k]);
      if (d) { date = d; break; }
    }
  }

  // Try to find amount column
  // Strategy: dedicated income/expense columns first, then generic signed columns,
  // then any numeric column. Preserve sign for bank statements where + = income, - = expense.
  let amount = 0;
  let foundAmount = false;
  let amountSign = 0; // +1 = positive (income on bank), -1 = negative (expense on bank), 0 = unknown
  let typeFromAmount: 'expense' | 'income' | null = null;

  // 1. Dedicated income column
  const incomeAmt = normalized['收入金额'] || row['收入金额'];
  if (incomeAmt && !isNaN(parseFloat(incomeAmt.replace(/[,，¥￥\s]/g, '')))) {
    const n = Math.abs(parseFloat(incomeAmt.replace(/[,，¥￥\s]/g, '')));
    if (n > 0) { amount = n; foundAmount = true; typeFromAmount = 'income'; }
  }

  // 2. Dedicated expense column
  if (!foundAmount) {
    const expenseAmt = normalized['支出金额'] || row['支出金额'];
    if (expenseAmt && !isNaN(parseFloat(expenseAmt.replace(/[,，¥￥\s]/g, '')))) {
      const n = Math.abs(parseFloat(expenseAmt.replace(/[,，¥￥\s]/g, '')));
      if (n > 0) { amount = n; foundAmount = true; typeFromAmount = 'expense'; }
    }
  }

  // 3. Generic amount columns (bank format: signed values e.g. -50.00 = expense)
  if (!foundAmount) {
    const genericAmountKeys = ['amount', '金额', '¥', 'money', '元', '交易金额', '金额(元)'];
    for (const ak of genericAmountKeys) {
      const v = normalized[ak] || row[ak];
      if (v && !isNaN(parseFloat(v.replace(/[,，¥￥\s]/g, '')))) {
        const raw = v.replace(/[,，¥￥\s]/g, '');
        const n = parseFloat(raw);
        amount = Math.abs(n);
        foundAmount = true;
        if (n < 0) amountSign = -1;
        else if (n > 0) amountSign = 1;
        break;
      }
    }
  }

  // 4. Fallback: any numeric column
  if (!foundAmount) {
    for (const k of keys) {
      const v = row[k]?.replace(/[,，¥￥\s]/g, '');
      if (v && /^-?\d+(\.\d{1,2})?$/.test(v)) {
        const n = parseFloat(v);
        if (Math.abs(n) > 0.01 && Math.abs(n) < 1000000) {
          amount = Math.abs(n);
          foundAmount = true;
          if (n < 0) amountSign = -1;
          else if (n > 0) amountSign = 1;
          break;
        }
      }
    }
  }

  if (!date || !foundAmount) return null;

  // Skip cancelled/closed orders — money never actually left the account
  const statusKeys = ['交易状态', '当前状态', '状态', 'status'];
  for (const sk of statusKeys) {
    const v = (normalized[sk] || row[sk] || '').toLowerCase();
    if (v.includes('交易关闭')) return null;
  }

  // Determine type: dedicated columns > text columns > amount sign
  let type: 'expense' | 'income' = typeFromAmount || 'expense';
  let typeFromColumn = false; // true if type was set by 收/支 or similar text column
  const typeKeys = ['type', '类型', '收支', '收/支', '方向'];
  for (const tk of typeKeys) {
    const rawV = (row[tk] || '').trim();
    if (!rawV) continue; // column not present in this format
    const v = rawV.toLowerCase();
    // Skip non-transaction records
    if (v.includes('不计收支') || v.includes('不计入')) return null;
    // WeChat neutral transactions (收/支="/"): 提现/充值/零钱通，不产生收支
    if (rawV === '/') return null;
    if (v.includes('收入') || v.includes('入账') || v.includes('income') || v.includes('贷')) {
      type = 'income'; typeFromColumn = true; break;
    }
    if (v.includes('支出') || v.includes('出账') || v.includes('expense') || v.includes('借')) {
      type = 'expense'; typeFromColumn = true; break;
    }
  }
  // Fallback: use amount sign ONLY when no type column found (bank statements)
  if (!typeFromAmount && !typeFromColumn && amountSign !== 0 && type === 'expense') {
    if (amountSign > 0) type = 'income';
  }

  // Try to find description
  // For WeChat/Alipay bills: combine 商品 as primary + 交易对方 as supplement.
  // Long company names are truncated to keep the description readable.
  let description = '';
  const counterparty = normalized['交易对方'] || row['交易对方'] || '';
  const product = normalized['商品说明'] || row['商品说明'] || normalized['商品'] || row['商品'] || '';
  if (product && counterparty) {
    const shortParty = counterparty.length > 20 ? counterparty.slice(0, 20) + '…' : counterparty;
    description = `${product} · ${shortParty}`.slice(0, 60);
  } else if (product) {
    description = product.slice(0, 50);
  } else if (counterparty) {
    description = counterparty.slice(0, 50);
  } else {
    const descKeys = ['description', 'desc', 'note', '备注', '描述', '交易说明', '商户名称', '交易地点/附言', '摘要'];
    for (const dk of descKeys) {
      const v = normalized[dk] || row[dk];
      if (v) { description = v.slice(0, 50); break; }
    }
  }

  return { date, amount, description, type, rawRow: row };
}

/**
 * Normalize various date formats to YYYY-MM-DD
 */
function normalizeDate(raw: string): string {
  raw = raw.trim();
  if (!raw) return '';

  // Excel serial date (days since 1899-12-30, used by Alipay/WeChat)
  const num = Number(raw);
  if (!isNaN(num) && num > 40000 && num < 70000) {
    const d = new Date((num - 25569) * 86400000);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  // Already YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // YYYYMMDD (bank format, e.g. 20260601)
  const compactMatch = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  // YYYY/MM/DD or YYYY.MM.DD
  const slashMatch = raw.match(/(\d{4})[/.](\d{1,2})[/.](\d{1,2})/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[3].padStart(2, '0')}`;
  }

  // MM/DD/YYYY or DD/MM/YYYY — try both
  const shortMatch = raw.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (shortMatch) {
    const [_, a, b, y] = shortMatch;
    // Assume MM/DD
    return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
  }

  // Chinese format: 2026年6月20日
  const cnMatch = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (cnMatch) {
    return `${cnMatch[1]}-${cnMatch[2].padStart(2, '0')}-${cnMatch[3].padStart(2, '0')}`;
  }

  return '';
}
