interface ProgressBarProps {
  value: number;   // current spent
  max: number;     // budget
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function ProgressBar({
  value,
  max,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = value > max;

  // Color: green → yellow → red based on percentage
  const barColor = isOver
    ? 'bg-destructive'
    : pct > 80
      ? 'bg-amber-500'
      : pct > 60
        ? 'bg-amber-400'
        : 'bg-emerald-500';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className={`font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
            已花 ¥{value.toFixed(0)}
          </span>
          <span className="text-muted-foreground">
            预算 ¥{max.toFixed(0)}
          </span>
        </div>
      )}
      <div className={`w-full rounded-full bg-muted overflow-hidden ${size === 'sm' ? 'h-2' : 'h-3'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOver && showLabel && (
        <p className="text-xs text-destructive mt-1 font-medium">
          已超支 ¥{(value - max).toFixed(0)}
        </p>
      )}
    </div>
  );
}
