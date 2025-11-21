import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyGHS } from '../utils/formatters';

const SpendingTrendsChart = ({ data }) => {
  // Sample data if none provided
  const sampleData = [
    { month: 'Jan', spending: 2450, income: 3200 },
    { month: 'Feb', spending: 2100, income: 3200 },
    { month: 'Mar', spending: 2800, income: 3200 },
    { month: 'Apr', spending: 1950, income: 3200 },
    { month: 'May', spending: 3200, income: 3200 },
    { month: 'Jun', spending: 2650, income: 3200 },
  ];

  const chartData = data || sampleData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium text-neutral-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
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
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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