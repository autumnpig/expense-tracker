import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { CategorySummary } from '@/types';

interface PieChartProps {
  data: CategorySummary[];
  showLegend?: boolean;
}

export default function PieChart({ data, showLegend = true }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="amount"
          nameKey="categoryName"
        >
          {data.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`¥${Number(value).toFixed(2)}`, '金额']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--popover))',
          }}
        />
        {showLegend && (
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        )}
      </RePieChart>
    </ResponsiveContainer>
  );
}
