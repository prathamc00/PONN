import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, GraduationCap, BookOpen, ArrowRight, AlertCircle, Building2, ShieldCheck, RefreshCw, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../utils/api.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    branch: 'Computer Science & Engineering',
    semester: '5',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const branches = [
    'Computer Science & Engineering',
    'AI & Machine Learning',
    'Information Science & Engineering',
    'Electronics & Communication',
    'Data Science & Analytics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Other Technology Stream',
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const base = import.meta.env.BASE_URL || '/portal/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  // Step 1: Validate form inputs and send OTP email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await apiFetch('/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and create student account
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setVerifying(true);
    try {
      const verifyRes = await apiFetch('/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          code: cleanOtp,
        }),
      });

      const verificationToken = verifyRes.verificationToken;

      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        branch: formData.branch,
        semester: Number(formData.semester) || 1,
        password: formData.password,
        emailVerificationToken: verificationToken,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code or request a new one.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setSendingOtp(true);
    try {
      const res = await apiFetch('/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      if (res.devCode) {
        setDevCode(res.devCode);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setSendingOtp(false);
    }
  };

  const busy = isLoading || sendingOtp || verifying;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 md:p-8">
      <div className="w-full max-w-2xl my-8">
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
            to="/login"
            className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-[#ea580c] transition-colors flex items-center gap-1.5"
          >
            Sign In Instead <ArrowRight size={14} />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-10 shadow-sm space-y-6">
          {/* Header & Step Tracker */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-semibold">
                Student Enrollment
              </span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${step === 'form' ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
                  1. Details
                </span>
                <span className="text-outline">→</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${step === 'otp' ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
                  2. Email Verification
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif text-primary font-bold">
              {step === 'form' ? 'Create Student Account' : 'Verify Your Email Address'}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              {step === 'form'
                ? 'Register to access structured coursework, sequential video lectures, and verified certifications.'
                : `We sent a 6-digit security code to ${formData.email}. Please enter it below to verify your account.`}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            /* STEP 1: Details Form */
            <form onSubmit={handleSendOtp} className="space-y-5 text-xs">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@example.com"
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & College */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    College / Institution
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="College or University Name"
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Branch & Semester */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Academic Branch / Stream *
                  </label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-xs font-mono focus:border-primary focus:outline-none transition-colors cursor-pointer"
                    >
                      {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Current Semester *
                  </label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-xs font-mono focus:border-primary focus:outline-none transition-colors cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={String(sem)}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Security Password *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-outline mb-1.5 tracking-wider">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      disabled={busy}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface text-sm placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {sendingOtp ? (
                  'Sending Verification Code...'
                ) : (
                  <>
                    Send Email Verification Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Email Verification OTP */
            <form onSubmit={handleVerifyAndRegister} className="space-y-6 text-xs">
              <div className="p-4 bg-surface border border-outline-variant rounded-xl text-center space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-outline block">
                  Target Verification Address
                </span>
                <p className="font-mono text-sm font-bold text-primary">{formData.email}</p>
                <p className="text-[11px] text-on-surface-variant">
                  Please check your inbox (and spam folder) for the 6-digit confirmation code.
                </p>
              </div>

              {devCode && (
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-between gap-3 font-mono text-xs text-secondary">
                  <span>Development Simulator Code: <strong>{devCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(devCode)}
                    className="px-2 py-1 bg-secondary text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Insert Code
                  </button>
                </div>
              )}

              <div>
                <label className="block font-mono uppercase text-outline mb-2 text-center tracking-widest">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  disabled={busy}
                  className="w-full py-3.5 bg-surface border border-outline-variant rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-on-surface focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {verifying ? (
                  'Verifying & Creating Account...'
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify Email & Complete Registration
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant text-xs font-mono">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(''); }}
                  className="text-outline hover:text-on-surface transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Details
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResendOtp}
                  className="text-secondary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={sendingOtp ? 'animate-spin' : ''} />
                  Resend Verification Code
                </button>
              </div>
            </form>
          )}



          {/* Footer Link */}
          <div className="pt-4 border-t border-outline-variant text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-medium hover:underline">
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
