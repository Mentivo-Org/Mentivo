import React from 'react';
import { Shield, Mail, Globe, Clock, UserCheck, Lock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-blue-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-[#00288e] p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Privacy Policy</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-blue-100 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Effective Date: June 6, 2026
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck size={16} />
                  Last Updated: June 6, 2026
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-12 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Introduction
              </h2>
              <p>
                Mentivo is an EdTech platform that connects JEE aspirants with verified IIT student mentors 
                through a per-minute voice call marketplace. We are committed to protecting your personal 
                information and your right to privacy.
              </p>
              <p className="mt-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our platform, mobile application, or website (collectively, the &quot;Platform&quot;). Please read this 
                policy carefully. If you disagree with its terms, please discontinue use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Information We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">2.1 Information You Provide to Us</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-slate-900">Account Registration:</strong> Name, email address, phone number, password, and profile photo.</li>
                    <li><strong className="text-slate-900">Student Profile:</strong> Class/grade, target exam year, coaching institute name, city, and academic background.</li>
                    <li><strong className="text-slate-900">Mentor Profile:</strong> IIT college name, branch, year of study, JEE rank, areas of expertise, and identity verification documents.</li>
                    <li><strong className="text-slate-900">Payment Information:</strong> UPI ID, bank account details, or card information processed securely via Razorpay. We do not store raw payment credentials.</li>
                    <li><strong className="text-slate-900">Communications:</strong> Messages, feedback, and support requests submitted through the Platform.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">2.2 Information Collected Automatically</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-slate-900">Usage Data:</strong> Pages visited, features used, session duration, call initiation and duration logs, and in-app interactions.</li>
                    <li><strong className="text-slate-900">Device Information:</strong> Device type, operating system, browser type, IP address, and unique device identifiers.</li>
                    <li><strong className="text-slate-900">Call Metadata:</strong> Call timestamps, duration, and session ratings. Voice call content is not recorded or stored unless explicitly disclosed and consented to.</li>
                    <li><strong className="text-slate-900">Location Data:</strong> Approximate location inferred from IP address. We do not collect precise GPS location without explicit consent.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">2.3 Information from Third Parties</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-slate-900">Social Login:</strong> If you sign in via Google or other OAuth providers, we receive your name, email, and profile picture from that provider.</li>
                    <li><strong className="text-slate-900">Referral Data:</strong> If you joined via a coaching institute partner, we may receive basic enrollment details shared by that partner.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                How We Use Your Information
              </h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and manage your account on the Platform.</li>
                <li>Match students with suitable mentors based on their academic needs and preferences.</li>
                <li>Facilitate voice call sessions and process per-minute billing.</li>
                <li>Process payments and disburse earnings to mentors.</li>
                <li>Send transactional notifications (call confirmations, payment receipts, session reminders).</li>
                <li>Verify mentor credentials and maintain quality standards.</li>
                <li>Respond to customer support queries and resolve disputes.</li>
                <li>Analyse usage patterns to improve Platform features and user experience.</li>
                <li>Send marketing communications (you may opt out at any time).</li>
                <li>Comply with applicable laws and regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                How We Share Your Information
              </h2>
              <p className="mb-6">We do not sell your personal data. We may share your information in the following circumstances:</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">4.1 With Other Users</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Student profiles (name, class, subject focus) are visible to mentors during session matching.</li>
                    <li>Mentor profiles (name, IIT branch, year, JEE rank, expertise, ratings) are visible to students browsing the Platform.</li>
                    <li>Precise contact details (phone number, email) are not shared between students and mentors directly.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">4.2 With Service Providers</h3>
                  <p className="mb-3">We engage trusted third-party vendors to support our operations, including:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-slate-900">Payment Processing:</strong> Razorpay</li>
                    <li><strong className="text-slate-900">Cloud Hosting:</strong> Amazon Web Services (AWS) / Google Cloud</li>
                    <li><strong className="text-slate-900">Communication Infrastructure:</strong> VoIP and telephony API providers</li>
                    <li><strong className="text-slate-900">Analytics:</strong> Firebase / Google Analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">4.3 With Institutional Partners</h3>
                  <p>If you access Mentivo through a coaching institute or school partnership, we may share aggregate, non-personally identifiable usage data with that partner.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">4.4 For Legal Compliance</h3>
                  <p>We may disclose your information if required to do so by law, court order, or government authority.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Data Retention
              </h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide 
                services. You may request deletion of your account and associated data at any time. We may retain certain data for up to 5 years where required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                Data Security
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encrypted data transmission (TLS/SSL).</li>
                <li>Secure password hashing.</li>
                <li>Access controls limiting data access to authorised personnel only.</li>
                <li>Regular security audits.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                Children&apos;s Privacy
              </h2>
              <p>
                Mentivo&apos;s services are intended for users who are 13 years of age or older. Students below 18 
                years of age must have parental or guardian consent to use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#00288e] rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                Your Rights
              </h2>
              <p className="mb-4">Depending on applicable law, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong className="text-[#00288e]">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-[#00288e]">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong className="text-[#00288e]">Deletion:</strong> Request deletion of your personal data.</li>
                <li><strong className="text-[#00288e]">Withdrawal of Consent:</strong> Withdraw consent for data processing.</li>
              </ul>
            </section>

            <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-200">
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <Lock size={28} className="text-[#00288e]" />
                Contact Us
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                      <Mail size={20} className="text-[#00288e]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Support</p>
                      <a href="mailto:privacy@mentivo.in" className="text-slate-900 font-bold hover:text-[#00288e] transition-colors">privacy@mentivo.in</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                      <Globe size={20} className="text-[#00288e]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website</p>
                      <a href="https://www.mentivo.in" className="text-slate-900 font-bold hover:text-[#00288e] transition-colors">www.mentivo.in</a>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Grievance Officer</p>
                  <p className="text-slate-900 font-black">Abhirajya Yadav</p>
                  <p className="text-sm text-slate-500 font-medium">Founder & CEO, Mentivo</p>
                  <a href="mailto:grievance@mentivo.in" className="text-[#00288e] text-sm font-bold hover:underline mt-2 inline-block">grievance@mentivo.in</a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
