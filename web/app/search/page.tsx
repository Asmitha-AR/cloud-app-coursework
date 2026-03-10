'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { searchApi } from '@/lib/api';

type SearchSalaryItem = {
  id: string;
  country: string;
  company: string;
  role: string;
  level: string;
  experienceYears: number;
  salaryAmount: number;
  currency: string;
  period: string;
  isAnonymous: boolean;
  status: string;
  submittedAt: string;
};

type SearchResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: SearchSalaryItem[];
};

export default function SearchPage() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    country: '',
    company: '',
    role: '',
    level: '',
    minSalaryAmount: '',
    maxSalaryAmount: ''
  });
  const [page, setPage] = useState(1);

  const fetchResults = async (targetPage = page) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (filters.q.trim()) params.append('q', filters.q.trim());
      if (filters.country.trim()) params.append('country', filters.country.trim());
      if (filters.company.trim()) params.append('company', filters.company.trim());
      if (filters.role.trim()) params.append('role', filters.role.trim());
      if (filters.level.trim()) params.append('level', filters.level.trim());
      if (filters.minSalaryAmount.trim()) params.append('minSalaryAmount', filters.minSalaryAmount.trim());
      if (filters.maxSalaryAmount.trim()) params.append('maxSalaryAmount', filters.maxSalaryAmount.trim());

      params.append('page', String(targetPage));
      params.append('pageSize', '12');
      params.append('sortBy', 'submittedAt');
      params.append('sortOrder', 'desc');

      const response = await searchApi.get<SearchResponse>(`/search/salaries?${params.toString()}`);
      setResult(response.data);
      setPage(targetPage);
    } catch {
      setResult(null);
      setError('Failed to search salaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    fetchResults(1);
  };

  const clearFilters = () => {
    const clearedFilters = {
      q: '',
      country: '',
      company: '',
      role: '',
      level: '',
      minSalaryAmount: '',
      maxSalaryAmount: ''
    };
    setFilters(clearedFilters);
    
    // Fetch results with cleared filters immediately
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('pageSize', '12');
    params.append('sortBy', 'submittedAt');
    params.append('sortOrder', 'desc');

    searchApi.get<SearchResponse>(`/search/salaries?${params.toString()}`)
      .then(response => {
        setResult(response.data);
        setPage(1);
      })
      .catch(() => {
        setResult(null);
        setError('Failed to search salaries. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const canPrev = (result?.page ?? 1) > 1;
  const canNext = (result?.page ?? 1) < (result?.totalPages ?? 0);

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col selection:bg-cyan-200/80 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute top-32 -right-24 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
      </div>

      <nav className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/search" className="flex items-center space-x-2.5">
            <BrandLogo size={40} />
            <span className="font-bold text-lg tracking-tight text-slate-900">Search</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/salaries"><Button variant="ghost" className="text-sm text-slate-700">Moderation View</Button></Link>
            <Link href="/stats"><Button variant="ghost" className="text-sm text-slate-700">Insights</Button></Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full p-6 lg:p-10 xl:p-12 space-y-6 animate-in fade-in duration-500">
        <section className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 lg:p-8 shadow-sm shadow-slate-900/5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Public Lookup</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Salary Search</h1>
          <p className="text-slate-600 text-base lg:text-lg">Search community salary submissions. Logged-in users see all statuses; anonymous users see approved entries only.</p>
        </section>

        <section className="bg-white/90 border border-slate-200/80 p-6 rounded-3xl shadow-sm shadow-slate-900/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Keyword" placeholder="Role, company, country" value={filters.q} onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))} />
            <Input label="Country" placeholder="Sri Lanka" value={filters.country} onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))} />
            <Input label="Company" placeholder="WSO2" value={filters.company} onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))} />
            <Input label="Role" placeholder="Software Engineer" value={filters.role} onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))} />
            <Input label="Level" placeholder="Junior / Senior" value={filters.level} onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))} />
            <Input label="Min Salary" type="number" placeholder="0" value={filters.minSalaryAmount} onChange={(e) => setFilters(prev => ({ ...prev, minSalaryAmount: e.target.value }))} />
            <Input label="Max Salary" type="number" placeholder="200000" value={filters.maxSalaryAmount} onChange={(e) => setFilters(prev => ({ ...prev, maxSalaryAmount: e.target.value }))} />
          </div>
          <div className="flex justify-between items-center gap-4">
            <Button 
              variant="ghost" 
              className="rounded-xl text-slate-600"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <Button 
              className="rounded-xl bg-slate-900 hover:bg-slate-800" 
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white/90 border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm shadow-slate-900/5">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {loading ? 'Loading results...' : `${result?.totalCount ?? 0} record${result?.totalCount !== 1 ? 's' : ''} found`}
            </p>
            {result && result.totalPages > 0 && (
              <p className="text-xs text-slate-500">Page {result.page} of {result.totalPages}</p>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
          ) : result && result.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Role</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Company</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Location</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Experience</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Salary</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.role}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">{item.level}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">{item.company}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.country}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.experienceYears}y</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency, maximumFractionDigits: 0 }).format(item.salaryAmount)}
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">/ {item.period.replace('ly', '')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          item.status === 'APPROVED' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : item.status === 'PENDING' 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-14 text-center text-slate-600 font-medium">No salaries found for current filters.</div>
          )}

          {!loading && result && result.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => fetchResults(result.page - 1)} disabled={!canPrev}>Previous</Button>
              <Button variant="outline" className="rounded-xl" onClick={() => fetchResults(result.page + 1)} disabled={!canNext}>Next</Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
