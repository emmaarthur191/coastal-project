import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, Variants } from 'framer-motion';
import { TrendingUp, ArrowUpRight, PieChart as PieChartIcon } from 'lucide-react';
import GlassCard from '../ui/modern/GlassCard';
import { MonthlyReportData, CategoryReportData } from '../../types';
import './OperationalOverview.css';

interface OperationalOverviewProps {
  monthlyData?: MonthlyReportData[];
  categoryData?: CategoryReportData[];
  loading?: boolean;
  activeTimeframe?: string;
  onTimeframeChange?: (t: string) => void;
}

const timeframeMap: Record<string, string> = {
  '7D': 'daily',
  '30D': 'weekly',
  'ALL': 'monthly'
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const OperationalOverview: React.FC<OperationalOverviewProps> = ({
  monthlyData = [],
  categoryData = [],
  loading = false,
  activeTimeframe = 'monthly',
  onTimeframeChange
}) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-coastal-primary" /> Operational Performance
          </h3>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] ml-7">Real-time Telemetry: April 2026</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-4 border border-slate-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Daily Transaction Volume
            </h4>
            <div className="flex gap-1.5">
              {['7D', '30D', 'ALL'].map(t => (
                <button 
                  key={t} 
                  onClick={() => onTimeframeChange?.(timeframeMap[t])}
                  className={`px-2 py-0.5 rounded text-[9px] font-black border transition-all ${activeTimeframe === timeframeMap[t] ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-44 w-full min-h-[176px] min-w-0 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center animate-pulse bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold text-xs">Syncing Data...</span>
              </div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={176} debounce={50}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                  <Line name="Revenue" type="monotone" dataKey="revenue" stroke="#6C5CE7" strokeWidth={2} dot={false} />
                  <Line name="Loans" type="monotone" dataKey="loans" stroke="#00B894" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-[10px]">No data available.</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 border border-slate-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-3 h-3 text-blue-500" /> Product Distribution
            </h4>
          </div>
          {loading ? (
            <div className="h-44 flex items-center justify-center animate-pulse bg-gray-50 rounded-xl">
              <span className="text-gray-400 font-bold text-xs">Calculating...</span>
            </div>
          ) : categoryData.length > 0 ? (
            <div className="h-44 flex flex-col items-center min-h-[176px] min-w-0 relative">
              <ResponsiveContainer width="100%" height={176} debounce={50}>
                <PieChart>
                  <Pie data={categoryData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-[10px]">No distribution data found.</p>
            </div>
          )}
        </GlassCard>
      </div>

    </motion.div>
  );
};
export default OperationalOverview;
