"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function UserFilters({ teams }: { teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRole = searchParams.get("role") || "";
  const currentTeam = searchParams.get("team") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    params.set("page", "1"); 
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-3">
      <select
        value={currentRole}
        onChange={(e) => handleFilterChange("role", e.target.value)}
        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
      >
        <option value="">All Roles</option>
        <option value="ADMIN">Admin</option>
        <option value="ANALYST">Analyst</option>
        <option value="EMPLOYEE">Employee</option>
      </select>

      <select
        value={currentTeam}
        onChange={(e) => handleFilterChange("team", e.target.value)}
        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm max-w-[150px] truncate"
      >
        <option value="">All Departments</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}