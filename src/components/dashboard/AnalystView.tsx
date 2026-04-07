import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import TopDepartmentsChart from '@/components/dashboard/TopDepartmentsChart';

interface Expense {
  id: string;
  amount: number;
  category: string;
  status: string;
  description: string;
  created_at: string;
  users: { full_name: string } | null;
  teams: { name: string } | { name: string }[] | null; 
}

const CATEGORY_MAP: Record<string, { icon: React.ReactNode, color: string, bg: string }> = {
  Software: { bg: 'bg-blue-50', color: 'text-blue-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
  Marketing: { bg: 'bg-purple-50', color: 'text-purple-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
  Travel: { bg: 'bg-amber-50', color: 'text-amber-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
  Office: { bg: 'bg-rose-50', color: 'text-rose-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  Payroll: { bg: 'bg-emerald-50', color: 'text-emerald-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  Other: { bg: 'bg-slate-100', color: 'text-slate-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
  Uncategorized: { bg: 'bg-slate-50', color: 'text-slate-400', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
};

export default async function AnalystView({ profile }: { profile: any }) {
  const supabase = await createClient();

  const { data: expensesData } = await supabase
    .from('expenses')
    .select('id, amount, category, status, description, created_at, users(full_name), teams(name)')
    .order('created_at', { ascending: false });

  const allExpenses = (expensesData as unknown as Expense[]) || [];

  const { data: budgets } = await supabase
    .from('budgets')
    .select('total_amount, start_date, end_date');

  const today = new Date();
  const activeBudgets = (budgets || []).filter(b => {
    const start = new Date(b.start_date);
    const end = new Date(b.end_date);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });
  const totalActiveBudget = activeBudgets.reduce((sum, b) => sum + Number(b.total_amount), 0);

  const approvedExpenses = allExpenses.filter(e => e.status === 'APPROVED');
  const pendingExpenses = allExpenses.filter(e => e.status === 'PENDING');
  
  const totalYtdSpend = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingLiability = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgTransactionSize = approvedExpenses.length > 0 ? totalYtdSpend / approvedExpenses.length : 0;
  
  const budgetUtilization = totalActiveBudget > 0 ? (totalYtdSpend / totalActiveBudget) * 100 : 0;
  const isBudgetHealthy = budgetUtilization < 90;

  const highestExpense = approvedExpenses.reduce((max, exp) => Number(exp.amount) > max ? Number(exp.amount) : max, 0);
  const uncategorizedCount = approvedExpenses.filter(e => e.category === 'Uncategorized' || e.category === 'Other').length;
  
  const recentApprovals = approvedExpenses.slice(0, 10);
  
  const teamSpendMap: Record<string, number> = {};
  approvedExpenses.forEach(exp => {
    const teamData = Array.isArray(exp.teams) ? exp.teams[0] : exp.teams;
    const teamName = teamData?.name || 'Unassigned';
    teamSpendMap[teamName] = (teamSpendMap[teamName] || 0) + Number(exp.amount);
  });
  
  const topTeams = Object.entries(teamSpendMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); 

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Morning Briefing</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-widest">
              Financial Overview • {new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Link href="/dashboard/reports" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2">
            Open Full Reports
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="YTD Cleared Spend" value={`$${totalYtdSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} type="emerald" />
          <StatCard label="Pending Liabilities" value={`$${pendingLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} type="amber" isPulse />
          <StatCard label="Avg. Transaction" value={`$${avgTransactionSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext="Across approved items" type="purple" />
          <StatCard label="Transaction Volume" value={allExpenses.length.toString()} subtext={`${pendingExpenses.length} awaiting review`} type="blue" />
        </div>

        {totalActiveBudget > 0 && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Company Budget Utilization</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Aggregated Active Team Budgets</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${isBudgetHealthy ? 'text-slate-900' : 'text-rose-600'}`}>
                  {budgetUtilization.toFixed(1)}% Utilized
                </span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${isBudgetHealthy ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <span>$0</span>
              <span>Total Cap: ${totalActiveBudget.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col h-[420px]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-semibold text-slate-800">Recent Cash Outflow</h3>
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-widest">Cleared</span>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-3 space-y-1">
              {recentApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-slate-400"><p>No recent transactions.</p></div>
              ) : (
                recentApprovals.map((exp) => {
                  const style = CATEGORY_MAP[exp.category] || CATEGORY_MAP.Other;
                  const teamData = Array.isArray(exp.teams) ? exp.teams[0] : exp.teams;
                  return (
                    <div key={exp.id} className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.color} shadow-sm border border-slate-100/50`}>{style.icon}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{exp.description}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                            {exp.users?.full_name} • {teamData?.name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-bold text-slate-900">${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col h-[420px]">
            <div className="p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-semibold text-slate-800">Top Departments</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">By approved YTD spend</p>
            </div>
            <div className="p-4 flex-1 min-h-0">
              <TopDepartmentsChart data={topTeams} />
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col h-[420px]">
            <div className="p-5 border-b border-slate-100 shrink-0"><h3 className="text-sm font-semibold text-slate-800">Audit Insights</h3></div>
            <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto bg-slate-50/50">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Largest Transfer</p>
                <p className="text-xl font-black text-slate-900">${highestExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`p-4 rounded-lg border shadow-sm ${uncategorizedCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${uncategorizedCount > 0 ? 'text-amber-800' : 'text-slate-600'}`}>Needs Review</p>
                <p className={`text-xl font-black tracking-tight ${uncategorizedCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>{uncategorizedCount} items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, type, subtext, isPulse = false }: { label: string; value: string; type: 'emerald' | 'amber' | 'blue' | 'purple'; subtext?: string; isPulse?: boolean; }) {
  const colorMap = { emerald: "bg-emerald-400", amber: "bg-amber-400", blue: "bg-blue-400", purple: "bg-purple-400" };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`w-2 h-2 rounded-full shrink-0 ${colorMap[type]} ${isPulse ? 'animate-pulse' : ''}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</p>
        {subtext && <p className="text-xs font-medium text-slate-400 mt-1 truncate">{subtext}</p>}
      </div>
    </div>
  );
}