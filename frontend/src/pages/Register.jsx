import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'doctor', // Defaulting to doctor as per the Professional Registration requirements
    specialist: 'General Physician',
    licenseNumber: '',
    mobile: '',
    abhaId: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({ width: 'w-0', color: '', text: '', textColor: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, password: val }));
    
    if (val.length === 0) {
      setPasswordStrength({ width: 'w-0', color: '', text: '', textColor: '' });
    } else if (val.length < 6) {
      setPasswordStrength({ width: 'w-1/3', color: 'bg-error', text: 'Weak: Add more characters', textColor: 'text-error' });
    } else if (val.length < 10) {
      setPasswordStrength({ width: 'w-2/3', color: 'bg-[#FFAB00]', text: 'Medium: Good password', textColor: 'text-[#FFAB00]' });
    } else {
      setPasswordStrength({ width: 'w-full', color: 'bg-secondary', text: 'Strong: Excellent protection', textColor: 'text-secondary' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        role: formData.role,
        specialist: formData.specialist,
        license_number: formData.licenseNumber,
        mobile: formData.mobile,
        abha_id: formData.abhaId,
        clinic_id: 'clinic3', // Default clinic
        age: 35, // Doctor defaults
        gender: 'Other'
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
    <div className="bg-surface text-on-surface font-body-md min-h-screen lg:h-screen w-full flex flex-col overflow-hidden">
      <main className="flex-grow flex flex-col lg:flex-row items-stretch h-full overflow-hidden">
        
        {/* Visual Column (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary h-full">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: 'url("/login_bg.jpg")' 
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-primary-container/90 mix-blend-multiply"></div>
          
          <div className="relative z-10 p-margin-desktop flex flex-col justify-between w-full h-full text-white">
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="flex items-center gap-stack-sm mb-stack-lg">
                <span className="material-symbols-outlined text-[48px] text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
                <h1 className="text-display-lg font-display-lg tracking-tight text-white leading-none">MediMind</h1>
              </div>
              <p className="text-headline-md font-headline-md max-w-lg text-white/95 leading-relaxed font-semibold">
                Intelligence at the Point of Care.
              </p>
              <p className="text-body-md text-white/85 mt-2 max-w-md">
                Join a network of verified medical professionals leveraging AI to enhance clinical outcomes and patient safety.
              </p>
            </div>

            <div className="space-y-stack-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="bg-white/10 backdrop-blur-xl p-stack-md rounded-xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary-fixed">verified_user</span>
                  <span className="text-label-md font-label-md uppercase tracking-widest text-secondary-fixed">Verified Clinical Network</span>
                </div>
                <p className="text-body-md text-white/90 leading-snug">
                  Accelerating diagnostics and patient care with AES-256 secure clinical workflows and ABDM-verified records.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">check_circle</span>
                  <span className="text-label-md font-label-md text-white/80">10k+ Verified Doctors</span>
                </div>
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">security</span>
                  <span className="text-label-md font-label-md text-white/80">99.9% Data Integrity</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side (Right Column) */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-start p-6 md:p-12 bg-surface-container-lowest lg:h-screen lg:max-h-screen overflow-y-auto custom-scrollbar">
          
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 text-primary cursor-pointer" onClick={() => navigate('/login')}>
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
              <h1 className="text-2xl font-extrabold tracking-tight">MediMind</h1>
            </div>
            <p className="text-on-surface-variant text-xs mt-1">Smart AI Clinical Platform</p>
          </div>

          <div className="w-full max-w-[460px] space-y-6 py-6">
            {/* Header Text (Desktop) */}
            <div className="hidden lg:block">
              <h2 className="text-2xl font-bold text-on-surface mb-1 leading-tight">Join the Clinical Network</h2>
              <p className="text-xs text-on-surface-variant">Secure access to AI-driven patient analytics and collaborative care tools.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-800 p-2.5 rounded-lg text-xs mb-3">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Section 1: Professional Identity */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs uppercase tracking-wider text-outline border-b border-outline-variant pb-1.5">Professional Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Full Name</label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-2 h-11 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none transition-all" 
                      placeholder="Dr. Jane Doe"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Medical License Number</label>
                    <input 
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full p-2 h-11 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none transition-all" 
                      placeholder="MCI-123456"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Specialty</label>
                  <select 
                    name="specialist"
                    value={formData.specialist}
                    onChange={handleChange}
                    className="w-full p-2 h-11 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none transition-all"
                  >
                    <option value="General Physician">General Practice</option>
                    <option value="Cardiologist">Cardiology</option>
                    <option value="Neurologist">Neurology</option>
                    <option value="Pulmonologist">Oncology</option>
                    <option value="Dermatologist">Pediatrics</option>
                  </select>
                </div>
              </div>

              {/* Section 2: National Integration (ABHA) */}
              <div className="p-3 bg-primary-container/5 rounded-xl border border-primary-container/10 ai-indicator">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <div className="w-full">
                    <h3 className="text-xs font-bold text-primary mb-0.5">National Integration (Ayushman Bharat)</h3>
                    <p className="text-[10px] text-on-surface-variant mb-2.5">Link your ABHA ID to sync patient records with the National Digital Health Ecosystem.</p>
                    <div className="flex flex-col md:flex-row gap-2">
                      <input 
                        type="text"
                        name="abhaId"
                        value={formData.abhaId}
                        onChange={handleChange}
                        className="flex-1 p-2 h-10 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none" 
                        placeholder="Enter ABHA ID / Number"
                      />
                      <button 
                        type="button"
                        onClick={() => alert('Verification OTP requested successfully!')}
                        className="bg-secondary text-white px-4 py-2 h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Link ABHA
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Contact Details */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs uppercase tracking-wider text-outline border-b border-outline-variant pb-1.5">Communication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Professional Email</label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 h-11 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none" 
                      placeholder="jane.doe@hospital.com"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Mobile Number</label>
                    <div className="flex h-11">
                      <span className="inline-flex items-center px-3 border border-r-0 border-outline-variant bg-surface-container-low text-on-surface-variant rounded-l-lg text-xs font-bold">+91</span>
                      <input 
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="flex-1 p-2 border border-outline-variant rounded-r-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none" 
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Security */}
              <div className="space-y-2">
                <h3 className="font-label-md text-xs uppercase tracking-wider text-outline border-b border-outline-variant pb-1.5">Security</h3>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Create Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      className="w-full p-2 h-11 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:ring-0 outline-none pr-10" 
                      placeholder="••••••••"
                      required
                    />
                    <span 
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant cursor-pointer text-base"
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </div>
                  {/* Strength Meter */}
                  <div className="mt-1.5 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength.width} ${passwordStrength.color || 'bg-error'} transition-all duration-300`}></div>
                  </div>
                  {passwordStrength.text && (
                    <p className={`text-[10px] font-semibold mt-1 leading-none ${passwordStrength.textColor}`}>
                      {passwordStrength.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Key Actions */}
              <div className="pt-2 space-y-3">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white h-12 rounded-lg text-xs font-bold hover:bg-primary-container transition-all shadow-md active:scale-[0.98]"
                >
                  {submitting ? 'Creating Profile...' : 'Create Professional Account'}
                </button>
                <div className="flex justify-center items-center gap-2 text-xs">
                  <span className="text-on-surface-variant">Already have an account?</span>
                  <Link className="text-primary font-bold hover:underline" to="/login">Back to Login</Link>
                </div>
              </div>

              {/* Trust Signals & Compliance */}
              <div className="pt-3 flex justify-center items-center gap-4 border-t border-outline-variant/30">
                <div className="flex items-center gap-1 opacity-60">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  <span className="text-[9px] font-semibold uppercase tracking-tighter">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span className="text-[9px] font-semibold uppercase tracking-tighter">ABDM Verified</span>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                  <span className="material-symbols-outlined text-xs">security</span>
                  <span className="text-[9px] font-semibold uppercase tracking-tighter">AES-256 Encrypted</span>
                </div>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
