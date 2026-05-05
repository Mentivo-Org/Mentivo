'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { AuthEndpoints } from '@/constants/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { usePasswordMask } from '@/hooks/usePasswordMask';

export default function StudentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { displayValue: passwordDisplay, handleChange: handlePasswordChange } = usePasswordMask(password, setPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const forceCursorToEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const el = e.target as HTMLInputElement;
    setTimeout(() => {
      el.selectionStart = el.value.length;
      el.selectionEnd = el.value.length;
    }, 0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(AuthEndpoints.login, { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      
      if (data.user.role === 'mentor') {
        router.push('/mentor/home');
      } else {
        router.push('/student/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
      <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full">
        <h1 className="text-3xl font-black text-[#0b1c30] mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-slate-500 mb-8">Login to continue your mentorship journey.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-slate-900 font-medium"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                required
                value={showPassword ? password : passwordDisplay}
                onChange={(e) => showPassword ? setPassword(e.target.value) : handlePasswordChange(e.target.value)}
                onClick={forceCursorToEnd}
                onSelect={forceCursorToEnd}
                onKeyUp={forceCursorToEnd}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-slate-900 font-medium"
                placeholder="∗∗∗∗∗∗∗∗"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00288e] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#00288e] font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
