import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl font-extrabold text-[#1e3a8a] uppercase tracking-tighter mb-4">
          MENTIVO
        </h2>
        <div className="flex justify-center gap-8 mb-6">
          <Link href="/" className="text-slate-500 hover:text-[#00288e] text-sm font-semibold transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-slate-500 hover:text-[#00288e] text-sm font-semibold transition-colors">
            About Us
          </Link>
          <Link href="/privacy-policy" className="text-slate-500 hover:text-[#00288e] text-sm font-semibold transition-colors">
            Privacy Policy
          </Link>
          <a href="mailto:support@mentivo.in" className="text-slate-500 hover:text-[#00288e] text-sm font-semibold transition-colors">
            Contact
          </a>
        </div>
        <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
          © 2026 Mentivo Platform. All excellence reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
