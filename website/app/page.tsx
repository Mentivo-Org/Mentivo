import Link from 'next/link';
import { ArrowRight, Share2, User, CheckCircle2, Home } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full min-h-screen relative overflow-hidden bg-slate-50">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#00288e 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="px-6 pt-12 pb-12 sm:pt-20 sm:pb-24 max-w-7xl mx-auto w-full">
          <div className="bg-[#eff4ff]/80 backdrop-blur-sm rounded-[32px] p-8 sm:p-16 relative overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/50">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block bg-[#dce9ff] text-[#004666] px-4 py-1.5 rounded-full text-sm font-bold mb-6 tracking-wide uppercase">
              Academic Excellence Awaits
            </span>
            <h1 className="text-5xl sm:text-7xl font-black text-[#0b1c30] leading-[1.1] tracking-tighter mb-8">
              Learn from <span className="text-[#00288e]">IITians</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 max-w-xl">
              Unlock your potential with personalized mentorship from the prestigious IIT community. Bridge the gap between ambition and achievement with expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="bg-[#00288e] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#001d66] transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-blue-900/20"
              >
                I am a Student
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="bg-white text-[#00288e] border-2 border-[#00288e] px-8 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all transform hover:-translate-y-1 active:scale-95"
              >
                I am a Mentor
              </Link>
            </div>
          </div>
          {/* Decorative elements can go here */}
        </div>
      </section>
      </div>

      {/* Features Grid */}
      <section id="features" className="px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-[#00288e]">Direct Access</h3>
              <Share2 className="text-[#00288e]" size={28} />
            </div>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Connect directly with students and alumni from India&apos;s top engineering institutes.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#dce9ff] text-[#1e40af] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">JEE Prep</span>
              <span className="bg-[#dce9ff] text-[#1e40af] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Career Growth</span>
              <span className="bg-[#dce9ff] text-[#1e40af] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Research</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#00288e] p-8 rounded-[24px] text-white flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-[#a8b8ff] mb-4">Smart Scheduling</h3>
            <p className="text-white/90 leading-relaxed">
              Seamlessly book sessions that fit both your schedules perfectly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#d3e4fe] p-8 rounded-[24px] text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
              <User className="text-[#00288e]" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#0b1c30] mb-4">Personalized</h3>
            <p className="text-slate-600 leading-relaxed">
              Curated mentorship plans tailored to your specific academic goals.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="px-6 py-12 sm:py-20 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-[32px] p-8 sm:p-16 border border-slate-200">
          <h2 className="text-4xl sm:text-5xl font-black text-[#0b1c30] mb-4 tracking-tight">Mentorship Progress</h2>
          <p className="text-lg text-slate-600 mb-12">Helping thousands of students reach their dream campus.</p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <p className="text-4xl sm:text-5xl font-black text-[#00288e] mb-2 tracking-tighter">12K+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Sessions</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-[#00288e] mb-2 tracking-tighter">98%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Success Rate</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-[#00288e] mb-2 tracking-tighter">450</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">IIT Mentors</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black text-[#00288e] mb-2 tracking-tighter">23</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">IIT Campuses</p>
            </div>
          </div>

          <div className="h-3 bg-[#c9e6ff] rounded-full overflow-hidden">
            <div className="h-full bg-[#39b8fd] w-3/4 transition-all duration-1000 ease-out" />
          </div>
        </div>
      </section>
    </div>
  );
}
