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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
            <p className="text-zinc-500 font-medium">{error || 'Salary not found'}</p>
            <Link href={listPath}><Button variant="outline">Back to List</Button></Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col selection:bg-zinc-200">
            {toast && <Toast message={toast} onClose={() => setToast('')} />}

            <nav className="border-b border-zinc-200 bg-white">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={listPath} className="flex items-center text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Database
                    </Link>
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        ID: {salary.id.substring(0, 8)}
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-12 animate-in fade-in duration-500">
                <header className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                {salary.status}
                            </span>
                            {summary && (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                    Score {summary.score}
                                </span>
                            )}
                            {salary.isAnonymous && (
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                    Anonymous
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{salary.role}</h1>
                        <p className="text-xl text-zinc-500 font-medium">{salary.company} • {salary.country}</p>
                    </div>

                    <div className="flex items-center space-x-6 p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Experience</p>
                            <p className="text-2xl font-bold">{salary.experienceYears}y <span className="text-sm text-zinc-400">{salary.level}</span></p>
                        </div>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black text-white p-10 rounded-[40px] space-y-2 group shadow-2xl shadow-black/10">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Total Compensation</p>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-5xl font-bold tracking-tighter">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: salary.currency, maximumFractionDigits: 0 }).format(salary.salaryAmount)}
                            </span>
                            <span className="text-zinc-500 font-bold uppercase text-sm">/ {salary.period.replace('ly', '')}</span>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 p-10 rounded-[40px] flex flex-col justify-center space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">Verified Submission</h3>
                            <p className="text-sm text-zinc-500 font-medium">
                                This salary was submitted anonymously and is subject to community moderation.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-zinc-200 p-8 lg:p-12 rounded-[40px] space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold tracking-tight">Community Voting</h3>
                        <p className="text-zinc-500 text-sm">Vote to help validate this submission.</p>
                    </div>

                    {summary && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                                <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Upvotes</p>
                                <p className="text-2xl font-bold text-zinc-900">{summary.upvotes}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                                <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Downvotes</p>
                                <p className="text-2xl font-bold text-zinc-900">{summary.downvotes}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                                <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Score</p>
                                <p className="text-2xl font-bold text-zinc-900">{summary.score}</p>
                            </div>
                        </div>
                    )}

                    {isAuthenticated ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button
                                onClick={() => handleVote('UP')}
                                className="py-4"
                                isLoading={updatingVote}
                            >
                                Upvote
                            </Button>
                            <Button
                                onClick={() => handleVote('DOWN')}
                                variant="outline"
                                className="py-4"
                                isLoading={updatingVote}
                            >
                                Downvote
                            </Button>
                            <Button
                                onClick={handleRemoveVote}
                                variant="ghost"
                                className="py-4"
                                isLoading={updatingVote}
                            >
                                Remove Vote
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-500">Login is required to vote or report.</p>
                    )}
                </section>

                {isAuthenticated && (
                    <section className="bg-white border border-zinc-200 p-8 lg:p-12 rounded-[40px] space-y-8">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold tracking-tight">Report Submission</h3>
                            <p className="text-zinc-500 text-sm">Flag this entry if the data appears incorrect.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="py-4 border-red-200 text-red-600 hover:bg-red-50"
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

                <footer className="pt-12 border-t border-zinc-100 flex flex-col items-center space-y-4">
                    <p className="text-zinc-400 text-sm font-medium">Shared on {new Date(salary.submittedAt).toLocaleDateString()}</p>
                    <Link href="/stats">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black cursor-pointer transition-colors underline underline-offset-4 decoration-zinc-200 hover:decoration-black">
                            Check Community Stats
                        </span>
                    </Link>
                </footer>
            </main>
        </div>
    );
}
