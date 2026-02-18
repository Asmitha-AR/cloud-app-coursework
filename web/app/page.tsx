'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Toast } from '@/components/ui/Toast';
import BrandLogo from '@/components/BrandLogo';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, logout, isLoading } = useAuth();
  const [dismissedAuthToast, setDismissedAuthToast] = useState(false);
  const authParam = searchParams.get('auth');
  const authParamPresent = authParam === 'success';
  const showAuthToast = authParamPresent && !dismissedAuthToast;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (isAuthenticated && authParam === 'success') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router, authParam]);

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading || !isAuthenticated) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900 selection:bg-cyan-200/80 flex overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />
      </div>

      {showAuthToast && (
        <Toast
          message="Successfully logged in"
          onClose={() => setDismissedAuthToast(true)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="relative hidden lg:flex w-72 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="p-8 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            <BrandLogo size={48} />
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1.5">
          {[
            { label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', active: true },
            { label: 'Project', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
            { label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          ].map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${item.active
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                }`}
            >
              <svg className={`w-5 h-5 ${item.active ? 'opacity-100' : 'opacity-70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200/80">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-xs font-bold text-slate-500 hover:text-red-600">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Mobile only */}
        <nav className="lg:hidden border-b border-slate-200/80 bg-white/90 backdrop-blur h-16 px-6 flex items-center justify-between">
          <BrandLogo size={48} />
          <button className="p-2 -mr-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </nav>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 lg:p-10 xl:p-12 space-y-8 animate-in fade-in duration-700">
            <header className="rounded-3xl border border-slate-200/80 bg-white/75 backdrop-blur-sm p-6 lg:p-8 shadow-sm shadow-slate-900/5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Control Center</p>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-none">
                Overview
              </h2>
              <p className="text-slate-600 text-base lg:text-lg max-w-2xl">
                Manage your community actions and identity.
              </p>
            </header>

            {/* Success Bar if just logged in */}
            {authParamPresent && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-sm font-semibold animate-in slide-in-from-top-4 duration-500">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Session started successfully. All systems operational.</span>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  label: 'Security Status',
                  value: 'High',
                  tone: 'text-emerald-700 bg-emerald-100 border-emerald-200',
                  icon: 'M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z'
                },
                {
                  label: 'Last Login',
                  value: 'Today, 10:42',
                  tone: 'text-cyan-700 bg-cyan-100 border-cyan-200',
                  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                },
                {
                  label: 'Active Alerts',
                  value: '0',
                  tone: 'text-slate-700 bg-slate-100 border-slate-200',
                  icon: 'M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 100-20 10 10 0 000 20z'
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/80 border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm shadow-slate-900/5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.tone}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Featured Section */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="space-y-4 xl:col-span-3">
                <h3 className="font-bold text-lg text-slate-900 px-1">Salary Transparency</h3>
                <div className="relative overflow-hidden bg-white/85 border border-slate-200/80 rounded-[32px] p-8 flex flex-col justify-between h-[260px] group cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm shadow-slate-900/5" onClick={() => router.push('/salaries')}>
                  <div className="absolute -top-8 -right-12 h-36 w-36 rounded-full bg-cyan-100 blur-2xl opacity-80" />
                  <div>
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-6 border border-emerald-200">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold tracking-tight text-slate-900">View Salary Database</h4>
                    <p className="text-slate-600 text-sm mt-1.5 max-w-md">Explore community-shared salary data and trends with clean filters and country-level insights.</p>
                  </div>
                  <div className="flex items-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-900 transition-colors pt-4">
                    Explore Database
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4 xl:col-span-2">
                <h3 className="font-bold text-lg text-slate-900 px-1">Quick Actions</h3>
                <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  <button
                    className="p-7 bg-slate-900 text-white rounded-3xl text-left hover:scale-[1.01] transition-transform shadow-xl shadow-slate-900/20 flex flex-col h-full border border-slate-800"
                    onClick={() => router.push('/vote/report')}
                  >
                    <svg className="w-6 h-6 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    <span className="font-bold text-lg">View Reports</span>
                    <span className="text-slate-300 text-sm mt-1">Moderation queue and report history</span>
                  </button>
                  <button
                    className="p-7 bg-white/85 border border-slate-200 text-slate-900 rounded-3xl text-left hover:bg-white transition-colors flex flex-col h-full shadow-sm"
                    onClick={() => router.push('/stats')}
                  >
                    <svg className="w-6 h-6 mb-4 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002-2h2a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-bold text-lg">Insights</span>
                    <span className="text-slate-600 text-sm mt-1">See trends and health metrics</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
