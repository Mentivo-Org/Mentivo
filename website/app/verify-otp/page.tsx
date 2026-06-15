'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { AuthEndpoints } from '@/constants/endpoints';
import { useAuthStore } from '@/store/useAuthStore';

function VerifyOtpContent() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is missing. Please try signing up again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(AuthEndpoints.verifyOtp, {
        email,
        token,
        type: 'signup'
      });

      setSuccess(true);
      // Wait a bit to show success state before redirecting
      setTimeout(() => {
        setAuth(data.user);
        router.push(data.user.role === 'mentor' ? '/mentor/home' : '/student/home');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl max-w-md w-full text-center">
          <p className="text-red-600 font-medium">Invalid verification link. Please sign up again.</p>
          <button 
            onClick={() => router.push('/signup')}
            className="mt-4 text-[#0077CB] font-bold hover:underline"
          >
            Back to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6 py-12">
      <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0b1c30] mb-2 tracking-tight">Verify Email</h1>
          <p className="text-slate-500">
            We&apos;ve sent a 6-digit code to <br />
            <span className="font-bold text-slate-700">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-600 p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={48} className="animate-bounce" />
            <p className="font-bold text-lg">Email Verified Successfully!</p>
            <p className="text-sm">Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0077CB]/20 focus:border-[#0077CB] transition-all text-center text-2xl font-black tracking-[0.5em]"
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full bg-[#0077CB] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
            </button>
            
            <p className="text-center text-sm text-slate-500">
              Didn&apos;t receive the code?{' '}
              <button 
                type="button"
                className="text-[#0077CB] font-bold hover:underline"
                onClick={() => {/* Implement resend logic if needed */}}
              >
                Resend Code
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="animate-spin text-[#0077CB]" size={48} />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
