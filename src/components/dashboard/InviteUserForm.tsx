"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Team = {
  id: string;
  name: string;
};

const InviteUserForm = ({ startupId, teams }: { startupId: string, teams: Team[] })=>{
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Automatically clear messages after 3 seconds
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg("");
        setSuccessMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  const handleInviteUser = async (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const form = e.currentTarget;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(form);

    try {
      await axios.post("/api/users/invite", {
        startupId,
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
        teamId: formData.get("teamId"),
      });

      setSuccessMsg("Employee invited and assigned to team successfully!");
      form.reset(); 
      router.refresh();

    } catch (error) {
      setSuccessMsg(""); 
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Failed to invite user");
      } else {
        setErrorMsg("An unexpected network error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleInviteUser} className="space-y-3">
      
      {/* Fixed height container for messages so the form doesn't jump around */}
      <div className="flex justify-center w-full min-h-[35px]">
        {errorMsg && (
          <div className="p-2 bg-red-50 text-red-700 w-full text-center text-sm rounded-lg border border-red-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-1 bg-green-50 text-green-700 w-full text-center text-sm rounded-lg border border-green-100">
            {successMsg}
          </div>
        )}
      </div>

      {/* Changed to a vertical stack (space-y-4) to fit the narrow left column */}
      <div className="space-y-3">
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            required
            placeholder="Jane Doe"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            required
            placeholder="jane@startup.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm"
          />
        </div>

        <div className="w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Temporary Password</label>
            <input
              type="text" 
              name="password"
              required
              minLength={6}
              placeholder="secret123"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm"
            />
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">System Role</label>
          <select
            name="role"
            required
            defaultValue="EMPLOYEE"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm bg-white"
          >
            <option value="EMPLOYEE">Employee (Submit Expenses)</option>
            <option value="ANALYST">Analyst (View Reports)</option>
            <option value="ADMIN">Admin (Full Control)</option>
          </select>
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Assign to Team</label>
          <select
            name="teamId"
            required
            defaultValue=""
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition text-sm bg-white"
          >
            <option value="" disabled>
              Select a department...
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-70 text-sm"
        >
          {loading ? "Creating Account..." : "Create Employee Account"}
        </button>
      </div>
    </form>
  )
}

export default InviteUserForm;