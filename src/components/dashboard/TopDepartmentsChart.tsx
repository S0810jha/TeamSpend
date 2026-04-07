"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type ChartData = {
  name: string;
  amount: number;
};

export default function TopDepartmentsChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-sm text-slate-400 mt-10">No department data yet.</div>;
  }

  const chartData = [...data].reverse();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
          <p className="text-white text-sm font-black tracking-tight">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
          width={85} 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === chartData.length - 1 ? '#6366f1' : '#94a3b8'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}