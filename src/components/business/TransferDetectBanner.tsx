import { ArrowLeftRight } from 'lucide-react';

interface TransferMatch {
  fromIndex: number;
  toIndex: number;
  fromAccount: string;
  toAccount: string;
  amount: number;
  date: string;
}

interface TransferDetectBannerProps {
  matches: TransferMatch[];
  onConfirm: (match: TransferMatch) => void;
  onIgnore: (match: TransferMatch) => void;
  onConfirmAll: () => void;
}

export default function TransferDetectBanner({
  matches,
  onConfirm,
  onIgnore,
  onConfirmAll,
}: TransferDetectBannerProps) {
  if (matches.length === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={18} className="text-blue-600" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          检测到 {matches.length} 笔疑似转账
        </span>
      </div>

      <div className="space-y-2">
        {matches.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white dark:bg-background rounded-lg px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">
                ¥{m.amount.toFixed(2)}
              </span>
              <span className="text-muted-foreground">
                {m.fromAccount} → {m.toAccount}
              </span>
              <span className="text-xs text-muted-foreground">{m.date}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onIgnore(m)}
                className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                忽略
              </button>
              <button
                onClick={() => onConfirm(m)}
                className="text-xs px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                确认转账
              </button>
            </div>
          </div>
        ))}
      </div>

      {matches.length > 1 && (
        <button
          onClick={onConfirmAll}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          全部确认
        </button>
      )}
    </div>
  );
}
