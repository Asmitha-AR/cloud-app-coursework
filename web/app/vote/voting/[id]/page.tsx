'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { salaryApi, voteApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SalaryDetailsPage() {
    const { id } = useParams();
    const listPath = '/salaries';
    const { isAuthenticated } = useAuth();
    const [salary, setSalary] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updatingVote, setUpdatingVote] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [salaryRes, summaryRes] = await Promise.all([
                    salaryApi.get(`/salaries/${id}`),
                    voteApi.get(`/votes/${id}/summary`)
                ]);
                setSalary(salaryRes.data);
                setSummary(summaryRes.data);
            } catch (err) {
                setError('Could not find salary details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const refreshData = async () => {
        const [salaryRes, summaryRes] = await Promise.all([
            salaryApi.get(`/salaries/${id}`),
            voteApi.get(`/votes/${id}/summary`)
        ]);
        setSalary(salaryRes.data);
        setSummary(summaryRes.data);
    };

    const handleVote = async (voteType: 'UP' | 'DOWN') => {
        setUpdatingVote(true);
        try {
            await voteApi.post('/votes', { submissionId: id, voteType });
            await refreshData();
            setToast(`Vote submitted: ${voteType}`);
        } catch (err) {
            setToast('Voting failed. Please login first.');
        } finally {
            setUpdatingVote(false);
        }
    };

    const handleRemoveVote = async () => {
        setUpdatingVote(true);
        try {
            await voteApi.delete(`/votes/${id}`);
            await refreshData();
            setToast('Vote removed');
        } catch (err) {
            setToast('Failed to remove vote');
        } finally {
            setUpdatingVote(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
    );

    if (error || !salary) return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f9ff_0%,_#f8fafc_45%,_#ffffff_100%)] flex flex-col items-center justify-center p-6 space-y-4">
            <p className="text-zinc-600 font-medium">{error || 'Salary not found'}</p>
            <Link href={listPath}><Button variant="outline">Back to List</Button></Link>
        </div>
    );

    const toneByStatus: Record<string, string> = {
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
        APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    const statusTone = toneByStatus[salary.status] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200';
    const currencyValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: salary.currency, maximumFractionDigits: 0 }).format(salary.salaryAmount);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#eef2ff_30%,_#f8fafc_65%,_#ffffff_100%)] flex flex-col selection:bg-sky-100">
            {toast && <Toast message={toast} onClose={() => setToast('')} />}

            <nav className="border-b border-zinc-200/80 bg-white/90 backdrop-blur">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href={listPath} className="flex items-center text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Database
                    </Link>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                        ID: {salary.id.substring(0, 8)}
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-10 space-y-7 sm:space-y-10 animate-in fade-in duration-500">
                <header className="bg-white/90 border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] space-y-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusTone}`}>
                                {salary.status}
                            </span>
                            {summary && (
                                <span className="bg-sky-50 text-sky-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-sky-200">
                                    Score {summary.score}
                                </span>
                            )}
                            {salary.isAnonymous && (
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-200">
                                    Anonymous
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900">{salary.role}</h1>
                        <p className="text-base sm:text-xl text-zinc-600 font-medium">{salary.company} • {salary.country}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.16em]">Experience</p>
                            <p className="text-2xl font-bold text-zinc-900">{salary.experienceYears}y <span className="text-sm text-zinc-500">{salary.level}</span></p>
                        </div>
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.16em]">Pay Period</p>
                            <p className="text-2xl font-bold text-zinc-900">{salary.period.replace('ly', '')}</p>
                        </div>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl space-y-3 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.8)]">
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.22em]">Total Compensation</p>
                        <div className="space-y-1">
                            <p className="text-4xl sm:text-5xl font-black tracking-tight">{currencyValue}</p>
                            <span className="text-zinc-300 font-bold uppercase text-xs tracking-[0.12em]">per {salary.period.replace('ly', '')}</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white to-sky-50/60 border border-zinc-200 p-6 sm:p-8 rounded-3xl flex flex-col justify-center space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-zinc-900">Verified Submission</h3>
                            <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                                This salary was submitted anonymously and is subject to community moderation.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-zinc-200 p-5 sm:p-8 rounded-3xl space-y-6 shadow-[0_20px_55px_-40px_rgba(15,23,42,0.4)]">
                    <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Community Voting</h3>
                        <p className="text-zinc-600 text-sm">Vote to help validate this submission.</p>
                    </div>

                    {summary && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                <p className="text-xs uppercase tracking-[0.15em] text-emerald-700 font-bold">Upvotes</p>
                                <p className="text-3xl font-black text-emerald-900">{summary.upvotes}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                                <p className="text-xs uppercase tracking-[0.15em] text-rose-700 font-bold">Downvotes</p>
                                <p className="text-3xl font-black text-rose-900">{summary.downvotes}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                                <p className="text-xs uppercase tracking-[0.15em] text-sky-700 font-bold">Score</p>
                                <p className="text-3xl font-black text-sky-900">{summary.score}</p>
                            </div>
                        </div>
                    )}

                    {isAuthenticated ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <Button
                                onClick={() => handleVote('UP')}
                                className="py-3.5 bg-gradient-to-r from-zinc-950 to-zinc-800 hover:from-zinc-900 hover:to-zinc-700"
                                isLoading={updatingVote}
                            >
                                Upvote
                            </Button>
                            <Button
                                onClick={() => handleVote('DOWN')}
                                variant="outline"
                                className="py-3.5 border-zinc-300 hover:bg-zinc-50"
                                isLoading={updatingVote}
                            >
                                Downvote
                            </Button>
                            <Button
                                onClick={handleRemoveVote}
                                variant="ghost"
                                className="py-3.5 text-zinc-700 hover:bg-zinc-100"
                                isLoading={updatingVote}
                            >
                                Remove Vote
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-600">Login is required to vote or report.</p>
                    )}
                </section>

                {isAuthenticated && (
                    <section className="bg-gradient-to-b from-white to-amber-50/40 border border-zinc-200 p-5 sm:p-8 rounded-3xl space-y-6 shadow-[0_20px_55px_-40px_rgba(15,23,42,0.4)]">
                        <div className="space-y-1">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Report Submission</h3>
                            <p className="text-zinc-600 text-sm">Flag this entry if the data appears incorrect.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="py-3.5 border-rose-300 text-rose-700 hover:bg-rose-50"
                            onClick={async () => {
                                try {
                                    await voteApi.post('/reports', { submissionId: id, reason: 'Suspicious salary data' });
                                    setToast('Report submitted');
                                } catch {
                                    setToast('Failed to submit report');
                                }
                            }}
                        >
                            Report This Entry
                        </Button>
                    </section>
                )}

                <footer className="pt-8 border-t border-zinc-200 flex flex-col items-center space-y-3">
                    <p className="text-zinc-500 text-sm font-medium">Shared on {new Date(salary.submittedAt).toLocaleDateString()}</p>
                    <Link href="/stats">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-700">
                            Check Community Stats
                        </span>
                    </Link>
                </footer>
            </main>
        </div>
    );
}
