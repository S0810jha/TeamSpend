import { getUserProfile } from '@/utils/getUser';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Import our new interactive client components
import TeamAnalytics from '@/components/dashboard/TeamAnalytics';
import TeamTransactionsPanel from '@/components/dashboard/TeamTransactionsPanel';
import AdjustBudgetModal from '@/components/dashboard/AdjustBudgetModal'; 
import PendingApprovalsList from '@/components/dashboard/PendingApprovalsList';
import TeamTrendChart from '@/components/dashboard/TeamTrendChart';

export default async function TeamDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await getUserProfile();
  if (profile.role !== 'ADMIN') redirect('/dashboard');

  const supabase = await createClient();
  const resolvedParams = await params;
  const teamId = resolvedParams.id;

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      name,
      budgets ( id, total_amount, start_date, end_date ),
      team_members ( users ( id, full_name, email, role ) ),
      expenses ( id, amount, description, category, status, created_at, user_id, users ( full_name ) )
    `)
    .eq('id', teamId)
    .single();

  if (error || !team) redirect('/dashboard/teams');

  // --- 1. DATA SEPARATION ---
  const budgetObj = Array.isArray(team.budgets) ? team.budgets[0] : team.budgets;
  const totalBudget = Number(budgetObj?.total_amount || 0);
  
  const allExpenses = team.expenses || [];
  const pendingExpenses = allExpenses.filter((e: any) => e.status === 'PENDING');
  const approvedExpenses = allExpenses.filter((e: any) => e.status === 'APPROVED');

  // --- 2. BUDGET MATH (APPROVED ONLY) ---
  const totalSpent = approvedExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  const remainingBudget = totalBudget - totalSpent;
  const utilizationPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  let progressColor = 'bg-emerald-500';
  if (utilizationPercent > 75) progressColor = 'bg-amber-500';
  if (utilizationPercent > 90) progressColor = 'bg-red-500';

  // --- 3. BURN RATE FORECASTING MATH ---
  let forecastMessage = "Calculating projection...";
  let forecastColor = "text-slate-500";

  if (budgetObj?.start_date && totalSpent > 0) {
    const today = new Date();
    const startDate = new Date(budgetObj.start_date);
    const endDate = new Date(budgetObj.end_date);
    
    const daysElapsed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyBurnRate = totalSpent / daysElapsed;
    const daysUntilEmpty = remainingBudget / dailyBurnRate;
    const projectedEmptyDate = new Date(today.getTime() + (daysUntilEmpty * 24 * 60 * 60 * 1000));

    if (remainingBudget <= 0) {
      forecastMessage = "Budget depleted.";
      forecastColor = "text-red-600 font-semibold";
    } else if (projectedEmptyDate < endDate) {
      forecastMessage = `Warning: Runs out ~${projectedEmptyDate.toLocaleDateString()}`;
      forecastColor = "text-amber-600 font-semibold";
    } else {
      forecastMessage = `On track to last until ${projectedEmptyDate.toLocaleDateString()}`;
      forecastColor = "text-emerald-600 font-medium";
    }
  } else if (totalSpent === 0) {
    forecastMessage = "No spending data to forecast.";
  }

  // --- TREND MATH (Last 6 Months) ---
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

  // --- TOP MERCHANTS MATH ---
  const merchantMap: Record<string, number> = {};
  approvedExpenses.forEach((exp: any) => {
    const merchant = exp.description || 'Unknown Vendor';
    merchantMap[merchant] = (merchantMap[merchant] || 0) + Number(exp.amount);
  });

  const topMerchants = Object.keys(merchantMap)
    .map(key => ({ name: key, total: merchantMap[key] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); 

  const members = team.team_members?.map((m: any) => m.users) || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* 🟢 PERFECTED HEADER 🟢 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        {/* Left Side: Titles */}
        <div>
          <Link href="/dashboard/teams" className="text-xs font-bold text-blue-600 hover:text-blue-800 mb-1.5 inline-flex items-center gap-1 transition uppercase tracking-wider">
            &larr; Back to Teams
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">{team.name} Command Center</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Financial overview and employee spending limits.</p>
        </div>
        
        {/* Right Side: Grouped Buttons */}
        <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0">
          <TeamTransactionsPanel expenses={allExpenses} />
          
          <AdjustBudgetModal 
            teamId={teamId}
            budgetId={budgetObj?.id}
            currentAmount={budgetObj?.total_amount}
            startDate={budgetObj?.start_date}
            endDate={budgetObj?.end_date}
          />
        </div>
      </div>

      <PendingApprovalsList expenses={pendingExpenses} />

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Allocation</p>
          <p className="text-xl font-bold text-slate-900">${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {budgetObj?.start_date ? new Date(budgetObj.start_date).toLocaleDateString() : 'N/A'} - {budgetObj?.end_date ? new Date(budgetObj.end_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Approved Spend</p>
          <p className="text-xl font-bold text-slate-900">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-400 mt-1">Based on {approvedExpenses.length} transactions</p>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border flex flex-col justify-between ${remainingBudget < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div>
            <div className="flex justify-between items-start mb-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining Funds</p>
              <span className="bg-purple-100 text-purple-700 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">AI Forecast</span>
            </div>
            <p className={`text-2xl font-black ${remainingBudget < 0 ? 'text-red-700' : 'text-slate-900'}`}>
              ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className={`text-[11px] mt-2 ${forecastColor} leading-tight`}>{forecastMessage}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Utilization</p>
            <p className={`text-sm font-bold ${utilizationPercent > 90 ? 'text-red-600' : 'text-slate-800'}`}>
              {utilizationPercent.toFixed(1)}%
            </p>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full transition-all duration-700 ease-out rounded-full ${progressColor}`} style={{ width: `${utilizationPercent}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 text-right">
            {totalBudget > 0 ? `$${(totalBudget - totalSpent).toLocaleString()} left` : 'No budget'}
          </p>
        </div>

      </div>

      <TeamAnalytics expenses={approvedExpenses} members={members} />

      {/* BOTTOM ROW: Trend & Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">6-Month Spending Trend</h3>
          <p className="text-[11px] text-slate-500 mb-2">Approved expenses mapped over the previous 6 calendar months.</p>
          <div className="flex-1 flex flex-col items-center justify-end">
             <TeamTrendChart data={trendData} />
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Vendors</h3>
            <p className="text-[11px] text-slate-500">Highest volume payees by description.</p>
          </div>
          <div className="flex-1 p-5 pt-3">
            {topMerchants.length > 0 ? (
              <div className="space-y-4">
                {topMerchants.map((merchant, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">{merchant.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 ml-2">
                      ${merchant.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center mt-6">No merchant data available.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}