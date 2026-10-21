import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, Clock, CheckCircle2, AlertCircle, PlayCircle, ShieldCheck, ArrowRight, RotateCcw
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { showError, showSuccess, showConfirm } from '../utils/dialog.js';

export default function TestPage() {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        apiFetch('/tests').catch(() => ({ tests: [] })),
        apiFetch('/tests/my-attempts').catch(() => ({ attempts: [] })),
      ]);
      setTests(tRes.tests || []);
      setAttempts(aRes.attempts || []);
    } catch (err) {
      console.error('Failed to load tests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartQuiz = async (testId) => {
    try {
      const res = await apiFetch(`/tests/${testId}/start`, { method: 'POST' });
      navigate(`/test/take/${testId}`);
    } catch (err) {
      showError('Eligibility Notice', err.message || 'Unable to start quiz session.');
    }
  };

  const handleRetake = async (testId) => {
    const ok = await showConfirm({
      title: 'Retake Assessment?',
      text: 'Start a new attempt session for this examination?',
      confirmText: 'Retake Exam',
    });
    if (!ok) return;

    try {
      await apiFetch(`/tests/${testId}/retake`, { method: 'POST' });
      navigate(`/test/take/${testId}`);
    } catch (err) {
      showError('Retake Notice', err.message);
    }
  };

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Proctored Academic Examinations</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Assessments & Quizzes</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Validate competency through timed, multiple-choice exams. Achieving 40% or higher automatically issues your degree certificate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-outline font-mono text-xs">Loading available assessments...</div>
        ) : tests.length ? (
          tests.map((test) => {
            const tId = test._id || test.id;
            const myAttempts = attempts.filter(a => {
              const qId = a.quizId || a.quiz?.id || a.quiz?._id || a.quiz || a.testId?._id || a.testId;
              return String(qId) === String(tId);
            });
            const bestAttempt = myAttempts.reduce((prev, current) => {
              const prevPct = prev.percentage ?? prev.score ?? 0;
              const curPct = current.percentage ?? current.score ?? 0;
              return prevPct > curPct ? prev : current;
            }, myAttempts[0] || null);
            const hasPassed = bestAttempt && (bestAttempt.passed || (bestAttempt.percentage ?? bestAttempt.score) >= (test.passingScore || 40));
            const attemptsCount = myAttempts.length;

            return (
              <div
                key={tId}
                className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-outline font-mono">
                    <span className="px-2 py-0.5 bg-surface-container rounded uppercase text-[10px]">
                      {test.durationMinutes || 30} mins
                    </span>
                    <span>Pass: {test.passingScore || 40}%</span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-primary mt-3">{test.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
                    Course final examination with anti-cheat proctoring and automated credential issuance.
                  </p>

                  <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-mono">
                    <span className="text-outline">Attempts: {attemptsCount}</span>
                    {bestAttempt ? (
                      <span className={hasPassed ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        Best: {bestAttempt.percentage ?? bestAttempt.score}% ({hasPassed ? 'Passed' : 'Failed'})
                      </span>
                    ) : (
                      <span className="text-primary font-medium">Ready</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex flex-col gap-2">
                  {attemptsCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/test/result?testId=${tId}`}
                        className="flex-1 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={13} className={hasPassed ? 'text-emerald-600' : 'text-rose-600'} /> Review Result
                      </Link>
                      <button
                        onClick={() => handleRetake(tId)}
                        className="px-3 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                        title="Retake Assessment"
                      >
                        <RotateCcw size={13} />
                      </button>
                      {hasPassed && (
                        <Link
                          to="/certificate"
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 shadow-sm"
                          title="View Certificate"
                        >
                          <Award size={13} />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartQuiz(tId)}
                      className="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <PlayCircle size={14} /> Start Exam Session →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-16 text-center space-y-3 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
            <Award size={32} className="text-outline mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary">No Scheduled Assessments</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              Check back once your course modules are completed to unlock your certification assessment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
