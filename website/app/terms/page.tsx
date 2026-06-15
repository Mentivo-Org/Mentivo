import React from 'react';
import { Shield, Clock, UserCheck, FileText, Mail, Globe, Lock } from 'lucide-react';

export default function TermsAndConditions() {
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
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Terms & Conditions</h1>
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
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Acceptance of Terms
              </h2>
              <p>
                By accessing or using the Mentivo platform, mobile application, or website (collectively, the &quot;Platform&quot;),
                you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to these Terms,
                please do not use the Platform.
              </p>
              <p className="mt-4">
                These Terms constitute a legally binding agreement between you and Mentivo. By registering an account,
                you confirm that you have read, understood, and accepted these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Eligibility
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 13 years of age to use the Platform.</li>
                <li>Users below 18 years of age require parental or guardian consent.</li>
                <li>Mentors must be currently enrolled students at an IIT (Indian Institute of Technology) and must be at least 18 years of age.</li>
                <li>By using the Platform, you represent and warrant that you meet these eligibility requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                Account Registration
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
                <li>You agree to notify us immediately at <a href="mailto:support@mentivo.in" className="text-[#0077CB] hover:underline">support@mentivo.in</a> if you suspect any unauthorised use of your account.</li>
                <li>Mentivo reserves the right to suspend or terminate accounts that contain false or misleading information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                The Mentivo Platform
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.1 Nature of Services</h3>
                  <p>
                    Mentivo is a peer-to-peer marketplace that connects JEE (and other competitive exam) aspirants with
                    verified IIT student mentors via per-minute voice calls. Mentivo acts solely as an intermediary platform
                    and does not itself provide educational or coaching services.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.2 No Guarantee of Outcomes</h3>
                  <p>
                    Mentivo does not guarantee any specific academic results, exam scores, or outcomes as a result of using
                    the Platform. The quality and effectiveness of mentorship sessions depend entirely on the individual
                    mentor and student.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.3 Mentor Verification</h3>
                  <p>
                    Mentivo verifies mentor credentials (IIT enrollment, identity) at the time of onboarding. However, we do not
                    independently verify the accuracy of all information shared by mentors during sessions. Students are
                    encouraged to exercise independent judgment.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Student Terms
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Students may browse mentor profiles and initiate voice call sessions on a per-minute basis.</li>
                <li>Sessions are billed based on actual call duration at the rates displayed on the mentor&apos;s profile.</li>
                <li>Students must maintain sufficient wallet balance before initiating a call. Calls will be automatically terminated if the balance falls to zero.</li>
                <li>Students agree not to share personal contact details (phone number, social media handles, email) with mentors outside the Platform to circumvent the per-minute billing model.</li>
                <li>Students must treat mentors with respect. Abusive, threatening, or inappropriate conduct will result in immediate account suspension.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                Mentor Terms
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentors must be currently enrolled IIT students and must provide accurate documentation for verification.</li>
                <li>Mentors set their own per-minute rates within the range permitted by Mentivo.</li>
                <li>Mentors agree to provide honest, good-faith guidance to students. Deliberately misleading or inaccurate advice is prohibited.</li>
                <li>Mentors must maintain a professional standard of conduct during all sessions.</li>
                <li>Mentors agree not to solicit direct payment from students outside the Platform.</li>
                <li>Mentivo will disburse mentor earnings on a weekly/fortnightly basis, subject to the minimum payout threshold.</li>
                <li>Mentivo reserves the right to delist a mentor for low ratings, repeated complaints, or policy violations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                Payments and Billing
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">7.1 Student Payments</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Students prepay into a Mentivo wallet via UPI, debit/credit card, or net banking through Razorpay.</li>
                    <li>Per-minute charges are deducted in real time during a session.</li>
                    <li>Unused wallet balance is refundable upon written request, subject to a processing fee.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">7.2 Mentor Payouts</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mentivo retains a platform commission on each session (commission rate displayed in the mentor dashboard).</li>
                    <li>Net earnings are transferred to the mentor&apos;s registered bank account or UPI ID.</li>
                    <li>Mentivo is not responsible for delays caused by banking intermediaries.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">7.3 Refunds</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Refunds for sessions will be considered only in cases of proven technical failure on Mentivo&apos;s end (e.g., call drop due to platform error).</li>
                    <li>Dissatisfaction with session quality does not automatically entitle a student to a refund. Students are encouraged to review mentor profiles and ratings before initiating a session.</li>
                    <li>Refund requests must be submitted within 48 hours of the session at <a href="mailto:support@mentivo.in" className="text-[#0077CB] hover:underline">support@mentivo.in</a>.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                Prohibited Conduct
              </h2>
              <p className="mb-4">All users agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Platform for any unlawful purpose.</li>
                <li>Share, distribute, or reproduce session content without explicit consent.</li>
                <li>Attempt to circumvent the Platform&apos;s billing system by taking mentor-student interactions off-platform.</li>
                <li>Harass, abuse, or threaten other users.</li>
                <li>Upload or share false, defamatory, or misleading information.</li>
                <li>Attempt to hack, reverse-engineer, or disrupt the Platform&apos;s technical infrastructure.</li>
                <li>Use automated bots, scrapers, or scripts to access the Platform.</li>
                <li>Impersonate any person or entity.</li>
              </ul>
              <p className="mt-4">
                Violation of any of the above may result in immediate account termination and, where applicable, legal action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                Intellectual Property
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All content on the Platform, including but not limited to the Mentivo brand, logo, design, software, and text, is the intellectual property of Mentivo and is protected under applicable Indian and international laws.</li>
                <li>Users retain ownership of content they upload (such as profile information) but grant Mentivo a non-exclusive, royalty-free licence to use such content for operating and improving the Platform.</li>
                <li>You may not copy, reproduce, distribute, or create derivative works from Mentivo&apos;s content without prior written permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">10</span>
                Limitation of Liability
              </h2>
              <p className="mb-4">To the fullest extent permitted by applicable law:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentivo is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</li>
                <li>Mentivo&apos;s total liability to any user for any claim arising out of or related to these Terms shall not exceed the total amount paid by that user to Mentivo in the 3 months preceding the claim.</li>
                <li>Mentivo is not responsible for the conduct, statements, or actions of mentors or students on the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">11</span>
                Disclaimers
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, express or implied.</li>
                <li>Mentivo does not warrant that the Platform will be uninterrupted, error-free, or free of viruses or harmful components.</li>
                <li>Mentivo does not endorse any mentor&apos;s views, advice, or recommendations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">12</span>
                Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless Mentivo, its founders, employees, and partners from
                and against any claims, liabilities, damages, losses, or expenses (including legal fees) arising out of or
                related to your use of the Platform, your violation of these Terms, or your violation of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">13</span>
                Termination
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentivo may suspend or terminate your account at any time, with or without notice, for violation of these Terms or for any conduct that Mentivo determines, in its sole discretion, to be harmful to other users or the Platform.</li>
                <li>You may terminate your account at any time by contacting <a href="mailto:support@mentivo.in" className="text-[#0077CB] hover:underline">support@mentivo.in</a>. Upon termination, your right to use the Platform ceases immediately.</li>
                <li>Provisions of these Terms that by their nature should survive termination (including Sections 9, 10, 11, 12) shall survive.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">14</span>
                Governing Law and Dispute Resolution
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>These Terms shall be governed by and construed in accordance with the laws of India.</li>
                <li>Any disputes arising out of or relating to these Terms or the Platform shall first be attempted to be resolved through good-faith negotiation.</li>
                <li>If unresolved within 30 days, disputes shall be submitted to binding arbitration in accordance with the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Guwahati, Assam, India.</li>
                <li>The language of arbitration shall be English.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-[#0077CB] rounded-lg flex items-center justify-center text-sm font-bold">15</span>
                Changes to These Terms
              </h2>
              <p>
                Mentivo reserves the right to modify these Terms at any time. We will notify you of material changes via
                email or a notice on the Platform at least 7 days before the changes take effect. Your continued use of the
                Platform after the effective date constitutes your acceptance of the revised Terms.
              </p>
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
                These Terms are written in plain language. If you have any questions about what they mean, please write to us before using the Platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
