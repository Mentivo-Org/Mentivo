import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
              <Image src="/logo.svg" alt="Mentivo Logo" width={32} height={32} className="rounded-lg" />
              Mentivo
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/about" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                About
              </Link>
              <Link href="/#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="/#stats" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                Progress
              </Link>
              <Link href="/login" className="bg-[#0077CB] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#001d66] transition-all shadow-lg shadow-blue-500/20">
                Get Started
              </Link>
            </div>
          </div>
          <div className="md:hidden">
             <Link href="/login" className="bg-[#0077CB] text-white px-5 py-2 rounded-full text-sm font-semibold">
                Login
              </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
