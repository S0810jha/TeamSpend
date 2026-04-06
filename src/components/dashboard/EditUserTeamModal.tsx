"use client";

import { useState } from "react";

type TeamOption = { id: string; name: string };

export default function EditUserTeamModal({ 
  userId, 
  userName, 
  currentTeamName, 
  activeTeams 
}: { 
  userId: string; 
  userName: string; 
  currentTeamName: string | null;
  activeTeams: TeamOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // In a real app, you would POST to an API route here to update the team_members table
    // await axios.post('/api/users/assign-team', { userId, teamId: selectedTeam });
    
    setTimeout(() => {
      setIsSaving(false);
      setIsOpen(false);
      // router.refresh(); // Refresh to see changes
    }, 800);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition"
      >
        Change Team
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-extrabold text-slate-900">Assign Department</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</p>
                <p className="font-bold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Currently: {currentTeamName || "Unassigned"}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Active Team</label>
                {activeTeams.length > 0 ? (
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
                  >
                    <option value="" disabled>Select a department...</option>
                    {activeTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-xs font-semibold">
                    No active teams available. Please create a team or extend a budget cycle first.
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                  Note: Teams with expired or missing budgets are automatically hidden from this list to prevent invalid expense routing.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition">
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={!selectedTeam || isSaving} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}