"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

type MonthlyData = { month: string; spend: number };
type CategoryData = { name: string; value: number; color: string };

export default function AnalystCharts({ 
  monthlyData, 
  categoryData 
}: { 
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
}) {
  
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
          <p className="text-white text-lg font-black tracking-tight">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{data.name}</p>
            <p className="text-white text-sm font-black tracking-tight">
              ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
        <div className="mb-4 shrink-0">
          <h3 className="text-sm font-bold text-slate-800">Company Burn Rate (YTD)</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">Monthly aggregate of all approved expenses.</p>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                tickFormatter={(value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`}
              />
              <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="spend" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSpend)" 
                activeDot={{ r: 6, fill: "#4f46e5", stroke: "#fff", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
        <div className="mb-2 shrink-0">
          <h3 className="text-sm font-bold text-slate-800">Spend by Category</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">Distribution of approved funds.</p>
        </div>
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
          {categoryData.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          
          {categoryData.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Top Category</span>
              <span className="text-sm font-black text-slate-900 truncate max-w-[100px]">
                {categoryData.sort((a,b) => b.value - a.value)[0]?.name}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}