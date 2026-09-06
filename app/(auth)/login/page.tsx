'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Waves, LogIn, Key, Mail, ShieldAlert, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleDemoLogin = async (demoRole: 'USER' | 'ADMIN') => {
    setError('');
    setLoading(true);

    const demoEmail = demoRole === 'ADMIN' ? 'admin@floodvision.org' : 'user@floodvision.org';
    const demoPass = demoRole === 'ADMIN' ? 'Admin@123456' : 'User@123456';

    const res = await login(demoEmail, demoPass);
    setLoading(false);

    if (res.success) {
      router.push(demoRole === 'ADMIN' ? '/admin' : '/dashboard');
    } else {
      setError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md mb-2">
            <Waves className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign In to FloodVision</h1>
          <p className="text-xs text-muted-foreground">Access your flood risk dashboard and emergency alerts</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : <><LogIn className="h-4 w-4" /> Sign In</>}
          </button>
        </form>

        {/* Demo Quick Fill Buttons */}
        <div className="pt-4 border-t border-border space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block text-center">
            One-Click Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('USER')}
              disabled={loading}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 border border-border rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" /> Demo User
            </button>

            <button
              onClick={() => handleDemoLogin('ADMIN')}
              disabled={loading}
              className="py-2 px-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Demo Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
