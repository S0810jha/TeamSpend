"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function PendingApprovalsList({ expenses }: { expenses: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusUpdate = async (expenseId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setLoadingId(expenseId);
    try {
      await axios.post("/api/expenses/update-status", { expenseId, newStatus });
      router.refresh(); // Instantly update the dashboard math
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setLoadingId(null);
    }
  };

  if (expenses.length === 0) return null; // Don't show anything if there's nothing to approve!

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
        <h3 className="text-lg font-extrabold text-amber-900">Action Needed: Pending Approvals</h3>
      </div>
      
      <div className="space-y-3">
        {expenses.map((exp: any) => (
          <div key={exp.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900">{exp.users?.full_name} <span className="text-slate-500 font-medium">requested</span> ${Number(exp.amount).toFixed(2)}</p>
              <p className="text-sm text-slate-600">{exp.description} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">({exp.category})</span></p>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => handleStatusUpdate(exp.id, 'REJECTED')}
                disabled={loadingId === exp.id}
                className="px-4 py-2 bg-white border border-slate-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleStatusUpdate(exp.id, 'APPROVED')}
                disabled={loadingId === exp.id}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition disabled:opacity-50 shadow-sm"
              >
                {loadingId === exp.id ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}