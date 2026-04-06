// src/components/dashboard/ClientSidebar.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';

export default function ClientSidebar({ profile }: { profile: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Helper function to check if a link is active
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* MOBILE HEADER (Visible only on sm screens and below) */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4 border-b border-slate-800 text-white shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Logo isDarkBg={true} />
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          {isMobileMenuOpen ? (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          )}
        </button>
      </div>

      {/* MOBILE OVERLAY (Darkens the background when menu is open) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* THE SIDEBAR (Fixed on desktop, sliding drawer on mobile) */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-slate-900 text-white shadow-2xl md:shadow-none flex flex-col shrink-0
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Startup Info */}
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-white truncate">
            {profile.startups?.name || 'Workspace'}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black border border-indigo-500/30">
               {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
               <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest truncate leading-tight">
                 {profile.full_name}
               </p>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate leading-tight">
                 {profile.role}
               </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
          
          <Link 
            href="/dashboard" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              isActive('/dashboard') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Overview
          </Link>

          {profile.role === 'ADMIN' && (
            <>
              <Link 
                href="/dashboard/teams" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  isActive('/dashboard/teams') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Manage Teams
              </Link>
              <Link 
                href="/dashboard/users" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  isActive('/dashboard/users') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                User Directory
              </Link>
            </>
          )}

          {profile.role === 'ANALYST' && (
            <Link 
              href="/dashboard/reports" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                isActive('/dashboard/reports') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
               <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Financial Reports
            </Link>
          )}

          {profile.role === 'EMPLOYEE' && (
            <Link 
              href="/dashboard/expenses" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                isActive('/dashboard/expenses') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
               <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              My Expenses
            </Link>
          )}
        </nav>

        {/* Logo & Logout Footer */}
        <div className="p-5 mt-auto border-t border-slate-800 space-y-4">
          <div className="flex justify-center opacity-80 hover:opacity-100 transition-opacity">
            <Logo isDarkBg={true} />
          </div>
          <div className="w-full flex justify-center rounded-lg bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/50 transition-colors">
            <LogoutButton /> 
          </div>
        </div>
      </aside>
    </>
  );
}