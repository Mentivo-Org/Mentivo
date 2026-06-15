'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { 
  Loader2, LogOut, Copy, Check, Users, Sparkles, TrendingUp, Award, DollarSign
} from 'lucide-react';

interface PartnerDetails {
  partner: {
    id: string;
    email: string;
    name: string;
    role: string;
    referralCode: string;
    commissionMethod: string | null;
    commissionValue: number | null;
  };
  balance: {
    pendingPayout: string;
    totalEarned: string;
    totalWithdrawn: string;
  } | null;
  stats: {
    totalSignups: number;
    totalRevenueGenerated: number;
    coachingCenter?: {
      id: string;
      name: string;
    } | null;
  };
}

interface LeaderboardItem {
  id: string;
  name: string;
  signupCount: number;
  isSelf: boolean;
}

export default function PartnerDashboard() {
  const { user, logout, isSignedIn } = useAuthStore();
  const router = useRouter();

  const [partnerData, setPartnerData] = useState<PartnerDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/partners/me');
        setPartnerData(data);

        // If telegram partner, fetch leaderboard
        if (data.partner.role === 'telegram_partner') {
          fetchLeaderboard(leaderboardPeriod);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSignedIn]);

  const fetchLeaderboard = async (period: 'weekly' | 'monthly') => {
    setLeaderboardLoading(true);
    try {
      const { data } = await api.get(`/partners/leaderboard?period=${period}`);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handlePeriodChange = (period: 'weekly' | 'monthly') => {
    setLeaderboardPeriod(period);
    fetchLeaderboard(period);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const copyLink = () => {
    if (!partnerData) return;
    const refLink = `https://mentivo.in/referral/${partnerData.partner.referralCode}`;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-3 bg-slate-50">
        <Loader2 className="animate-spin text-[#0077CB]" size={36} />
        <span className="text-slate-500 font-bold">Loading dashboard details...</span>
      </div>
    );
  }

  if (error || !partnerData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-500 mb-6">{error || 'Failed to fetch dashboard data.'}</p>
          <button onClick={handleLogout} className="bg-red-650 hover:bg-red-750 text-white font-bold px-6 py-3 rounded-2xl w-full">
            Log out
          </button>
        </div>
      </div>
    );
  }

  const { partner, balance, stats } = partnerData;

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-8 text-slate-900 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/80 shadow-sm">
        <div>
          <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            {partner.role.replace('_', ' ')}
          </span>
          <h1 className="text-3xl font-black text-[#0b1c30] tracking-tight">
            Welcome back, {partner.name || 'Partner'}!
          </h1>
          {stats.coachingCenter && (
            <p className="text-indigo-600 font-bold text-sm mt-1">Coaching Center: {stats.coachingCenter.name}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Referral Code card */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Referral Link</span>
            <div className="font-mono text-lg font-bold text-blue-600 bg-blue-50/50 border border-blue-100/50 px-3 py-2 rounded-xl mt-3 select-all truncate">
              mentivo.in/referral/{partner.referralCode}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check size={18} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Link
              </>
            )}
          </button>
        </div>

        {/* Signups Stats */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
            <Users size={28} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Signups</span>
            <h3 className="text-3xl font-black text-slate-850 mt-1">{stats.totalSignups}</h3>
          </div>
        </div>

        {/* Revenue Generated */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Referred Revenue</span>
            <h3 className="text-3xl font-black text-slate-850 mt-1">₹{stats.totalRevenueGenerated.toFixed(2)}</h3>
          </div>
        </div>

        {/* Payout Pending */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <DollarSign size={28} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending Payout</span>
            <h3 className="text-3xl font-black text-slate-850 mt-1">₹{balance?.pendingPayout || '0.00'}</h3>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Award size={28} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Earned</span>
            <h3 className="text-3xl font-black text-slate-850 mt-1">₹{balance?.totalEarned || '0.00'}</h3>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
            <Sparkles size={28} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Payout Rules</span>
            <h3 className="text-lg font-bold text-slate-850 mt-1">
              {partner.commissionMethod === 'per_signup' ? `₹${partner.commissionValue} per signup` : `${partner.commissionValue}% revenue share`}
            </h3>
          </div>
        </div>
      </div>

      {/* Telegram Admin Leaderboard */}
      {partner.role === 'telegram_partner' && (
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-850">Referrals Leaderboard</h2>
              <p className="text-sm text-slate-400">Compete with other Telegram partners for maximum signups.</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => handlePeriodChange('weekly')}
                className={`px-4 py-2 rounded-lg transition-all ${leaderboardPeriod === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => handlePeriodChange('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${leaderboardPeriod === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {leaderboardLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    item.isSelf 
                      ? 'bg-blue-50/50 border-blue-200' 
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-850' : 'bg-slate-100 text-slate-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className={`font-semibold ${item.isSelf ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                      {item.name} {item.isSelf && '(You)'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">
                    {item.signupCount} signups
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
