import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (data.success) setSent(true);
      else setError(data.message || 'Failed to send reset email');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden student-theme">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/15 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-purple font-bold text-sm mb-8 transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <div className="glass-panel rounded-[3rem] p-10 border-white/5 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 rounded-full border border-brand-purple/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Account Recovery</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Reset Password</h1>
            <p className="text-slate-400 mt-3 font-medium text-sm leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Check Your Email</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                  We've sent a password reset link to <span className="text-brand-purple font-bold">{email}</span>. The link expires in 15 minutes.
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-white/5 rounded-2xl text-sm font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Return to Login
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {error && (
                  <div className="px-5 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none transition-all disabled:opacity-50 text-white placeholder:text-slate-600 font-bold"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg glow-shadow flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
