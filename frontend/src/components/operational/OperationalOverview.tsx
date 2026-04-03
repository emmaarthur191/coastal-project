import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/modern/GlassCard';
import { useAuth } from '../../context/AuthContext';
import OnboardingHub from './OnboardingHub';

interface MonthlyReportData {
  month: string;
  loans: number;
  transactions: number;
  revenue: number;
  [key: string]: string | number | undefined;
}

interface CategoryReportData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number | undefined;
}

interface OperationalOverviewProps {
  monthlyData?: MonthlyReportData[];
  categoryData?: CategoryReportData[];
  loading?: boolean;
}

const OperationalOverview: React.FC<OperationalOverviewProps> = ({
  monthlyData = [],
  categoryData = [],
  loading = false
}) => {
  const { user } = useAuth();
  const onboardingMode = (user?.role === 'manager' || user?.role === 'admin') ? 'manager' : 'staff';

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <span>📈</span> Performance & Analytics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Volume Chart */}
          <div className="flex flex-col h-96 w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Volume & Revenue Trends</h4>
            {loading ? (
              <div className="flex-1 flex items-center justify-center animate-pulse bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold">Syncing Data...</span>
              </div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '12px'
                    }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    name="Revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6C5CE7"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#6C5CE7', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                  <Line
                    name="Loans"
                    type="monotone"
                    dataKey="loans"
                    stroke="#00B894"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#00B894', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No historical data available for this range.</p>
              </div>
            )}
          </div>

          {/* Distribution Chart */}
          <div className="flex flex-col h-96 w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Service Distribution</h4>
            {loading ? (
              <div className="flex-1 flex items-center justify-center animate-pulse bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold">Calculating...</span>
              </div>
            ) : categoryData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No distribution data found.</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="mt-8">
        <OnboardingHub mode={onboardingMode} />
      </div>
    </div>
  );
};

export default OperationalOverview;
