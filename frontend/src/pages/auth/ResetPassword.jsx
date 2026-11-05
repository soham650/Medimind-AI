import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(authService.friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xl mb-2 text-[#0f766e]">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            MediMind Healthcare
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Set New Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose a strong, secure password for your account.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Updated Successfully</h3>
            <p className="text-sm text-slate-600">
              Your password has been reset. Redirecting you to sign in...
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-sm font-bold text-[#0f766e] hover:underline">
                Sign In Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-11 px-3.5 pl-10 rounded-lg border border-slate-300 text-sm focus:border-[#0f766e] focus:outline-none"
                  required
                />
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-11 px-3.5 pl-10 rounded-lg border border-slate-300 text-sm focus:border-[#0f766e] focus:outline-none"
                  required
                />
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#0f766e] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0f766e]/90 transition-all shadow disabled:opacity-50"
            >
              {submitting ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
