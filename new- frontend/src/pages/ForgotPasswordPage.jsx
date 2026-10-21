import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check the email entered.');
    } finally {
      setLoading(false);
    }
  };

  const base = import.meta.env.BASE_URL || '/portal/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center mb-6 group">
          <img
            src={`${cleanBase}cta_logo_clean.png`}
            alt="CRISMATECH"
            className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </Link>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-outline hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>

          <div className="mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold block mb-1">
              Account Recovery
            </span>
            <h1 className="font-serif text-3xl font-bold text-primary">Reset Password</h1>
            <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Enter your registered email address and we will dispatch a secure link to reset your credentials.
            </p>
          </div>

          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-serif font-bold text-primary">Reset Link Dispatched</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                We have sent an authentication link to <strong>{email}</strong>. Please check your inbox and follow the link within 15 minutes.
              </p>
              <div className="pt-4 border-t border-outline-variant">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-medium hover:bg-primary-container transition-colors shadow-sm"
                >
                  <ArrowLeft size={14} /> Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-outline mb-2">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  'Dispatching Link...'
                ) : (
                  <>
                    <Send size={16} /> Send Password Reset Link
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
