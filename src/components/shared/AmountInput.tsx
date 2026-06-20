import { useRef, useEffect } from 'react';

interface AmountInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function AmountInput({
  value,
  onChange,
  placeholder = '0.00',
  autoFocus = false,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Allow empty
    if (raw === '') {
      onChange('');
      return;
    }
    // Only allow valid decimal: digits and at most one dot, max 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(raw)) {
      onChange(raw === '' ? '' : Number(raw));
    }
  }

  const displayValue = value === '' ? '' : String(value);

  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-3xl font-bold text-foreground">¥</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full max-w-[200px] text-center text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40"
      />
    </div>
  );
}
