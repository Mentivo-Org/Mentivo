'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Wallet, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

// Load Razorpay SDK script dynamically
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

function AddCreditsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { validateSession, isSignedIn, user } = useAuthStore();

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPack, setSelectedPack] = useState<number | null>(200);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState(0);
  const [error, setError] = useState('');

  // Predefined credit packages
  const creditPacks = [
    { amount: 100, label: '100 Credits', description: 'Quick Session' },
    { amount: 200, label: '200 Credits', description: 'Standard Pack' },
    { amount: 500, label: '500 Credits', description: 'IIT Masterclass' },
    { amount: 1000, label: '1000 Credits', description: 'Long Term Prep' },
  ];

  // 1. Initial authentication and balance fetching
  const token = searchParams.get('token');
  const refresh = searchParams.get('refreshToken');

  useEffect(() => {
    const initAuthAndBalance = async () => {
      setLoadingBalance(true);
      try {
        if (token) {
          // If token is in URL, store it and validate it
          localStorage.setItem('accessToken', token);
          if (refresh) {
            localStorage.setItem('refreshToken', refresh);
          }
          await validateSession();
          // Clean URL parameters from browser history for security
          router.replace('/add-credits');
        } else if (!isSignedIn) {
          // Otherwise, if not signed in, validate existing local session
          await validateSession();
        }
      } catch (err) {
        console.error('Init auth/balance failed:', err);
      } finally {
        setLoadingBalance(false);
      }
    };

    initAuthAndBalance();
  }, [token, refresh, isSignedIn, validateSession, router]);

  // 2. Fetch Wallet Balance once authenticated
  const fetchBalance = async () => {
    try {
      const response = await api.get('/wallet/balance');
      setBalance(response.data.balance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchBalance();
    }
  }, [isSignedIn]);

  const handlePackSelect = (amount: number) => {
    setSelectedPack(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCustomAmount(val);
      setSelectedPack(null);
    }
  };

  const handlePay = async () => {
    const amount = selectedPack || Number(customAmount);
    if (!amount || amount < 10) {
      setError('Minimum credit purchase amount is ₹10.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      // Load Razorpay Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Create Topup Order in Backend
      const orderRes = await api.post('/wallet/topup', { amount });
      const { orderId, key, currency } = orderRes.data;

      // Initialize Checkout options
      const options = {
        key: key,
        amount: amount * 100, // in paise
        currency: currency,
        name: 'Mentivo',
        description: `Purchase of ${amount} Session Credits`,
        image: 'https://mentivo.in/logo.png',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#0077CB',
        },
        handler: async (response: any) => {
          setProcessing(true);
          try {
            // Confirm transaction with backend
            const confirmRes = await api.post('/wallet/topup/confirm', {
              orderId: orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (confirmRes.data.success) {
              setCreditedAmount(amount);
              setPaymentSuccess(true);
              fetchBalance();
            } else {
              throw new Error('Payment confirmation failed. Please contact support.');
            }
          } catch (confirmErr: any) {
            setError(confirmErr.response?.data?.error || confirmErr.message || 'Payment confirmation failed.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzInstance = new (window as any).Razorpay(options);
      rzInstance.open();
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.response?.data?.error || err.message || 'Payment initiation failed.');
      setProcessing(false);
    }
  };

  if (loadingBalance && !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <Loader2 className="animate-spin text-[#0077CB]" size={40} />
        <p className="mt-4 text-slate-500 font-medium">Validating session...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-md w-full text-center">
          <AlertTriangle className="text-amber-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-black text-[#0b1c30] mb-2 tracking-tight">Authentication Required</h1>
          <p className="text-slate-500 mb-8 font-medium">
            Please log in via the Mentivo App or click below to login to your account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#0077CB] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all shadow-lg shadow-blue-500/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-2xl shadow-green-500/5 max-w-md w-full text-center">
          <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={64} />
          <h1 className="text-3xl font-black text-[#0b1c30] mb-2 tracking-tight">Credits Added!</h1>
          <p className="text-slate-500 mb-6 font-medium">
            We have successfully credited <span className="text-[#0077CB] font-extrabold">{creditedAmount} Credits</span> to your account.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">New Balance</p>
            <p className="text-3xl font-black text-slate-800">
              {balance !== null ? `${balance} Credits` : '--'}
            </p>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            You can now return to the Mentivo mobile application to book or call a mentor.
          </p>
          <button
            onClick={() => router.push('/student/home')}
            className="w-full bg-[#0077CB] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] transition-all shadow-lg shadow-blue-500/20"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12 px-6">
      <div className="bg-white p-8 sm:p-12 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-500/5 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#0b1c30] tracking-tight">Add Session Credits</h1>
            <p className="text-slate-500 font-medium">Purchase credits to call verified IITian mentors</p>
          </div>
        </div>

        {/* Current Balance Display */}
        <div className="bg-gradient-to-r from-[#0077CB] to-[#2563eb] p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-900/20 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-3xl font-black">
              {balance !== null ? `${balance} Credits` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <Wallet size={18} />
            <span className="text-sm font-semibold">1 Credit = ₹1.00</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-semibold border border-red-100 mb-6">
            {error}
          </div>
        )}

        {/* Credit Packs */}
        <h2 className="text-lg font-bold text-[#0b1c30] mb-4">Select Credit Pack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {creditPacks.map((pack) => {
            const isSelected = selectedPack === pack.amount;
            return (
              <button
                key={pack.amount}
                onClick={() => handlePackSelect(pack.amount)}
                className={`text-left p-5 rounded-2xl border-2 transition-all hover:border-[#0077CB] ${
                  isSelected
                    ? 'border-[#0077CB] bg-blue-50/50 shadow-md shadow-blue-500/5'
                    : 'border-slate-200 bg-slate-50/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xl font-extrabold text-[#0b1c30]">₹{pack.amount}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    isSelected ? 'bg-[#0077CB] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pack.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{pack.description}</p>
              </button>
            );
          })}
        </div>

        {/* Custom Amount */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Or Enter Custom Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-slate-400">₹</span>
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="Minimum ₹10"
              className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0077CB] transition-all text-slate-900 font-extrabold text-lg"
            />
          </div>
        </div>

        {/* Secure Checkout Check */}
        <div className="flex items-center gap-2 mb-8 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 rounded-xl p-3">
          <ShieldCheck className="text-emerald-500" size={16} />
          <span>Transactions are fully secure and processed externally using Razorpay</span>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 bg-[#0077CB] text-white py-4 rounded-2xl font-bold hover:bg-[#001d66] disabled:bg-blue-300 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard size={20} />
              Pay ₹{selectedPack || customAmount || '0'} Securely
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AddCreditsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <Loader2 className="animate-spin text-[#0077CB]" size={40} />
        <p className="mt-4 text-slate-500 font-medium">Loading Page...</p>
      </div>
    }>
      <AddCreditsContent />
    </Suspense>
  );
}
