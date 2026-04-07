"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b', '#14b8a6'];

export default function EmployeeMonthlyChart({ data, employeeNames }: { data: any[], employeeNames: string[] }) {
  if (!data || data.length === 0 || employeeNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-2 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500">No monthly data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const activeSpenders = payload
        .filter((p: any) => p.value > 0)
        .sort((a: any, b: any) => b.value - a.value);

      if (activeSpenders.length === 0) return null;

      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl z-50 min-w-[180px]">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
            {label} Breakdown
          </p>
          <div className="space-y-2">
            {activeSpenders.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-200 text-xs font-medium truncate max-w-[100px]">{entry.dataKey}</span>
                </div>
                <span className="text-white text-xs font-black shrink-0">
                  ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
          dy={10} 
          interval={0} 
        />
        <YAxis 
          tickFormatter={(val) => `$${val >= 1000 ? (val / 1000) + 'k' : val}`} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
        
        {employeeNames.map((name, index) => (
          <Bar 
            key={name} 
            dataKey={name} 
            stackId="a" 
            fill={COLORS[index % COLORS.length]} 
            maxBarSize={40}
            radius={index === employeeNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}