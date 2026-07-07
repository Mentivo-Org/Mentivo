'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, User as UserIcon, BookOpen, Clock, Wallet, Loader2, Ticket, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.hasOwnProperty('Razorpay')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StudentHomePage() {
  const { user, logout, isSignedIn } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Voucher State
  const [voucherEligible, setVoucherEligible] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingVoucher, setLoadingVoucher] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

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

    const fetchVoucherEligibility = async () => {
      try {
        const response = await api.get('/vouchers/eligibility');
        setVoucherEligible(response.data.eligible);
        setSubscriptions(response.data.subscriptions);
      } catch (err) {
        console.error('Failed to fetch voucher eligibility:', err);
      } finally {
        setLoadingVoucher(false);
      }
    };

    if (isSignedIn) {
      fetchBalance();
      fetchVoucherEligibility();
    }
  }, [isSignedIn]);

  const handlePurchaseVoucher = async (plan: '3000' | '6000') => {
    setProcessingPlan(plan);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Razorpay SDK failed to load.');

      const orderRes = await api.post('/vouchers/purchase', { plan });
      const { orderId, key, currency, amount } = orderRes.data;

      const options = {
        key: key,
        amount: amount * 100,
        currency: currency,
        name: 'Mentivo',
        description: `Voucher Plan ₹${plan}`,
        image: 'https://mentivo.in/logo.png',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#0077CB' },
        handler: async (response: any) => {
          setProcessingPlan(plan);
          try {
            const confirmRes = await api.post('/vouchers/confirm', {
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (confirmRes.data.success) {
              alert('Voucher purchased successfully!');
              // Re-fetch data
              const balRes = await api.get('/wallet/balance');
              setBalance(balRes.data.balance);
              
              const vouchRes = await api.get('/vouchers/eligibility');
              setVoucherEligible(vouchRes.data.eligible);
              setSubscriptions(vouchRes.data.subscriptions);
            }
          } catch (confirmErr: any) {
            alert(confirmErr.response?.data?.error || 'Payment confirmation failed.');
          } finally {
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
      };

      const rzInstance = new (window as any).Razorpay(options);
      rzInstance.open();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Payment initiation failed.');
      setProcessingPlan(null);
    }
  };

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

      {voucherEligible && !loadingVoucher && (
        <div className="mb-12">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-900/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <Ticket className="text-emerald-100" size={32} />
                  Voucher Subscription
                </h2>
                <p className="text-emerald-50 font-medium">Get 10% extra credits split across 6 months.</p>
              </div>
            </div>

            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-1">Plan</p>
                      <p className="text-2xl font-black">₹{sub.plan}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm font-medium">
                      <div className="bg-black/20 px-4 py-2 rounded-lg">
                        {sub.installmentsRemaining === 0 ? 'Completed' : `${6 - sub.installmentsRemaining} / 6 Credited`}
                      </div>
                      {sub.nextCreditDate && (
                        <div className="bg-black/20 px-4 py-2 rounded-lg">
                          Next Credit: {new Date(sub.nextCreditDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => handlePurchaseVoucher('3000')} disabled={processingPlan !== null} className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg disabled:opacity-70 flex-1">
                    {processingPlan === '3000' ? 'Processing...' : 'Purchase Another ₹3000 Plan'}
                  </button>
                  <button onClick={() => handlePurchaseVoucher('6000')} disabled={processingPlan !== null} className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg disabled:opacity-70 flex-1">
                    {processingPlan === '6000' ? 'Processing...' : 'Purchase Another ₹6000 Plan'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* 3000 Plan */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black mb-1">₹3,000</h3>
                    <p className="text-emerald-100 font-medium mb-6">Get ₹3,300 total credits</p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={18} className="text-emerald-200" /> ₹550 credited immediately</li>
                      <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={18} className="text-emerald-200" /> ₹550 every month for 5 months</li>
                    </ul>
                  </div>
                  <button onClick={() => handlePurchaseVoucher('3000')} disabled={processingPlan !== null} className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg disabled:opacity-70">
                    {processingPlan === '3000' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
                {/* 6000 Plan */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black mb-1">₹6,000</h3>
                    <p className="text-emerald-100 font-medium mb-6">Get ₹6,600 total credits</p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={18} className="text-emerald-200" /> ₹1,100 credited immediately</li>
                      <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={18} className="text-emerald-200" /> ₹1,100 every month for 5 months</li>
                    </ul>
                  </div>
                  <button onClick={() => handlePurchaseVoucher('6000')} disabled={processingPlan !== null} className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg disabled:opacity-70">
                    {processingPlan === '6000' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
