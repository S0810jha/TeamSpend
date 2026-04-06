"use client";

import { useState, useEffect } from "react";

export default function TeamTransactionsPanel({ expenses }: { expenses: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scrolling when the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      {/* The Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm border border-dashed border-slate-200 rounded-2xl text-slate-500 font-semibold hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        View All Transactions
      </button>

      {/* The Overlay & Drawer Container */}
      <div 
        className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        {/* Dark background overlay (Fades in/out) */}
        <div 
          className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* The Sliding Panel (Slides in from the right) */}
        <div 
          className={`relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Transaction History</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Complete audit log for this department.</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Drawer Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-slate-400 font-semibold border-b border-slate-100 text-xs uppercase tracking-wider sticky top-0 bg-white z-10">
                <tr>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Description & Category</th>
                  <th className="py-3 pl-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 pr-4 font-medium text-slate-500 whitespace-nowrap">
                      {/* FIXED: Added Locale and Options to match Server vs Client formatting */}
                      {new Date(exp.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">{exp.users?.full_name}</td>
                    <td className="py-4 px-4">
                      <div className="text-slate-900 font-medium">{exp.description}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold">
                          {exp.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pl-4 text-right font-black text-slate-900 text-base whitespace-nowrap">
                      ${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 italic">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  );
}