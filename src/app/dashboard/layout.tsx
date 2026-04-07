// src/app/dashboard/layout.tsx
import { getUserProfile } from '@/utils/getUser';
import ClientSidebar from '@/components/dashboard/ClientSidebar';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { profile } = await getUserProfile();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA] font-sans text-slate-900 selection:bg-indigo-100">
      <ClientSidebar profile={profile} />
      <main className="flex-1 overflow-y-auto relative w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;