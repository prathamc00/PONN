import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setError('No reset token was provided. Please request a new password reset link.');
      return;
    }

    apiFetch(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then((data) => {
        if (data.success) {
          setTokenValid(true);
        } else {
          setError(data.message || 'Invalid or expired password reset link');
        }
      })
      .catch((err) => {
        setError(err.message || 'Invalid or expired password reset link');
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Failed to update credentials. Please try again.');
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
              Security Protocol
            </span>
            <h1 className="font-serif text-3xl font-bold text-primary">New Password</h1>
            <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Define a strong, new password to access your CRISMATECH student portal.
            </p>
          </div>

          {validating ? (
            <div className="text-center py-12 space-y-3 font-mono text-xs text-outline">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Validating authentication token...</p>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-serif font-bold text-primary">Password Updated</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                Your account password has been updated successfully. You can now proceed to login.
              </p>
              <div className="pt-4 border-t border-outline-variant">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-medium hover:bg-primary-container transition-colors shadow-sm"
                >
                  <ShieldCheck size={14} /> Sign In to Portal
                </Link>
              </div>
            </div>
          ) : !tokenValid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-serif font-bold text-primary">Invalid or Expired Link</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                {error || 'This reset link has either expired or already been utilized.'}
              </p>
              <div className="pt-4 border-t border-outline-variant">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-lg text-xs font-medium transition-colors"
                >
                  Request Fresh Reset Link
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-outline mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-outline mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
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
                  'Updating Password...'
                ) : (
                  <>
                    <ShieldCheck size={16} /> Complete Password Reset
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
