import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, ArrowRight, RotateCcw, Share2, Sparkles, Trophy, Target, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';

export default function TestResultPage() {
  const location = useLocation();
  const result = location.state?.result;
  const quizTitle = location.state?.quizTitle || 'Assessment';
  const terminateReason = location.state?.terminateReason; // 'manual', 'timeout', or 'suspicious_activity'
  const quizId = location.state?.quizId;
  const navigate = useNavigate();
  const [retaking, setRetaking] = useState(false);

  const score = result?.score ?? 0;
  const totalMarks = result?.totalMarks ?? 0;
  const percentage = result?.percentage ?? 0;
  const certificate = result?.certificate;

  const handleRetake = async () => {
    if (!quizId) return;
    setRetaking(true);
    try {
      await apiFetch(`/tests/${quizId}/retake`, { method: 'POST' });
      navigate('/test', { replace: true });
    } catch (err: any) {
      alert(err.message || 'Failed to initialize retake');
    } finally {
      setRetaking(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel p-10 md:p-16 rounded-[4rem] border-white/5 shadow-2xl text-center relative overflow-hidden backdrop-blur-3xl"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-purple to-brand-blue shadow-[0_0_20px_rgba(124,58,237,0.5)]"></div>
        
        <motion.div 
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-32 h-32 bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 text-brand-purple rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-lg glow-shadow relative group"
        >
          <Trophy className="w-16 h-16 group-hover:scale-110 transition-transform" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-2 border border-dashed border-brand-purple/30 rounded-full"
          />
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-brand-purple" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-purple">Assessment Complete</span>
            </div>
            
            {terminateReason === 'suspicious_activity' && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-center justify-center gap-3 max-w-md mx-auto">
                <ShieldAlert className="w-5 h-5" /> Quiz submitted automatically due to exceeding maximum anti-cheat violations.
              </div>
            )}
            
            {terminateReason === 'timeout' && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-sm font-medium flex items-center justify-center gap-3 max-w-md mx-auto">
                <Clock className="w-5 h-5" /> Quiz submitted automatically because time ran out.
              </div>
            )}
            
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Phenomenal <span className="gradient-text">Performance!</span></h1>
            <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-md mx-auto">
              You've completed <strong>{quizTitle}</strong>. Here are your final results.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl group"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Target className="w-4 h-4 text-brand-purple" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Marks Scored</p>
              </div>
              <h2 className="text-5xl font-bold text-white tracking-tighter group-hover:scale-110 transition-transform">{score}<span className="text-2xl text-slate-600 font-medium">/{totalMarks}</span></h2>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl group"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Award className="w-4 h-4 text-brand-blue" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Accuracy</p>
              </div>
              <h2 className="text-5xl font-bold text-brand-blue tracking-tighter group-hover:scale-110 transition-transform">{percentage}%</h2>
            </motion.div>
          </div>

        <div className="glass-panel rounded-[2rem] border-white/5 p-8 mb-14 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between py-2 border-b border-white/5"
            >
              <div className="flex items-center gap-3">
                 <ShieldAlert className={`w-4 h-4 ${result?.tabSwitchCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                 <span className="text-slate-400 font-bold text-sm tracking-tight">Anti-Cheat System</span>
              </div>
              {result?.tabSwitchCount > 0 ? (
                 <span className="text-rose-400 font-bold text-lg tracking-tighter">{result?.tabSwitchCount} Violations</span>
              ) : (
                 <span className="text-emerald-400 font-bold text-lg tracking-tighter">0 Violations (Clean)</span>
              )}
            </motion.div>
            
            {certificate && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col gap-3 py-4 mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 text-left"
              >
                <div className="flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                   <span className="text-emerald-400 font-bold text-md tracking-tight">Certificate Earned!</span>
                </div>
                <p className="text-slate-300 text-sm">Congratulations! You successfully unlocked a certificate with Grade {certificate.grade} (ID: {certificate.certificateId}). Check your certificates section to view and download it.</p>
              </motion.div>
            )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link 
            to="/dashboard"
            className="flex-1 py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-[2rem] font-bold hover:scale-105 transition-all shadow-lg glow-shadow flex items-center justify-center gap-3 group"
          >
            Continue Learning
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          {percentage < 45 && (
            <button 
              onClick={handleRetake}
              disabled={retaking}
              className="flex-1 py-5 bg-white/5 text-slate-300 rounded-[2rem] font-bold hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              <RotateCcw className={`w-5 h-5 transition-transform duration-500 ${retaking ? 'animate-spin' : 'group-hover:-rotate-180'}`} />
              {retaking ? 'Preparing...' : 'Retake Assessment'}
            </button>
          )}
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          className="mt-12 text-slate-500 hover:text-brand-purple transition-all flex items-center justify-center gap-2 mx-auto text-xs font-bold uppercase tracking-widest group"
        >
          <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Share Achievement
        </motion.button>
      </motion.div>
    </div>
  );
}
