import Logo from "@/components/Logo";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/LogoutButton"; 

const asset = [
  {
    i: 1,
    title: "Register your Startup",
    description: "Create your company workspace in seconds. As the Founder, you instantly get Admin rights to manage budgets and teams.",
  },
  {
    i: 2,
    title: "Invite your Team",
    description: "Add employees to specific departments. Assign Roles like Analyst for your finance team, or Employee for standard workers.",
  },
  {
    i: 3,
    title: "Track Everything",
    description: "Employees log expenses effortlessly. Admins approve or reject them while monitoring live dashboard analytics.",
  },
];

const LandingPage = async () => {
  // 1. Initialize Supabase and check if the user is logged in
  // Using the exact pattern from our API routes
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto w-full">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Conditionally render Nav buttons based on Supabase User state */}
          {!user ? (
            <>
              <Link 
                href="/login" 
                className="text-sm sm:text-base text-slate-600 hover:text-slate-900 font-medium px-2 sm:px-4 py-2 transition"
              >
                Log in
              </Link>
              <Link 
                href="/register" 
                className="text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition shadow-sm whitespace-nowrap"
              >
                Register <span className="hidden sm:inline">Startup</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm sm:text-base text-blue-600 hover:text-blue-800 font-semibold px-2 sm:px-4 py-2 transition"
              >
                Dashboard
              </Link>
              <div className="ml-2 border-l border-slate-200 pl-4 flex items-center">
                <LogoutButton />
              </div>
            </>
          )}

        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-blue-100">
          <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-600"></span>
          B2B Expense Management
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 sm:mb-8 max-w-4xl leading-tight sm:leading-tight lg:leading-tight">
          Control your startup&apos;s <br className="hidden md:block" /> 
          spending in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">real-time.</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mb-8 sm:mb-12 leading-relaxed px-2 sm:px-0">
          The ultimate multi-tenant dashboard. Give your employees an easy way to log expenses, while giving founders and analysts total visibility over the budget.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          
          {/* Conditionally render Hero buttons */}
          {!user ? (
            <>
              <Link 
                href="/register" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto flex items-center justify-center"
              >
                Get Started
              </Link>
              <Link 
                href="/login" 
                className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition shadow-sm w-full sm:w-auto flex items-center justify-center"
              >
                Employee Login
              </Link>
            </>
          ) : (
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto flex items-center justify-center"
            >
              Go to your Workspace &rarr;
            </Link>
          )}

        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white border-t border-slate-200 py-16 sm:py-20 mt-8 sm:mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
          {
            asset.map((item) => (
              <div key={item.i} className="bg-slate-50  p-5 rounded-2xl border border-slate-100 ">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-lg sm:text-xl font-bold border border-indigo-100">
                  {item.i}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">{item.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {item.description}
                </p>
            </div>
            ))
          }
        </div>
      </section>
    </div>
  );
};

export default LandingPage;