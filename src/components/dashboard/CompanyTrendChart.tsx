"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CompanyTrendChart({ data }: { data: { name: string, total: number }[] }) {
  if (!data || data.length === 0 || data.every(d => d.total === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[150px] text-slate-400">
        <p className="text-xs font-semibold">Not enough data to map trends.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-40 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={5}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            formatter={(value: any) => [
              `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
              'Spent'
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ display: 'none' }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#3b82f6' : '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}