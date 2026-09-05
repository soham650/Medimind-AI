import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f8fafc] min-h-screen w-full flex flex-col justify-between text-[#0f172a] font-sans">
      {/* Header */}
      <header className="h-[70px] bg-white border-b border-[#e2e8f0] px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0a4bb5] text-3xl font-bold">medical_services</span>
          <h1 className="text-xl font-extrabold text-[#0a4bb5] tracking-tight">MediMind AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="text-sm font-semibold text-[#475569] hover:text-[#0a4bb5] transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register-patient')} 
            className="bg-[#0a4bb5] hover:bg-[#083c91] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-12 max-w-7xl mx-auto gap-12">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 bg-[#eff6ff] border border-[#0a4bb5]/20 px-4 py-1.5 rounded-full text-[#0a4bb5]">
            <span className="material-symbols-outlined text-sm font-bold">auto_awesome</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Next-Gen Patient Care</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-[#0f172a]">
            Intelligence at the <span className="text-[#0a4bb5]">Point of Care</span>
          </h2>
          
          <p className="text-[#475569] text-base leading-relaxed max-w-lg">
            Empower your health journey with MediMind's state-of-the-art diagnostic predictions, clinical report analytics, and secure digital health locker integration.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
            <button 
              onClick={() => navigate('/register-patient')}
              className="w-full sm:w-auto bg-[#0a4bb5] hover:bg-[#083c91] text-white px-8 py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>Create Patient Account</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#eff6ff] hover:text-[#0a4bb5] px-8 py-3.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Clinician Portal</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#e2e8f0] max-w-md mx-auto lg:mx-0">
            <div>
              <strong className="block text-2xl font-extrabold text-[#0a4bb5]">99.8%</strong>
              <span className="text-xs text-[#64748b]">Accuracy</span>
            </div>
            <div>
              <strong className="block text-2xl font-extrabold text-[#0a4bb5]">HIPAA</strong>
              <span className="text-xs text-[#64748b]">Compliant</span>
            </div>
            <div>
              <strong className="block text-2xl font-extrabold text-[#0a4bb5]">ABDM</strong>
              <span className="text-xs text-[#64748b]">Integrated</span>
            </div>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="flex-1 max-w-md lg:max-w-none relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a4bb5]/20 to-[#10b981]/10 rounded-3xl filter blur-3xl z-0"></div>
          <img 
            src="/login_bg.jpg" 
            alt="Healthcare AI" 
            className="w-full rounded-2xl shadow-2xl border border-white/50 relative z-10"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </main>

      {/* Basic Footer */}
      <footer className="py-6 border-t border-[#e2e8f0] text-center text-xs text-[#64748b] bg-white">
        © 2026 MediMind AI Healthcare Platform. All rights reserved.
      </footer>
    </div>
  );
}
