'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { AuthEndpoints } from '@/constants/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { usePasswordMask } from '@/hooks/usePasswordMask';

export default function StudentSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'student'
  });
  
  const setPassword = (password: string) => setFormData(prev => ({ ...prev, password }));
  const { displayValue: passwordDisplay, handleChange: handlePasswordChange } = usePasswordMask(formData.password, setPassword);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(AuthEndpoints.signup, formData);
      
      if (data.requiresVerification) {
        // Redirect to OTP verification page for email-password signup
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Google signup or direct signup success (if verification was skipped or handled differently)
        setAuth(data.user);
        router.push(data.user.role === 'mentor' ? '/mentor/home' : '/student/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6 py-12">
      <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full">
        <h1 className="text-3xl font-black text-[#0b1c30] mb-2 tracking-tight">Create Account</h1>
        <p className="text-slate-500 mb-8">Join Mentivo and start learning from the best.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-slate-900 font-medium"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-slate-900 font-medium"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-slate-900 font-medium"
                placeholder="+91 9876543210"
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
                value={showPassword ? formData.password : passwordDisplay}
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

          <div className="pt-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">I want to join as a</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`py-3 rounded-xl font-bold border-2 transition-all ${formData.role === 'student' ? 'bg-[#00288e] text-white border-[#00288e]' : 'bg-white text-slate-700 border-slate-200'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'mentor' })}
                className={`py-3 rounded-xl font-bold border-2 transition-all ${formData.role === 'mentor' ? 'bg-[#00288e] text-white border-[#00288e]' : 'bg-white text-slate-700 border-slate-200'}`}
              >
                Mentor
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00288e] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-[#00288e] font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
