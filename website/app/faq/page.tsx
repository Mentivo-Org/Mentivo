'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, BookOpen, User, Award, CreditCard, Laptop, Shield, MessageSquare } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

export default function FAQPage() {

  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const faqData: FAQCategory[] = [
    {
      id: 'general',
      name: 'General',
      icon: <BookOpen className="w-5 h-5" />,
      items: [
        {
          q: 'Q1. What is Mentivo?',
          a: 'Mentivo is an EdTech platform that connects JEE and competitive exam aspirants with verified IIT student mentors through a per-minute voice call marketplace. Think of it like having a senior IITian on call — whenever you need guidance, just open the app and connect instantly.'
        },
        {
          q: 'Q2. Who are the mentors on Mentivo?',
          a: 'All mentors on Mentivo are currently enrolled students at IITs (Indian Institutes of Technology). They are verified by the Mentivo team before going live on the platform. They offer peer-level guidance based on their own JEE preparation experience.'
        },
        {
          q: 'Q3. Is Mentivo a coaching institute?',
          a: 'No. Mentivo is not a coaching institute. We are a peer-to-peer mentorship marketplace. We do not provide structured courses, recorded lectures, or scheduled classes. Mentivo complements your existing coaching by giving you direct access to IITians for doubt-solving, strategy, and motivation.'
        },
        {
          q: 'Q4. Which exams does Mentivo cover?',
          a: 'Mentivo currently focuses on JEE Mains and JEE Advanced preparation. We plan to expand to other competitive exams in the future.'
        },
        {
          q: 'Q5. Is Mentivo available across India?',
          a: 'Yes. Mentivo is available to any student in India with a smartphone and internet connection.'
        }
      ]
    },
    {
      id: 'students',
      name: 'Students',
      icon: <User className="w-5 h-5" />,
      items: [
        {
          q: 'Q6. How do I sign up as a student?',
          a: 'Download the Mentivo app, tap "Sign Up as Student," enter your name, phone number, and email, verify your number via OTP, and you\'re in. It takes less than 2 minutes.'
        },
        {
          q: 'Q7. How do I find the right mentor?',
          a: 'Browse mentor profiles on the app. You can filter by IIT, branch, subject expertise, availability, and per-minute rate. Each mentor\'s profile shows their ratings and reviews from past sessions.'
        },
        {
          q: 'Q8. How does a call session work?',
          a: 'Add funds to your Mentivo Wallet, select a mentor, and tap "Call Now." The call connects instantly if the mentor is available. Billing starts the moment the call connects and stops when either party ends the call. Your wallet is deducted in real time at the mentor\'s per-minute rate.'
        },
        {
          q: 'Q9. What if the mentor I want is not available?',
          a: 'You can check the mentor\'s availability status on their profile. If they are offline, you can browse other available mentors or use the Ask Feature to send a text question and wait for a response.'
        },
        {
          q: 'Q10. What is the Ask Feature?',
          a: 'The Ask Feature lets you send a short question (up to 120 characters) to any mentor. The mentor can reply with a detailed response (up to 400 characters). It is a great way to get a quick answer or to build a connection before booking a call.'
        },
        {
          q: 'Q11. Can I choose my mentor every time?',
          a: 'Yes. Unlike other platforms, Mentivo gives you full freedom to choose which mentor you want to connect with for every session. There is no forced matching.'
        },
        {
          q: 'Q12. What is the minimum wallet balance needed to start a call?',
          a: 'You need at least enough balance to cover 5 minutes at your chosen mentor\'s per-minute rate. The app will notify you if your balance is too low before a call.'
        },
        {
          q: 'Q13. What happens if my wallet runs out during a call?',
          a: 'The call will be automatically terminated when your wallet balance reaches zero. You will be notified on screen. You can top up your wallet immediately and call again.'
        },
        {
          q: 'Q14. Can I get a refund on my wallet balance?',
          a: 'Unused wallet balance is refundable upon written request to support@mentivo.in, subject to a processing fee. Refund requests must be raised within 90 days of the top-up transaction.'
        },
        {
          q: 'Q15. What is Mentivo Pass?',
          a: 'Mentivo Pass is an optional subscription plan that gives you benefits like discounted call rates, bonus wallet credits, and priority mentor access. Plans are available on a 6-month and 12-month basis. You can subscribe from the app\'s wallet section.'
        },
        {
          q: 'Q16. How do I rate a mentor after a session?',
          a: 'After every call, you will be prompted to rate your mentor on a 5-star scale and optionally leave a written review. Your feedback helps maintain quality on the platform.'
        }
      ]
    },
    {
      id: 'mentors',
      name: 'Mentors',
      icon: <Award className="w-5 h-5" />,
      items: [
        {
          q: 'Q17. Who can become a mentor on Mentivo?',
          a: 'Any currently enrolled IIT student (any year, any branch) who has cleared JEE and wants to earn while helping JEE aspirants can apply to become a mentor.'
        },
        {
          q: 'Q18. How do I sign up as a mentor?',
          a: 'Visit mentivo.in/mentor or tap "Join as Mentor" in the app. Fill in your details, submit your IIT enrollment proof and identity document, and our team will verify and onboard you within 48 hours.'
        },
        {
          q: 'Q19. How much can I earn as a mentor?',
          a: 'Mentors set their own per-minute rates within the range permitted by Mentivo (currently ₹10, ₹15, or ₹20 per minute). You earn 70% of every session\'s billed amount. The more you are available and the higher your ratings, the more you earn.'
        },
        {
          q: 'Q20. When and how do I receive my earnings?',
          a: 'Earnings are credited to your Mentivo Earnings Ledger after each session. Payouts are processed on a weekly or fortnightly cycle to your registered bank account or UPI ID, subject to the minimum payout threshold.'
        },
        {
          q: 'Q21. Can I set my own availability hours?',
          a: 'Yes. You are in full control of when you appear as "Available" on the platform. You can go online or offline at any time from the app.'
        },
        {
          q: 'Q22. What happens if a student raises a complaint against me?',
          a: 'Mentivo takes all complaints seriously. If a complaint is raised, our team will review the session metadata and relevant details. Mentors with repeated valid complaints may face rating penalties or delisting. We always give mentors an opportunity to share their side.'
        },
        {
          q: 'Q23. Will Mentivo provide a badge or recognition for top mentors?',
          a: 'Yes. Top-performing mentors are eligible for the "Verified IIT Mentor" badge and can be featured on the platform\'s homepage, giving them greater visibility and more session requests.'
        }
      ]
    },
    {
      id: 'payments',
      name: 'Payments & Wallet',
      icon: <CreditCard className="w-5 h-5" />,
      items: [
        {
          q: 'Q24. What payment methods are accepted?',
          a: 'We accept UPI, debit cards, credit cards, and net banking — all processed securely through Razorpay.'
        },
        {
          q: 'Q25. Is my payment information safe?',
          a: 'Yes. Mentivo does not store your raw payment credentials. All transactions are processed through Razorpay, which is PCI-DSS compliant and uses bank-level encryption.'
        },
        {
          q: 'Q26. Will I receive a receipt for my transactions?',
          a: 'Yes. A transaction confirmation is sent to your registered email.'
        },
        {
          q: 'Q27. Are there any hidden charges?',
          a: 'No. The per-minute rate shown on each mentor\'s profile is exactly what you are charged. Any applicable taxes or platform fees are displayed clearly before you confirm a transaction.'
        }
      ]
    },
    {
      id: 'technical',
      name: 'Technical',
      icon: <Laptop className="w-5 h-5" />,
      items: [
        {
          q: 'Q28. Which devices does Mentivo support?',
          a: 'Mentivo is available on only Android smartphones currently. A stable internet connection (4G or Wi-Fi) is recommended for the best call experience.'
        },
        {
          q: 'Q29. What should I do if a call drops suddenly?',
          a: 'If a call drops due to a verified platform-side technical error, the affected duration may be credited to your wallet. Report the issue within 24 hours via the in-app support option or email support@mentivo.in with the session date and time.'
        },
        {
          q: 'Q30. How do I contact Mentivo support?',
          a: 'You can reach us via by emailing support@mentivo.in. We aim to respond within 24 hours on working days.'
        }
      ]
    },
    {
      id: 'privacy',
      name: 'Privacy & Safety',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          q: 'Q31. Is my personal information shared with mentors?',
          a: 'No. Your precise contact details (phone number, email) are never shared directly with mentors. All communication happens within the Mentivo platform.'
        },
        {
          q: 'Q32. Can mentors contact me outside the app?',
          a: 'No. Mentors are strictly prohibited from soliciting off-platform contact with students. If a mentor attempts to take the conversation outside the app, please report it immediately to support@mentivo.in.'
        },
        {
          q: 'Q33. Is my call content recorded?',
          a: 'No. Mentivo does not record or store the content of voice call sessions. Only session metadata (duration, timestamp, billing) is logged for platform operations.'
        },
        {
          q: 'Q34. What should I do if I experience inappropriate behaviour during a session?',
          a: 'End the call immediately and report the incident via the in-app report button or email grievance@mentivo.in. Mentivo takes safety very seriously and will investigate all reports promptly.'
        }
      ]
    },
    {
      id: 'grievance',
      name: 'Grievance',
      icon: <MessageSquare className="w-5 h-5" />,
      items: [
        {
          q: 'Q35. How do I raise a formal complaint?',
          a: 'You can email our Grievance Officer directly:\nName: Abhirajya Yadav\nEmail: grievance@mentivo.in\nResponse Time: Within 30 days of receiving your complaint'
        }
      ]
    }
  ];

  const toggleExpand = (questionId: string) => {
    setExpandedItemId(prev => (prev === questionId ? null : questionId));
  };

  // Filter items based on category
  const filteredCategories = faqData
    .filter(
      category =>
        activeCategory === 'all' || category.id === activeCategory
    );

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-blue-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-[#0077CB] p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <HelpCircle size={24} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">FAQ</h1>
              </div>
              <p className="text-blue-100 text-lg font-medium">
                Find answers to frequently asked questions about Mentivo.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-slate-100">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-[#0077CB] text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                All Categories
              </button>
              {faqData.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === category.id
                      ? 'bg-[#0077CB] text-white shadow-md shadow-blue-500/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {category.icon}
                  {category.name}
                </button>
              ))}
            </div>

            {/* FAQ Listing */}
            {filteredCategories.length > 0 ? (
              <div className="space-y-12">
                {filteredCategories.map(category => (
                  <div key={category.id} className="space-y-4">
                    <h2 className="text-xl font-black text-[#0b1c30] flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <span className="text-[#0077CB]">{category.icon}</span>
                      {category.name}
                    </h2>
                    
                    <div className="grid gap-3">
                      {category.items.map((item, idx) => {
                        const questionId = `${category.id}-${idx}`;
                        const isExpanded = expandedItemId === questionId;
                        return (
                          <div
                            key={idx}
                            className={`border rounded-2xl transition-all duration-300 ${
                              isExpanded
                                ? 'bg-slate-50/50 border-blue-100 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <button
                              onClick={() => toggleExpand(questionId)}
                              className="w-full flex items-center justify-between text-left p-5 font-bold text-slate-800 hover:text-slate-900 transition-colors"
                            >
                              <span className="pr-4">{item.q}</span>
                              <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <div
                              className="grid transition-all duration-300 ease-in-out"
                              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                            >
                              <div className="overflow-hidden">
                                <div className="px-5 pb-5 text-slate-600 font-medium leading-relaxed whitespace-pre-line border-t border-slate-100/50 pt-4">
                                  {item.a}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-bold">No questions found</p>
                <p className="text-sm font-medium mt-1">Try selecting a different category.</p>
              </div>
            )}

            {/* Bottom Support Section */}
            <div className="mt-16 bg-[#0077CB]/5 p-8 rounded-[32px] border border-[#0077CB]/10 text-center">
              <h2 className="text-xl font-bold text-[#0b1c30] mb-2">Still have a question?</h2>
              <p className="text-slate-600 font-medium mb-6">Write to us — we are happy to help.</p>
              <a
                href="mailto:support@mentivo.in"
                className="inline-flex items-center justify-center bg-[#0077CB] hover:bg-[#005fa3] text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md shadow-blue-500/10"
              >
                Contact Support (support@mentivo.in)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
