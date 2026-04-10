import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner, LoadingOverlay } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'instructor') navigate('/admin/courses');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden student-theme">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <AnimatePresence>
        {isLoading && <LoadingOverlay />}
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl glow-shadow group-hover:rotate-12 transition-transform duration-500">C</div>
              <span className="font-bold text-3xl tracking-tight text-white">Crismatech</span>
            </Link>
          </motion.div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Secure Access</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">Welcome <span className="gradient-text">Back</span></h1>
          <p className="text-slate-400 mt-4 font-medium text-lg">Login to access your futuristic learning portal</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="glass-panel p-10 md:p-14 rounded-[3.5rem] border-white/5 shadow-2xl backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-purple to-brand-blue" />
          
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none transition-all disabled:opacity-50 text-white placeholder:text-slate-600 font-bold"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-brand-purple hover:text-brand-blue transition-colors uppercase tracking-widest">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none transition-all disabled:opacity-50 text-white placeholder:text-slate-600 font-bold"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg glow-shadow flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 relative overflow-hidden"
            >
              {isLoading ? (
                <LoadingSpinner color="white" size="sm" />
              ) : (
                <>
                  <Fingerprint className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Sign In to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Don't have an account yet? <Link to="/register" className="text-brand-purple font-bold hover:text-brand-blue transition-colors ml-1">Create Account</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
