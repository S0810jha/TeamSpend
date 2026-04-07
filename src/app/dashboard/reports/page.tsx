import { getUserProfile } from '@/utils/getUser';
import { createClient } from '@/utils/supabase/server';
import AnalystCharts from '@/components/dashboard/AnalystCharts';
import ExportCsvButton from '@/components/dashboard/ExportCsvButton';
import EmployeeMonthlyChart from '@/components/dashboard/EmployeeMonthlyChart';
import Link from 'next/link';
import { JSX } from 'react';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  status: string;
  created_at: string;
  team_id: string | null;
  users: { full_name: string; role: string } | null;
  teams: { id: string; name: string } | null;
}

interface Team {
  id: string;
  name: string;
}

type MonthlyDataEntry = {
  month: string;
  [employeeName: string]: string | number; 
};

const CATEGORY_MAP: Record<string, { icon: JSX.Element, color: string, bg: string, hex: string }> = {
  Software: { bg: 'bg-blue-50', color: 'text-blue-600', hex: '#3b82f6', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
  Marketing: { bg: 'bg-purple-50', color: 'text-purple-600', hex: '#a855f7', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
  Travel: { bg: 'bg-amber-50', color: 'text-amber-600', hex: '#f59e0b', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
  Office: { bg: 'bg-rose-50', color: 'text-rose-600', hex: '#f43f5e', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  Payroll: { bg: 'bg-emerald-50', color: 'text-emerald-600', hex: '#10b981', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  Other: { bg: 'bg-slate-100', color: 'text-slate-600', hex: '#64748b', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
  Uncategorized: { bg: 'bg-slate-50', color: 'text-slate-400', hex: '#94a3b8', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
};

export default async function AnalystReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ team?: string }>;
}) {
  const { profile } = await getUserProfile();
  const supabase = await createClient();

  if (profile.role !== 'ANALYST' && profile.role !== 'ADMIN') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500">You do not have clearance to view financial reports.</p>
        </div>
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const currentTeamFilter = resolvedParams?.team || 'ALL';

  const { data: allExpensesData } = await supabase
    .from('expenses')
    .select('id, amount, description, category, status, created_at, team_id, users(full_name, role), teams(id, name)')
    .eq('startup_id', profile.startup_id)
    .order('created_at', { ascending: true }); 

  const allExpenses = (allExpensesData as unknown as Expense[]) || [];

  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name')
    .eq('startup_id', profile.startup_id); 
    
  const teamsList = (teamsData as unknown as Team[]) || [];

  const filteredExpenses = currentTeamFilter === 'ALL' 
    ? allExpenses 
    : allExpenses.filter(e => e.teams?.id === currentTeamFilter);

  const approvedExpenses = filteredExpenses.filter(e => e.status === 'APPROVED');
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'PENDING');

  const monthlyDataMap: Record<string, number> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthNames.forEach(m => monthlyDataMap[m] = 0);

  approvedExpenses.forEach(exp => {
    const date = new Date(exp.created_at);
    if (date.getFullYear() === new Date().getFullYear()) {
      const monthStr = monthNames[date.getMonth()];
      monthlyDataMap[monthStr] += Number(exp.amount);
    }
  });

  const chartMonthlyData = monthNames.map(month => ({ month, spend: monthlyDataMap[month] }));

  const chartCategoryData = Object.keys(CATEGORY_MAP).map(cat => {
    const total = approvedExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0);
    return { name: cat, value: total, color: CATEGORY_MAP[cat].hex };
  }).filter(data => data.value > 0); 

  const monthlyEmployeeDataMap: Record<string, MonthlyDataEntry> = {};
  const uniqueEmployees = new Set<string>();

  monthNames.forEach(m => {
    monthlyEmployeeDataMap[m] = { month: m };
  });

  approvedExpenses.forEach(exp => {
    const date = new Date(exp.created_at);
    if (date.getFullYear() === new Date().getFullYear()) {
      const monthStr = monthNames[date.getMonth()];
      const empName = exp.users?.full_name || 'Unknown';
      uniqueEmployees.add(empName);
      
      const currentVal = monthlyEmployeeDataMap[monthStr][empName] as number || 0;
      monthlyEmployeeDataMap[monthStr][empName] = currentVal + Number(exp.amount);
    }
  });

  const chartMonthlyEmployeeData = monthNames.map(m => monthlyEmployeeDataMap[m]);
  const employeeNames = Array.from(uniqueEmployees);

  const totalYtdSpend = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalPendingLiability = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const ledgerExpenses = [...approvedExpenses].reverse();

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deep Dive Reports</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-widest">
              {currentTeamFilter === 'ALL' ? 'Company-Wide' : 'Department'} Analytics • {new Date().getFullYear()}
            </p>
          </div>
          <ExportCsvButton 
            data={approvedExpenses} 
            filename={`vaultpay_export_${currentTeamFilter === 'ALL' ? 'company' : currentTeamFilter}`} 
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link 
            href="?team=ALL" 
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border ${
              currentTeamFilter === 'ALL' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            All Company
          </Link>
          {teamsList.map(team => (
            <Link 
              key={team.id}
              href={`?team=${team.id}`} 
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border ${
                currentTeamFilter === team.id 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {team.name}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-5 rounded-xl shadow-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.01]">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-3 relative z-10">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total YTD Spend</p>
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white tracking-tight relative z-10">
              ${totalYtdSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <StatCard label="Pending Liabilities" value={`$${totalPendingLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext="Awaiting approval" type="amber" isPulse />
          <StatCard label="Transaction Volume" value={approvedExpenses.length.toString()} subtext="Total approved transactions" type="blue" />
        </div>

        <AnalystCharts monthlyData={chartMonthlyData} categoryData={chartCategoryData} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col h-[500px]">
            <div className="p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-semibold text-slate-800">Monthly Employee Spend</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                {currentTeamFilter === 'ALL' ? 'Across all teams' : 'Within selected team'}
              </p>
            </div>
            <div className="p-5 flex-1 min-h-0">
              <EmployeeMonthlyChart data={chartMonthlyEmployeeData} employeeNames={employeeNames} />
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col overflow-hidden h-[500px]">
            <div className="p-5 border-b border-slate-100 bg-white shrink-0 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Ledger</h3>
              <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-widest">Approved Transactions</span>
            </div>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <div className="col-span-4 md:col-span-3">Date & Team</div>
              <div className="hidden md:block md:col-span-3">Employee</div>
              <div className="col-span-5 md:col-span-4">Category & Desc.</div>
              <div className="col-span-3 md:col-span-2 text-right">Amount</div>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0">
              {ledgerExpenses.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm font-semibold text-slate-400">No transactions found.</p>
                </div>
              ) : (
                ledgerExpenses.map((exp) => {
                  const style = CATEGORY_MAP[exp.category] || CATEGORY_MAP.Other;
                  return (
                    <div key={exp.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-slate-50/80 transition-colors group">
                      <div className="col-span-4 md:col-span-3 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {new Date(exp.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5 truncate group-hover:text-indigo-600 transition-colors">
                          {exp.teams?.name || 'Unassigned'}
                        </p>
                      </div>
                      <div className="hidden md:block md:col-span-3 min-w-0">
                         <p className="text-sm font-semibold text-slate-700 truncate">{exp.users?.full_name || 'Unknown'}</p>
                      </div>
                      <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} ${style.color} border border-${style.color.split('-')[1]}-100`}>
                          {style.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{exp.description}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{exp.category}</p>
                        </div>
                      </div>
                      <div className="col-span-3 md:col-span-2 text-right">
                        <p className="text-sm font-black text-slate-900">
                          ${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  type, 
  subtext,
  isPulse = false
}: { 
  label: string; 
  value: string; 
  type: 'emerald' | 'amber' | 'blue' | 'purple'; 
  subtext?: string;
  isPulse?: boolean;
}) {
  const colorMap = {
    emerald: { dot: "bg-emerald-400" },
    amber: { dot: "bg-amber-400" },
    blue: { dot: "bg-blue-400" },
    purple: { dot: "bg-purple-400" }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`w-2 h-2 rounded-full shrink-0 ${colorMap[type].dot} ${isPulse ? 'animate-pulse' : ''}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</p>
        {subtext && <p className="text-xs font-medium text-slate-400 mt-1 truncate">{subtext}</p>}
      </div>
    </div>
  );
}