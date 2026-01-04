import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrencyGHS } from '../utils/formatters';

interface ExpenseData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}

interface LegendProps {
  payload?: Array<{ color: string; value: string }>;
}

const ExpenseBreakdownChart = ({ data }: { data: ExpenseData[] }) => {
  // Show empty state if no data provided
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-neutral-500 text-sm">No expense breakdown data available</p>
      </div>
    );
  }

  const chartData = data;

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium text-neutral-900">{item.name}</p>
          <p className="text-sm text-neutral-600">
            Amount: {formatCurrencyGHS(item.value)}
          </p>
          <p className="text-sm text-neutral-600">
            Percentage: {((item.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: LegendProps) => {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-neutral-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseBreakdownChart;
