"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const CreateTeamForm = ({ startupId }: { startupId: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg("");
        setSuccessMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; 

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(form); 
    const teamName = formData.get("teamName");
    const initialBudget = formData.get("initialBudget");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");

    try {
      await axios.post("/api/teams/create", {
        startupId,
        teamName,
        initialBudget: parseFloat(initialBudget as string),
        startDate,
        endDate,
      });

      setSuccessMsg("Team and budget created successfully!");
      form.reset(); 
      router.refresh(); 

    } catch (error) {
      setSuccessMsg(""); 
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Failed to create team");
      } else {
        setErrorMsg("An unexpected network error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreateTeam} className="space-y-4">
      
      <div className="flex justify-center w-full min-h-[40px]">
        {errorMsg && (
          <div className="p-2 bg-red-50 text-red-700 w-full text-center text-sm rounded-lg border border-red-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2 bg-green-50 text-green-700 w-full text-center text-sm rounded-lg border border-green-100">
            {successMsg}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Department Name</label>
          <input
            type="text"
            name="teamName"
            required
            placeholder="e.g., Marketing"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Total Budget ($)</label>
          <input
            type="number"
            name="initialBudget"
            required
            min="0"
            step="0.01"
            placeholder="5000.00"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm text-slate-700"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm text-slate-700"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-70 text-sm"
        >
          {loading ? "Creating..." : "Create Team"}
        </button>
      </div>
    </form>
  );
};

export default CreateTeamForm;