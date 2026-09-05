import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
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
      
      // Fetch user profile to verify role switch constraint
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to retrieve user profile.');
      }

      if (profileData.role !== role) {
        await logout();
        throw new Error(`Account not registered as a ${role === 'doctor' ? 'Professional' : 'Patient'}.`);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
                Precision clinical intelligence bridging the gap between AI accuracy and human-centric medical care.
              </p>
            </div>

            <div className="space-y-stack-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="bg-white/10 backdrop-blur-xl p-stack-md rounded-xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary-fixed">verified_user</span>
                  <span className="text-label-md font-label-md uppercase tracking-widest text-secondary-fixed">AI Diagnostic Assurance</span>
                </div>
                <p className="text-body-md text-white/90 leading-snug">
                  Processing over 1.2M patient records with 99.8% diagnostic accuracy across our clinical partner network.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">check_circle</span>
                  <span className="text-label-md font-label-md text-white/80">ABDM Compliant</span>
                </div>
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">security</span>
                  <span className="text-label-md font-label-md text-white/80">HIPAA Certified</span>
                </div>
                <div className="h-10 px-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">verified</span>
                  <span className="text-label-md font-label-md text-white/80">SOC2 Type II</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-surface-container-lowest lg:h-screen lg:max-h-screen overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[440px] space-y-stack-lg py-6">
            
            {/* Brand Mobile */}
            <div className="lg:hidden flex flex-col items-center mb-stack-lg">
              <div className="flex items-center gap-stack-sm text-primary">
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <h1 className="text-headline-lg font-headline-lg">MediMind AI</h1>
              </div>
              <p className="text-on-surface-variant text-body-sm mt-2">Precision Healthcare Platform</p>
            </div>

            <header className="text-center lg:text-left">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Welcome back</h2>
              <p className="text-on-surface-variant text-body-md mt-2">Access your secure clinical workspace.</p>
            </header>

            {/* Role Switcher */}
            <div className="flex p-1.5 bg-surface-container rounded-xl relative border border-outline-variant/30">
              <div 
                className="absolute top-1.5 left-1.5 w-[calc(50%-6px)] h-[calc(100%-12px)] bg-white rounded-lg shadow-md tab-transition z-0" 
                id="role-indicator"
                style={{ transform: role === 'patient' ? 'translateX(0)' : 'translateX(calc(100% + 0px))' }}
              ></div>
              <button 
                type="button"
                className={`relative z-10 flex-1 py-3 text-label-md font-label-md flex items-center justify-center gap-2 transition-colors ${role === 'patient' ? 'text-primary font-bold' : 'text-on-surface-variant'}`} 
                onClick={() => setRole('patient')}
              >
                <span className="material-symbols-outlined text-lg">person</span>
                Patient
              </button>
              <button 
                type="button"
                className={`relative z-10 flex-1 py-3 text-label-md font-label-md flex items-center justify-center gap-2 transition-colors ${role === 'doctor' ? 'text-primary font-bold' : 'text-on-surface-variant'}`} 
                onClick={() => setRole('doctor')}
              >
                <span className="material-symbols-outlined text-lg">stethoscope</span>
                Professional
              </button>
            </div>

            {/* Sign in with ABHA (Primary Integration) */}
            <button 
              type="button"
              onClick={() => alert('Authenticating securely using National Health Authority OTP...')}
              className="w-full h-14 bg-surface-container-low border border-primary/20 rounded-xl flex items-center px-5 gap-4 hover:bg-surface-container transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm border border-outline-variant">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
              </div>
              <div className="text-left">
                <div className="text-label-md font-label-md font-bold text-on-surface">Sign in with ABHA ID</div>
                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">National Health Authority</div>
              </div>
              <span className="material-symbols-outlined ml-auto text-outline group-hover:text-primary transition-colors">chevron_right</span>
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-grow h-px bg-outline-variant opacity-30"></div>
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest whitespace-nowrap">Or use credentials</span>
              <div className="flex-grow h-px bg-outline-variant opacity-30"></div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-800 p-3 rounded-lg text-sm mb-4">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="group">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1.5 px-1 group-focus-within:text-primary transition-colors" htmlFor="identifier">Email or Mobile Number</label>
                <div className="relative">
                  <input 
                    className="w-full h-12 pl-4 pr-4 bg-white border border-outline-variant rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-body-md placeholder:text-outline/50" 
                    id="identifier" 
                    name="identifier" 
                    placeholder="e.g. name@example.com" 
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-label-md font-label-md text-on-surface-variant group-focus-within:text-primary transition-colors" htmlFor="password">Password</label>
                  <a className="text-label-md font-label-md text-primary hover:underline" href="#">Forgot?</a>
                </div>
                <div className="relative">
                  <input 
                    className="w-full h-12 px-4 bg-white border border-outline-variant rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-body-md placeholder:text-outline/50" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input 
                  className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary/20" 
                  id="remember" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <label className="text-body-sm text-on-surface-variant cursor-pointer" htmlFor="remember">Keep me signed in for 30 days</label>
              </div>

              <button 
                className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Validating Credentials...' : 'Sign In to Portal'}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>

            <div className="flex justify-center mt-6">
              <p className="text-center text-body-sm text-on-surface-variant">
                New to the platform?{' '}
                {role === 'patient' ? (
                  <Link className="text-primary font-bold hover:underline" to="/register-patient">Create Patient Account</Link>
                ) : (
                  <Link className="text-primary font-bold hover:underline" to="/register">Create Professional Account</Link>
                )}
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
