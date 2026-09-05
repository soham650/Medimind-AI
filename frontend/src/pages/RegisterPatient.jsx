import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPatient() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Select',
    email: '',
    mobile: '',
    abhaId: '',
    password: '',
    agree: false
  });

  const [passwordStrength, setPasswordStrength] = useState({ width: 'w-0', color: 'bg-outline-variant', text: 'STRENGTH: NONE', textColor: 'text-outline' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, password: val }));
    
    if (val.length === 0) {
      setPasswordStrength({ width: 'w-0', color: 'bg-outline-variant', text: 'STRENGTH: NONE', textColor: 'text-outline' });
    } else if (val.length < 6) {
      setPasswordStrength({ width: 'w-1/3', color: 'bg-red-500', text: 'STRENGTH: WEAK', textColor: 'text-red-500' });
    } else if (val.length < 10) {
      setPasswordStrength({ width: 'w-2/3', color: 'bg-[#FFAB00]', text: 'STRENGTH: MEDIUM', textColor: 'text-[#FFAB00]' });
    } else {
      setPasswordStrength({ width: 'w-full', color: 'bg-[#006c47]', text: 'STRENGTH: STRONG', textColor: 'text-[#006c47]' });
    }
  };

  const generateMockABHA = () => {
    const rand = () => Math.floor(1000 + Math.random() * 9000);
    const mockAbha = `91-${rand()}-${rand()}-${rand()}`;
    setFormData(prev => ({ ...prev, abhaId: mockAbha }));
    alert(`Mock ABHA ID generated: ${mockAbha}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.gender === 'Select') {
      setError('Please select a gender.');
      return;
    }
    if (!formData.agree) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        role: 'patient',
        gender: formData.gender,
        mobile: formData.mobile,
        abha_id: formData.abhaId,
        age: formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : 30,
        bmi: 22.0,
        blood_sugar: 100,
        bp_systolic: 120,
        bp_diastolic: 80,
        smoking: 0
      };

      await register(formData.email, formData.password, payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen lg:h-screen w-full flex flex-col overflow-y-auto lg:overflow-hidden">
      
      {/* Main Grid Body */}
      <main className="flex-grow flex flex-col lg:flex-row items-stretch h-full overflow-hidden">
        
        {/* Left Column (Desktop Illustration / Branding) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-8 lg:p-12 text-white h-full">
          
          {/* Glowing Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#003d9b]/90 via-[#003d9b]/60 to-[#001848]/95 z-0"></div>
          <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: 'url("/login_bg.jpg")' }}></div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <span className="material-symbols-outlined text-sm text-secondary-fixed">auto_awesome</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">Clinical Intelligence</span>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                Your Health, Digitally Empowered
              </h2>
              <p className="text-sm text-white/80 leading-relaxed max-w-md">
                Join MediMind AI to unlock precision diagnostics, unified health records, and AI-driven personal health insights that prioritize your well-being.
              </p>
            </div>
          </div>

          {/* Secure Assurances */}
          <div className="relative z-10 space-y-4 mt-8 lg:mt-0">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#82f9be]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[#82f9be] text-sm font-bold">check</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">HIPAA Compliant</h4>
                <p className="text-xs text-white/70">Military-grade encryption for all medical data.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#82f9be]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[#82f9be] text-sm font-bold">database</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Universal Health ID</h4>
                <p className="text-xs text-white/70">Seamlessly integrate with ABHA and national ecosystems.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Register Form) */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-start p-6 md:p-12 bg-surface-container-lowest lg:h-screen lg:max-h-screen overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[440px] space-y-6 py-6">
            
            {/* Brand Mobile */}
            <div className="lg:hidden flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 text-[#003d9b] cursor-pointer" onClick={() => navigate('/login')}>
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <h1 className="text-2xl font-extrabold tracking-tight">MediMind</h1>
              </div>
              <p className="text-on-surface-variant text-xs mt-1">Smart AI Healthcare Platform</p>
            </div>

            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-[#001848] leading-tight">Create Patient Account</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Already have an account? <Link to="/login" className="text-[#003d9b] font-bold hover:underline">Sign In</Link>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-800 p-3 rounded-lg text-xs">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. PERSONAL INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#003d9b] border-b border-outline-variant/30 pb-1.5">
                  1. Personal Information
                </h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Full Name</label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 h-11 border border-outline-variant rounded-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                    placeholder="Enter your full legal name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Date of Birth</label>
                    <input 
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full p-3 h-11 border border-outline-variant rounded-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full p-3 h-11 border border-outline-variant rounded-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                      required
                    >
                      <option value="Select">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. CONTACT DETAILS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#003d9b] border-b border-outline-variant/30 pb-1.5">
                  2. Contact Details
                </h3>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Email Address</label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 h-11 border border-outline-variant rounded-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex h-11">
                      <span className="inline-flex items-center px-3 border border-r-0 border-outline-variant bg-surface-container-low text-on-surface-variant rounded-l-lg text-xs font-bold">+91</span>
                      <input 
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="flex-1 p-3 border border-outline-variant rounded-r-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                        placeholder="00000 00000"
                        required
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => alert('Mobile OTP verification code sent!')}
                      className="bg-primary-light hover:bg-[#003d9b]/10 text-[#003d9b] border border-[#003d9b]/20 px-4 h-11 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97]"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. HEALTH IDENTITY (ABHA) */}
              <div className="bg-[#eff6ff] p-4 rounded-xl border border-dashed border-[#0a4bb5]/30">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#001848]">Link your ABHA ID</h3>
                    <span 
                      className="material-symbols-outlined text-outline text-sm cursor-help"
                      title="Ayushman Bharat Health Account (ABHA) is a unique digital identity created to securely manage health history."
                    >
                      info
                    </span>
                  </div>
                  <span className="bg-[#dcfce7] text-[#166534] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                
                <div className="space-y-2">
                  <input 
                    type="text"
                    name="abhaId"
                    value={formData.abhaId}
                    onChange={handleChange}
                    className="w-full p-3 h-10 border border-outline-variant rounded-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                    placeholder="14-digit ABHA Number"
                  />
                  <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                    <span>Don't have one?</span>
                    <button 
                      type="button" 
                      onClick={generateMockABHA}
                      className="text-[#003d9b] font-bold hover:underline"
                    >
                      Create ABHA ID
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. SECURITY */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#003d9b] border-b border-outline-variant/30 pb-1.5">
                  4. Security
                </h3>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Create Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      className="w-full p-3 h-11 border border-outline-variant rounded-lg bg-white text-xs outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] pr-10 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  <div className="mt-2 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength.width} ${passwordStrength.color} transition-all duration-300`}></div>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${passwordStrength.textColor}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              </div>

              {/* Checkbox Consent */}
              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox"
                  id="agree"
                  name="agree"
                  checked={formData.agree}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#003d9b] border-outline-variant rounded focus:ring-[#003d9b]/20 mt-0.5 cursor-pointer"
                  required
                />
                <label htmlFor="agree" className="text-xs text-on-surface-variant leading-snug cursor-pointer">
                  I agree to the <a href="#" onClick={(e) => { e.preventDefault(); alert('Terms of Service...'); }} className="text-[#003d9b] font-semibold hover:underline">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy Policy...'); }} className="text-[#003d9b] font-semibold hover:underline">Privacy Policy</a> including clinical data handling.
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-[#003d9b] hover:bg-[#001848] text-white h-12 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Creating Patient Account...' : 'Create Patient Account'}
              </button>

              {/* Sign In Link */}
              <div className="text-center text-xs">
                <span className="text-on-surface-variant">Already have an account? </span>
                <Link to="/login" className="text-[#003d9b] font-bold hover:underline">Sign In</Link>
              </div>

            </form>

          </div>
        </div>

      </main>

    </div>
  );
}
