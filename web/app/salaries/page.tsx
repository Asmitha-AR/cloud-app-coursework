'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { salaryApi } from '@/lib/api';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/context/AuthContext';

type SalarySubmission = {
    id: string;
    role: string;
    level: string;
    company: string;
    country: string;
    experienceYears: number;
    currency: string;
    salaryAmount: number;
    period: string;
    status: string;
};

export default function SalariesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [salaries, setSalaries] = useState<SalarySubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        const fetchSalaries = async () => {
            try {
                const response = await salaryApi.get('/salaries');
                setSalaries(response.data);
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 401) {
                    router.push('/auth/login');
                } else {
                    setError('Failed to load salaries.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSalaries();
    }, [router, authLoading, isAuthenticated]);

    if (loading || authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    const approvedCount = salaries.filter((s) => s.status === 'APPROVED').length;
    const pendingCount = salaries.filter((s) => s.status === 'PENDING').length;
    const countriesCount = new Set(salaries.map((s) => s.country)).size;

    return (
        <div className="relative min-h-screen bg-slate-100 flex flex-col selection:bg-cyan-200/80 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
                <div className="absolute top-44 -right-24 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
            </div>

            <nav className="relative z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl items-center">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2.5">
                        <Link href="/"><BrandLogo size={48} /></Link>
                        <span className="font-bold text-lg tracking-tight text-slate-900">Salaries</span>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" className="text-sm text-slate-600">Back to Dashboard</Button>
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full p-6 lg:p-10 xl:p-12 space-y-6 animate-in fade-in duration-500">
                <section className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 lg:p-8 shadow-sm shadow-slate-900/5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Transparency Hub</p>
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Community Salaries</h1>
                            <p className="text-slate-600 max-w-2xl">Explore real salary submissions from the community, compare compensation trends, and vote on data quality.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/salary/submit">
                                <Button className="text-sm font-bold bg-slate-900 hover:bg-slate-800 rounded-xl px-6 py-3">Submit Yours</Button>
                            </Link>
                            <Button variant="outline" className="text-sm rounded-xl px-6 py-3" onClick={() => router.push('/stats')}>
                                View Insights
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm shadow-slate-900/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Total Entries</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{salaries.length}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm shadow-emerald-900/5">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-[0.18em]">Approved</p>
                        <p className="text-3xl font-bold text-emerald-900 mt-2">{approvedCount}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/90 p-5 shadow-sm shadow-cyan-900/5">
                        <p className="text-xs font-bold text-cyan-700 uppercase tracking-[0.18em]">Pending / Countries</p>
                        <p className="text-3xl font-bold text-cyan-900 mt-2">{pendingCount} / {countriesCount}</p>
                    </div>
                </section>

                {error ? (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold">
                        {error}
                    </div>
                ) : (
                    <div className="bg-white/90 border border-slate-200/80 rounded-3xl overflow-hidden overflow-x-auto shadow-sm shadow-slate-900/5">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Company</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Experience</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Salary</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {salaries.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                                        onClick={() => router.push(`/vote/voting/${s.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{s.role}</div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wide">{s.level}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{s.company} ({s.country})</td>
                                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{s.experienceYears}y</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(s.salaryAmount)}
                                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">/ {s.period.replace('ly', '')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {salaries.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                            No salary submissions found yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
