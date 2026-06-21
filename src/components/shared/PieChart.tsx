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

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null; // hide labels below 5%
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
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
          label={renderPieLabel}
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(_value, _name, props) => [
            `¥${Number(props.payload.amount).toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`,
            props.payload.categoryName,
          ]}
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
