import { getUserProfile } from '@/utils/getUser';
import { createClient } from '@/utils/supabase/server';
import SubmitExpenseForm from '@/components/dashboard/SubmitExpenseForm';

// --- CONFIGURATION FOR DYNAMIC CATEGORY STYLING ---
const CATEGORY_MAP: Record<string, { icon: JSX.Element, color: string, bg: string, barBg: string }> = {
  Software: {
    bg: 'bg-blue-50', color: 'text-blue-600', barBg: 'bg-blue-500',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
  },
  Marketing: {
    bg: 'bg-purple-50', color: 'text-purple-600', barBg: 'bg-purple-500',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
  },
  Travel: {
    bg: 'bg-amber-50', color: 'text-amber-600', barBg: 'bg-amber-500',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
  },
  Office: {
    bg: 'bg-rose-50', color: 'text-rose-600', barBg: 'bg-rose-500',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /></svg>
  },
  Payroll: {
    bg: 'bg-emerald-50', color: 'text-emerald-600', barBg: 'bg-emerald-500',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  },
  Other: {
    bg: 'bg-slate-100', color: 'text-slate-600', barBg: 'bg-slate-500',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
  },
  Uncategorized: {
    bg: 'bg-slate-50', color: 'text-slate-400', barBg: 'bg-slate-400',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }
};

