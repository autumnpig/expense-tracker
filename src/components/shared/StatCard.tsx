import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  amount: number;
  icon?: LucideIcon;
  trend?: 'up' | 'down';
  trendLabel?: string;
  color?: string;
  onClick?: () => void;
}

function formatMoney(n: number): string {
  return `¥${n.toFixed(2)}`;
}

export default function StatCard({
  label,
  amount,
  icon: Icon,
  trend,
  trendLabel,
  color,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl p-4 border border-border ${
        onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {Icon && <Icon size={16} className="text-muted-foreground" />}
      </div>
      <div className={`text-xl font-bold ${color || 'text-foreground'}`}>
        {formatMoney(amount)}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <TrendingUp size={14} className="text-destructive" />
          ) : (
            <TrendingDown size={14} className="text-emerald-600" />
          )}
          <span className={`text-xs ${trend === 'up' ? 'text-destructive' : 'text-emerald-600'}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
