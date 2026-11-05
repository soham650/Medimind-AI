import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(authService.friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xl mb-2 text-[#0f766e]">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            MediMind Healthcare
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Reset Your Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your account email to receive a secure recovery link.
          </p>
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Reset Link Dispatched</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                If an account exists with <strong className="text-slate-800">{email}</strong>, you will receive password reset instructions shortly.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0f766e] hover:underline"
              >
                <ArrowLeft size={16} /> Return to Sign In
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 px-3.5 pl-10 rounded-lg border border-slate-300 text-sm focus:border-[#0f766e] focus:outline-none"
                  required
                />
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#0f766e] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0f766e]/90 transition-all shadow disabled:opacity-50"
            >
              {submitting ? 'Sending Link...' : 'Send Recovery Link'}
            </button>

            <div className="pt-3 text-center border-t border-slate-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
