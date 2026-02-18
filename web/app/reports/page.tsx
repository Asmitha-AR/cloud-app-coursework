'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { voteApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
    const [selectedReportDetail, setSelectedReportDetail] = useState<any>(null);
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
        } catch (err: any) {
            if (err.response?.status === 401) {
                router.push('/auth/login');
                return;
            }
            if (err.response?.status === 403) {
                setError('Only ADMIN/MODERATOR can access reports moderation.');
                return;
            }
            setError(err.response?.data?.message ? `Failed to load reports: ${err.response.data.message}` : 'Failed to load reports.');
        } finally {
            setLoading(false);
        }
    }, [filters, page, pageSize, router]);

    const fetchReportDetail = useCallback(async (reportId: string) => {
        setDetailLoading(true);
        try {
            const res = await voteApi.get(`/reports/${reportId}`);
            setSelectedReportDetail(res.data);
            setSelectedReportId(reportId);
            setReviewForm({
                status: res.data.reportStatus || 'IN_REVIEW',
                moderationAction: res.data.resolutionAction || 'NONE',
                internalNote: res.data.internalNote || ''
            });
        } catch (err: any) {
            setActionMessage(err.response?.data?.message || 'Failed to load report detail.');
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
        } catch (err: any) {
            setActionMessage(err.response?.status === 403 ? 'No permission to delete reports.' : (err.response?.data?.message || 'Failed to delete report.'));
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
        } catch (err: any) {
            const data = err.response?.data;
            const status = err.response?.status;
            const message = data?.message || err.message || 'Failed to update report.';
            const errorDetails = data?.errors
                ? Object.values(data.errors).flat().join(' | ')
                : '';
            const raw = data && typeof data !== 'object' ? ` | ${String(data)}` : '';
            const withStatus = status ? `[${status}] ${message}` : message;
            setActionMessage(errorDetails ? `${withStatus}: ${errorDetails}${raw}` : `${withStatus}${raw}`);
        }
    };

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col selection:bg-zinc-200">
            <nav className="border-b border-zinc-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2.5">
                        <Link href="/" className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">K</Link>
                        <span className="font-bold text-lg tracking-tight">Moderation Reports</span>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" className="text-sm">Back to Dashboard</Button>
                    </Link>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10 space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reports Moderation</h1>
                    <p className="text-zinc-500">Filter, review and take moderation actions on reported submissions.</p>
                </div>

                {actionMessage && <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium">{actionMessage}</div>}
                {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

                <section className="bg-white border border-zinc-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                        <select className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
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
                        <label className="text-xs font-bold text-zinc-500 uppercase">Sort</label>
                        <select className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" value={filters.sort} onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}>
                            <option value="latest">Latest first</option>
                            <option value="most_reported">Most reported</option>
                            <option value="most_downvoted">Most downvoted</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-6 flex gap-2">
                        <Button onClick={() => { setPage(1); fetchReports(); }}>Apply</Button>
                        <Button variant="outline" onClick={() => {
                            setFilters({ status: '', reason: '', q: '', sort: 'latest', from: '', to: '' });
                            setPage(1);
                        }}>Reset</Button>
                    </div>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Submission</th>
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Report Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Reason</th>
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">#Reports</th>
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Downvotes</th>
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Time</th>
                                    <th className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {reports.map((r) => (
                                    <tr key={r.id} className={`hover:bg-zinc-50/50 ${selectedReportId === r.id ? 'bg-zinc-50' : ''}`}>
                                        <td className="px-4 py-3 text-sm font-semibold">
                                            <button className="underline underline-offset-2" onClick={() => fetchReportDetail(r.id)}>{r.submissionId.slice(0, 8)}...</button>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold">{r.reportStatus}</td>
                                        <td className="px-4 py-3 text-sm text-zinc-600">{r.reason}</td>
                                        <td className="px-4 py-3 text-sm">{r.reportsForSubmission}</td>
                                        <td className="px-4 py-3 text-sm">{r.downvotesForSubmission}</td>
                                        <td className="px-4 py-3 text-sm text-zinc-500">{new Date(r.createdAt).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            {isModerator ? (
                                                <Button variant="outline" className="text-xs" onClick={() => handleDelete(r.id)}>Delete</Button>
                                            ) : <span className="text-xs text-zinc-400">No access</span>}
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">No reports found.</td></tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                        <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
                            <p className="text-sm text-zinc-500">Page {page} of {totalPages} ({total} total)</p>
                            <div className="flex gap-2">
                                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4">
                        <h3 className="text-lg font-bold">Review Panel</h3>
                        {!selectedReportId && <p className="text-sm text-zinc-500">Select a report from the table.</p>}
                        {detailLoading && <p className="text-sm text-zinc-500">Loading detail...</p>}

                        {selectedReportDetail && (
                            <>
                                <div className="text-sm space-y-1">
                                    <p><span className="font-bold">Submission:</span> {selectedReportDetail.submissionId}</p>
                                    <p><span className="font-bold">Company:</span> {selectedReportDetail.submission.company}</p>
                                    <p><span className="font-bold">Role:</span> {selectedReportDetail.submission.role}</p>
                                    <p><span className="font-bold">Country:</span> {selectedReportDetail.submission.country}</p>
                                    <p><span className="font-bold">Salary:</span> {selectedReportDetail.submission.salaryAmount} {selectedReportDetail.submission.currency}</p>
                                    <p><span className="font-bold">Votes:</span> {selectedReportDetail.voteSummary.upvotes} up / {selectedReportDetail.voteSummary.downvotes} down (score {selectedReportDetail.voteSummary.score})</p>
                                    <p><span className="font-bold">Threshold:</span> {selectedReportDetail.voteSummary.threshold}</p>
                                </div>

                                <div className="space-y-3 border-t border-zinc-100 pt-3">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-500">Case Status</label>
                                        <select className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" value={reviewForm.status} onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}>
                                            <option value="NEW">NEW</option>
                                            <option value="IN_REVIEW">IN_REVIEW</option>
                                            <option value="ACTION_TAKEN">ACTION_TAKEN</option>
                                            <option value="DISMISSED">DISMISSED</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-500">Moderation Action</label>
                                        <select className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" value={reviewForm.moderationAction} onChange={(e) => setReviewForm(prev => ({ ...prev, moderationAction: e.target.value }))}>
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
                                        <label className="text-xs font-bold uppercase text-zinc-500">Internal Note</label>
                                        <textarea className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" rows={4} value={reviewForm.internalNote} onChange={(e) => setReviewForm(prev => ({ ...prev, internalNote: e.target.value }))} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleReviewUpdate} disabled={!isModerator}>Save Review</Button>
                                        <Button variant="outline" onClick={() => setReviewForm({ status: 'IN_REVIEW', moderationAction: 'NONE', internalNote: '' })}>Reset</Button>
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                            disabled={!isModerator || !selectedReportId}
                                            onClick={() => selectedReportId && handleDelete(selectedReportId)}
                                        >
                                            Delete Report
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-zinc-100 pt-3">
                                    <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Report History</p>
                                    <div className="space-y-2 max-h-52 overflow-y-auto">
                                        {selectedReportDetail.reportHistory.map((h: any) => (
                                            <div key={h.reportId} className="text-xs border border-zinc-100 rounded-lg p-2">
                                                <p className="font-bold">{h.status} - {new Date(h.createdAt).toLocaleString()}</p>
                                                <p className="text-zinc-600">{h.reason}</p>
                                                <p className="text-zinc-400">Reporter: {h.userId}</p>
                                            </div>
                                        ))}
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
