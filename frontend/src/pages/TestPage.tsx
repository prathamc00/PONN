import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles, PlayCircle, CheckCircle2, Calendar, HelpCircle, ChevronRight, RotateCcw, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';
import { showAlreadyAttemptedQuizAlert, showError } from '../utils/dialog';

interface TestRecord {
  _id: string;
  title: string;
  course: { _id: string; title: string } | string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  questions: any[];
}

const QUIZ_ATTEMPT_LIMIT = 3;

export default function TestPage() {
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tData, aData, eData] = await Promise.all([
          apiFetch('/tests').catch(() => ({ tests: [] })),
          apiFetch('/tests/my-attempts').catch(() => ({ attempts: [] })),
          apiFetch('/courses/my-enrollments').catch(() => ({ courses: [] })),
        ]);
        setTests(tData.tests || []);
        setAttempts(aData.attempts || []);
        const enrolledCourses: any[] = eData.courses || [];
        const ids = new Set<string>(enrolledCourses.map((c: any) => String(c.id || c._id)));
        setEnrolledCourseIds(ids);

        // Fetch progress for each enrolled course
        const progressMap: Record<string, { completed: number; total: number }> = {};
        await Promise.all(
          enrolledCourses.map(async (c: any) => {
            const courseId = String(c.id || c._id);
            const totalModules = (c.modules || []).length;
            try {
              const prog = await apiFetch(`/courses/${courseId}/progress`);
              progressMap[courseId] = { completed: (prog.completedModules || []).length, total: totalModules };
            } catch {
              progressMap[courseId] = { completed: 0, total: totalModules };
            }
          })
        );
        setCourseProgress(progressMap);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const getAttemptQuizId = (attempt: any): string => {
    if (!attempt) return '';
    if (typeof attempt.quiz === 'object' && attempt.quiz) {
      return String(attempt.quiz._id || attempt.quiz.id || attempt.quiz.quiz || '');
    }
    return String(attempt.quiz ?? attempt.quizId ?? '');
  };

  const getCourseName = (t: TestRecord) => typeof t.course === 'object' && t.course ? t.course.title : '—';
  const getAttemptCount = (testId: string) => {
    const normalizedTestId = String(testId);
    return attempts.filter((a: any) => getAttemptQuizId(a) === normalizedTestId).length;
  };

  const getStatus = (t: TestRecord) => {
    const now = new Date();
    const testId = String(t._id);
    const attempted = attempts.find((a: any) => {
      return getAttemptQuizId(a) === testId;
    });
    if (attempted?.completedAt) return 'Completed';
    if (t.startTime && now < new Date(t.startTime)) return 'Upcoming';
    if (t.endTime && now > new Date(t.endTime)) return 'Expired';
    return 'Available';
  };

  const getAttemptStats = (testId: string) => {
    const normalizedTestId = String(testId);
    const attempt = attempts.find((a: any) => {
      return getAttemptQuizId(a) === normalizedTestId && a.completedAt;
    });
    if (!attempt) return null;
    const percentage = attempt.totalMarks > 0 ? (attempt.score / attempt.totalMarks) * 100 : 0;
    return { score: `${attempt.score}/${attempt.totalMarks}`, percentage };
  };

  const handleStartQuiz = async (testId: string) => {
    try {
      const data = await apiFetch(`/tests/${testId}/start`, { method: 'POST' });
      // Store quiz data in sessionStorage for the quiz-taking page
      sessionStorage.setItem('activeQuiz', JSON.stringify(data));
      navigate(`/test/take/${testId}`, { state: { quizData: data } });
    } catch (err: any) {
      const message = err.message || 'Failed to start quiz';
      if (/already|completed|attempted/i.test(message)) {
        await showAlreadyAttemptedQuizAlert();
      } else if (/limit|maximum|only 3 times|contact admin/i.test(message)) {
        await showError('Attempt limit reached', message);
      } else {
        await showError('Unable to start quiz', message);
      }
    }
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Assessments</span>
        </motion.div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Available <span className="gradient-text">Tests</span></h1>
        <p className="text-slate-400 mt-2 font-medium">View and take scheduled quizzes for your courses.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Loading tests...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-medium">No tests available yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test, i) => {
            const status = getStatus(test);
            const stats = getAttemptStats(test._id);
            const attemptCount = getAttemptCount(test._id);
            const canRetake = stats !== null && stats.percentage < 45 && attemptCount < QUIZ_ATTEMPT_LIMIT;
            const reachedAttemptLimit = attemptCount >= QUIZ_ATTEMPT_LIMIT;

            // Check enrollment and course completion
            const testCourseId = typeof test.course === 'object' && test.course ? String((test.course as any)._id || (test.course as any).id) : String(test.course);
            const isNotEnrolled = testCourseId && !enrolledCourseIds.has(testCourseId);
            const progress = courseProgress[testCourseId];
            const courseNotComplete = progress && progress.total > 0 && progress.completed < progress.total;
            const isLocked = isNotEnrolled || courseNotComplete;
            
            return (
              <motion.div key={test._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden hover:border-brand-purple/20 transition-all group">
                <div className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      status === 'Available' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                      status === 'Completed' ? (canRetake ? 'bg-amber-400/10 text-amber-500 border-amber-400/20' : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20') :
                      status === 'Upcoming' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>{status === 'Completed' && canRetake ? 'Failed' : status}</span>
                    {stats?.score && (
                      <span className={`text-sm font-bold ${canRetake ? 'text-amber-500' : 'text-emerald-400'}`}>{stats.score}</span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-purple transition-colors tracking-tight">{test.title}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-8">{getCourseName(test)}</p>

                  <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Questions</p>
                        <p className="text-sm font-bold text-white">{test.questions?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Duration</p>
                        <p className="text-sm font-bold text-white">{test.durationMinutes} min</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                    <Calendar className="w-4 h-4 text-brand-purple" />
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(test.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(test.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {isNotEnrolled ? (
                    <div className="w-full py-4 bg-white/5 text-slate-500 text-center rounded-2xl text-sm font-bold border border-white/5 flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" /> Enroll in course to access
                    </div>
                  ) : courseNotComplete && progress ? (
                    <div className="w-full py-4 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-center rounded-2xl text-sm font-bold flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Complete all lessons first
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-amber-500/70">{progress.completed}/{progress.total} lessons watched</span>
                    </div>
                  ) : status === 'Available' ? (
                    <button onClick={() => handleStartQuiz(test._id)}
                      className="w-full py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-center rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg glow-shadow active:scale-95 flex items-center justify-center gap-2">
                      <PlayCircle className="w-5 h-5" /> Start Quiz
                    </button>
                  ) : status === 'Completed' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                         <div className={`flex-1 py-4 ${canRetake ? 'bg-amber-400/10 text-amber-500 border-amber-400/20' : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'} text-center rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border`}>
                           <CheckCircle2 className="w-5 h-5" /> Quiz Submitted
                         </div>
                         {canRetake && (
                           <button 
                             onClick={async () => {
                               try {
                                 await apiFetch(`/tests/${test._id}/retake`, { method: 'POST' });
                                 handleStartQuiz(test._id);
                               } catch (err: any) {
                                 await showError('Retake failed', err.message || 'Error initializing retake');
                               }
                             }} 
                             className="px-6 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-2xl font-bold transition-all"
                             title="Retake Quiz"
                           >
                             <RotateCcw className="w-5 h-5"/>
                           </button>
                         )}
                      </div>
                      {stats && stats.percentage < 45 && reachedAttemptLimit && (
                        <div className="w-full py-2.5 bg-rose-500/10 text-rose-400 text-center rounded-xl text-xs font-bold border border-rose-500/20">
                          Attempt limit reached (3/3). Contact admin to reset attempts.
                        </div>
                      )}
                    </div>
                  ) : reachedAttemptLimit ? (
                    <div className="w-full py-4 bg-rose-500/10 text-rose-400 text-center rounded-2xl text-sm font-bold border border-rose-500/20">
                      Attempt limit reached (3/3)
                    </div>
                  ) : (
                    <div className="w-full py-4 bg-white/5 text-slate-500 text-center rounded-2xl text-sm font-bold border border-white/5">
                      {status === 'Upcoming' ? 'Not yet available' : 'Quiz has ended'}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
