import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, GraduationCap, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    branch: '',
    semester: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        college: formData.college,
        branch: formData.branch,
        semester: Number(formData.semester),
        phone: formData.phone,
        role: 'student',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 py-20 relative overflow-hidden student-theme">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl glow-shadow group-hover:rotate-12 transition-transform duration-500">C</div>
            <span className="font-bold text-3xl tracking-tight text-white">Crismatech</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">New Enrollment</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">Create <span className="gradient-text">Account</span></h1>
          <p className="text-slate-400 mt-4 font-medium text-lg">Join our futuristic community of elite learners today</p>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="glass-panel p-10 md:p-16 rounded-[4rem] border-white/5 shadow-2xl backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-purple to-brand-blue" />
          
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
              {[
                { name: 'name', label: 'Full Name', icon: User, placeholder: 'John Doe', type: 'text' },
                { name: 'email', label: 'Email Address', icon: Mail, placeholder: 'john@example.com', type: 'email' },
                { name: 'college', label: 'College Name', icon: GraduationCap, placeholder: 'Tech Institute of Technology', type: 'text' },
                { name: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+91 98765 43210', type: 'text' },
                { name: 'branch', label: 'Academic Branch', icon: BookOpen, placeholder: 'Computer Science', type: 'text' },
              ].map((field) => (
                <div key={field.name} className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{field.label}</label>
                  <div className="relative group">
                    <field.icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                    <input 
                      name={field.name} type={field.type} required onChange={handleChange}
                      placeholder={field.placeholder} disabled={isLoading}
                      className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-600 font-bold disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Current Semester</label>
                <div className="relative group">
                  <select name="semester" required onChange={handleChange} disabled={isLoading}
                    className="w-full px-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none appearance-none text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-900">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-slate-900">Semester {s}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ArrowRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Security Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                  <input name="password" type="password" required onChange={handleChange} disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-600 font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                  <input name="confirmPassword" type="password" required onChange={handleChange} disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-600 font-bold disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg glow-shadow flex items-center justify-center gap-3 group active:scale-95 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner color="white" size="sm" /> : (
                <>
                  Initialize Registration
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Already a member? <Link to="/login" className="text-brand-purple font-bold hover:text-brand-blue transition-colors ml-1">Sign In here</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
