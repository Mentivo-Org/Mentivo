'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, User as UserIcon, BookOpen, Clock, Wallet, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function StudentHomePage() {
  const { user, logout, isSignedIn } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isSignedIn) {
      router.push('/login');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get('/wallet/balance');
        setBalance(response.data.balance);
      } catch (err) {
        console.error('Failed to fetch credits balance:', err);
      } finally {
        setLoadingBalance(false);
      }
    };

    if (isSignedIn) {
      fetchBalance();
    }
  }, [isSignedIn]);

  if (!mounted || !isSignedIn) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0b1c30] tracking-tight mb-2">
            Welcome, <span className="text-[#00288e]">{user?.name}</span>
          </h1>
          <p className="text-slate-500 font-medium">Ready to excel in your JEE preparation?</p>
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
              <BookOpen className="text-[#00288e]" />
              Recommended Mentors
            </h2>
            <div className="text-center py-12">
              <p className="text-slate-400">Loading top IITian mentors for you...</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#00288e] p-8 rounded-[32px] text-white shadow-xl shadow-blue-900/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Session Credits</h3>
              <Wallet size={24} />
            </div>
            <p className="text-4xl font-black mb-2">
              {loadingBalance ? (
                <Loader2 className="animate-spin inline" size={24} />
              ) : (
                `${balance !== null ? balance : 0} Credits`
              )}
            </p>
            <p className="text-blue-200 text-sm mb-6">First 5 minutes are free!</p>
            <button
              onClick={() => router.push('/add-credits')}
              className="w-full bg-white text-[#00288e] py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all active:scale-95"
            >
              Add Credits
            </button>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-[#0b1c30] mb-6 flex items-center gap-2">
              <Clock className="text-[#00288e]" size={20} />
              Recent Sessions
            </h3>
            <p className="text-slate-400 text-center py-4 text-sm font-medium">No recent sessions found.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
