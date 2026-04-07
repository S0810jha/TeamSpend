"use client";

import { useState } from "react";

export default function ExportCsvButton({ data, filename = "vaultpay_export" }: { data: any[], filename?: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    try {
      if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
      }

      const headers = ["Transaction ID", "Date", "Employee", "Department", "Category", "Description", "Amount", "Status"];

      const csvRows = data.map(exp => [
        exp.id,
        new Date(exp.created_at).toLocaleDateString('en-GB'),
        `"${exp.users?.full_name || 'Unknown'}"`, 
        `"${exp.teams?.name || 'Unassigned'}"`,
        exp.category,
        `"${(exp.description || '').replace(/"/g, '""')}"`, 
        exp.amount,
        exp.status
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to export CSV", error);
      alert("An error occurred while generating the CSV.");
    } finally {
      setTimeout(() => setIsExporting(false), 500); 
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className="px-4 py-2 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {isExporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}