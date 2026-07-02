'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Eye, EyeOff, User, BookOpen, Building, ArrowLeft, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { AuthEndpoints } from '@/constants/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { usePasswordMask } from '@/hooks/usePasswordMask';

export default function LoginPage() {
  const [view, setView] = useState<'selection' | 'partner' | 'download'>('selection');
  
  // Partner Form State
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
      const { data } = await api.post('/partners/login', { email, password });
      setAuth(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6 py-12">
      {view === 'selection' && (
        <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full">
          <h1 className="text-3xl font-black text-[#0b1c30] mb-2 tracking-tight text-center">Welcome to Mentivo</h1>
          <p className="text-slate-500 mb-8 text-center">Select your role to continue.</p>

          <div className="space-y-4">
            <button 
              onClick={() => setView('download')}
              className="w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-[#0077CB] hover:bg-blue-50/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#0077CB] transition-colors">
                <BookOpen className="text-[#0077CB] group-hover:text-white transition-colors" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#0b1c30]">I am a Student</h3>
                <p className="text-sm text-slate-500">Find mentors and crack JEE</p>
              </div>
            </button>

            <button 
              onClick={() => setView('download')}
              className="w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-[#0077CB] hover:bg-blue-50/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-indigo-600 transition-colors">
                <User className="text-indigo-600 group-hover:text-white transition-colors" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#0b1c30]">I am a Mentor</h3>
                <p className="text-sm text-slate-500">Guide students to success</p>
              </div>
            </button>

            <button 
              onClick={() => setView('partner')}
              className="w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-slate-800 hover:bg-slate-50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-slate-800 transition-colors">
                <Building className="text-slate-600 group-hover:text-white transition-colors" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#0b1c30]">I am a Coaching Partner</h3>
                <p className="text-sm text-slate-500">Manage your students</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'download' && (
        <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setView('selection')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
          
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="text-[#0077CB]" size={40} />
          </div>
          
          <h1 className="text-3xl font-black text-[#0b1c30] mb-4 tracking-tight">App Required</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Mentors and Students authenticate securely using the Mentivo Mobile App. Download it now to start your journey!
          </p>
          
          <div className="flex flex-col gap-3">
            <a href="https://play.google.com/store/apps/details?id=com.mentivo.in" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0077CB] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all flex items-center justify-center shadow-lg shadow-blue-500/20">
              Download for Android
            </a>
          </div>
        </div>
      )}

      {view === 'partner' && (
        <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setView('selection')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>

          <h1 className="text-3xl font-black text-[#0b1c30] mb-2 tracking-tight">Partner Login</h1>
          <p className="text-slate-500 mb-8">Login to your coaching center dashboard.</p>

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
              className="w-full bg-[#0077CB] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#0077CB] font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