export default async function EmployeeView({ profile }: { profile: any }) {
  const supabase = await createClient();

  // 1. Fetch Team Details
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', profile.id)
    .maybeSingle();

  let myTeam = null;
  let budgetObj = null;
  let teammates: any[] = []; 
  let teamApprovedSpend = 0;
  let teammateSpends: Record<string, number> = {}; // NEW: Map to track spend per user

  if (teamMember?.team_id) {
    const { data: teamData } = await supabase.from('teams').select('id, name').eq('id', teamMember.team_id).maybeSingle();
    if (teamData) myTeam = teamData;

    const { data: budgetData } = await supabase.from('budgets').select('total_amount, start_date, end_date').eq('team_id', teamMember.team_id).maybeSingle();
    
    if (budgetData) {
      budgetObj = budgetData;

      // UPDATED: Added user_id to the select query to map expenses to teammates
      const { data: teamExp } = await supabase
        .from('expenses')
        .select('amount, user_id') 
        .eq('team_id', teamMember.team_id)
        .eq('status', 'APPROVED')
        .gte('created_at', budgetData.start_date)
        .lte('created_at', `${budgetData.end_date}T23:59:59.999Z`);

      if (teamExp) {
        teamExp.forEach(e => {
          teamApprovedSpend += Number(e.amount);
          if (e.user_id) {
            teammateSpends[e.user_id] = (teammateSpends[e.user_id] || 0) + Number(e.amount);
          }
        });
      }
    }

    // FETCH THE TEAM ROSTER
    const { data: rosterData } = await supabase
      .from('team_members')
      .select('users(id, full_name, role)')
      .eq('team_id', teamMember.team_id);

    if (rosterData) {
      teammates = rosterData
        .map((r: any) => r.users)
        .filter((u: any) => u && u.id !== profile.id); 
    }
  }

  // 2. Fetch Personal Expenses for Calculations
  const { data: myExpenses } = await supabase
    .from('expenses')
    .select('id, amount, description, category, status, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  // 3. Determine Budget Status
  let budgetStatus: 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'NO_BUDGET' | 'UNASSIGNED' = 'UNASSIGNED';
  if (myTeam) {
    if (!budgetObj?.start_date || !budgetObj?.end_date) budgetStatus = 'NO_BUDGET';
    else {
      const today = new Date();
      const startDate = new Date(budgetObj.start_date);
      const endDate = new Date(budgetObj.end_date);
      endDate.setHours(23, 59, 59, 999);
      if (today > endDate) budgetStatus = 'EXPIRED';
      else if (today < startDate) budgetStatus = 'UPCOMING';
      else budgetStatus = 'ACTIVE';
    }
  }

  // Personal Metrics
  const expensesList = myExpenses || [];
  const pendingAmount = expensesList.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + Number(e.amount), 0);
  const approvedAmount = expensesList.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + Number(e.amount), 0);
  const rejectedAmount = expensesList.filter(e => e.status === 'REJECTED').reduce((sum, e) => sum + Number(e.amount), 0);

  // Calculate remaining team budget
  const remainingBudget = budgetObj ? Number(budgetObj.total_amount) - teamApprovedSpend : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* PREMIUM HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-5 pb-5 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome, {profile.full_name.split(' ')[0]}</h1>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-200/60 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {myTeam?.name || 'Unassigned'}
              </span>
              <span className="text-slate-300">•</span>
              <span>Employee Portal</span>
            </div>
          </div>
          
          {/* COMBINED CYCLE & BUDGET WIDGET */}
          {budgetObj && (
            <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-sm w-full xl:w-auto overflow-x-auto">
              
              {/* Cycle */}
              <div className="px-4 py-2 border-r border-slate-100 whitespace-nowrap">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${budgetStatus === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">{budgetStatus === 'ACTIVE' ? 'Active Cycle' : budgetStatus}</p>
                </div>
                <p className="text-sm font-bold text-slate-800 tracking-tight">
                  {new Date(budgetObj.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} &ndash; {new Date(budgetObj.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
              </div>

              {/* Total Budget */}
              <div className="px-4 py-2 border-r border-slate-100 text-right hidden sm:block whitespace-nowrap">
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Total Budget</p>
                <p className="text-sm font-bold text-slate-500 tracking-tight">${Number(budgetObj.total_amount).toLocaleString()}</p>
              </div>

              {/* Remaining */}
              <div className="px-4 py-2 text-right whitespace-nowrap">
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Remaining</p>
                <p className={`text-lg font-black tracking-tight ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

            </div>
          )}
        </div>

        {/* DENSE STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Approved Spend" amount={approvedAmount} type="emerald" />
          <StatCard label="Pending Approval" amount={pendingAmount} type="amber" />
          <StatCard label="Rejected" amount={rejectedAmount} type="rose" />
        </div>

        {/* MAIN LAYOUT (Form + 2 Blocks) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: SUBMISSION FORM */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
               <SubmitExpenseForm budgetStatus={budgetStatus} />
            </div>
          </div>

          {/* RIGHT COLUMN: SIDE-BY-SIDE BLOCKS */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* BLOCK 1: DYNAMIC SPEND BREAKDOWN */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col h-[443px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-sm font-semibold text-slate-800">Spend Breakdown</h3>
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">APPROVED</span>
              </div>

              <div className="space-y-5 overflow-y-auto flex-1 min-h-0 pr-2">
                {Object.keys(CATEGORY_MAP).map((cat) => {
                  const config = CATEGORY_MAP[cat];
                  
                  const catTotal = expensesList
                    .filter(e => e.category === cat && e.status === 'APPROVED')
                    .reduce((sum, e) => sum + Number(e.amount), 0);
                  
                  const percentage = approvedAmount > 0 ? (catTotal / approvedAmount) * 100 : 0;
                  const isZero = catTotal === 0;

                  return (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                           <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isZero ? 'bg-slate-50 text-slate-400' : `${config.bg} ${config.color}`}`}>
                             {config.icon}
                           </div>
                           <span className={`font-medium transition-colors ${isZero ? 'text-slate-400' : 'text-slate-700'}`}>{cat}</span>
                        </div>
                        <span className={`font-semibold text-xs transition-colors ${isZero ? 'text-slate-300' : 'text-slate-900'}`}>
                          ${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${isZero ? 'bg-transparent' : config.barBg}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BLOCK 2: TEAM ROSTER */}
            {myTeam && (
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col h-[443px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
                  <h3 className="text-sm font-semibold text-slate-800">Team Roster</h3>
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{teammates.length} PEERS</span>
                </div>
                
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-2">
                  {teammates.length > 0 ? (
                    teammates.map(mate => {
                      // NEW: Grab the total calculated spend for this specific teammate
                      const mateSpend = teammateSpends[mate.id] || 0;
                      
                      return (
                        <div key={mate.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="w-8 h-8 rounded bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                            {mate.full_name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{mate.full_name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5 truncate">{mate.role}</p>
                          </div>
                          
                          {/* NEW: Render the specific teammate's approved spend */}
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-700">
                              ${mateSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center pb-10">
                      <p className="text-sm font-medium text-slate-400">You are the only member.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, amount, type }: { label: string, amount: number, type: 'emerald' | 'amber' | 'rose' }) {
  const colorMap = {
    emerald: { wrapper: "text-emerald-700 bg-emerald-50 border-emerald-100", dot: "bg-emerald-400" },
    amber: { wrapper: "text-amber-700 bg-amber-50 border-amber-100", dot: "bg-amber-400" },
    rose: { wrapper: "text-rose-700 bg-rose-50 border-rose-100", dot: "bg-rose-400" }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`w-2 h-2 rounded-full ${colorMap[type].dot}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">
        ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}