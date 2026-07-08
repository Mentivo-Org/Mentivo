'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Clipboard, Check, Smartphone, Monitor } from 'lucide-react';

export default function ReferralPage() {
  const params = useParams();
  const rawCode = params.code as string;
  const referralCode = `MENTIVO-${rawCode}`;
  
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isMobile, setIsMobile] = useState(false);

  // Play Store URL for the app
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mentivo.in';
  // Deep link back to referral activation in the app
  const DEEP_LINK_URL = `https://mentivo.in/referral/${rawCode}`;

  useEffect(() => {
    // Basic user agent check for mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobilePattern = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const mobileDetected = mobilePattern.test(userAgent.toLowerCase());
    setIsMobile(mobileDetected);

    // Auto copy the referral code
    try {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [referralCode]);

  useEffect(() => {
    if (isMobile) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = PLAY_STORE_URL;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isMobile]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const qrPlayStore = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PLAY_STORE_URL)}`;
  const qrReferral = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(DEEP_LINK_URL)}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[32px] p-8 sm:p-12 shadow-2xl text-center">
        <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
          {isMobile ? <Smartphone size={32} /> : <Monitor size={32} />}
        </div>

        <h1 className="text-3xl font-black mb-2 tracking-tight text-white">
          Welcome to <span className="text-blue-500">Mentivo</span>
        </h1>
        <p className="text-slate-400 mb-8 text-sm">
          You have been referred to Mentivo! Connect 1-on-1 with verified IITians for per-minute JEE mentorship.
        </p>

        {/* Copy Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="text-left">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Referral Code</span>
            <code className="font-mono text-lg font-bold text-blue-400 select-all">{referralCode}</code>
          </div>
          <button
            onClick={copyToClipboard}
            className="p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check size={18} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Clipboard size={18} />
                <span className="text-xs font-bold">Copy</span>
              </>
            )}
          </button>
        </div>

        {isMobile ? (
          /* Mobile View - Redirect Countdown */
          <div className="space-y-6">
            <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6 text-sm text-slate-300">
              <p className="mb-2">
                We have copied your referral code. You will be redirected to the Play Store in{' '}
                <span className="font-bold text-blue-400 text-base">{countdown}s</span>...
              </p>
              <p className="text-[11px] text-slate-400">
                For successful referral activation, please click your referral link again after installing the application.
              </p>
            </div>

            <a
              href={PLAY_STORE_URL}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
            >
              <Download size={20} />
              Download Mentivo App
            </a>
          </div>
        ) : (
          /* Desktop View - QR Codes */
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 mb-3">1. Install App</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrPlayStore} alt="Play Store QR" className="w-32 h-32 rounded-lg bg-white p-2" />
                <span className="text-[10px] text-slate-500 mt-2">Scan to Download</span>
              </div>
              <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 mb-3">2. Activate Link</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrReferral} alt="Referral Deep Link QR" className="w-32 h-32 rounded-lg bg-white p-2" />
                <span className="text-[10px] text-slate-500 mt-2">Scan after Install</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Scan the first QR to download the application. Once installed, scan the second QR to link and activate your referral bonus.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
