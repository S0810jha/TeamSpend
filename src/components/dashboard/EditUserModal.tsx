"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Team = { id: string; name: string };
type User = { id: string; full_name: string; role: string };

export default function EditUserModal({ 
  user, 
  teams, 
  currentTeamId 
}: { 
  user: User; 
  teams: Team[]; 
  currentTeamId: string | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // FIX 1: Create an easy boolean to check if the target user is an Admin
  const isAdmin = user.role === 'ADMIN';

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setErrorMsg("");

    try {
      await axios.post("/api/users/update", {
        userId: user.id,
        fullName: formData.get("fullName"),
        // If they are an admin, the disabled dropdowns won't send data, so we force the original values!
        role: isAdmin ? 'ADMIN' : formData.get("role"),
        teamId: isAdmin ? currentTeamId : formData.get("teamId"),
      });

      setIsOpen(false);
      router.refresh(); 
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Failed to update user");
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg("");

    try {
      await axios.post("/api/users/delete", { userId: user.id });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Failed to delete user");
      } else {
        setErrorMsg("An unexpected error occurred");
      }
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setConfirmDelete(false);
    setErrorMsg("");
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-left">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Employee</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={user.full_name}
                  required
                  disabled={confirmDelete || isDeleting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">System Role</label>
                <select
                  name="role"
                  defaultValue={user.role}
                  required
                  // FIX 2: Disable if the user is an admin!
                  disabled={confirmDelete || isDeleting || isAdmin}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Team</label>
                <select
                  name="teamId"
                  defaultValue={currentTeamId || ""}
                  // FIX 3: Disable if the user is an admin!
                  disabled={confirmDelete || isDeleting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Unassigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FIX 4: Show a warning message so the Admin understands why the dropdowns are locked */}
              {isAdmin && (
                <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100 font-medium">
                  System Roles cannot be changed for Admin accounts.
                </div>
              )}

              <div className="pt-6 mt-2 border-t border-slate-100">
                {confirmDelete ? (
                  <div className="space-y-3">
                    <p className="text-sm text-red-600 font-medium text-center">
                      Are you sure? This will permanently delete the user and their login access.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={isDeleting}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-70 text-sm"
                      >
                        {isDeleting ? "Deleting..." : "Yes, Delete User"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    {isAdmin ? (
                      <span className="text-xs text-slate-400 italic">Admins cannot be deleted.</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition"
                      >
                        Delete User
                      </button>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-70 text-sm"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}