"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type SubmitExpenseProps = {
  budgetStatus: 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'NO_BUDGET' | 'UNASSIGNED';
};

export default function SubmitExpenseForm({ budgetStatus }: SubmitExpenseProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await axios.post("/api/expenses/create", {
        amount: parseFloat(formData.get("amount") as string),
        description: formData.get("description"),
        category: formData.get("category"),
      });

      setSuccessMsg("Expense submitted for approval!");
      form.reset();
      router.refresh();
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Failed to submit expense.");
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- PREMIUM LOCKED STATES ---
  if (budgetStatus !== 'ACTIVE') {
    const lockConfig = {
      UNASSIGNED: { title: "Access Restricted", desc: "You must be assigned to a department to log expenses. Contact your Admin.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
      EXPIRED: { title: "Cycle Closed", desc: "Your department's budget timeline has ended. Submissions are paused.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      UPCOMING: { title: "Starting Soon", desc: "Your budget cycle hasn't started yet. Check back later.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
      NO_BUDGET: { title: "No Allocation", desc: "Your team has no active budget. Contact your Admin.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    }[budgetStatus];

    return (
      <div className="flex flex-col items-center justify-center text-center py-3 px-8 h-[420px] bg-slate-50/50">
        <div className="w-12 h-12 bg-white text-slate-400 rounded-xl border border-slate-200/80 flex items-center justify-center mb-4 shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {lockConfig.icon}
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">{lockConfig.title}</h3>
        <p className="text-xs font-medium text-slate-500 mt-1.5 max-w-[240px] leading-relaxed">{lockConfig.desc}</p>
      </div>
    );
  }

  // --- THE ACTIVE PREMIUM FORM ---
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full p-6 sm:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="shrink-0">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Log Expense</h3>
        <p className="text-[11px] font-medium text-slate-500 mt-1">Submit a receipt for manager approval.</p>
      </div>

      {/* ALERTS */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-rose-700 animate-in fade-in slide-in-from-top-1">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-semibold">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2 text-emerald-700 animate-in fade-in slide-in-from-top-1">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {/* INPUTS CONTAINER */}
      <div className="space-y-5 flex-1 min-h-0 overflow-y-auto pr-1">
        
        {/* AMOUNT */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Amount</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-slate-400 font-semibold">$</span>
            </div>
            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Description</label>
          <input
            type="text"
            name="description"
            required
            placeholder="e.g. Client Dinner at Dorsia"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* CATEGORY (Matches DB exactly) */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Category</label>
          <div className="relative">
            <select
              name="category"
              required
              defaultValue=""
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-slate-400">Select a classification...</option>
              <option value="Software">Software & Subscriptions</option>
              <option value="Marketing">Marketing</option>
              <option value="Travel">Travel</option>
              <option value="Payroll">Payroll</option>
              <option value="Office">Office Supplies</option>
              <option value="Other">Other Expenses</option>
              <option value="Uncategorized">Uncategorized</option>
            </select>
            {/* Custom dropdown arrow for a cleaner look */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
            </div>
          </div>
        </div>

      </div>

      {/* SUBMIT BUTTON */}
      <div className="pt-2 shrink-0 border-t border-slate-100">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-3 rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>
    </form>
  );
}