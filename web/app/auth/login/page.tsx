'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authApi.post('/auth/login', { email, password });
            const { token, email: userEmail } = response.data;

            // Sync token with API client
            const { setAccessToken } = await import('@/lib/api');
            setAccessToken(token);

            login(token, { email: userEmail });
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-100 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
                <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
            </div>

            <header className="relative z-10 px-6 md:px-10 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <BrandLogo size={48} />
                </Link>
                <Link href="/salary/submit">
                    <Button className="text-sm font-bold rounded-xl px-5 py-2.5 bg-slate-900 hover:bg-slate-800">
                        Submit Salary Info
                    </Button>
                </Link>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pb-10 min-h-[calc(100vh-88px)] flex items-center">
                <div className="w-full grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                    <section className="hidden lg:block space-y-6">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Welcome Back</p>
                        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-slate-900">
                            Secure access to your salary transparency workspace
                        </h1>
                        <p className="text-lg text-slate-600 max-w-lg">
                            Continue moderating reports, reviewing submissions, and contributing trusted salary insights with your account.
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 font-semibold">Moderation</span>
                            <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 font-semibold">Reports</span>
                            <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 font-semibold">Insights</span>
                        </div>
                    </section>

                    <section className="w-full max-w-[430px] mx-auto lg:mx-0 rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-slate-900/10 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign in</h2>
                            <p className="text-sm text-slate-600">
                                Enter your credentials to continue.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="rounded-xl border-slate-300 focus:border-slate-900"
                            />

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 ml-0.5">Password</label>
                                    <Link href="#" className="text-xs text-slate-500 hover:text-slate-900 hover:underline">
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="rounded-xl border-slate-300 focus:border-slate-900"
                                />
                            </div>

                            {error && (
                                <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full rounded-xl py-3 text-base font-semibold bg-slate-900 hover:bg-slate-800" isLoading={loading}>
                                Sign In
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-400 tracking-[0.14em]">Secure Login</span>
                            </div>
                        </div>

                        <p className="text-center text-sm text-slate-600">
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/signup" className="text-slate-900 font-semibold hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
