'use client';

import React, { useState } from 'react';
import { Mail, ShieldAlert, Check, Copy, HelpCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function SupportPage() {
  const [copied, setCopied] = useState(false);

  const emailTemplate = `To: support@mentivo.in
Subject: Account Deletion Request - [Your Registered Email/Phone]

Dear Mentivo Support,

I am writing to request the permanent deletion of my Mentivo account. Here are my account details:

- Registered Email: [Enter Email Address]
- Registered Phone Number: [Enter Phone Number]
- Reason for Deletion (Optional): [Enter Reason]

I understand that:
- This action is permanent and irreversible.
- All billing receipts and transaction IDs will be retained by Mentivo for security, compliance, and auditing purposes.

Regards,
[Your Name]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                  <HelpCircle size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Support & Account</h1>
              </div>
              <p className="text-blue-100 max-w-xl text-lg font-medium leading-relaxed">
                Need to delete your Mentivo account? Follow the clear instructions below to submit your request safely and securely.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-10 text-slate-600 leading-relaxed">
            {/* Context/Overview */}
            <section className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-3xl">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={24} className="text-[#00288e]" />
                Account Deletion Information
              </h2>
              <p className="text-slate-600 mb-4 text-sm sm:text-base">
                We are sorry to see you go. To protect your personal information and prevent accidental deletion, 
                account deletion requests are processed manually by our support team.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="text-amber-600" size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Security & Compliance</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      All billing receipts and transaction IDs will be retained for security purposes and legal compliance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="text-[#00288e]" size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Processing Time</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Our support team will contact you and process the account deletion request within <strong>4 days</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Steps */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-[#0b1c30] flex items-center gap-3">
                Instructions to Request Account Deletion
              </h2>
              
              <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                {/* Step 1 */}
                <div className="flex gap-4 relative">
                  <span className="w-8 h-8 rounded-full bg-[#00288e] text-white flex items-center justify-center text-sm font-bold z-10 shrink-0">
                    1
                  </span>
                  <div className="pt-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Copy the Email Template</h3>
                    <p className="text-slate-600 mb-4 text-sm sm:text-base">
                      Copy the pre-formatted request template below and fill in your registered account information.
                    </p>
                    
                    {/* Code Template box */}
                    <div className="bg-slate-950 text-slate-200 rounded-2xl overflow-hidden border border-slate-800 shadow-lg max-w-2xl">
                      <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                        <span className="text-xs font-mono text-slate-400">Deletion Request Template</span>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
                        >
                          {copied ? (
                            <>
                              <Check size={14} className="text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Template</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {emailTemplate}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 relative">
                  <span className="w-8 h-8 rounded-full bg-[#00288e] text-white flex items-center justify-center text-sm font-bold z-10 shrink-0">
                    2
                  </span>
                  <div className="pt-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Send the Email</h3>
                    <p className="text-slate-600 mb-2 text-sm sm:text-base">
                      Send the completed template from your registered email address to our support mailbox:
                    </p>
                    <a
                      href="mailto:support@mentivo.in"
                      className="inline-flex items-center gap-2 text-lg font-extrabold text-[#00288e] hover:underline bg-blue-50/50 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-blue-100"
                    >
                      <Mail size={18} />
                      support@mentivo.in
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 relative">
                  <span className="w-8 h-8 rounded-full bg-[#00288e] text-white flex items-center justify-center text-sm font-bold z-10 shrink-0">
                    3
                  </span>
                  <div className="pt-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Confirmation</h3>
                    <p className="text-slate-600 text-sm sm:text-base">
                      Once received, our team will review the request and verify your identity if needed. The deletion process will be finalized, and a confirmation email will be sent to you within <strong>4 days</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
