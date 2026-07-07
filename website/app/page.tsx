'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, ArrowUpRight, X, Share2, User, Clock } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Mentors", href: "/login" },
    { label: "How it works", href: "/about" },
    { label: "Results", href: "/#results" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Talk to us", href: "/support" }
  ];

  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

  const statSessions = process.env.NEXT_PUBLIC_STAT_SESSIONS;
  const statSuccess = process.env.NEXT_PUBLIC_STAT_SUCCESS_RATE;
  const statMentors = process.env.NEXT_PUBLIC_STAT_MENTORS;
  const statCampuses = process.env.NEXT_PUBLIC_STAT_CAMPUSES;
  const showStatsSection = statSessions || statSuccess || statMentors || statCampuses;

  return (
    <div className="flex flex-col min-h-screen font-inter bg-[var(--color-background)] overflow-x-hidden">
      {/* Cinematic Hero Section (100vh) */}
      <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-[var(--color-ink)]">
        {/* Background Video Wrapper */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: easing }}
        >
          <div className="w-[80%] h-[80%] md:w-full md:h-full rounded-2xl md:rounded-none overflow-hidden relative">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover"
              src="/hero-video.mp4"
            />
            {/* Permanent ink gradient overlay top 30% for navbar */}
            <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-[#0B0D10]/80 to-transparent pointer-events-none" />
          </div>
        </motion.div>

        {/* Navbar - Fixed, pointer-events: none wrapper */}
        <motion.nav 
          className="absolute top-0 left-0 w-full z-40 pointer-events-none flex items-center justify-between px-4 md:px-8 pt-4 md:pt-8"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: easing }}
        >
          {/* Left: Logo + Wordmark */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Logo Mark: Two overlapping rounded-square strokes */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute w-6 h-6 border-2 border-white rounded-lg -ml-2" />
              <div className="absolute w-6 h-6 border-2 border-white rounded-lg ml-2" />
            </div>
            <span className="hidden md:block text-white font-inter font-semibold text-lg tracking-tight">Mentivo</span>
          </div>

          {/* Center-left: Menu Pill */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="pointer-events-auto flex items-center gap-2 bg-[#0B0D10]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full md:absolute md:left-1/2 md:-translate-x-1/2 hover:bg-[#0B0D10] transition-colors"
          >
            <Circle className="fill-[var(--color-rank-gold)] text-[var(--color-rank-gold)]" size={8} />
            <span className="text-white text-[11px] font-medium tracking-wide uppercase">Menu</span>
          </button>

          {/* Right: CTA Pill (Desktop only) */}
          <div className="hidden md:flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2 bg-[#F4F4F6] text-[var(--color-ink)] px-4 py-2 rounded-full text-xs font-medium">
              <span>IITian Mentors</span>
              <span className="w-1 h-1 bg-[var(--color-ink)]/20 rounded-full" />
              <span>JEE & NEET</span>
            </div>
            <Link href="/login" className="flex items-center gap-2 bg-[#F4F4F6] text-[var(--color-ink)] px-1 py-1 pr-4 rounded-full hover:bg-white transition-colors group">
              <div className="w-7 h-7 rounded-full bg-[var(--color-ink)] flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowUpRight className="text-white" size={14} />
              </div>
              <span className="text-xs font-semibold">Book a free call</span>
            </Link>
          </div>
        </motion.nav>

        {/* Pinned Bottom Content Block */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full z-30 pt-32 pb-8 px-4 md:px-8 flex flex-col md:flex-row md:items-end justify-between"
          style={{ background: 'linear-gradient(to top, var(--color-paper) 0%, rgba(250,250,247,0.85) 55%, transparent 100%)' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.5, ease: easing }}
        >
          {/* Left Column */}
          <div className="flex flex-col max-w-2xl">
            {/* Eyebrow */}
            <motion.div 
              className="flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm border border-blue-100 w-fit px-4 py-2 rounded-full mb-6 shadow-sm"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: easing }}
            >
              <Circle className="fill-[#4f46e5] text-[#4f46e5]" size={8} />
              <span className="text-[#4f46e5] text-[11px] font-black tracking-widest uppercase">Academic Excellence Awaits</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              className="font-inter font-black text-[clamp(3rem,8vw,5.5rem)] leading-[1.05] tracking-tight text-[#0b1c30]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease: easing }}
            >
              Learn from <span className="bg-gradient-to-r from-[#0077CB] to-[#4f46e5] bg-clip-text text-transparent pb-1">IITians</span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              className="text-slate-600 text-lg md:text-[22px] font-medium max-w-xl leading-[1.6] mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9, ease: easing }}
            >
              Unlock your potential with personalized mentorship from the prestigious IIT community. Bridge the gap between ambition and achievement with expert guidance.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center gap-4 mt-10"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0, ease: easing }}
            >
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#0077CB] to-[#4f46e5] text-white px-8 py-4 rounded-2xl text-[16px] font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                I am a Student <span className="text-lg">→</span>
              </Link>
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center border-2 border-blue-100 text-[#0077CB] bg-white px-8 py-4 rounded-2xl text-[16px] font-bold hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm">
                I am a Mentor
              </Link>
            </motion.div>
          </div>

          {/* Right Column (Desktop Only) */}
          <div className="hidden md:flex flex-col gap-2 items-end pb-2">
            <span className="text-[var(--color-mute)] text-[11px] font-medium mb-1">Top Institutes</span>
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] px-4 py-1.5 rounded-full text-[11px] font-medium text-[var(--color-ink)]">IIT Bombay</div>
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] px-4 py-1.5 rounded-full text-[11px] font-medium text-[var(--color-ink)]">IIT Delhi</div>
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] px-4 py-1.5 rounded-full text-[11px] font-medium text-[var(--color-ink)]">IIT Madras</div>
          </div>
        </motion.div>
      </section>

      {/* App Download Banner */}
      <section className="px-6 pb-0 pt-16 relative z-20 w-full flex justify-center -mb-8">
        <a href="https://play.google.com/store/apps/details?id=com.mentivo.in" target="_blank" rel="noopener noreferrer" className="bg-[#0b1c30] hover:bg-[#001d66] text-white flex items-center gap-4 px-8 py-5 rounded-2xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 transition-all border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0077CB]/0 via-[#0077CB]/20 to-[#0077CB]/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          <Image src="/logo.png" alt="Mentivo" width={40} height={40} className="w-10 h-10 rounded-xl bg-white p-1" />
          
          <div className="flex flex-col text-left mr-4">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Download the App Now</span>
            <span className="text-[22px] font-black leading-none text-white mt-1">Get it on Google Play</span>
          </div>

          <div className="w-px h-12 bg-slate-700 mx-2 hidden sm:block" />

          {/* Play Store Logo (Inline SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd"
viewBox="0 0 466 511.98" width={50} height={50}>
 <g id="Layer_x0020_1">
  <path fill="#EA4335" fill-rule="nonzero" d="M199.9 237.8l-198.5 232.37c7.22,24.57 30.16,41.81 55.8,41.81 11.16,0 20.93,-2.79 29.3,-8.37l0 0 244.16 -139.46 -130.76 -126.35z"/>
  <path fill="#FBBC04" fill-rule="nonzero" d="M433.91 205.1l0 0 -104.65 -60 -111.61 110.22 113.01 108.83 104.64 -58.6c18.14,-9.77 30.7,-29.3 30.7,-50.23 -1.4,-20.93 -13.95,-40.46 -32.09,-50.22z"/>
  <path fill="#34A853" fill-rule="nonzero" d="M199.42 273.45l129.85 -128.35 -241.37 -136.73c-8.37,-5.58 -19.54,-8.37 -30.7,-8.37 -26.5,0 -50.22,18.14 -55.8,41.86 0,0 0,0 0,0l198.02 231.59z"/>
  <path fill="#4285F4" fill-rule="nonzero" d="M1.39 41.86c-1.39,4.18 -1.39,9.77 -1.39,15.34l0 397.64c0,5.57 0,9.76 1.4,15.34l216.27 -214.86 -216.28 -213.46z"/>
 </g>
</svg>

        </a>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 bg-gradient-to-b from-transparent to-muted/50 w-full relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Mentivo?</h2>
            <p className="text-secondary max-w-2xl mx-auto">Everything you need to accelerate your academic journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-premium transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#39b8fd] to-[#0077CB]" />
              <div className="w-14 h-14 bg-gradient-to-br from-[#e6f4ff] to-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-[#0077CB]/10">
                <Share2 className="text-[#0077CB]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Direct Access</h3>
              <p className="text-secondary mb-6 leading-relaxed">
                Connect directly with students and alumni from India&apos;s top engineering institutes.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#0077CB]/5 text-[#005a9c] rounded-md text-xs font-bold uppercase tracking-wider">JEE Prep</span>
                <span className="px-3 py-1 bg-[#0077CB]/5 text-[#005a9c] rounded-md text-xs font-bold uppercase tracking-wider">Career</span>
              </div>
            </div>

            {/* Feature 2: Smart Scheduling (Fixed Background) */}
            <div className="relative p-8 rounded-3xl shadow-premium text-white flex flex-col overflow-hidden group transform hover:-translate-y-1 transition-all" style={{ background: 'linear-gradient(135deg, #005a9c 0%, #0077CB 50%, #4f46e5 100%)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2" />
              
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform">
                <Clock className="text-white drop-shadow-md" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 drop-shadow-sm">Smart Scheduling</h3>
              <p className="text-white/90 leading-relaxed font-medium">
                Seamlessly book sessions that fit both your schedules perfectly. No back-and-forth emails required.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-premium transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4f46e5] to-[#818cf8]" />
              <div className="w-14 h-14 bg-gradient-to-br from-[#e0e7ff] to-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-[#4f46e5]/10">
                <User className="text-[#3730a3]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Personalized</h3>
              <p className="text-secondary leading-relaxed">
                Curated mentorship plans tailored to your specific academic goals and learning pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {showStatsSection && (
        <section id="stats" className="px-6 py-24 max-w-7xl mx-auto w-full">
        <div className="bg-card rounded-[2rem] p-8 md:p-12 border border-border/50 shadow-premium relative overflow-hidden">
          {/* Colorful internal glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#4f46e5]/10 to-[#0077CB]/5 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0077CB]/10 rounded-full blur-[60px] -z-10 -translate-x-1/2 translate-y-1/2" />
          
          <div className="max-w-2xl mb-12 relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">Mentorship Progress</h2>
            <p className="text-lg text-secondary">Helping thousands of students reach their dream campus.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 relative z-10">
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#005a9c] to-[#0077CB] bg-clip-text text-transparent mb-2">{process.env.NEXT_PUBLIC_STAT_SESSIONS || "12K+"}</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Sessions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#3730a3] to-[#4f46e5] bg-clip-text text-transparent mb-2">{process.env.NEXT_PUBLIC_STAT_SUCCESS_RATE || "98%"}</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Success Rate</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#005a9c] to-[#0077CB] bg-clip-text text-transparent mb-2">{process.env.NEXT_PUBLIC_STAT_MENTORS || "450"}</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">IIT Mentors</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#3730a3] to-[#4f46e5] bg-clip-text text-transparent mb-2">{process.env.NEXT_PUBLIC_STAT_CAMPUSES || "23"}</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Campuses</span>
            </div>
          </div>

          <div className="h-4 bg-muted/80 rounded-full overflow-hidden border border-border/50 relative z-10 shadow-inner">
            <div className="h-full w-3/4 rounded-full relative" style={{ background: 'linear-gradient(90deg, #0077CB, #4f46e5, #39b8fd)' }}>
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-50 bg-[#0B0D10]/95 backdrop-blur-md flex flex-col pointer-events-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: easing }}
          >
            {/* Overlay Header */}
            <div className="flex items-center justify-between px-4 md:px-8 pt-4 md:pt-8">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-6 h-6 border-2 border-white rounded-lg -ml-2" />
                  <div className="absolute w-6 h-6 border-2 border-white rounded-lg ml-2" />
                </div>
                <span className="text-white font-inter font-semibold text-lg tracking-tight">Mentivo</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 flex flex-col justify-center px-8 md:px-24 max-w-4xl">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.07 + 0.15, ease: easing }}
                  className="mb-4"
                >
                  <Link 
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="font-fraunces font-medium text-[clamp(2rem,7vw,4rem)] text-white hover:text-[var(--color-rank-gold)] transition-colors block leading-tight"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: navLinks.length * 0.07 + 0.15, ease: easing }}
                className="mt-8"
              >
                <Link 
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center justify-center bg-[var(--color-rank-gold)] text-[var(--color-ink)] px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Book a free call
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
