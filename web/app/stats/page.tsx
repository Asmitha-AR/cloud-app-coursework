'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { salaryApi } from '@/lib/api';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

type SalaryStats = {
    count: number;
    average: number;
    median: number;
    p25: number;
    p75: number;
};

export default function StatsPage() {
    const [stats, setStats] = useState<SalaryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        country: '',
        role: '',
        level: ''
    });
    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.country) params.append('country', filters.country);
            if (filters.role) params.append('role', filters.role);
            if (filters.level) params.append('level', filters.level);

            const response = await salaryApi.get(`/salaries/stats?${params.toString()}`);
            setStats(response.data);
        } catch {
            console.error('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="relative min-h-screen bg-slate-100 flex flex-col selection:bg-cyan-200/80 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-cyan-200/25 blur-3xl" />
                <div className="absolute top-32 -right-24 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
            </div>

            <nav className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2.5">
                        <BrandLogo size={40} />
                        <span className="font-bold text-lg tracking-tight text-slate-900">Insights</span>
                    </Link>
                    <Link href="/salaries"><Button variant="ghost" className="text-sm text-slate-700">View Database</Button></Link>
                </div>
            </nav>

            <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full p-6 lg:p-10 xl:p-12 space-y-6 animate-in fade-in duration-500">
                <section className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 lg:p-8 shadow-sm shadow-slate-900/5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Analytics Workspace</p>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Community Insights</h1>
                    <p className="text-slate-600 text-base lg:text-lg">Aggregated salary data from approved community submissions.</p>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/90 border border-slate-200/80 p-6 rounded-3xl space-y-6 shadow-sm shadow-slate-900/5">
                            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-500">Filters</h3>
                            <div className="space-y-4">
                                <Input className="rounded-xl border-slate-300 focus:border-slate-900" label="Country" placeholder="All" value={filters.country} onChange={(e) => handleFilterChange('country', e.target.value)} />
                                <Input className="rounded-xl border-slate-300 focus:border-slate-900" label="Role" placeholder="All" value={filters.role} onChange={(e) => handleFilterChange('role', e.target.value)} />
                                <Input className="rounded-xl border-slate-300 focus:border-slate-900" label="Level" placeholder="All" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)} />
                                <Button onClick={fetchStats} className="w-full rounded-xl bg-slate-900 hover:bg-slate-800">Apply Filters</Button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-8">
                        {loading ? (
                            <div className="bg-white/90 border border-slate-200/80 p-20 rounded-3xl flex items-center justify-center shadow-sm shadow-slate-900/5">
                                <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                            </div>
                        ) : stats && stats.count > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-900 text-white p-8 lg:p-10 rounded-3xl space-y-2 shadow-xl shadow-slate-900/25">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Average Salary</p>
                                        <p className="text-5xl font-bold tracking-tighter">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.average)}
                                        </p>
                                        <p className="text-xs text-slate-300 font-medium">Based on {stats.count} approved records</p>
                                    </div>
                                    <div className="bg-white/90 border border-slate-200/80 p-8 lg:p-10 rounded-3xl space-y-2 shadow-sm shadow-slate-900/5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Median (P50)</p>
                                        <p className="text-5xl font-bold tracking-tighter">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.median)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/90 border border-slate-200/80 p-8 lg:p-10 rounded-3xl space-y-2 shadow-sm shadow-slate-900/5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Lower Quartile (P25)</p>
                                        <p className="text-3xl font-bold tracking-tight">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.p25)}
                                        </p>
                                    </div>
                                    <div className="bg-white/90 border border-slate-200/80 p-8 lg:p-10 rounded-3xl space-y-2 shadow-sm shadow-slate-900/5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Upper Quartile (P75)</p>
                                        <p className="text-3xl font-bold tracking-tight">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.p75)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white/90 border border-slate-200/80 p-20 rounded-3xl text-center space-y-4 shadow-sm shadow-slate-900/5">
                                <p className="text-slate-600 font-semibold text-lg">No approved records found matching these filters.</p>
                                <p className="text-slate-500 text-sm">Statistics are only calculated from submissions with the &quot;APPROVED&quot; status.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
