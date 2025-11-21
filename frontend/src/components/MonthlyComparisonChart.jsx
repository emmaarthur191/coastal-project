import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyGHS } from '../utils/formatters';

const MonthlyComparisonChart = ({ data }) => {
  // Sample data if none provided
  const sampleData = [
    { month: 'Jan', income: 3200, expenses: 2450, savings: 750 },
    { month: 'Feb', income: 3200, expenses: 2100, savings: 1100 },
    { month: 'Mar', income: 3200, expenses: 2800, savings: 400 },
    { month: 'Apr', income: 3200, expenses: 1950, savings: 1250 },
    { month: 'May', income: 3200, expenses: 3200, savings: 0 },
    { month: 'Jun', income: 3200, expenses: 2650, savings: 550 },
  ];

  const chartData = data || sampleData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium text-neutral-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neutral-700">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {formatCurrencyGHS(entry.value)}
              </span>
            </div>
          ))}
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