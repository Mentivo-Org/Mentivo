import React from 'react';
import { Shield, Clock, UserCheck, FileText, Mail, Globe, Lock, Info, CheckCircle, Smartphone, CreditCard, Sparkles, RefreshCw, AlertTriangle, MessageSquare } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-blue-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-[#0077CB] p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Terms of Service</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-blue-100 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Effective Date: June 6, 2026
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck size={16} />
                  Last Updated: June 18, 2026
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-12 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                About These Terms
              </h2>
              <p>
                These Terms of Service (&quot;ToS&quot;) govern your access to and use of Mentivo&apos;s services, including the Platform, voice call marketplace, wallet system, and any related features or tools (collectively, the &quot;Services&quot;). These ToS are separate from but complementary to Mentivo&apos;s Terms & Conditions and Privacy Policy.
              </p>
              <p className="mt-4">
                By using the Services, you agree to these ToS. If you are using Mentivo on behalf of an institution, you represent that you have authority to bind that institution to these ToS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Description of Services
              </h2>
              <p className="mb-4">Mentivo provides the following core services:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-slate-200 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2">Mentor Discovery</h3>
                  <p className="text-sm">A searchable marketplace of verified IIT student mentors with profiles showing branch, expertise, ratings, and per-minute rates.</p>
                </div>
                <div className="p-5 border border-slate-200 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2">Voice Call Sessions</h3>
                  <p className="text-sm">Real-time, per-minute billed voice calls between students and mentors facilitated through the Platform.</p>
                </div>
                <div className="p-5 border border-slate-200 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2">Mentivo Wallet</h3>
                  <p className="text-sm">A prepaid digital wallet for students to fund sessions, and a payout system for mentors to receive earnings.</p>
                </div>
                <div className="p-5 border border-slate-200 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2">Mentivo Pass (Subscription)</h3>
                  <p className="text-sm">Optional subscription plans offering discounted call rates and priority access to mentors.</p>
                </div>
                <div className="p-5 border border-slate-200 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2">Ask Feature</h3>
                  <p className="text-sm">A text-based Q&A feature allowing students to submit short questions and receive mentor responses to drive session engagement.</p>
                </div>
                <div className="p-5 border border-slate-200 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2">Ratings & Reviews</h3>
                  <p className="text-sm">A feedback system allowing students to rate mentors after each session to maintain quality standards.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                Service Availability
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentivo strives to maintain Platform availability 24/7 but does not guarantee uninterrupted access.</li>
                <li>We may suspend Services temporarily for maintenance, upgrades, or emergency fixes, and will endeavour to notify users in advance where possible.</li>
                <li>Mentivo is not liable for losses arising from Platform downtime or service interruptions beyond our reasonable control, including internet outages, third-party API failures, or force majeure events.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                User Accounts and Access
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.1 Account Types</h3>
                  <p className="mb-2">The Platform supports two primary account types:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong className="text-slate-900">Student Account:</strong> For JEE and competitive exam aspirants seeking mentorship.</li>
                    <li><strong className="text-slate-900">Mentor Account:</strong> For verified IIT students offering per-minute guidance sessions.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.2 Account Security</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You are solely responsible for all activity under your account.</li>
                    <li>Do not share your login credentials with any third party.</li>
                    <li>Mentivo will never ask for your password via email, SMS, or chat.</li>
                    <li>Suspicious account activity must be reported to <a href="mailto:support@mentivo.in" className="text-[#0077CB] hover:underline">support@mentivo.in</a> immediately.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.3 Single Account Policy</h3>
                  <p>
                    Each user may maintain only one active account per account type. Creating multiple accounts to circumvent bans, ratings, or platform policies is strictly prohibited.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Voice Call Services
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">5.1 How Calls Work</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Students initiate calls by selecting a mentor and tapping the &quot;Call Now&quot; button.</li>
                    <li>Billing starts from the moment the call is connected and stops when either party ends the call.</li>
                    <li>The per-minute rate applicable to a session is the rate displayed on the mentor&apos;s profile at the time the call is initiated.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">5.2 Call Quality</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mentivo facilitates the technical connection but is not responsible for call quality issues arising from the user&apos;s internet connection, device, or telecom network.</li>
                    <li>In case of a call drop due to a verified Platform-side error, the affected duration may be credited to the student&apos;s wallet upon review.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">5.3 Session Conduct</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Both students and mentors must conduct themselves professionally and respectfully during sessions.</li>
                    <li>Recording of sessions by either party without explicit mutual consent is prohibited.</li>
                    <li>Mentivo reserves the right to monitor aggregate session metadata (not content) for quality assurance and fraud prevention.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                Mentivo Wallet
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">6.1 Wallet Top-Up</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Students can add funds to their Mentivo Wallet using UPI, debit/credit card, or net banking via Razorpay.</li>
                    <li>Wallet funds are non-transferable between accounts.</li>
                    <li>Top-up amounts are subject to minimum and maximum limits as displayed in the app.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">6.2 Wallet Deductions</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Funds are deducted in real time during a voice call session based on the applicable per-minute rate.</li>
                    <li>If wallet balance reaches zero mid-call, the session will be automatically terminated.</li>
                    <li>Any applicable taxes or platform fees will be displayed at the time of transaction.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">6.3 Wallet Refunds and Withdrawals</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Unused wallet balance may be refunded to the original payment method upon written request to <a href="mailto:support@mentivo.in" className="text-[#0077CB] hover:underline">support@mentivo.in</a>, subject to a processing fee and verification.</li>
                    <li>Refund requests must be submitted within 90 days of the top-up transaction.</li>
                    <li>Wallets inactive for more than 12 consecutive months may be subject to dormancy review.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                Mentivo Pass (Subscription Plans)
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentivo offers optional subscription plans (&quot;Mentivo Pass&quot;) providing benefits such as discounted call rates, bonus wallet credits, and priority mentor access.</li>
                <li>Subscription fees are charged in advance and are non-refundable once the billing cycle has commenced.</li>
                <li>Mentivo Pass benefits are non-transferable and apply only to the subscribed account.</li>
                <li>Mentivo reserves the right to modify subscription plan features or pricing with 7 days&apos; prior notice.</li>
                <li>Subscriptions auto-renew unless cancelled before the renewal date through the Platform&apos;s subscription settings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                Mentor Payout Services
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">8.1 Earnings</h3>
                  <p className="mb-2">
                    Mentors earn a percentage of each session&apos;s billed amount after Mentivo&apos;s platform commission is deducted. The current commission structure is displayed in the Mentor Dashboard.
                  </p>
                  <p>
                    Earnings are credited to the mentor&apos;s Mentivo Earnings Ledger after each completed session.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">8.2 Payout Processing</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Payouts are processed on a weekly or fortnightly cycle to the mentor&apos;s registered bank account or UPI ID.</li>
                    <li>A minimum payout threshold must be met before a withdrawal is processed.</li>
                    <li>Mentivo is not responsible for delays caused by bank processing times or incorrect payout details provided by the mentor.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">8.3 Payout Disputes</h3>
                  <p className="mb-2">
                    Mentors must raise payout discrepancies within 7 days of the payout date by emailing <a href="mailto:support@mentivo.in" className="text-[#0077CB] hover:underline">support@mentivo.in</a> with relevant session details.
                  </p>
                  <p>
                    Unresolved disputes will be escalated to the Grievance Officer.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                Third-Party Services
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Platform integrates with third-party services including Razorpay (payments), cloud hosting providers, and communication APIs.</li>
                <li>Mentivo is not responsible for the terms, policies, or failures of these third-party providers.</li>
                <li>Your use of third-party services through the Platform may be subject to those providers&apos; own terms of service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">10</span>
                Content Standards
              </h2>
              <p className="mb-4">All content uploaded or shared on the Platform (profile information, reviews, Ask Feature responses) must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be accurate and not misleading.</li>
                <li>Not infringe any third-party intellectual property rights.</li>
                <li>Not be abusive, defamatory, obscene, or harmful.</li>
                <li>Not contain spam, promotional content, or external contact details intended to circumvent the Platform.</li>
              </ul>
              <p className="mt-4">
                Mentivo reserves the right to remove any content that violates these standards without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">11</span>
                Feedback and Reviews
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Students may rate mentors and leave written reviews after each session.</li>
                <li>Reviews must be honest, based on actual session experience, and comply with Content Standards (Section 10).</li>
                <li>Mentivo reserves the right to remove reviews that are fraudulent, abusive, or in violation of these ToS.</li>
                <li>Mentors may not solicit, incentivise, or coerce students into leaving positive reviews.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">12</span>
                Suspension and Termination of Services
              </h2>
              <p className="mb-4">Mentivo reserves the right to suspend or permanently terminate access to Services for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these ToS, Terms & Conditions, or Privacy Policy.</li>
                <li>Fraudulent activity, including wallet manipulation or fake session generation.</li>
                <li>Repeated low-quality sessions or sustained negative feedback (for mentors).</li>
                <li>Any conduct deemed harmful to the Platform, its users, or Mentivo&apos;s reputation.</li>
              </ul>
              <p className="mt-4">
                Upon termination, any unused wallet balance will be refunded subject to fraud verification. Mentor earnings already in the ledger will be paid out after a 30-day hold period for dispute resolution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">13</span>
                Modifications to Services
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentivo reserves the right to modify, add, or discontinue any feature or service at any time.</li>
                <li>Change pricing, commission rates, or subscription terms with 7 days&apos; prior notice.</li>
                <li>Update these ToS at any time, with notice provided via email or in-app notification.</li>
                <li>Continued use of the Services after any modification constitutes your acceptance of the updated ToS.</li>
              </ul>
            </section>

            <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-200">
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <Lock size={28} className="text-[#0077CB]" />
                Grievance Officer
              </h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                In accordance with the Information Technology Act, 2000 and applicable Indian law, our designated Grievance Officer is:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-6 bg-white rounded-2xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p>
                    <p className="text-slate-900 font-black">Abhirajya Yadav</p>
                    <p className="text-sm text-slate-500 font-medium mt-1">Founder & CEO, Mentivo</p>
                  </div>
                  
                  <div className="p-6 bg-white rounded-2xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Response Time</p>
                    <p className="text-slate-900 font-bold">Within 30 days of receiving a complaint</p>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Grievance Contact</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail size={16} className="text-[#0077CB]" />
                      <a href="mailto:grievance@mentivo.in" className="text-slate-900 font-bold hover:text-[#0077CB] transition-colors">grievance@mentivo.in</a>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Please send complaints with relevant references or screenshots where applicable.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-[#0077CB]/5 p-8 rounded-[32px] border border-[#0077CB]/10">
              <h2 className="text-xl font-bold text-[#0b1c30] mb-4 flex items-center gap-3">
                <Shield size={24} className="text-[#0077CB]" />
                Contact Us
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <Mail size={20} className="text-[#0077CB]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Support</p>
                    <a href="mailto:support@mentivo.in" className="text-slate-900 font-bold hover:text-[#0077CB] transition-colors">support@mentivo.in</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <Globe size={20} className="text-[#0077CB]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website</p>
                    <a href="https://www.mentivo.in" className="text-slate-900 font-bold hover:text-[#0077CB] transition-colors">www.mentivo.in</a>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-6 text-center">
                These Terms of Service are designed to ensure a safe, fair, and transparent experience for every student and mentor on the Mentivo platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
