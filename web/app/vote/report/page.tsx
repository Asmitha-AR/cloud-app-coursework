'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { voteApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';

type ReportItem = {
    id: string;
    submissionId: string;
    userId: string;
    reason: string;
    createdAt: string;
    submissionStatus: string;
    reportStatus: string;
    reportsForSubmission: number;
    downvotesForSubmission: number;
};

type ReportListResponse = {
    items: ReportItem[];
    total: number;
    page: number;
    pageSize: number;
};

type ReportHistoryItem = {
    reportId: string;
    status: string;
    createdAt: string;
    reason: string;
    userId: string;
};

type ReportDetail = {
    submissionId: string;
    reportStatus?: string;
    resolutionAction?: string;
    internalNote?: string;
    submission?: {
        company?: string;
        role?: string;
        country?: string;
        salaryAmount?: number;
        currency?: string;
    };
    voteSummary?: {
        upvotes?: number;
        downvotes?: number;
        score?: number;
        threshold?: number;
    };
    reportHistory?: ReportHistoryItem[];
};

export default function ReportsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, token } = useAuth();

    const [reports, setReports] = useState<ReportItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [selectedReportDetail, setSelectedReportDetail] = useState<ReportDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        reason: '',
        q: '',
        sort: 'latest',
        from: '',
        to: ''
    });

    const [reviewForm, setReviewForm] = useState({
        status: 'IN_REVIEW',
        moderationAction: 'NONE',
        internalNote: ''
    });

    const roles = useMemo(() => {
        if (!token) return ['USER'];
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const rawRole = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? 'USER';
            if (Array.isArray(rawRole)) return rawRole.map((r: unknown) => String(r).toUpperCase());
            return String(rawRole).toUpperCase().split(',').map((r) => r.trim()).filter(Boolean);
        } catch {
            return ['USER'];
        }
    }, [token]);

    const isModerator = roles.includes('ADMIN') || roles.includes('MODERATOR');

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.reason) params.append('reason', filters.reason);
            if (filters.q) params.append('q', filters.q);
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);
            params.append('sort', filters.sort);
            params.append('page', String(page));
            params.append('pageSize', String(pageSize));

            const res = await voteApi.get<ReportListResponse>(`/reports?${params.toString()}`);
            setReports(res.data.items);
            setTotal(res.data.total);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            if (status === 401) {
                router.push('/auth/login');
                return;
            }
            if (status === 403) {
                setError('Only ADMIN/MODERATOR can access reports moderation.');
                return;
            }
            setError(message ? `Failed to load reports: ${message}` : 'Failed to load reports.');
        } finally {
            setLoading(false);
        }
    }, [filters, page, pageSize, router]);

    const fetchReportDetail = useCallback(async (reportId: string) => {
        setDetailLoading(true);
        try {
            const res = await voteApi.get<ReportDetail>(`/reports/${reportId}`);
            setSelectedReportDetail(res.data);
            setSelectedReportId(reportId);
            setReviewForm({
                status: res.data.reportStatus || 'IN_REVIEW',
                moderationAction: res.data.resolutionAction || 'NONE',
                internalNote: res.data.internalNote || ''
            });
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setActionMessage(message || 'Failed to load report detail.');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        fetchReports();
    }, [authLoading, isAuthenticated, router, fetchReports]);

    const handleDelete = async (reportId: string) => {
        setActionMessage('');
        try {
            await voteApi.delete(`/reports/${reportId}`);
            setActionMessage('Report deleted.');
            if (selectedReportId === reportId) {
                setSelectedReportId(null);
                setSelectedReportDetail(null);
            }
            fetchReports();
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setActionMessage(status === 403 ? 'No permission to delete reports.' : (message || 'Failed to delete report.'));
        }
    };

    const handleReviewUpdate = async () => {
        if (!selectedReportId) return;
        setActionMessage('');
        try {
            await voteApi.patch(`/reports/${selectedReportId}/review`, {
                Status: reviewForm.status,
                ModerationAction: reviewForm.moderationAction,
                InternalNote: reviewForm.internalNote
            });
            setActionMessage('Report review updated.');
            await fetchReports();
            await fetchReportDetail(selectedReportId);
        } catch (err: unknown) {
            const response = (err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string });
            const data = response.response?.data;
            const status = response.response?.status;
            const message = data?.message || response.message || 'Failed to update report.';
            const errorDetails = data?.errors
                ? Object.values(data.errors).flat().join(' | ')
                : '';
            const raw = data && typeof data !== 'object' ? ` | ${String(data)}` : '';
            const withStatus = status ? `[${status}] ${message}` : message;
            setActionMessage(errorDetails ? `${withStatus}: ${errorDetails}${raw}` : `${withStatus}${raw}`);
        }
    };

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const newCount = reports.filter((r) => r.reportStatus === 'NEW').length;
    const inReviewCount = reports.filter((r) => r.reportStatus === 'IN_REVIEW').length;
    const actionTakenCount = reports.filter((r) => r.reportStatus === 'ACTION_TAKEN').length;
    const statusTone: Record<string, string> = {
        NEW: 'bg-amber-50 text-amber-700 border-amber-200',
        IN_REVIEW: 'bg-sky-50 text-sky-700 border-sky-200',
        ACTION_TAKEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        DISMISSED: 'bg-zinc-100 text-zinc-700 border-zinc-200'
    };
    const statusClass = (status: string) => statusTone[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
    const formatDate = (value: string) => new Date(value).toLocaleString();
    const selectedSummary = reports.find((r) => r.id === selectedReportId) ?? null;

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-100 flex flex-col selection:bg-cyan-200/80 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/25 blur-3xl" />
                <div className="absolute top-36 -right-24 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
            </div>

            <nav className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <Link href="/"><BrandLogo size={48} /></Link>
                        <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">Moderation Reports</span>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" className="text-sm text-slate-700">Back to Dashboard</Button>
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-10 space-y-5 sm:space-y-6">
                <section className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 sm:p-6 lg:p-8 shadow-sm shadow-slate-900/5">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Moderation Console</p>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Reports Moderation</h1>
                        <p className="text-sm sm:text-base text-slate-600 max-w-3xl">Filter, review, and resolve reported submissions with clear workflow controls and audit history.</p>
                    </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5 shadow-sm shadow-slate-900/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Visible Reports</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{reports.length}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5 shadow-sm">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-[0.18em]">New</p>
                        <p className="text-3xl font-bold text-amber-900 mt-2">{newCount}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-4 sm:p-5 shadow-sm">
                        <p className="text-xs font-bold text-sky-700 uppercase tracking-[0.18em]">In Review</p>
                        <p className="text-3xl font-bold text-sky-900 mt-2">{inReviewCount}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5 shadow-sm">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-[0.18em]">Action Taken</p>
                        <p className="text-3xl font-bold text-emerald-900 mt-2">{actionTakenCount}</p>
                    </div>
                </section>

                {actionMessage && <div className="p-3.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-2xl text-sm font-semibold">{actionMessage}</div>}
                {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold">{error}</div>}

                <section className="bg-white/90 border border-slate-200/80 rounded-3xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 shadow-sm shadow-slate-900/5">
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-[0.14em]">Status</label>
                        <select className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white" value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                            <option value="">All</option>
                            <option value="NEW">NEW</option>
                            <option value="IN_REVIEW">IN_REVIEW</option>
                            <option value="ACTION_TAKEN">ACTION_TAKEN</option>
                            <option value="DISMISSED">DISMISSED</option>
                        </select>
                    </div>
                    <Input label="Reason" value={filters.reason} onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))} />
                    <Input label="Search" placeholder="Submission/Company/Role/Country" value={filters.q} onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))} />
                    <Input label="From" type="date" value={filters.from} onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))} />
                    <Input label="To" type="date" value={filters.to} onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))} />
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-[0.14em]">Sort</label>
                        <select className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white" value={filters.sort} onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}>
                            <option value="latest">Latest first</option>
                            <option value="most_reported">Most reported</option>
                            <option value="most_downvoted">Most downvoted</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row gap-2">
                        <Button className="sm:min-w-[120px]" onClick={() => { setPage(1); fetchReports(); }}>Apply</Button>
                        <Button variant="outline" className="sm:min-w-[120px]" onClick={() => {
                            setFilters({ status: '', reason: '', q: '', sort: 'latest', from: '', to: '' });
                            setPage(1);
                        }}>Reset</Button>
                    </div>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    <div className="xl:col-span-2 bg-white/90 border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm shadow-slate-900/5 self-start">
                        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Report Queue</p>
                                <p className="text-xs text-slate-600">Select a case to review details and moderation history.</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 bg-white">
                                {total} total
                            </span>
                        </div>

                        <div className="md:hidden p-4 space-y-3">
                            {reports.map((r) => (
                                <article key={r.id} className={`rounded-2xl border p-3.5 space-y-2 ${selectedReportId === r.id ? 'border-sky-300 bg-sky-50/40' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <button className="text-left text-sm font-semibold text-slate-900 underline decoration-slate-400 underline-offset-2" onClick={() => fetchReportDetail(r.id)}>
                                            {r.submissionId}
                                        </button>
                                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${statusClass(r.reportStatus)}`}>{r.reportStatus}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{r.reason}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                                        <p>Reports: <span className="font-semibold text-slate-900">{r.reportsForSubmission}</span></p>
                                        <p>Downvotes: <span className="font-semibold text-slate-900">{r.downvotesForSubmission}</span></p>
                                        <p>{formatDate(r.createdAt)}</p>
                                    </div>
                                    <div className="pt-1">
                                        {isModerator ? (
                                            <Button variant="outline" className="w-full text-xs" onClick={() => handleDelete(r.id)}>Delete</Button>
                                        ) : <span className="text-xs text-slate-500">No access</span>}
                                    </div>
                                </article>
                            ))}
                            {reports.length === 0 && (
                                <div className="px-2 py-10 text-center text-slate-500 font-medium text-sm">
                                    No reports found.
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[860px]">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Submission</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Report Status</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Reason</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">#Reports</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Downvotes</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Time</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reports.map((r) => (
                                        <tr key={r.id} className={`hover:bg-slate-50/70 ${selectedReportId === r.id ? 'bg-sky-50/40' : ''}`}>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                                <button className="underline underline-offset-2 decoration-slate-400" onClick={() => fetchReportDetail(r.id)}>{r.submissionId.slice(0, 8)}...</button>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold">
                                                <span className={`px-2 py-1 rounded-full border ${statusClass(r.reportStatus)}`}>{r.reportStatus}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{r.reason}</td>
                                            <td className="px-4 py-3 text-sm text-slate-800">{r.reportsForSubmission}</td>
                                            <td className="px-4 py-3 text-sm text-slate-800">{r.downvotesForSubmission}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(r.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                {isModerator ? (
                                                    <Button variant="outline" className="text-xs" onClick={() => handleDelete(r.id)}>Delete</Button>
                                                ) : <span className="text-xs text-slate-500">No access</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {reports.length === 0 && (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">No reports found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-600">Page {page} of {totalPages} ({total} total)</p>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 sm:flex-none" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                                <Button variant="outline" className="flex-1 sm:flex-none" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm shadow-slate-900/5 xl:sticky xl:top-6 h-fit">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900">Review Panel</h3>
                            {selectedSummary && (
                                <p className="text-xs text-slate-600">
                                    Selected: <span className="font-semibold text-slate-900">{selectedSummary.submissionId.slice(0, 12)}...</span>
                                </p>
                            )}
                        </div>
                        {!selectedReportId && <p className="text-sm text-slate-600">Select a report from the table.</p>}
                        {detailLoading && <p className="text-sm text-slate-600">Loading detail...</p>}

                        {selectedReportDetail && (
                            <>
                                <div className="text-sm space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700">
                                    <p><span className="font-bold text-slate-900">Submission:</span> {selectedReportDetail.submissionId}</p>
                                    <p><span className="font-bold text-slate-900">Company:</span> {selectedReportDetail.submission?.company || '-'}</p>
                                    <p><span className="font-bold text-slate-900">Role:</span> {selectedReportDetail.submission?.role || '-'}</p>
                                    <p><span className="font-bold text-slate-900">Country:</span> {selectedReportDetail.submission?.country || '-'}</p>
                                    <p><span className="font-bold text-slate-900">Salary:</span> {selectedReportDetail.submission?.salaryAmount} {selectedReportDetail.submission?.currency}</p>
                                    <p><span className="font-bold text-slate-900">Votes:</span> {selectedReportDetail.voteSummary?.upvotes} up / {selectedReportDetail.voteSummary?.downvotes} down (score {selectedReportDetail.voteSummary?.score})</p>
                                    <p><span className="font-bold text-slate-900">Threshold:</span> {selectedReportDetail.voteSummary?.threshold}</p>
                                </div>

                                <div className="space-y-3 border-t border-slate-200 pt-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">Case Status</label>
                                        <select className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white" value={reviewForm.status} onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}>
                                            <option value="NEW">NEW</option>
                                            <option value="IN_REVIEW">IN_REVIEW</option>
                                            <option value="ACTION_TAKEN">ACTION_TAKEN</option>
                                            <option value="DISMISSED">DISMISSED</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">Moderation Action</label>
                                        <select className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white" value={reviewForm.moderationAction} onChange={(e) => setReviewForm(prev => ({ ...prev, moderationAction: e.target.value }))}>
                                            <option value="NONE">NONE</option>
                                            <option value="HIDE">HIDE</option>
                                            <option value="UNHIDE">UNHIDE</option>
                                            <option value="LOCK">LOCK</option>
                                            <option value="UNLOCK">UNLOCK</option>
                                            <option value="REVERT_APPROVAL">REVERT_APPROVAL</option>
                                            <option value="DELETE_SUBMISSION">DELETE_SUBMISSION</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">Internal Note</label>
                                        <textarea className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-white" rows={4} value={reviewForm.internalNote} onChange={(e) => setReviewForm(prev => ({ ...prev, internalNote: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Button className="w-full rounded-xl" onClick={handleReviewUpdate} disabled={!isModerator}>Save Review</Button>
                                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setReviewForm({ status: 'IN_REVIEW', moderationAction: 'NONE', internalNote: '' })}>Reset</Button>
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl border-red-300 text-red-700 hover:bg-red-50 sm:col-span-2"
                                            disabled={!isModerator || !selectedReportId}
                                            onClick={() => selectedReportId && handleDelete(selectedReportId)}
                                        >
                                            Delete Report
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700 mb-2.5">Report History</p>
                                    <div className="space-y-2 max-h-52 overflow-y-auto">
                                        {(selectedReportDetail.reportHistory || []).map((h) => (
                                            <div key={h.reportId} className="text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                                                <p className="font-bold text-slate-800">{h.status} - {formatDate(h.createdAt)}</p>
                                                <p className="text-slate-700">{h.reason}</p>
                                                <p className="text-slate-500">Reporter: {h.userId}</p>
                                            </div>
                                        ))}
                                        {(selectedReportDetail.reportHistory || []).length === 0 && (
                                            <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl p-3 bg-white">
                                                No history records available for this case.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
