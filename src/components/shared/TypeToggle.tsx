interface TypeToggleProps {
  value: 'expense' | 'income';
  onChange: (value: 'expense' | 'income') => void;
}

export default function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      <button
        onClick={() => onChange('expense')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
          value === 'expense'
            ? 'bg-background text-destructive shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        支出
      </button>
      <button
        onClick={() => onChange('income')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
          value === 'income'
            ? 'bg-background text-emerald-600 shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        收入
      </button>
    </div>
  );
}
