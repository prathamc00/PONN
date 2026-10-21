import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Clock,
  HelpCircle,
  Check,
  X,
  FileText,
  AlertTriangle,
  ChevronDown,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch } from '../utils/api.js';
import { showConfirm, showError } from '../utils/dialog.js';

export default function TestResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const state = location.state || {};
  const [resultData, setResultData] = useState(state.result || null);
  const [testTitle, setTestTitle] = useState(state.testTitle || '');
  const [passingScore, setPassingScore] = useState(state.passingScore || 40);
  const [loading, setLoading] = useState(!state.result);
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect'

  const testId = searchParams.get('testId') || state.result?.test?.id || state.result?.test?._id;

  useEffect(() => {
    if (!resultData && testId) {
      setLoading(true);
      apiFetch(`/tests/${testId}/my-result`)
        .then((res) => {
          if (res.success) {
            setResultData(res);
            if (res.test?.title) setTestTitle(res.test.title);
            if (res.test?.passingScore) setPassingScore(res.test.passingScore);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [testId, resultData]);

  const score = resultData?.score ?? 0;
  const totalMarks = resultData?.totalMarks ?? 0;
  const percentage =
    resultData?.percentage !== undefined
      ? resultData.percentage
      : totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0;

  const passed =
    resultData?.passed !== undefined
      ? resultData.passed
      : percentage >= passingScore;

  const tabSwitchCount = resultData?.tabSwitchCount ?? 0;
  const certId = resultData?.certificate?.certificateId || resultData?.certificateId;
  const certGrade = resultData?.certificate?.grade;
  const questionReview = Array.isArray(resultData?.questionReview) ? resultData.questionReview : [];

  useEffect(() => {
    if (passed) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#c2410c', '#c25e3e', '#5a7180', '#059669', '#d97706'],
        });
      } catch (e) {
        console.warn('Confetti trigger error:', e);
      }
    }
  }, [passed]);

  const handleRetake = async () => {
    const tId = testId || resultData?.test?.id || resultData?.test?._id;
    if (!tId) {
      navigate('/test');
      return;
    }

    const ok = await showConfirm({
      title: 'Retake Examination?',
      text: 'Starting a new session will clear your previous attempt score and grant a clean exam window.',
      confirmText: 'Retake Exam',
    });
    if (!ok) return;

    try {
      await apiFetch(`/tests/${tId}/retake`, { method: 'POST' });
      navigate(`/test/take/${tId}`);
    } catch (err) {
      showError('Retake Notice', err.message || 'Unable to reset session.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-outline">
          Compiling examination results & verification score...
        </span>
      </div>
    );
  }

  // Filter question reviews
  const filteredQuestions = questionReview.filter((q) => {
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'incorrect') return !q.isCorrect;
    return true;
  });

  const correctCount = questionReview.filter((q) => q.isCorrect).length;
  const incorrectCount = questionReview.length - correctCount;

  return (
    <div className="min-h-screen bg-surface p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full space-y-8">
      {/* ── TOP SCORECARD HERO ────────────────────────────────────────────── */}
      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 md:p-10 shadow-lg text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-outline-variant rounded-full text-xs font-mono text-secondary">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>Proctored Assessment Outcome</span>
        </div>

        {/* Dynamic Icon */}
        <div className="mx-auto">
          {passed ? (
            <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
              <Award size={40} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-rose-100 text-rose-800 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-rose-50">
              <XCircle size={40} />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mt-1">
            {passed ? 'Certification Granted' : 'Assessment Threshold Unmet'}
          </h1>
          <p className="text-sm font-serif font-semibold text-secondary mt-1">
            {testTitle || 'Core Competency Examination'}
          </p>
          <p className="text-xs text-on-surface-variant max-w-lg mx-auto mt-2 leading-relaxed">
            {passed
              ? `Outstanding performance! You achieved ${percentage}%, exceeding the required ${passingScore}% cutoff. Your official credential has been signed and added to your portfolio.`
              : `You achieved a score of ${percentage}%. A minimum passing score of ${passingScore}% is required to unlock your degree certificate.`}
          </p>
        </div>

        {/* Quantitative Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-surface rounded-2xl border border-outline-variant">
          <div>
            <span className="font-mono text-[10px] uppercase text-outline block">Final Score</span>
            <span className="text-2xl font-serif font-bold text-primary mt-1 block">
              {score} / {totalMarks}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-outline block">Accuracy</span>
            <span className={`text-2xl font-serif font-bold mt-1 block ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
              {percentage}%
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-outline block">Status</span>
            <span
              className={`text-xs font-mono font-bold mt-2 block uppercase px-2.5 py-1 rounded-lg inline-block ${
                passed ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
              }`}
            >
              {passed ? 'PASSED' : 'RETAKE REQUIRED'}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-outline block">Integrity Record</span>
            <span className="text-xs font-mono font-semibold text-on-surface mt-2 block">
              {tabSwitchCount > 0 ? (
                <span className="text-amber-700">{tabSwitchCount} Strikes Logged</span>
              ) : (
                <span className="text-emerald-700">100% Clean Audit</span>
              )}
            </span>
          </div>
        </div>

        {/* Certificate Unlocked Banner */}
        {certId && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-mono flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 block font-bold">
                Official Credential Issued
              </span>
              <span className="text-sm font-serif font-bold text-emerald-900">
                Certificate ID: <strong>{certId}</strong> {certGrade && `(Grade: ${certGrade})`}
              </span>
            </div>
            <Link
              to="/certificate"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
            >
              <Award size={14} /> Open Certificate Vault →
            </Link>
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {passed ? (
            <Link
              to="/certificate"
              className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Award size={16} /> View & Download Certificate
            </Link>
          ) : (
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw size={16} /> Retake Assessment Now
            </button>
          )}

          <Link
            to="/test"
            className="px-5 py-3 border border-outline-variant bg-surface hover:bg-surface-container text-on-surface rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            Assessments Catalogue
          </Link>

          <Link
            to="/dashboard"
            className="px-5 py-3 text-xs text-outline hover:text-on-surface font-mono transition-colors"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>

      {/* ── QUESTION-BY-QUESTION DIAGNOSTIC REVIEW ────────────────────────── */}
      {questionReview.length > 0 && (
        <section className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 md:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-outline block">
                Diagnostic Analysis
              </span>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-primary mt-0.5">
                Question Review & Answer Key
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Detailed breakdown of your answers, correct solutions, and faculty explanations.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-primary text-on-primary border-primary font-bold'
                    : 'bg-surface border-outline-variant text-outline hover:text-on-surface'
                }`}
              >
                All ({questionReview.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('correct')}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  filter === 'correct'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-surface border-outline-variant text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                Correct ({correctCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  filter === 'incorrect'
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-surface border-outline-variant text-rose-800 hover:bg-rose-50'
                }`}
              >
                Incorrect ({incorrectCount})
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const selectedOpt = q.selectedAnswer !== null ? Number(q.selectedAnswer) : null;
              const correctOpt = Number(q.correctAnswer);

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all space-y-4 ${
                    q.isCorrect
                      ? 'bg-surface border-emerald-200'
                      : 'bg-surface border-rose-200'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                    <span className="font-mono text-xs font-bold text-outline">
                      Question {(q.index !== undefined ? q.index : idx) + 1}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold flex items-center gap-1 ${
                        q.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOpt === null
                          ? 'bg-surface-container text-outline'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {q.isCorrect ? (
                        <>
                          <Check size={12} strokeWidth={3} /> Correct (+1 Mark)
                        </>
                      ) : selectedOpt === null ? (
                        'Unattempted (0 Marks)'
                      ) : (
                        <>
                          <X size={12} strokeWidth={3} /> Incorrect (0 Marks)
                        </>
                      )}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="text-base md:text-lg font-serif font-bold text-primary leading-relaxed">
                    {q.question}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((optText, optIdx) => {
                      const isThisSelected = selectedOpt === optIdx;
                      const isThisCorrect = correctOpt === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);

                      let style = 'bg-surface-container-low border-outline-variant text-on-surface';
                      let badge = null;

                      if (isThisCorrect) {
                        style = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium';
                        badge = (
                          <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Correct Answer
                          </span>
                        );
                      } else if (isThisSelected && !isThisCorrect) {
                        style = 'bg-rose-50 border-rose-300 text-rose-950';
                        badge = (
                          <span className="text-[10px] font-mono font-bold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <X size={11} strokeWidth={3} /> Your Answer
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold ${
                                isThisCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isThisSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-surface-container text-outline'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="font-medium">{optText}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Educational Explanation Box */}
                  {q.explanation && (
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-secondary">
                        <HelpCircle size={13} /> Explanation & Solution Key:
                      </div>
                      <p className="text-on-surface-variant leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
