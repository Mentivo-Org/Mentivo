import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Share2, User, BookOpen, Clock, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Ambient Mesh Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] pointer-events-none -z-10 overflow-hidden opacity-60">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#0077CB]/20 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#4f46e5]/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-32 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
          <div className="max-w-3xl relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#e6f4ff] to-[#e0e7ff] text-[#005a9c] text-sm font-bold uppercase tracking-wider mb-8 border border-[#0077CB]/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5] animate-pulse" />
              Academic Excellence Awaits
            </span>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-foreground leading-[1.1] tracking-tight mb-6">
              Learn from <span className="bg-gradient-to-r from-[#0077CB] via-[#4f46e5] to-[#0077CB] bg-clip-text text-transparent relative inline-block pb-2">IITians
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#4f46e5]/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-secondary leading-relaxed mb-10 max-w-2xl">
              Unlock your potential with personalized mentorship from the prestigious IIT community. Bridge the gap between ambition and achievement with expert guidance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white rounded-xl shadow-premium-hover overflow-hidden transition-all transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(90deg, #0077CB 0%, #4f46e5 100%)' }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center">
                  I am a Student
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-[#0077CB] bg-white border-2 border-[#0077CB]/20 rounded-xl hover:border-[#0077CB] hover:bg-[#0077CB]/5 transition-all"
              >
                I am a Mentor
              </Link>
            </div>
          </div>
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
                <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#005a9c] to-[#0077CB] bg-clip-text text-transparent mb-2">12K+</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Sessions</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#3730a3] to-[#4f46e5] bg-clip-text text-transparent mb-2">98%</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Success Rate</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#005a9c] to-[#0077CB] bg-clip-text text-transparent mb-2">450</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">IIT Mentors</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-[#3730a3] to-[#4f46e5] bg-clip-text text-transparent mb-2">23</span>
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
      </main>
    </div>
  );
}
