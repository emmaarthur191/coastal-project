import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyGHS } from '../utils/formatters';
import './MonthlyComparisonChart.css';


const MonthlyComparisonChart = ({ data }) => {
  // Show empty state if no data provided
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-neutral-500 text-sm">No monthly comparison data available</p>
      </div>
    );
  }

  const chartData = data;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium text-neutral-900 mb-2">{label}</p>
          {payload.map((entry, index) => {
            const categoryClass = entry.name.toLowerCase();
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={`tooltip-indicator ${categoryClass}`} />
                <span className="text-neutral-700">{entry.name}:</span>
                <span className={`tooltip-value ${categoryClass}`}>
                  {formatCurrencyGHS(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          <Bar
            dataKey="income"
            fill="#10b981"
            radius={[2, 2, 0, 0]}
            name="Income"
          />
          <Bar
            dataKey="expenses"
            fill="#ef4444"
            radius={[2, 2, 0, 0]}
            name="Expenses"
          />
          <Bar
            dataKey="savings"
            fill="#0066CC"
            radius={[2, 2, 0, 0]}
            name="Savings"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyComparisonChart;
