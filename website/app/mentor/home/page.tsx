'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, User as UserIcon, Calendar, CheckCircle2, IndianRupee } from 'lucide-react';

export default function MentorHomePage() {
  const { user, logout, isSignedIn } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isSignedIn) {
      router.push('/login');
    }
  }, [isSignedIn, router]);

  if (!mounted || !isSignedIn) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0b1c30] tracking-tight mb-2">
            Mentor Dashboard
          </h1>
          <p className="text-slate-500 font-medium">Welcome back, <span className="text-[#00288e]">{user?.name}</span>. Your expertise is changing lives.</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0b1c30] mb-6 flex items-center gap-2">
              <Calendar className="text-[#00288e]" />
              Upcoming Sessions
            </h2>
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No sessions scheduled for today.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0b1c30] mb-6">Profile Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl">
                <p className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">Total Hours</p>
                <p className="text-3xl font-black text-blue-900">128</p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl">
                <p className="text-green-600 font-bold text-sm uppercase tracking-wider mb-2">Avg Rating</p>
                <p className="text-3xl font-black text-green-900">4.9/5</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#00288e] p-8 rounded-[32px] text-white shadow-xl shadow-blue-900/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Earnings</h3>
              <IndianRupee size={24} />
            </div>
            <p className="text-4xl font-black mb-2">₹4,250.00</p>
            <p className="text-blue-200 text-sm mb-6">Next payout: Monday</p>
            <button className="w-full bg-white text-[#00288e] py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all">
              View Payouts
            </button>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#0b1c30]">Status: Online</h3>
                    <p className="text-sm text-slate-500">Students can reach you</p>
                </div>
            </div>
            <button className="w-full border-2 border-[#00288e] text-[#00288e] py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              Go Offline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
