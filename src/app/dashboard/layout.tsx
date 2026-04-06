// src/app/dashboard/layout.tsx
import { getUserProfile } from '@/utils/getUser';
import ClientSidebar from '@/components/dashboard/ClientSidebar';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  // Securely fetch the user's profile on the server
  const { profile } = await getUserProfile();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA] font-sans text-slate-900 selection:bg-indigo-100">
      
      {/* The ClientSidebar handles both the mobile top-nav and the 
        desktop/mobile sliding sidebar internally. 
      */}
      <ClientSidebar profile={profile} />

      {/* Main Page Content */}
      <main className="flex-1 overflow-y-auto relative w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;