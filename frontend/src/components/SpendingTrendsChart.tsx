import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyGHS } from '../utils/formatters';

export interface SpendingTrendsData {
  month: string;
  spending: number;
  income: number;
}

interface SpendingTrendsChartProps {
  data: SpendingTrendsData[];
}

const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({ data }) => {
  // Show empty state if no data provided
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-neutral-500 text-sm">No spending data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium text-neutral-900">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className={`text-sm ${entry.color === '#0066CC' ? 'text-primary-500' :
                  entry.color === '#10b981' ? 'text-success-500' :
                    'text-gray-900'
                }`}
            >
              {entry.name}: {formatCurrencyGHS(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `₵${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="spending"
            stroke="#0066CC"
            strokeWidth={3}
            dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0066CC', strokeWidth: 2, fill: '#ffffff' }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingTrendsChart;
