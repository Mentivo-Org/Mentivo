'use client';

import React from 'react';
import Link from 'next/link';
import { Key } from 'lucide-react';

export default function SetupPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6 bg-slate-50">
      <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Key size={32} />
        </div>
        <h1 className="text-3xl font-black text-[#0b1c30] tracking-tight mb-4 leading-tight">
          Account Activation<br />No Longer Required
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your Mentivo Partner account is ready to use. Simply log in with your registered email address — we'll send you a one-time code to verify your identity.
        </p>
        <Link 
          href="/login"
          className="w-full bg-[#00288e] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all transform active:scale-[0.98] flex items-center justify-center shadow-lg shadow-blue-900/10 inline-block"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
