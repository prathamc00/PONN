import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, ShieldAlert, AlertTriangle, ArrowRight, Focus, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { showError } from '../utils/dialog';

interface Question {
  question: string;
  options: string[];
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizData, setQuizData] = useState<any>(location.state?.quizData || null);
  const [loading, setLoading] = useState(!quizData);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [violationReason, setViolationReason] = useState<string>('Exited fullscreen or switching tabs');

  // Auto-submit logic when timer hits 0 or max violations reached
  const autoSubmit = async (finalSwitchCount: number, reason: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: answers.map((ans, idx) => ({ questionIndex: idx, selectedAnswer: ans })),
        tabSwitchCount: finalSwitchCount
      };
      const data = await apiFetch(`/tests/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      // Pass the submission result and reason to TestResultPage
      navigate('/test/result', { 
        state: { 
          result: data, 
          quizTitle: quizData.quizTitle,
          quizId: id,
          terminateReason: reason
        }, 
        replace: true 
      });
    } catch (err: any) {
      await showError('Submission failed', err.message || 'Failed to submit quiz');
      navigate('/test', { replace: true });
    }
  };

  const {
    violations,
    maxViolations,
    isFullscreen,
    requestFullscreen,
    isWarningModalOpen,
    closeWarningModal,
  } = useAntiCheat({
    enabled: monitoringEnabled,
    maxViolations: 3,
    onViolation: (count, reason) => setViolationReason(reason),
    onMaxViolationsReached: () => autoSubmit(3, 'suspicious_activity')
  });

  useEffect(() => {
    if (!quizData) {
      // For page reloads without state, fetch active attempt
      apiFetch(`/tests/my-attempts`)
        .then((res) => {
          const active = res.attempts?.find((a: any) => a.quiz._id === id && !a.completedAt);
          if (active) {
            // Re-fetch quiz questions
            return apiFetch(`/tests/${id}/start`, { method: 'POST' });
          }
          throw new Error('No active quiz session found');
        })
        .then((data) => {
          setQuizData(data);
          setAnswers(new Array(data.questions?.length || 0).fill(-1));
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          navigate('/test', { replace: true });
        });
    } else {
      setAnswers(new Array(quizData.questions?.length || 0).fill(-1));
    }
  }, [id, quizData, navigate]);

  useEffect(() => {
    if (hasStarted && quizData) {
      // Initialize timer
      const startTime = new Date(quizData.startedAt).getTime();
      const durationMs = quizData.durationMinutes * 60 * 1000;
      const endTime = startTime + durationMs;

      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, endTime - now);
        setTimeLeft(Math.floor(diff / 1000));
        if (diff <= 0) {
          autoSubmit(violations, 'timeout');
        }
      };
      
      updateTimer();
      const int = setInterval(updateTimer, 1000);
      return () => clearInterval(int);
    }
  }, [hasStarted, quizData, violations]); // Auto-submit depends on violations

  const handleStart = async () => {
    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request failed or was intentionally blocked:', err);
    }
    
    setHasStarted(true);
    
    // 2.5-second grace period for browser native permission prompts to safely vanish
    setTimeout(() => {
      setMonitoringEnabled(true);
    }, 2500);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading exam environment...</div>;

  if (!hasStarted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full glass-panel p-10 rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-3xl text-center">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Secure Exam Environment</h1>
          <ul className="text-left text-slate-400 space-y-4 mb-10 max-w-md mx-auto p-6 bg-slate-900/50 rounded-2xl border border-white/5 font-medium">
            <li className="flex gap-3"><Focus className="w-5 h-5 text-brand-purple shrink-0"/> The quiz requires full screen mode.</li>
            <li className="flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-500 shrink-0"/> Switching tabs or minimizing the window will be logged as a violation.</li>
            <li className="flex gap-3"><ShieldAlert className="w-5 h-5 text-rose-500 shrink-0"/> 3 violations will result in automatic submission.</li>
          </ul>
          <button onClick={handleStart} className="w-full py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg glow-shadow flex items-center justify-center gap-3">
            <Maximize className="w-6 h-6" /> Proceed & Enter Fullscreen
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-20 relative select-none">
      
      {/* Sticky Header */}
      <div className="sticky top-6 z-40 mb-10">
        <div className="glass-panel p-6 rounded-[2rem] border-white/5 backdrop-blur-3xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">{quizData.quizTitle}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${violations > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              <ShieldAlert className="w-4 h-4" />
              Violations: {violations}/{maxViolations}
            </div>
            <div className="flex items-center gap-3 px-6 py-2 bg-white/5 text-brand-blue rounded-full font-bold text-lg tracking-widest border border-white/5">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Questions */}
      <div className="space-y-8">
        {quizData.questions && quizData.questions.map((q: Question, qIdx: number) => (
          <motion.div key={qIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qIdx * 0.1 }}
            className="glass-panel p-8 md:p-10 rounded-[2.5rem] border-white/5">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-lg border border-white/5">
                {qIdx + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-xl text-white font-medium leading-relaxed mb-6">{q.question}</h3>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => {
                        const newAns = [...answers];
                        newAns[qIdx] = oIdx;
                        setAnswers(newAns);
                      }}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 group ${
                        answers[qIdx] === oIdx 
                          ? 'bg-brand-purple/20 border-brand-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.2)]' 
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                        answers[qIdx] === oIdx ? 'border-brand-purple bg-brand-purple' : 'border-slate-600 group-hover:border-slate-400'
                      }`}>
                        {answers[qIdx] === oIdx && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      <span className="font-medium text-[15px]">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Submit */}
      <div className="mt-10 flex justify-end">
         <button onClick={() => autoSubmit(violations, 'manual')} disabled={submitting}
            className="px-10 py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg glow-shadow flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'} <ArrowRight className="w-5 h-5" />
          </button>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {isWarningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full glass-panel p-10 rounded-[3rem] border border-rose-500/30 text-center shadow-[0_0_50px_rgba(225,29,72,0.2)] bg-slate-950">
              <AlertTriangle className="w-20 h-20 text-rose-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Warning Triggered</h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-6">
                Suspicious activity detected: <br/> 
                <strong className="text-rose-400 text-lg">{violationReason}</strong>
              </p>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                You have <strong className="text-rose-500">{maxViolations - violations}</strong> warnings left. Exceeding this limit will automatically kick and submit your quiz.
              </p>
              <button onClick={() => { closeWarningModal(); requestFullscreen(); }}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg transition-colors">
                I Understand, Return to Quiz
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
