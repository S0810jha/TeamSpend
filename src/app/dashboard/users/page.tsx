import { getUserProfile } from '@/utils/getUser';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EditUserModal from '@/components/dashboard/EditUserModal';
import InviteUserForm from '@/components/dashboard/InviteUserForm';
import UserFilters from '@/components/dashboard/UserFilters';

// --- 🟢 DEFINE TYPES TO SATISFY VERCEL 🟢 ---
interface Team {
  id: string;
  name: string;
}

interface TeamMemberRelation {
  team_id: string;
  teams: Team | Team[] | null; // Supabase can return an object or array depending on the join
}

interface User {
  id: string;
  full_name: string | null;
  role: string;
  email: string;
  team_members: TeamMemberRelation[];
}

const UsersPage = async ({ searchParams }: { searchParams: Promise<{ page?: string, role?: string, team?: string }> }) => {
  const { profile } = await getUserProfile();
  if (profile.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  const currentPage = Number(resolvedSearchParams?.page) || 1;
  const roleFilter = resolvedSearchParams?.role;
  const teamFilter = resolvedSearchParams?.team;
  
  const itemsPerPage = 7; 
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  // --- DYNAMIC SUPABASE QUERY FOR USERS ---
  let query = supabase
    .from('users')
    .select(`
      id, 
      full_name, 
      role,
      email,
      team_members ${teamFilter ? '!inner' : ''} (
        team_id,
        teams ( id, name )
      )
    `, { count: 'exact' })
    .eq('startup_id', profile.startup_id);

  if (roleFilter) query = query.eq('role', roleFilter);
  if (teamFilter) query = query.eq('team_members.team_id', teamFilter);

  const { data, count } = await query
    .order('full_name', { ascending: true })
    .range(from, to);

  // Cast data to our User interface
  const users = (data as unknown as User[]) || [];

  // --- DYNAMIC SUPABASE QUERY FOR TEAMS & BUDGETS ---
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, name, budgets(start_date, end_date)')
    .eq('startup_id', profile.startup_id)
    .order('name', { ascending: true });

  const today = new Date();
  const activeTeams: { id: string, name: string }[] = [];
  const teamStatusMap: Record<string, 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'NO_BUDGET'> = {}; 

  allTeams?.forEach(team => {
    const budgetObj = Array.isArray(team.budgets) ? team.budgets[0] : team.budgets;
    let status: 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'NO_BUDGET' = 'NO_BUDGET';

    if (budgetObj?.start_date && budgetObj?.end_date) {
      const startDate = new Date(budgetObj.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(budgetObj.end_date);
      endDate.setHours(23, 59, 59, 999);
      
      if (today > endDate) status = 'EXPIRED';
      else if (today < startDate) status = 'UPCOMING';
      else status = 'ACTIVE';
    }

    teamStatusMap[team.id] = status;
    if (status === 'ACTIVE' || status === 'UPCOMING') {
      activeTeams.push({ id: team.id, name: team.name });
    }
  });

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  const buildPaginationLink = (newPage: number) => {
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (teamFilter) params.set('team', teamFilter);
    params.set('page', newPage.toString());
    return `/dashboard/users?${params.toString()}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 xl:mb-8 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">User Directory</h1>
        <p className="mt-1 text-sm text-slate-600">Invite employees, assign roles, and allocate them to teams.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        <div className="xl:col-span-1 xl:h-full flex flex-col min-h-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:overflow-y-auto max-h-full">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Add New Employee</h2>
            <InviteUserForm startupId={profile.startup_id} teams={activeTeams} />
          </div>
        </div>

        <div className="xl:col-span-2 xl:h-full flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4 xl:mb-6 flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Active Employees</h2>
              <span className="text-sm font-medium text-slate-500 inline-block mt-1">Found {count || 0} Members</span>
            </div>
            <UserFilters teams={allTeams || []} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600 relative">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">System Role</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    // 🟢 FIX: Safe extraction with Array check
                    const firstMember = user.team_members?.[0];
                    const teamsField = firstMember?.teams;
                    const teamData = Array.isArray(teamsField) ? teamsField[0] : teamsField;
                    
                    const teamName = teamData?.name || 'Unassigned';
                    const teamId = teamData?.id || null;
                    const status = teamId ? teamStatusMap[teamId] : null;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{user.full_name || 'Pending Invite...'}</div>
                          <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold
                            ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' : ''}
                            ${user.role === 'ANALYST' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                            ${user.role === 'EMPLOYEE' ? 'bg-slate-100 text-slate-700 border border-slate-200' : ''}
                          `}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {teamName !== 'Unassigned' ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-slate-700 font-semibold">{teamName}</span>
                              {status === 'EXPIRED' && <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase">Expired Budget</span>}
                              {status === 'UPCOMING' && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase">Starts Soon</span>}
                              {status === 'NO_BUDGET' && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded uppercase">Needs Budget</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <EditUserModal 
                            user={{ id: user.id, full_name: user.full_name || '', role: user.role }} 
                            teams={activeTeams} 
                            currentTeamId={teamId} 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-slate-500 hidden sm:block">
                Showing <span className="font-medium">{count === 0 ? 0 : from + 1}</span> to <span className="font-medium">{Math.min(to + 1, count || 0)}</span> of <span className="font-medium">{count}</span> results
              </p>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link href={buildPaginationLink(currentPage - 1)} className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Previous</Link>
                ) : (
                  <button disabled className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed">Previous</button>
                )}
                {currentPage < totalPages ? (
                  <Link href={buildPaginationLink(currentPage + 1)} className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Next</Link>
                ) : (
                  <button disabled className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed">Next</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;