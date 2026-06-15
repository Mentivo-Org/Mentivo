import React from 'react';
import { Info, Target, Shield, Users, Zap } from 'lucide-react';

export default function AboutSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-blue-500/5 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0077CB] p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Info size={24} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">About Mentivo</h1>
            </div>
            <p className="text-blue-100 text-lg font-medium max-w-2xl leading-relaxed">
              Empowering the next generation of engineers through direct, per-minute mentorship from India's brightest minds.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-12 space-y-16 text-slate-600 leading-relaxed">
          {/* Mission Section */}
          <section>
            <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
              <Target className="text-[#0077CB]" size={28} />
              Our Mission
            </h2>
            <p className="text-lg">
              Mentivo was born from a simple observation: the journey to the IITs is as much about strategy and mindset as it is about syllabus. We believe that every aspirant deserves access to the lived experiences of those who have already conquered the mountain.
            </p>
            <p className="mt-4 text-lg">
              Our mission is to democratize elite mentorship, making it accessible, affordable, and instant. We bridge the gap between ambition and achievement by connecting you with mentors who understand your struggles because they've been in your shoes.
            </p>
          </section>

          {/* Functionality Section */}
          <section>
            <h2 className="text-2xl font-black text-[#0b1c30] mb-8 flex items-center gap-3">
              <Zap className="text-[#0077CB]" size={28} />
              How Mentivo Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                  <Users size={24} className="text-[#0077CB]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Verified IIT Mentors</h3>
                <p className="text-sm">Every mentor on our platform is a current student or alumni of the IITs, verified through rigorous ID checks.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                  <Zap size={24} className="text-[#0077CB]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Voice Calls</h3>
                <p className="text-sm">No scheduling headaches. Connect instantly via in-app VoIP calls whenever you need guidance.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                  <Shield size={24} className="text-[#0077CB]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Per-Minute Billing</h3>
                <p className="text-sm">Pay only for what you use. Transparent, fair, and budget-friendly pricing for every student.</p>
              </div>
            </div>
          </section>

          {/* Data Transparency Section */}
          <section className="bg-blue-50/50 p-8 sm:p-10 rounded-[32px] border border-blue-100">
            <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
              <Shield className="text-[#0077CB]" size={28} />
              Data Transparency & Trust
            </h2>
            <p className="mb-6">
              Your trust is our most valuable asset. We are transparent about why we request your data:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-5 h-5 bg-[#0077CB] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Personalization</h4>
                  <p className="text-sm text-slate-600">We collect your academic background to match you with mentors who have expertise in your specific target areas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-5 h-5 bg-[#0077CB] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Security & Verification</h4>
                  <p className="text-sm text-slate-600">Mentor documents are collected solely for identity and academic verification to ensure platform integrity.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-5 h-5 bg-[#0077CB] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Seamless Transactions</h4>
                  <p className="text-sm text-slate-600">Payment details are processed through encrypted channels via Razorpay; we never store your raw card or bank credentials.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA/Footer Note */}
          <div className="text-center pt-8 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4">Established 2026</p>
            <p className="text-[#0077CB] font-black text-xl tracking-tight">MENTIVO: Empowering Ambition.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
