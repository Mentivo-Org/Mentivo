"use client";

import React from 'react';

// Images from Figma design context
const imgContainer = "https://www.figma.com/api/mcp/asset/f8a2e487-6d55-496e-a599-2895c7945cbe";
const imgAbstractGeometricElements = "https://www.figma.com/api/mcp/asset/c401c8e6-7857-41b7-af0c-36f284e05ba8";
const imgContainer1 = "https://www.figma.com/api/mcp/asset/abd952c8-6cd4-491b-a2ff-d06b851742ca";
const imgContainer2 = "https://www.figma.com/api/mcp/asset/ae07c2f6-0205-4b9d-8395-ab6d55647678";

export default function MaintenancePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9ff] selection:bg-[#00288e]/10 selection:text-[#00288e]">
      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center relative overflow-hidden px-4 py-20 lg:py-0">
        {/* Background Blurs */}
        <div className="absolute top-0 right-0 w-[60%] h-[50%] bg-[#e5eeff] blur-[120px] opacity-50 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#c9e6ff] blur-[120px] opacity-30 -translate-x-1/4 translate-y-1/4" />
        
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#00288e 1px, transparent 1px), linear-gradient(90deg, #00288e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Left Hero Section */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-8">
            {/* "COMING SOON" Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#dce9ff] border border-[#c4c5d5] px-4 py-2 rounded-full shadow-sm">
              <img src={imgContainer} alt="Badge icon" className="w-4 h-4" />
              <span className="text-[#00288e] text-sm font-semibold tracking-wider uppercase">COMING SOON</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#0b1c30] tracking-tight">
                Something Great is
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#00288e] tracking-tight">
                in the Works
              </h1>
            </div>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-[#444653] leading-relaxed max-w-2xl font-normal">
              We are building a platform to connect the next generation of engineers with expert mentors from the IIT community. Our website is currently under development and will be launching soon.
            </p>
          </div>

          {/* Right Visual Asset Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md aspect-square bg-white border border-[#c4c5d5] rounded-3xl shadow-2xl p-10 relative flex flex-col items-center justify-center text-center space-y-8 overflow-hidden group">
              {/* Card Background Texture */}
              <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500" 
                   style={{ backgroundImage: 'radial-gradient(#00288e 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
              
              <img src={imgAbstractGeometricElements} alt="" className="absolute top-6 right-6 w-4 opacity-40" />
              <img src={imgContainer1} alt="" className="absolute bottom-6 left-6 w-12 opacity-40" />

              {/* Main Illustration/Icon */}
              <div className="w-20 h-20 bg-[#e5eeff] border border-[#c4c5d5] rounded-full flex items-center justify-center relative z-10 shadow-inner">
                <img src={imgContainer2} alt="Mentorship Icon" className="w-12" />
              </div>

              {/* Card Content */}
              <div className="space-y-4 relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-[#0b1c30]">Elite Mentorship</h3>
                <p className="text-[#444653] text-base leading-relaxed">
                  Direct access to the IIT alumni network for career and academic growth.
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="w-full space-y-4 relative z-10">
                <div className="h-3 w-full bg-[#e5eeff] rounded-full overflow-hidden shadow-sm">
                  <div className="h-full bg-[#00288e] rounded-full transition-all duration-1000 ease-out" style={{ width: '75%' }} />
                </div>
                <p className="text-[#00288e] font-bold text-sm tracking-wide">Platform Status: 25% Complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="border-t border-[#c4c5d5] bg-[#f8f9ff] py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start space-y-1">
            <span className="text-2xl font-extrabold text-[#00288e] tracking-tight">IITian Mentor</span>
            <p className="text-[#006591] text-sm text-center md:text-left font-medium opacity-80">
              © 2026 IITian Mentor. Empowering the next generation of engineers.
            </p>
          </div>
          <nav className="flex items-center space-x-8 text-[#444653] text-sm font-semibold opacity-80">
            <a href="#" className="hover:text-[#00288e] transition-colors duration-200">About Us</a>
            <a href="#" className="hover:text-[#00288e] transition-colors duration-200">Privacy Policy</a>
            <a href="#" className="hover:text-[#00288e] transition-colors duration-200">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
