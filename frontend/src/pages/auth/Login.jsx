import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, UserCheck, Stethoscope, Store, Shield } from 'lucide-react';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' | 'doctor' | 'pharmacy' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const data = await login(email, password);
      
      // Fetch user profile to verify role and approval gate
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error('Failed to retrieve user profile.');
      }

      const userRole = profileData?.role || data.user.user_metadata?.role || 'patient';
      const approvalStatus = profileData?.approval_status || 
        ((userRole === 'doctor' || userRole === 'pharmacy') ? 'pending' : 'approved');

      // Check role match
      if (userRole !== role) {
        await logout();
        throw new Error(`Account registered as "${userRole.toUpperCase()}", but you selected "${role.toUpperCase()}". Please switch tab.`);
      }

      // Mandatory Admin Approval Gate Check
      if ((userRole === 'doctor' || userRole === 'pharmacy') && approvalStatus !== 'approved') {
        navigate('/pending-approval');
        return;
      }

      // Route by role
      if (userRole === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (userRole === 'pharmacy') {
        navigate('/pharmacy/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient', icon: UserCheck },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope },
    { id: 'pharmacy', label: 'Pharmacy', icon: Store },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen lg:h-screen w-full flex flex-col overflow-y-auto lg:overflow-hidden">
      <main className="flex-1 flex items-stretch min-h-screen lg:h-full overflow-y-auto lg:overflow-hidden">
        
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
                <span className="material-symbols-outlined text-[48px] text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <h1 className="text-display-lg font-display-lg tracking-tight text-white leading-none">MediMind</h1>
              </div>
              <p className="text-headline-md font-headline-md max-w-lg text-white/95 leading-relaxed font-semibold">
                Unified healthcare platform connecting verified Doctors, Pharmacies, Patients, and AI Triage Intelligence.
              </p>
            </div>

            <div className="space-y-stack-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="bg-white/10 backdrop-blur-xl p-stack-md rounded-xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-secondary-fixed" size={20} />
                  <span className="text-label-md font-label-md uppercase tracking-widest text-secondary-fixed">Admin Approval Gate Enforced</span>
                </div>
                <p className="text-body-md text-white/90 leading-snug">
                  Only licensed Doctors and accredited Pharmacies approved by our Super Admin panel can accept patients and process orders.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="text-label-md font-label-md text-white/80">RBAC 4-Tier Security</span>
                </div>
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="text-label-md font-label-md text-white/80">Digital Rx Audited</span>
                </div>
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="text-label-md font-label-md text-white/80">HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-surface-container-lowest lg:h-screen lg:max-h-screen overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[460px] space-y-stack-lg py-6">
            
            {/* Brand Mobile */}
            <div className="lg:hidden flex flex-col items-center mb-stack-lg">
              <div className="flex items-center gap-stack-sm text-primary">
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <h1 className="text-headline-lg font-headline-lg">MediMind AI</h1>
              </div>
              <p className="text-on-surface-variant text-body-sm mt-2">Smart Healthcare Platform</p>
            </div>

            <header className="text-center lg:text-left">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Welcome Back</h2>
              <p className="text-on-surface-variant text-body-md mt-2">Sign in to your designated clinical portal.</p>
            </header>

            {/* 4-Role Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant/30">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      setError('');
                    }}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-white text-primary shadow-sm font-bold border border-primary/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Status notice if role is doctor or pharmacy */}
            {(role === 'doctor' || role === 'pharmacy') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-600 flex-shrink-0" />
                <span>Notice: Doctor & Pharmacy accounts must be verified and approved by the Super Admin before practice access.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-stack-md mt-4">
              {error && (
                <div className="p-3 bg-error-container/40 border border-error/20 rounded-lg text-error text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-label-md font-label-md text-on-surface">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'doctor' ? 'doctor@hospital.org' : (role === 'pharmacy' ? 'store@medicare.com' : (role === 'admin' ? 'admin@medimind.org' : 'patient@example.com'))}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/50 focus:border-primary focus:outline-none text-body-md transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-label-md font-label-md text-on-surface">Password</label>
                  <a href="#" className="text-body-sm text-primary hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 pr-11 rounded-lg bg-surface-container border border-outline-variant/50 focus:border-primary focus:outline-none text-body-md transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                <label htmlFor="rememberMe" className="text-body-sm text-on-surface-variant">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Sign In to {role.toUpperCase()} Workspace</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Registration link */}
            <div className="pt-4 text-center border-t border-outline-variant/30 text-body-sm text-on-surface-variant">
              <span>Don't have an account? </span>
              <Link to="/register" className="text-primary font-bold hover:underline">
                Register (Patient, Doctor, or Pharmacy)
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
