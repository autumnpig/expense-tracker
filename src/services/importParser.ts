import type { ParsedRecord } from '@/types';
import * as XLSX from 'xlsx';

/**
 * Parse an uploaded Excel/CSV file into ParsedRecord[]
 */
export function parseBillFile(file: File): Promise<ParsedRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

        const records: ParsedRecord[] = [];
        for (const row of rows) {
          const record = parseRow(row);
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
  let amount = 0;
  const amountKeys = ['amount', '金额', '¥', 'money', '元', '支出金额', '收入金额', '交易金额', '金额(元)'];
  for (const ak of amountKeys) {
    const v = normalized[ak] || row[ak];
    if (v && !isNaN(parseFloat(v.replace(/[,，¥￥\s]/g, '')))) {
      amount = Math.abs(parseFloat(v.replace(/[,，¥￥\s]/g, '')));
      if (amount > 0) break;
    }
  }
  // Also try to find any numeric column that looks like an amount
  if (amount === 0) {
    for (const k of keys) {
      const v = row[k]?.replace(/[,，¥￥\s]/g, '');
      if (v && /^-?\d+(\.\d{1,2})?$/.test(v)) {
        const n = parseFloat(v);
        if (Math.abs(n) > 0.01 && Math.abs(n) < 1000000) {
          amount = Math.abs(n);
          break;
        }
      }
    }
  }

  if (!date || amount === 0) return null;

  // Determine type based on amount sign or column
  let type: 'expense' | 'income' = 'expense';
  const typeKeys = ['type', '类型', '收支', '方向'];
  for (const tk of typeKeys) {
    const v = (normalized[tk] || row[tk] || '').toLowerCase();
    if (v.includes('收入') || v.includes('入账') || v.includes('income') || v.includes('贷')) {
      type = 'income'; break;
    }
    if (v.includes('支出') || v.includes('出账') || v.includes('expense') || v.includes('借')) {
      type = 'expense'; break;
    }
  }

  // Try to find description
  let description = '';
  const descKeys = ['description', 'desc', 'note', '备注', '描述', '交易说明', '商品', '商品说明', '商户名称', '交易对方'];
  for (const dk of descKeys) {
    const v = normalized[dk] || row[dk];
    if (v) { description = v.slice(0, 50); break; }
  }

  return { date, amount, description, type, rawRow: row };
}

/**
 * Normalize various date formats to YYYY-MM-DD
 */
function normalizeDate(raw: string): string {
  raw = raw.trim();
  if (!raw) return '';

  // Already YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
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
