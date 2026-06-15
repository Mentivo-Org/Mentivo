'use client';

import React, { useState } from 'react';
import { Mail, ShieldAlert, Check, Copy, HelpCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function SupportPage() {
  const [copied, setCopied] = useState(false);
  const [copiedPartial, setCopiedPartial] = useState(false);

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

  const partialEmailTemplate = `To: support@mentivo.in
Subject: Partial Information Deletion Request - [Your Registered Email/Phone]

Dear Mentivo Support,

I would like to request the deletion of specific information linked to my Mentivo account while keeping my account active. Here are my details:

- Registered Email/Phone: [Enter Details]
- Specific Information to Delete: [e.g., Linked Coaching Referral Code, Search/Filter History, Saved Academic Profiles]
- Reason (Optional): [Enter Reason]

I understand that:
- This deletion is permanent for the specified fields.
- Billing receipts and transaction IDs cannot be removed for audit and compliance reasons.

Regards,
[Your Name]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPartialToClipboard = () => {
    navigator.clipboard.writeText(partialEmailTemplate);
    setCopiedPartial(true);
    setTimeout(() => setCopiedPartial(false), 2000);
  };

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
                  <HelpCircle size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Support & Account</h1>
              </div>
              <p className="text-blue-100 max-w-xl text-lg font-medium leading-relaxed">
                Need to delete or modify your Mentivo account? Follow the instructions below to submit your request safely and securely.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-12 text-slate-600 leading-relaxed">
            {/* Context/Overview */}
            <section className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-3xl">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={24} className="text-[#0077CB]" />
                Account Deletion & Data Request Information
              </h2>
              <p className="text-slate-600 mb-4 text-sm sm:text-base">
                We respect your data privacy. To protect your personal information and prevent unauthorized requests, 
                account modification and deletion requests are processed manually by our support team.
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
                    <Clock className="text-[#0077CB]" size={18} />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Option A: Full Deletion */}
              <section className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-150">
                <h2 className="text-2xl font-black text-[#0b1c30] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#0077CB] text-white flex items-center justify-center text-sm font-bold shrink-0">A</span>
                  Full Account Deletion
                </h2>
                <p className="text-slate-600 text-sm">
                  Choose this if you want to permanently deactivate and delete your entire user profile and all associated personal information.
                </p>

                <div className="space-y-4">
                  <div className="bg-slate-950 text-slate-200 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                    <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                      <span className="text-xs font-mono text-slate-400">Full Deletion Template</span>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md border border-slate-700"
                      >
                        {copied ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 max-h-60 overflow-y-auto">
                      <pre className="font-mono text-[10px] sm:text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {emailTemplate}
                      </pre>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-500">
                    <p className="font-bold text-slate-700">Irreversible Action</p>
                    <p>This deletes your active mentor sessions, wallet access, and credentials forever.</p>
                  </div>
                </div>
              </section>

              {/* Option B: Partial Deletion */}
              <section className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-150">
                <h2 className="text-2xl font-black text-[#0b1c30] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#0077CB] text-white flex items-center justify-center text-sm font-bold shrink-0">B</span>
                  Partial Information Deletion
                </h2>
                <p className="text-slate-600 text-sm">
                  Choose this if you want to keep your Mentivo account active but remove specific pieces of information, such as linked coaching referrral logs, profile details, or search logs.
                </p>

                <div className="space-y-4">
                  <div className="bg-slate-950 text-slate-200 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                    <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800">
                      <span className="text-xs font-mono text-slate-400">Partial Deletion Template</span>
                      <button
                        onClick={copyPartialToClipboard}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md border border-slate-700"
                      >
                        {copiedPartial ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 max-h-60 overflow-y-auto">
                      <pre className="font-mono text-[10px] sm:text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {partialEmailTemplate}
                      </pre>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-500">
                    <p className="font-bold text-slate-700">Selective Removal</p>
                    <p>Allows removing specific fields/preferences while leaving your overall account intact.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* General Submission steps */}
            <section className="bg-blue-50/20 border border-blue-100 p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-950">How to submit either request:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">1. Send Email</h4>
                  <p className="text-slate-600 mb-2">Send the copied template from your registered email address to:</p>
                  <a
                    href="mailto:support@mentivo.in"
                    className="inline-flex items-center gap-2 font-extrabold text-[#0077CB] hover:underline bg-white px-3 py-1.5 rounded-lg border border-blue-100"
                  >
                    <Mail size={16} />
                    support@mentivo.in
                  </a>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">2. Verification & Completion</h4>
                  <p className="text-slate-600">
                    Our team will verify your identity, process the changes, and reach back to confirm your request status within <strong>4 days</strong>.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
