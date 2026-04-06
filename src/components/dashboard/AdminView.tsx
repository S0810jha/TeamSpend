import { createClient } from '@/utils/supabase/server';
import CompanySpendChart from '@/components/dashboard/CompanySpendChart';
import CompanyTrendChart from '@/components/dashboard/CompanyTrendChart'; // NEW IMPORT
import Link from 'next/link';

export default async function AdminView({ profile }: { profile: any }) {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, budgets(total_amount)')
    .eq('startup_id', profile.startup_id);

  const { count: employeeCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('startup_id', profile.startup_id);

  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      id, amount, description, category, status, created_at,
      users ( full_name ), teams ( id, name )
    `)
    .eq('startup_id', profile.startup_id)
    .order('created_at', { ascending: false });

  // --- SEPARATE THE DATA ---
  const allExpenses = expenses || [];
  const approvedExpenses = allExpenses.filter(e => e.status === 'APPROVED');
  const pendingExpenses = allExpenses.filter(e => e.status === 'PENDING');
  const recentExpenses = allExpenses.slice(0, 8);

  // --- CORE CALCULATIONS ---
  const totalTeams = teams?.length || 0;
  const totalBudget = teams?.reduce((acc, team) => {
    const teamBudget = Array.isArray(team.budgets) ? team.budgets[0]?.total_amount : team.budgets?.total_amount;
    return acc + Number(teamBudget || 0);
  }, 0) || 0;
  const totalSpent = approvedExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  const remainingBudget = totalBudget - totalSpent;

  // --- PIE CHART MATH ---
  const spendByTeamMap: Record<string, number> = {};
  approvedExpenses.forEach(exp => {
    // @ts-ignore
    const teamName = exp.teams?.name || 'Unassigned';
    spendByTeamMap[teamName] = (spendByTeamMap[teamName] || 0) + Number(exp.amount);
  });
  const chartData = Object.keys(spendByTeamMap)
    .map(key => ({ name: key, value: spendByTeamMap[key] }))
    .sort((a, b) => b.value - a.value);

  // --- 6-MONTH TREND MATH ---
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  
  const monthlyDataMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyDataMap[d.toLocaleString('default', { month: 'short' })] = 0;
  }
  approvedExpenses.forEach((exp: any) => {
    const date = new Date(exp.created_at);
    if (date >= sixMonthsAgo) {
      const monthName = date.toLocaleString('default', { month: 'short' });
      if (monthlyDataMap[monthName] !== undefined) {
        monthlyDataMap[monthName] += Number(exp.amount);
      }
    }
  });
  const trendData = Object.keys(monthlyDataMap).map(key => ({
    name: key,
    total: monthlyDataMap[key]
  }));

  // --- TOP SPENDERS LEADERBOARD MATH ---
  const employeeSpendMap: Record<string, number> = {};
  approvedExpenses.forEach((exp: any) => {
    const name = exp.users?.full_name || 'Unknown Employee';
    employeeSpendMap[name] = (employeeSpendMap[name] || 0) + Number(exp.amount);
  });
  const topSpenders = Object.keys(employeeSpendMap)
    .map(name => ({ name, total: employeeSpendMap[name] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Grab the top 5 only

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">Welcome, {profile.full_name}</h1>
        <p className="text-xs text-slate-500 mt-0.5">Company-wide financial overview and alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Budget</p>
          <p className="text-xl font-bold text-slate-900">${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-400 mt-1">Sum of all team allocations</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Approved Spend</p>
          <p className="text-xl font-bold text-slate-900">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-400 mt-1">{approvedExpenses.length} approved transactions</p>
        </div>
        
        <div className={`p-4 rounded-xl shadow-sm border ${remainingBudget < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-start mb-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining Runway</p>
          </div>
          <p className={`text-xl font-black ${remainingBudget < 0 ? 'text-red-700' : 'text-slate-900'}`}>
            ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Available company funds</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Action Needed</p>
             <p className={`text-xl font-bold ${pendingExpenses.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
               {pendingExpenses.length} Pending
             </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting your approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT 2/3: Transactions & Approvals */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          
          {pendingExpenses.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider">Global Approvals Needed</h3>
                </div>
              </div>
              <p className="text-xs text-amber-800 font-medium mb-4">
                You have {pendingExpenses.length} transactions waiting for review across your teams.
              </p>
              
              <div className="space-y-2">
                {pendingExpenses.slice(0, 3).map((exp) => (
                  <div key={exp.id} className="bg-white p-3 rounded-lg border border-amber-100 flex items-center justify-between">
                    <div>
                      {/* @ts-ignore */}
                      <p className="text-xs font-bold text-slate-900">{exp.users?.full_name} <span className="text-slate-400 font-normal">({exp.teams?.name})</span></p>
                      <p className="text-[11px] text-slate-500 mt-0.5">${Number(exp.amount).toFixed(2)} - {exp.description}</p>
                    </div>
                    {/* @ts-ignore */}
                    <Link href={`/dashboard/teams/${exp.teams?.id}`} className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded transition uppercase tracking-wider">
                      Review &rarr;
                    </Link>
                  </div>
                ))}
                {pendingExpenses.length > 3 && (
                  <p className="text-[11px] text-amber-700 font-semibold text-center mt-2 italic">+ {pendingExpenses.length - 3} more pending</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Company Activity</h3>
              <p className="text-[11px] text-slate-500">Latest transactions across all departments.</p>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition duration-150">
                      <td className="px-5 py-3">
                        {/* @ts-ignore */}
                        <div className="font-bold text-slate-800">{expense.users?.full_name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400">{new Date(expense.created_at).toLocaleDateString()}</div>
                      </td>
                      {/* @ts-ignore */}
                      <td className="px-5 py-3 font-medium text-slate-600">{expense.teams?.name || 'Unassigned'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border
                          ${expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                          ${expense.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                          ${expense.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                        `}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">
                        ${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {recentExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic text-xs">No company expenses recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT 1/3: ANALYTICS STACK */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">
          
          {/* Widget 1: Pie Chart */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Spend by Department</h3>
            <p className="text-[11px] text-slate-500 mb-2">Distribution of approved funds.</p>
            <div className="flex-1 flex items-center justify-center">
              <CompanySpendChart data={chartData} />
            </div>
          </div>

          {/* Widget 2: Burn Rate Trend */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">6-Month Burn Rate</h3>
            <p className="text-[11px] text-slate-500 mb-2">Company-wide spending trajectory.</p>
            <div className="flex-1 flex items-center justify-end">
              <CompanyTrendChart data={trendData} />
            </div>
          </div>

          {/* Widget 3: Top Spenders Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Spenders</h3>
              <p className="text-[11px] text-slate-500">Employees with highest approved expenses.</p>
            </div>
            <div className="p-5 pt-3">
              {topSpenders.length > 0 ? (
                <div className="space-y-4">
                  {topSpenders.map((person, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">{person.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 ml-2">
                        ${person.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center mt-2">No employee data available.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}