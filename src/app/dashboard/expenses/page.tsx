import { getUserProfile } from '@/utils/getUser';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import DeleteExpenseButton from '@/components/dashboard/DeleteExpenseButton';
import { JSX } from 'react';

// --- CONFIGURATION FOR DYNAMIC CATEGORY STYLING ---
const CATEGORY_MAP: Record<string, { icon: JSX.Element, color: string, bg: string }> = {
  Software: { bg: 'bg-blue-50', color: 'text-blue-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
  Marketing: { bg: 'bg-purple-50', color: 'text-purple-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
  Travel: { bg: 'bg-amber-50', color: 'text-amber-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
  Office: { bg: 'bg-rose-50', color: 'text-rose-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  Payroll: { bg: 'bg-emerald-50', color: 'text-emerald-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  Other: { bg: 'bg-slate-100', color: 'text-slate-600', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
  Uncategorized: { bg: 'bg-slate-50', color: 'text-slate-400', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
};

const FILTER_STATUSES = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const FILTER_CATEGORIES = ['ALL', 'Software', 'Marketing', 'Travel', 'Office', 'Payroll', 'Other', 'Uncategorized'];

export default async function MyExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; category?: string }>;
}) {
  const { user } = await getUserProfile();
  const supabase = await createClient();

  const resolvedParams = await searchParams;
  const currentStatus = resolvedParams?.status || 'ALL';
  const currentCategory = resolvedParams?.category || 'ALL';

  // 1. Fetch only this user's expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const expensesList = expenses || [];

  // 2. Calculations for metrics
  const totalApprovedSpend = expensesList.filter(e => e.status === 'APPROVED').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pendingCount = expensesList.filter(e => e.status === 'PENDING').length;
  const approvedCount = expensesList.filter(e => e.status === 'APPROVED').length;
  const rejectedCount = expensesList.filter(e => e.status === 'REJECTED').length;

  // 3. Apply Filters
  const filteredExpenses = expensesList.filter(exp => {
    const matchStatus = currentStatus === 'ALL' || exp.status === currentStatus;
    const matchCategory = currentCategory === 'ALL' || exp.category === currentCategory;
    return matchStatus && matchCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transaction Ledger</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">Complete history of your submitted expenses.</p>
          </div>
        </div>

        {/* DENSE STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Approved Spend</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">${totalApprovedSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <StatCard label="Pending Requests" count={pendingCount} type="amber" />
          <StatCard label="Approved Requests" count={approvedCount} type="emerald" />
          <StatCard label="Rejected Requests" count={rejectedCount} type="rose" />
        </div>

        {/* FULL WIDTH DENSE TABLE WITH SCROLL LOCK */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[600px]">
          
          {/* FILTER CONTROLS BAR */}
          <div className="p-4 border-b border-slate-200 bg-white flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
              {FILTER_STATUSES.map(status => (
                <Link 
                  key={status}
                  href={`?status=${status}&category=${currentCategory}`} 
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    currentStatus === status 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {status}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTER_CATEGORIES.map(cat => (
                <Link 
                  key={cat}
                  href={`?status=${currentStatus}&category=${cat}`} 
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md border transition-all ${
                    currentCategory === cat 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          
          {/* TABLE HEADERS */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <div className="col-span-5 md:col-span-4">Description & Date</div>
            <div className="col-span-4 md:col-span-3">Category</div>
            <div className="hidden md:block col-span-2">Status</div>
            <div className="col-span-3 md:col-span-2 text-center">Amount</div>
            <div className="hidden md:block md:col-span-1 text-center">Action</div>
          </div>

          {/* TABLE BODY (SCROLLABLE AREA) */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0">
            {filteredExpenses.length === 0 ? (
              <EmptyState />
            ) : (
              filteredExpenses.map((exp) => {
                const style = CATEGORY_MAP[exp.category] || CATEGORY_MAP.Other;
                return (
                  <div key={exp.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Col 1: Description & Date */}
                    <div className="col-span-5 md:col-span-4 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {exp.description || '—'}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        {new Date(exp.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Col 2: Category Pill */}
                    <div className="col-span-4 md:col-span-3 flex items-center">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${style.bg} ${style.color} border-${style.color.split('-')[1]}-100`}>
                        {style.icon}
                        <span className="text-[9px] font-black uppercase tracking-widest">{exp.category}</span>
                      </div>
                    </div>

                    {/* Col 3: Status Badge */}
                    <div className="hidden md:flex col-span-2 items-center">
                      <StatusBadge status={exp.status} />
                    </div>

                    {/* Col 4: Amount & Mobile Actions */}
                    <div className="col-span-3 md:col-span-2 flex flex-col items-center justify-center">
                      <p className={`text-sm font-black tracking-tight ${exp.status === 'REJECTED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        ${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <div className="md:hidden mt-1 flex items-center gap-2">
                         <StatusBadge status={exp.status} />
                         {exp.status === 'PENDING' && <DeleteExpenseButton expenseId={exp.id} />}
                      </div>
                    </div>

                    {/* Col 5: Desktop Delete Action */}
                    <div className="hidden md:flex md:col-span-1 justify-end">
                      {exp.status === 'PENDING' && (
                        <DeleteExpenseButton expenseId={exp.id} />
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, count, type }: { label: string, count: number, type: 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
    rose: "text-rose-700 bg-rose-50 border-rose-100"
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`w-2 h-2 rounded-full ${colors[type].split(' ')[1].replace('50', '400')}`} />
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight">
        {count}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    PENDING: "text-amber-700 bg-amber-50 border-amber-200",
    REJECTED: "text-rose-700 bg-rose-50 border-rose-200"
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shadow-sm ${styles[status]}`}>
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 bg-slate-50/50 h-full">
      <div className="w-12 h-12 bg-white text-slate-300 rounded-xl border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
      </div>
      <p className="text-sm font-bold text-slate-600">No transactions found</p>
      <p className="text-xs font-medium text-slate-400 mt-1 max-w-[250px]">Try adjusting your filters or submit a new expense to see it here.</p>
    </div>
  );
}