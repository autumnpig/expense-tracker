import type { ParsedRecord } from '@/types';

export interface TransferMatch {
  fromIndex: number;
  toIndex: number;
  fromAccount: string;
  toAccount: string;
  amount: number;
  date: string;
}

/**
 * Auto-detect transfers among parsed records.
 * Rule: same date + same amount (within tolerance) + different accounts.
 */
export function detectTransfers(
  records: ParsedRecord[],
  accountNames: Map<number, string>, // index -> account name
  tolerance = 0.5,
): TransferMatch[] {
  const matches: TransferMatch[] = [];
  const used = new Set<number>();

  for (let i = 0; i < records.length; i++) {
    if (used.has(i)) continue;
    const a = records[i];
    const aAccount = accountNames.get(i);
    if (!aAccount) continue;

    for (let j = i + 1; j < records.length; j++) {
      if (used.has(j)) continue;
      const b = records[j];
      const bAccount = accountNames.get(j);
      if (!bAccount) continue;

      // Must be different accounts
      if (aAccount === bAccount) continue;

      // Must be same date
      if (a.date !== b.date) continue;

      // Must have different directions (one expense, one income) or both expense with same amount
      const isOpposite =
        (a.type === 'expense' && b.type === 'income') ||
        (a.type === 'income' && b.type === 'expense');

      if (!isOpposite) continue;

      // Same amount within tolerance
      if (Math.abs(a.amount - b.amount) <= tolerance && a.amount > 0) {
        const expenseIdx = a.type === 'expense' ? i : j;
        const incomeIdx = a.type === 'income' ? i : j;
        const expenseRec = records[expenseIdx];
        const incomeRec = records[incomeIdx];

        matches.push({
          fromIndex: expenseIdx,
          toIndex: incomeIdx,
          fromAccount: a.type === 'expense' ? aAccount : bAccount,
          toAccount: a.type === 'income' ? aAccount : bAccount,
          amount: expenseRec.amount,
          date: expenseRec.date,
        });

        used.add(i);
        used.add(j);
        break;
      }
    }
  }

  return matches;
}
