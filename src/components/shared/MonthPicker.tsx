import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
}

export default function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [year, month] = value.split('-').map(Number);

  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const newVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onChange(newVal);
  }

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => changeMonth(-1)}
        className="p-1 rounded-full hover:bg-muted transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-base font-semibold min-w-[100px] text-center">
        {year}年 {monthNames[month - 1]}
      </span>
      <button
        onClick={() => changeMonth(1)}
        className="p-1 rounded-full hover:bg-muted transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
