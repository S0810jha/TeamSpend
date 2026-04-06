"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

// Added basic interfaces to avoid 'any' warnings
interface Expense {
  id: string;
  amount: number;
  category: string;
  user_id: string;
}

interface Member {
  id: string;
  full_name: string;
}

export default function TeamAnalytics({ expenses, members }: { expenses: Expense[], members: Member[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Filter expenses based on the dropdown selection
  const filteredExpenses = selectedUserId === 'all' 
    ? expenses 
    : expenses.filter(exp => exp.user_id === selectedUserId);

  // Calculate the total spent for the selected view
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Crunch data for the Recharts Pie Chart
  const categoryTotals = filteredExpenses.reduce((acc: Record<string, number>, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {});
  
  const chartData = Object.keys(categoryTotals)
    .map(key => ({ name: key, value: categoryTotals[key] }))
    .sort((a, b) => b.value - a.value);

  // Helper to get the selected person's name for UI text
  const selectedName = selectedUserId === 'all' 
    ? 'Entire Department' 
    : members.find(m => m.id === selectedUserId)?.full_name || 'Employee';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Side: Controls & Dynamic Stats */}
      <div className="p-5 lg:w-1/3 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Interactive Analytics</h3>
          <p className="text-[11px] text-slate-500 font-medium mb-5">Filter spending data by individual employees.</p>
          
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            View Data For
          </label>
          <select 
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition mb-6 cursor-pointer shadow-sm"
          >
            <option value="all">Entire Department (Overview)</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>

        <div className="mt-auto bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
          <p className="text-[11px] font-bold text-blue-600 mb-0.5 uppercase tracking-wide truncate">
            {selectedName}
          </p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Based on {filteredExpenses.length} transactions
          </p>
        </div>
      </div>

      {/* Right Side: The Chart */}
      <div className="p-4 lg:w-2/3 flex items-center justify-center min-h-[260px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                // 🟢 FIXED: Using 'any' and Number() to satisfy Recharts Formatter type requirements
                formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Spent']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-slate-400 flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
              <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-500">No expenses found.</p>
          </div>
        )}
      </div>

    </div>
  );
}