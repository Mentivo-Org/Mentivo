import React from 'react';
import { ShieldAlert, Clock, UserCheck, Mail, Globe, Lock, AlertTriangle } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-blue-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-[#E15241] p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <ShieldAlert size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Disclaimer</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-red-100 text-sm font-medium">
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
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                General Disclaimer
              </h2>
              <p>
                The information, content, and services available on the Mentivo platform, mobile application, and website (collectively, the &quot;Platform&quot;) are provided strictly for general informational and educational assistance purposes only. Mentivo is a peer-to-peer marketplace that connects students with IIT student mentors and does not itself provide coaching, tutoring, or academic advisory services.
              </p>
              <p className="mt-4">
                Nothing on this Platform constitutes professional academic counselling, guaranteed exam preparation advice, or a substitute for structured coaching programmes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                No Guarantee of Results
              </h2>
              <p className="mb-4">
                Mentivo makes no representations, warranties, or guarantees of any kind, express or implied, regarding:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Academic performance improvement or exam scores as a result of using the Platform.</li>
                <li>Selection or qualification in JEE, JEE Advanced, or any other competitive examination.</li>
                <li>The suitability of any mentor&apos;s advice for a particular student&apos;s academic needs.</li>
                <li>The accuracy, completeness, or currency of information shared by mentors during sessions.</li>
              </ul>
              <p className="mt-4">
                Any examples of student outcomes, success stories, or mentor achievements shared on the Platform are illustrative only and are not to be construed as typical or guaranteed results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                Mentor Disclaimer
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">3.1 Peer Mentorship, Not Professional Coaching</h3>
                  <p>
                    All mentors on Mentivo are current IIT students offering peer-level guidance based on their personal academic experience. They are not certified teachers, professional educators, or licensed academic counsellors. Their advice reflects personal experience and opinion, not professional instruction.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">3.2 Accuracy of Information</h3>
                  <p>
                    While Mentivo verifies mentor enrollment and identity at the time of onboarding, we do not monitor, review, or validate the academic content shared during sessions. Mentivo is not responsible for any errors, omissions, or inaccuracies in information provided by mentors.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">3.3 Mentor Availability</h3>
                  <p>
                    Mentivo does not guarantee the availability of any specific mentor at any given time. Mentor availability is subject to their own schedules and discretion.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                Platform Disclaimer
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.1 Technical Availability</h3>
                  <p>
                    Mentivo strives to maintain Platform availability at all times but does not warrant that the Platform will be uninterrupted, error-free, or free from technical issues. We are not liable for any losses or inconvenience arising from Platform downtime, call drops, or technical failures.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.2 Third-Party Services</h3>
                  <p>
                    The Platform integrates with third-party services including Razorpay for payment processing, cloud hosting providers, and communication APIs. Mentivo is not responsible for the performance, accuracy, or reliability of these third-party services.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">4.3 External Links</h3>
                  <p>
                    The Platform may contain links to third-party websites or resources. These links are provided for convenience only. Mentivo does not endorse, control, or take responsibility for the content or practices of any third-party websites.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Financial Disclaimer
              </h2>
              <p className="mb-4">
                Session charges, wallet top-ups, subscription fees, and platform commissions are clearly communicated within the Platform and are subject to change with prior notice.
              </p>
              <p className="mb-4">
                Mentivo is not a financial institution. The Mentivo Wallet is a prepaid service wallet intended solely for use within the Platform and does not constitute a bank account or financial instrument.
              </p>
              <p>
                Mentor earnings displayed in the dashboard are estimates until formally processed and transferred. Actual payouts may vary due to applicable taxes, processing fees, or dispute resolutions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                Content Disclaimer
              </h2>
              <p className="mb-4">
                Content shared by users (including mentor profiles, session advice, reviews, and Ask Feature responses) represents the views of the individual user and not the views or opinions of Mentivo.
              </p>
              <p className="mb-4">
                Mentivo does not verify, endorse, or take responsibility for user-generated content on the Platform.
              </p>
              <p>
                Any reliance you place on information shared by a mentor or another user is strictly at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                Age and Parental Responsibility Disclaimer
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentivo&apos;s services are intended for users aged 13 and above.</li>
                <li>Users below the age of 18 must use the Platform with parental or guardian consent and supervision.</li>
                <li>Parents and guardians are responsible for monitoring the use of the Platform by minors in their care.</li>
                <li>Mentivo is not liable for any harm arising from unsupervised use by minors.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                Limitation of Liability
              </h2>
              <p className="mb-4">
                To the maximum extent permitted by applicable law, Mentivo, its founders, employees, partners, and affiliates shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any direct, indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the Platform.</li>
                <li>Any loss of data, revenue, academic opportunity, or goodwill.</li>
                <li>Any actions or omissions of mentors, students, or other users on the Platform.</li>
              </ul>
              <p className="mt-4">
                Your sole remedy for dissatisfaction with the Platform or its services is to discontinue use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-red-50 text-[#E15241] rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                Changes to This Disclaimer
              </h2>
              <p>
                Mentivo reserves the right to update or modify this Disclaimer at any time. Changes will be posted on the Platform with an updated effective date. Continued use of the Platform after any changes constitutes your acceptance of the revised Disclaimer.
              </p>
            </section>

            <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-200">
              <h2 className="text-2xl font-black text-[#0b1c30] mb-6 flex items-center gap-3">
                <Lock size={28} className="text-[#E15241]" />
                Grievance Officer
              </h2>
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
                      <Mail size={16} className="text-[#E15241]" />
                      <a href="mailto:grievance@mentivo.in" className="text-slate-900 font-bold hover:text-[#E15241] transition-colors">grievance@mentivo.in</a>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Please send complaints with relevant references or screenshots where applicable.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-red-50/30 p-8 rounded-[32px] border border-red-100">
              <h2 className="text-xl font-bold text-[#0b1c30] mb-4 flex items-center gap-3">
                <AlertTriangle size={24} className="text-[#E15241]" />
                Contact Us
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <Mail size={20} className="text-[#E15241]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Support</p>
                    <a href="mailto:support@mentivo.in" className="text-slate-900 font-bold hover:text-[#E15241] transition-colors">support@mentivo.in</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <Globe size={20} className="text-[#E15241]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website</p>
                    <a href="https://www.mentivo.in" className="text-slate-900 font-bold hover:text-[#E15241] transition-colors">www.mentivo.in</a>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-6 text-center">
                This Disclaimer is intended to set clear and honest expectations for all users of the Mentivo platform. When in doubt, please reach out to us.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
