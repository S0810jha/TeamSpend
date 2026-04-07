import { getUserProfile } from '@/utils/getUser';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CreateTeamForm from '@/components/dashboard/CreateTeamForm';

const TeamsPage = async () => {
  const { profile } = await getUserProfile();
  if (profile.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      budgets (
        total_amount,
        start_date,
        end_date
      )
    `)
    .eq('startup_id', profile.startup_id)
    .order('created_at', { ascending: false });

  const today = new Date();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">Manage Teams</h1>
        <p className="text-xs text-slate-500 mt-0.5">Create departments and allocate their initial budgets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">Create New Team</h2>
            <div className="w-full">
              <CreateTeamForm startupId={profile.startup_id} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Teams</h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
              {teams?.length || 0} Teams
            </span>
          </div>

          <div>
            {!teams || teams.length === 0 ? (
              <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[250px]">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900">No teams found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  You haven&apos;t set up any departments yet. Use the form to create your first team.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => {
                  const currentBudget = Array.isArray(team.budgets) ? team.budgets[0] : team.budgets;
                  
                  let isActive = false;
                  if (currentBudget?.start_date && currentBudget?.end_date) {
                    const startDate = new Date(currentBudget.start_date);
                    const endDate = new Date(currentBudget.end_date);
                    endDate.setHours(23, 59, 59, 999); 
                    
                    if (today >= startDate && today <= endDate) {
                      isActive = true;
                    }
                  }
                  
                  return (
                    <Link href={`/dashboard/teams/${team.id}`} key={team.id} className="block group">
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 group-hover:border-blue-400 group-hover:shadow-md transition h-full flex flex-col justify-between relative overflow-hidden">
                   
                        {!isActive && (
                           <div className="absolute inset-0 bg-slate-50/50 pointer-events-none z-0"></div>
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-5 gap-2">
                            <h3 className={`text-base font-extrabold transition tracking-tight pr-2 truncate ${isActive ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                              {team.name}
                            </h3>
                       
                            {isActive ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100 shrink-0">
                                Active
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200 shrink-0">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          {currentBudget ? (
                            <>
                              <div className="mb-4">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Allocation</p>
                                <p className={`text-xl font-black tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                  ${currentBudget.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              
                              <div className={`rounded-lg p-2.5 border ${isActive ? 'bg-slate-50 border-slate-100' : 'bg-transparent border-slate-200'}`}>
                                <div className={`flex justify-between text-[10px] font-semibold ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                                  <span>{new Date(currentBudget.start_date).toLocaleDateString()}</span>
                                  <span>&rarr;</span>
                                  <span>{new Date(currentBudget.end_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 flex items-center mt-2">
                              <p className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2.5 py-2 rounded-lg border border-amber-100 w-full text-center uppercase tracking-wide">
                                Needs Budget
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeamsPage;