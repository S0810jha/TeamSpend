"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-sm w-full font-medium text-slate-300 hover:text-red-600 transition px-3 py-2 rounded-md hover:bg-red-50"
    >
      Log out
    </button>
  );
}