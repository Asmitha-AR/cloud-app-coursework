'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactSelect, { type SingleValue, type StylesConfig } from 'react-select';
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

type SelectOption = {
  value: string;
  label: string;
};

// Comprehensive list of countries
const COUNTRIES = [
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Albania', label: 'Albania' },
  { value: 'Algeria', label: 'Algeria' },
  { value: 'Andorra', label: 'Andorra' },
  { value: 'Angola', label: 'Angola' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Armenia', label: 'Armenia' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Azerbaijan', label: 'Azerbaijan' },
  { value: 'Bahamas', label: 'Bahamas' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Barbados', label: 'Barbados' },
  { value: 'Belarus', label: 'Belarus' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Belize', label: 'Belize' },
  { value: 'Benin', label: 'Benin' },
  { value: 'Bhutan', label: 'Bhutan' },
  { value: 'Bolivia', label: 'Bolivia' },
  { value: 'Bosnia and Herzegovina', label: 'Bosnia and Herzegovina' },
  { value: 'Botswana', label: 'Botswana' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Brunei', label: 'Brunei' },
  { value: 'Bulgaria', label: 'Bulgaria' },
  { value: 'Burkina Faso', label: 'Burkina Faso' },
  { value: 'Burundi', label: 'Burundi' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Cameroon', label: 'Cameroon' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Central African Republic', label: 'Central African Republic' },
  { value: 'Chad', label: 'Chad' },
  { value: 'Chile', label: 'Chile' },
  { value: 'China', label: 'China' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Comoros', label: 'Comoros' },
  { value: 'Congo', label: 'Congo' },
  { value: 'Costa Rica', label: 'Costa Rica' },
  { value: 'Croatia', label: 'Croatia' },
  { value: 'Cuba', label: 'Cuba' },
  { value: 'Cyprus', label: 'Cyprus' },
  { value: 'Czech Republic', label: 'Czech Republic' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Djibouti', label: 'Djibouti' },
  { value: 'Dominica', label: 'Dominica' },
  { value: 'Dominican Republic', label: 'Dominican Republic' },
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Equatorial Guinea', label: 'Equatorial Guinea' },
  { value: 'Eritrea', label: 'Eritrea' },
  { value: 'Estonia', label: 'Estonia' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Fiji', label: 'Fiji' },
  { value: 'Finland', label: 'Finland' },
  { value: 'France', label: 'France' },
  { value: 'Gabon', label: 'Gabon' },
  { value: 'Gambia', label: 'Gambia' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Grenada', label: 'Grenada' },
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Guinea', label: 'Guinea' },
  { value: 'Guinea-Bissau', label: 'Guinea-Bissau' },
  { value: 'Guyana', label: 'Guyana' },
  { value: 'Haiti', label: 'Haiti' },
  { value: 'Honduras', label: 'Honduras' },
  { value: 'Hungary', label: 'Hungary' },
  { value: 'Iceland', label: 'Iceland' },
  { value: 'India', label: 'India' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Iran', label: 'Iran' },
  { value: 'Iraq', label: 'Iraq' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Jamaica', label: 'Jamaica' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Jordan', label: 'Jordan' },
  { value: 'Kazakhstan', label: 'Kazakhstan' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Kiribati', label: 'Kiribati' },
  { value: 'North Korea', label: 'North Korea' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Kyrgyzstan', label: 'Kyrgyzstan' },
  { value: 'Laos', label: 'Laos' },
  { value: 'Latvia', label: 'Latvia' },
  { value: 'Lebanon', label: 'Lebanon' },
  { value: 'Lesotho', label: 'Lesotho' },
  { value: 'Liberia', label: 'Liberia' },
  { value: 'Libya', label: 'Libya' },
  { value: 'Liechtenstein', label: 'Liechtenstein' },
  { value: 'Lithuania', label: 'Lithuania' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Macedonia', label: 'Macedonia' },
  { value: 'Madagascar', label: 'Madagascar' },
  { value: 'Malawi', label: 'Malawi' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Maldives', label: 'Maldives' },
  { value: 'Mali', label: 'Mali' },
  { value: 'Malta', label: 'Malta' },
  { value: 'Marshall Islands', label: 'Marshall Islands' },
  { value: 'Mauritania', label: 'Mauritania' },
  { value: 'Mauritius', label: 'Mauritius' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Micronesia', label: 'Micronesia' },
  { value: 'Moldova', label: 'Moldova' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Mongolia', label: 'Mongolia' },
  { value: 'Montenegro', label: 'Montenegro' },
  { value: 'Morocco', label: 'Morocco' },
  { value: 'Mozambique', label: 'Mozambique' },
  { value: 'Myanmar', label: 'Myanmar' },
  { value: 'Namibia', label: 'Namibia' },
  { value: 'Nauru', label: 'Nauru' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Nicaragua', label: 'Nicaragua' },
  { value: 'Niger', label: 'Niger' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Oman', label: 'Oman' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Palau', label: 'Palau' },
  { value: 'Panama', label: 'Panama' },
  { value: 'Papua New Guinea', label: 'Papua New Guinea' },
  { value: 'Paraguay', label: 'Paraguay' },
  { value: 'Peru', label: 'Peru' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Romania', label: 'Romania' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Saint Kitts and Nevis', label: 'Saint Kitts and Nevis' },
  { value: 'Saint Lucia', label: 'Saint Lucia' },
  { value: 'Saint Vincent and the Grenadines', label: 'Saint Vincent and the Grenadines' },
  { value: 'Samoa', label: 'Samoa' },
  { value: 'San Marino', label: 'San Marino' },
  { value: 'Sao Tome and Principe', label: 'Sao Tome and Principe' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Senegal', label: 'Senegal' },
  { value: 'Serbia', label: 'Serbia' },
  { value: 'Seychelles', label: 'Seychelles' },
  { value: 'Sierra Leone', label: 'Sierra Leone' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Slovakia', label: 'Slovakia' },
  { value: 'Slovenia', label: 'Slovenia' },
  { value: 'Solomon Islands', label: 'Solomon Islands' },
  { value: 'Somalia', label: 'Somalia' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'South Sudan', label: 'South Sudan' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Sri Lanka', label: 'Sri Lanka' },
  { value: 'Sudan', label: 'Sudan' },
  { value: 'Suriname', label: 'Suriname' },
  { value: 'Swaziland', label: 'Swaziland' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Syria', label: 'Syria' },
  { value: 'Taiwan', label: 'Taiwan' },
  { value: 'Tajikistan', label: 'Tajikistan' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Togo', label: 'Togo' },
  { value: 'Tonga', label: 'Tonga' },
  { value: 'Trinidad and Tobago', label: 'Trinidad and Tobago' },
  { value: 'Tunisia', label: 'Tunisia' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Turkmenistan', label: 'Turkmenistan' },
  { value: 'Tuvalu', label: 'Tuvalu' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Ukraine', label: 'Ukraine' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Uruguay', label: 'Uruguay' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
  { value: 'Vanuatu', label: 'Vanuatu' },
  { value: 'Vatican City', label: 'Vatican City' },
  { value: 'Venezuela', label: 'Venezuela' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Yemen', label: 'Yemen' },
  { value: 'Zambia', label: 'Zambia' },
  { value: 'Zimbabwe', label: 'Zimbabwe' },
];

const LEVELS = [
  { value: 'Intern', label: 'Intern' },
  { value: 'Associate', label: 'Associate' },
  { value: 'SE', label: 'SE - Software Engineer' },
  { value: 'SSE', label: 'SSE - Senior Software Engineer' },
  { value: 'Associate Tech Lead', label: 'Associate Tech Lead' },
  { value: 'Tech Lead', label: 'Tech Lead' },
  { value: 'Solution Architect', label: 'Solution Architect' },
];

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    padding: '2px 4px',
    boxShadow: 'none',
    minHeight: '42px',
    '&:hover': {
      borderColor: '#000',
    },
    borderColor: state.isFocused ? '#000' : '#e5e7eb',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : '#fff',
    color: state.isSelected ? '#fff' : '#0f172a',
    '&:active': {
      backgroundColor: '#0f172a',
      color: '#fff',
    },
  }),
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
    <div className="relative min-h-screen bg-slate-100 flex flex-col selection:bg-cyan-200/80">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 ml-0.5">Country</label>
              <ReactSelect
                instanceId="country-select"
                options={COUNTRIES}
                placeholder="All Countries"
                styles={selectStyles}
                isClearable
                value={COUNTRIES.find(c => c.value === filters.country) || null}
                onChange={(opt: SingleValue<SelectOption>) => setFilters(prev => ({ ...prev, country: opt?.value || '' }))}
              />
            </div>
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
