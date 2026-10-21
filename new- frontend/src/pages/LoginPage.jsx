import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const base = import.meta.env.BASE_URL || '/portal/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'instructor') navigate('/admin/courses');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center group">
            <img
              src={`${cleanBase}cta_logo_clean.png`}
              alt="CRISMATECH"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </Link>
          <Link
            to="/"
            className="text-xs font-mono text-slate-500 hover:text-[#07241a] transition-colors"
          >
            ← Back Home
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-lg">
          <div className="pb-5 mb-6 border-b border-slate-100">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07241a] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to access your courses & assessments
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium mb-6">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1.5 font-semibold">
                Email Address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#07241a] focus:ring-2 focus:ring-[#07241a]/10 focus:outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#9d4225] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#07241a] focus:ring-2 focus:ring-[#07241a]/10 focus:outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#07241a] hover:bg-[#1e3a2f] text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? 'Signing in...' : (
                <>
                  <span>Sign In to Learning Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-slate-500">
            <div>
              Don't have an account yet?{' '}
              <Link to="/register" className="text-[#9d4225] font-semibold hover:underline">
                Register as Student
              </Link>
            </div>
            <div>
              Need to verify a credential?{' '}
              <Link to="/verify" className="text-slate-700 font-medium hover:underline">
                Certificate Verification Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
