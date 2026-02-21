'use client';

import { useState } from 'react';
import Link from 'next/link';
import Select, { type SingleValue, type StylesConfig } from 'react-select';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { salaryApi } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

const COUNTRIES = [
    { value: 'Afghanistan', label: 'Afghanistan' },
    { value: 'Albania', label: 'Albania' },
    { value: 'Algeria', label: 'Algeria' },
    { value: 'Andorra', label: 'Andorra' },
    { value: 'Angola', label: 'Angola' },
    { value: 'Antigua and Barbuda', label: 'Antigua and Barbuda' },
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
    { value: 'Cabo Verde', label: 'Cabo Verde' },
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
    { value: 'Czechia', label: 'Czechia' },
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
    { value: 'Eswatini', label: 'Eswatini' },
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
    { value: 'North Korea', label: 'North Korea' },
    { value: 'North Macedonia', label: 'North Macedonia' },
    { value: 'Norway', label: 'Norway' },
    { value: 'Oman', label: 'Oman' },
    { value: 'Pakistan', label: 'Pakistan' },
    { value: 'Palau', label: 'Palau' },
    { value: 'Palestine State', label: 'Palestine State' },
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
    { value: 'South Korea', label: 'South Korea' },
    { value: 'South Sudan', label: 'South Sudan' },
    { value: 'Spain', label: 'Spain' },
    { value: 'Sri Lanka', label: 'Sri Lanka' },
    { value: 'Sudan', label: 'Sudan' },
    { value: 'Suriname', label: 'Suriname' },
    { value: 'Sweden', label: 'Sweden' },
    { value: 'Switzerland', label: 'Switzerland' },
    { value: 'Syria', label: 'Syria' },
    { value: 'Taiwan', label: 'Taiwan' },
    { value: 'Tajikistan', label: 'Tajikistan' },
    { value: 'Tanzania', label: 'Tanzania' },
    { value: 'Thailand', label: 'Thailand' },
    { value: 'Timor-Leste', label: 'Timor-Leste' },
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
    { value: 'Venezuela', label: 'Venezuela' },
    { value: 'Vietnam', label: 'Vietnam' },
    { value: 'Yemen', label: 'Yemen' },
    { value: 'Zambia', label: 'Zambia' },
    { value: 'Zimbabwe', label: 'Zimbabwe' },
];

const CURRENCIES = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
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

type SelectOption = {
    value: string;
    label: string;
};

type BackendErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

const selectStyles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
        ...base,
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        padding: '2px 4px',
        boxShadow: 'none',
        minHeight: '46px',
        '&:hover': {
            borderColor: '#0f172a',
        },
        borderColor: state.isFocused ? '#0f172a' : '#cbd5e1',
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

export default function SalarySubmitPage() {
    const [formData, setFormData] = useState({
        country: '',
        company: '',
        role: '',
        experienceYears: '0',
        level: '',
        salaryAmount: '0',
        currency: 'USD',
        period: 'Yearly',
        isAnonymous: true
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const dataToSubmit = {
                ...formData,
                experienceYears: parseInt(formData.experienceYears as string) || 0,
                salaryAmount: parseFloat(formData.salaryAmount as string) || 0
            };
            await salaryApi.post('/salaries', dataToSubmit);
            setSubmitted(true);
        } catch (err: unknown) {
            const backendError = (err as { response?: { data?: BackendErrorResponse } })?.response?.data;
            if (backendError?.errors) {
                const messages = Object.values(backendError.errors).flat().join(' ');
                setError(messages);
            } else {
                setError(backendError?.message || 'Failed to submit. Please check if the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl shadow-emerald-900/10">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-1 border border-emerald-200">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Submission Received</p>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Submitted (PENDING)</h1>
                    <p className="text-slate-600 text-base leading-relaxed">
                        Thank you for contributing to community transparency. Your submission is being reviewed.
                    </p>
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
                            Back to Home
                        </Button>
                        <Button onClick={() => setSubmitted(false)} className="w-full bg-slate-900 hover:bg-slate-800">
                            Submit Another
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-100 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-cyan-200/25 blur-3xl" />
                <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
            </div>

            <header className="relative z-10 px-6 md:px-10 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <BrandLogo size={48} />
                </Link>
                <Link href="/salaries">
                    <Button variant="outline" className="rounded-xl text-sm">Browse Salaries</Button>
                </Link>
            </header>

            <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 pb-12 space-y-7">
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Community Contribution</p>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">Submit Salary Info</h1>
                    <p className="text-slate-600 text-lg">Contribute anonymously to the community. No login required.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/90 border border-slate-200/80 rounded-[32px] p-8 lg:p-10 shadow-sm shadow-slate-900/10 space-y-8 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Country</label>
                            <Select
                                instanceId="country-select"
                                options={COUNTRIES}
                                placeholder="Search Country..."
                                styles={selectStyles}
                                onChange={(opt: SingleValue<SelectOption>) => setFormData({ ...formData, country: opt?.value || '' })}
                                required
                            />
                        </div>
                        <Input
                            label="Company"
                            placeholder="e.g. Google, Startup Inc"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Role / Title"
                            placeholder="e.g. Software Engineer"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Level</label>
                            <Select
                                instanceId="level-select"
                                options={LEVELS}
                                placeholder="Select Level..."
                                styles={selectStyles}
                                onChange={(opt: SingleValue<SelectOption>) => setFormData({ ...formData, level: opt?.value || '' })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Experience (Years)"
                            type="number"
                            value={formData.experienceYears}
                            onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                            required
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Currency</label>
                            <Select
                                instanceId="currency-select"
                                options={CURRENCIES}
                                placeholder="USD"
                                styles={selectStyles}
                                defaultValue={CURRENCIES.find(c => c.value === 'USD')}
                                onChange={(opt: SingleValue<SelectOption>) => setFormData({ ...formData, currency: opt?.value || 'USD' })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Salary Amount"
                            type="number"
                            value={formData.salaryAmount}
                            onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                            required
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 ml-0.5">Period</label>
                            <select
                                className="w-full pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-slate-900 text-slate-900 h-[46px]"
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                            >
                                <option value="Yearly">Yearly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900">Anonymize</p>
                            <p className="text-xs text-slate-500 font-medium">Keep your info private from others</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${formData.isAnonymous ? 'bg-slate-900' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isAnonymous ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                    {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

                    <Button type="submit" className="w-full py-4 text-lg rounded-xl bg-slate-900 hover:bg-slate-800" isLoading={loading}>
                        Submit Salary Profile
                    </Button>
                </form>
            </div>
        </div>
    );
}
