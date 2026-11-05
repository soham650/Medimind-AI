import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, UserCheck, Stethoscope, Store, Shield, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { UserRoles } from '../../types/database';

export default function Login() {
  const { login, loginDemo, user, role, approvalStatus, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const demoPresets = {
    patient: { email: 'patient@medimind.ai', password: 'Patient@123', label: 'Patient Module', path: '/patient/dashboard' },
    doctor: { email: 'doctor@medimind.ai', password: 'Doctor@123', label: 'Doctor Module', path: '/doctor/dashboard' },
    pharmacist: { email: 'pharmacy@medimind.ai', password: 'Pharmacy@123', label: 'Pharmacy Module', path: '/pharmacy/dashboard' },
    admin: { email: 'admin@medimind.ai', password: 'Admin@123', label: 'Admin Module', path: '/admin/dashboard' },
  };

  // If already authenticated, redirect to the user's canonical module
  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === UserRoles.DOCTOR) {
        navigate('/doctor/dashboard', { replace: true });
      } else if (role === UserRoles.PHARMACIST) {
        navigate('/pharmacy/dashboard', { replace: true });
      } else if (role === UserRoles.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleRoleTabClick = (roleId) => {
    setSelectedRole(roleId);
    setError('');
  };

  const handleFillDemo = (roleId) => {
    const preset = demoPresets[roleId || selectedRole];
    if (preset) {
      setEmail(preset.email);
      setPassword(preset.password);
      setError('');
    }
  };

  const handleOneClickDemo = async (roleId) => {
    const targetRole = roleId || selectedRole;
    setError('');
    setDemoLoading(true);
    try {
      const result = await loginDemo(targetRole);
      const canonicalRole = result.role || targetRole;
      if (canonicalRole === UserRoles.DOCTOR) {
        navigate('/doctor/dashboard', { replace: true });
      } else if (canonicalRole === UserRoles.PHARMACIST) {
        navigate('/pharmacy/dashboard', { replace: true });
      } else if (canonicalRole === UserRoles.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Demo sign-in failed. Please verify network connection.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // 1. Authenticate with real Supabase Auth
      const data = await login(email, password);
      const canonicalRole = data.role || UserRoles.PATIENT;

      // 2. Check if user came from a protected URL redirect
      const fromPath = location.state?.from?.pathname;
      if (fromPath && !fromPath.startsWith('/login')) {
        const isPermitted = 
          (canonicalRole === UserRoles.DOCTOR && fromPath.startsWith('/doctor/')) ||
          (canonicalRole === UserRoles.PHARMACIST && fromPath.startsWith('/pharmacy/')) ||
          (canonicalRole === UserRoles.ADMIN && fromPath.startsWith('/admin/')) ||
          (canonicalRole === UserRoles.PATIENT && (fromPath.startsWith('/patient/') || fromPath === '/predict' || fromPath === '/reports'));

        if (isPermitted) {
          navigate(fromPath, { replace: true });
          return;
        }
      }

      // 3. Direct to their specific module
      if (canonicalRole === UserRoles.DOCTOR) {
        navigate('/doctor/dashboard', { replace: true });
      } else if (canonicalRole === UserRoles.PHARMACIST) {
        navigate('/pharmacy/dashboard', { replace: true });
      } else if (canonicalRole === UserRoles.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient', icon: UserCheck, desc: 'Health Records & AI Triage' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Queue & Consultations' },
    { id: 'pharmacist', label: 'Pharmacy', icon: Store, desc: 'Orders & Inventory' },
    { id: 'admin', label: 'Admin', icon: Shield, desc: 'System & Role Management' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen lg:h-screen w-full flex flex-col overflow-y-auto lg:overflow-hidden">
      <main className="flex-1 flex items-stretch min-h-screen lg:h-full overflow-y-auto lg:overflow-hidden">
        
        {/* Visual Column (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary h-full">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: 'url("/login_bg.jpg")' }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/50 to-primary-container/95 mix-blend-multiply"></div>
          
          <div className="relative z-10 p-margin-desktop flex flex-col justify-between w-full h-full text-white">
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="flex items-center gap-stack-sm mb-stack-lg">
                <span className="material-symbols-outlined text-[48px] text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <h1 className="text-display-lg font-display-lg tracking-tight text-white leading-none">MediMind AI</h1>
              </div>
              <p className="text-headline-md font-headline-md max-w-lg text-white/95 leading-relaxed font-semibold">
                Unified healthcare platform connecting verified Doctors, Pharmacies, Patients, and AI Intelligence.
              </p>
            </div>

            <div className="space-y-stack-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {/* Quick Module Directory */}
              <div className="bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-2xl">
                <div className="text-xs uppercase tracking-wider text-secondary-fixed font-bold mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  <span>Dedicated Modules by Role</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/90">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                    <strong className="block text-white font-bold">🩺 Doctor Module</strong>
                    <span className="text-[11px] text-white/70">Patient queue, AI teleconsult, digital Rx</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                    <strong className="block text-white font-bold">💊 Pharmacy Module</strong>
                    <span className="text-[11px] text-white/70">Prescription orders, inventory & batches</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                    <strong className="block text-white font-bold">👤 Patient Module</strong>
                    <span className="text-[11px] text-white/70">AI triage, digital health records & orders</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                    <strong className="block text-white font-bold">🛡️ Admin Module</strong>
                    <span className="text-[11px] text-white/70">User oversight, role approvals & audit logs</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="h-9 px-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-2">
                  <span className="text-label-sm font-label-sm text-white/80">Supabase Auth Verified</span>
                </div>
                <div className="h-9 px-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-2">
                  <span className="text-label-sm font-label-sm text-white/80">RBAC Database Synced</span>
                </div>
                <div className="h-9 px-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-2">
                  <span className="text-label-sm font-label-sm text-white/80">ABDM & HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-10 bg-surface-container-lowest lg:h-screen lg:max-h-screen overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[460px] space-y-5 py-4">
            
            {/* Brand Mobile */}
            <div className="lg:hidden flex flex-col items-center mb-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <h1 className="text-2xl font-bold">MediMind AI</h1>
              </div>
              <p className="text-on-surface-variant text-xs mt-1">Unified Healthcare Ecosystem</p>
            </div>

            <header className="text-center lg:text-left">
              <h2 className="text-2xl font-extrabold text-slate-900">Sign In to Your Module</h2>
              <p className="text-slate-500 text-sm mt-1">Select your role or enter your verified credentials below.</p>
            </header>

            {/* 4-Role Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleTabClick(r.id)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-white text-primary shadow-sm font-bold border border-primary/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick 1-Click Demo Sign-in Box */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-teal-900 block">
                  Quick Evaluation Demo: {demoPresets[selectedRole]?.label}
                </span>
                <span className="text-teal-700 text-[11px]">
                  {demoPresets[selectedRole]?.email}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFillDemo(selectedRole)}
                  className="px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white text-teal-800 font-semibold hover:bg-teal-50 transition-colors"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleOneClickDemo(selectedRole)}
                  disabled={demoLoading}
                  className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800 transition-colors flex items-center gap-1 disabled:opacity-50 shadow-sm"
                >
                  {demoLoading ? 'Signing in...' : '1-Click Login'}
                  {!demoLoading && <Sparkles size={13} />}
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{error}</span>
                    {error.includes('credentials') && (
                      <span className="text-[11px] text-red-600 mt-1 block">
                        Tip: You can use the "1-Click Login" button above or register a new account below.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'doctor' ? 'doctor@medimind.ai' :
                    selectedRole === 'pharmacist' ? 'pharmacy@medimind.ai' :
                    selectedRole === 'admin' ? 'admin@medimind.ai' : 'patient@medimind.ai'
                  }
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-slate-300 focus:border-primary focus:outline-none text-sm transition-colors"
                  required
                  disabled={submitting || demoLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full h-11 px-3.5 pr-10 rounded-lg bg-white border border-slate-300 focus:border-primary focus:outline-none text-sm transition-colors"
                    required
                    disabled={submitting || demoLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-600">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || demoLoading}
                className="w-full h-11 bg-primary text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>Validating credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {demoPresets[selectedRole]?.label}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Registration link */}
            <div className="pt-4 text-center border-t border-slate-200 text-xs text-slate-600">
              <span>Don't have an account yet? </span>
              <Link to="/register" className="text-primary font-bold hover:underline">
                Register as Patient, Doctor, or Pharmacy
              </Link>
            </div>

            {/* Quick Demo Access Bar for all 4 roles */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 text-center">
                One-Click Quick Login by Role:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {roles.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleOneClickDemo(r.id)}
                    disabled={demoLoading}
                    className="py-1.5 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors truncate"
                    title={`Sign in as ${r.label}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
