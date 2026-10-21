import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Bookmark,
  RotateCcw,
  Send,
  Play,
  Maximize2,
  Check,
  AlertCircle,
  FileText,
  Info,
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { showError, showConfirm } from '../utils/dialog.js';
import { useAntiCheat } from '../hooks/useAntiCheat.js';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Test and Questions state
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [index]: selectedOptionIndex }
  const [flagged, setFlagged] = useState({}); // { [index]: boolean }
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState('instructions'); // 'instructions' | 'exam'
  const [agreed, setAgreed] = useState({ ready: false, honest: false });
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const tabSwitchesRef = useRef(0);
  const timerRef = useRef(null);

  // Anti-Cheat Engine (only active when phase === 'exam')
  const {
    violations,
    maxViolations,
    requestFullscreen,
    isWarningModalOpen,
    setIsWarningModalOpen,
    warningReason,
  } = useAntiCheat({
    enabled: phase === 'exam',
    maxViolations: 3,
    onViolation: (count) => {
      tabSwitchesRef.current = count;
    },
    onMaxViolationsReached: () => {
      showError(
        'Examination Terminated',
        'Maximum focus violations reached (3 strikes). Your assessment has been automatically finalized and submitted.'
      );
      handleSubmitQuizDirect();
    },
  });

  // Load Quiz Data
  useEffect(() => {
    let isMounted = true;
    apiFetch(`/tests/${id}`)
      .then((data) => {
        if (!isMounted) return;
        if (data.test) {
          const t = data.test;
          setTest(t);
          const raw = Array.isArray(t.questions) && t.questions.length ? t.questions : [];
          // Preserve original index for secure backend grading
          const indexed = raw.map((q, origIdx) => ({
            ...q,
            originalIndex: q.index !== undefined ? q.index : origIdx,
          }));
          // Anti-cheat: Shuffle questions randomly per candidate session
          const shuffled = [...indexed].sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
          setTimeLeft((t.durationMinutes || 30) * 60);
        } else {
          showError('Not Found', 'Quiz assessment could not be located.');
          navigate('/test');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        showError('Access Error', err.message || 'Unable to access quiz session.');
        navigate('/test');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Direct submit function
  const handleSubmitQuizDirect = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Map candidate's displayed answers back to their immutable question indices
    const mappedAnswers = {};
    questions.forEach((q, idx) => {
      const orig = q.originalIndex !== undefined ? q.originalIndex : idx;
      if (answers[idx] !== undefined) {
        mappedAnswers[orig] = answers[idx];
      }
    });

    try {
      const res = await apiFetch(`/tests/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: mappedAnswers,
          tabSwitchCount: tabSwitchesRef.current,
        }),
      });

      navigate('/test/result', {
        state: {
          result: res,
          testTitle: test?.title || 'Academic Assessment',
          passingScore: 40,
        },
      });
    } catch (err) {
      showError('Submission Error', err.message || 'Failed to submit quiz.');
      setSubmitting(false);
    }
  }, [id, answers, submitting, test, navigate]);

  // Live Timer Countdown
  useEffect(() => {
    if (phase !== 'exam' || loading || !test) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitQuizDirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, loading, test, handleSubmitQuizDirect]);

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    if (phase !== 'exam') return;

    const handleKeyDown = (e) => {
      // Don't intercept if an input is focused
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const currentQ = questions[currentIndex];
      if (!currentQ || !currentQ.options) return;

      const key = e.key.toUpperCase();
      let selectedOpt = null;

      if (['A', '1'].includes(key) && currentQ.options[0]) selectedOpt = 0;
      else if (['B', '2'].includes(key) && currentQ.options[1]) selectedOpt = 1;
      else if (['C', '3'].includes(key) && currentQ.options[2]) selectedOpt = 2;
      else if (['D', '4'].includes(key) && currentQ.options[3]) selectedOpt = 3;

      if (selectedOpt !== null) {
        setAnswers((prev) => ({ ...prev, [currentIndex]: selectedOpt }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentIndex, questions]);

  // Start exam handler
  const handleStartExam = async () => {
    if (!agreed.ready || !agreed.honest) {
      showError('Notice', 'Please acknowledge both integrity checkboxes before starting.');
      return;
    }

    try {
      // Notify backend to initialize/resume session
      const startRes = await apiFetch(`/tests/${id}/start`, { method: 'POST' });
      if (startRes.questions && startRes.questions.length > 0) {
        setQuestions(startRes.questions);
      }
    } catch (err) {
      console.warn('Start session notice:', err.message);
    }

    // Request fullscreen for proctored mode
    await requestFullscreen();
    setPhase('exam');
  };

  // Option selection
  const handleSelectOption = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  // Clear answer for current question
  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  // Toggle bookmark / mark for review
  const handleToggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-outline">
          Securing examination environment...
        </span>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: PRE-EXAM INSTRUCTIONS & SECURITY ONBOARDING
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-surface p-4 md:p-8 flex items-center justify-center">
        <div className="bg-surface-container-low border border-outline-variant rounded-3xl max-w-2xl w-full p-6 md:p-10 shadow-xl space-y-8">
          {/* Header */}
          <div className="border-b border-outline-variant pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-outline-variant rounded-full text-xs font-mono text-secondary mb-3">
              <ShieldCheck size={14} className="text-emerald-700" />
              <span>Proctored Academic Assessment</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
              {test?.title || 'Academic Certification Examination'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Course: <strong className="text-primary">{test?.course?.title || test?.Course?.title || 'Curriculum Assessment'}</strong>
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant text-center">
              <span className="font-mono text-[10px] uppercase text-outline block">Questions</span>
              <span className="text-2xl font-serif font-bold text-primary mt-1 block">
                {questions.length || test?.totalQuestions || 0}
              </span>
            </div>
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant text-center">
              <span className="font-mono text-[10px] uppercase text-outline block">Time Limit</span>
              <span className="text-2xl font-serif font-bold text-primary mt-1 block">
                {test?.durationMinutes || 30}m
              </span>
            </div>
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant text-center">
              <span className="font-mono text-[10px] uppercase text-outline block">Passing Score</span>
              <span className="text-2xl font-serif font-bold text-emerald-700 mt-1 block">
                40%
              </span>
            </div>
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant text-center">
              <span className="font-mono text-[10px] uppercase text-outline block">Format</span>
              <span className="text-sm font-mono font-bold text-primary mt-2 block">
                Single Choice
              </span>
            </div>
          </div>

          {/* Rules & Guidelines */}
          <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-primary">
              <Info size={15} /> Examination Protocol & Anti-Cheat Rules
            </div>
            <ul className="text-xs text-on-surface-variant space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong>Fullscreen Lock:</strong> The assessment runs in fullscreen mode. Exiting fullscreen logs an integrity warning.
              </li>
              <li>
                <strong>Tab Switching / Window Blur:</strong> Navigating away from this tab or minimizing will be flagged. Reaching <strong>3 strikes</strong> automatically submits your test.
              </li>
              <li>
                <strong>Shortcuts & Copy-Paste:</strong> Keyboard shortcuts (Ctrl+C, Ctrl+V, F12, PrintScreen) and context menus are disabled.
              </li>
              <li>
                <strong>Timed Submission:</strong> Unsubmitted answers will be finalized automatically when the timer reaches 00:00.
              </li>
              <li>
                <strong>Certificate Award:</strong> Scoring 40% or higher automatically generates your verified digital degree certificate.
              </li>
            </ul>
          </div>

          {/* Checklist checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant bg-surface cursor-pointer hover:bg-surface-container-high transition-colors">
              <input
                type="checkbox"
                checked={agreed.ready}
                onChange={(e) => setAgreed({ ...agreed, ready: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs text-on-surface">
                I am in a quiet environment and ready to complete this assessment in one continuous session without external aids.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant bg-surface cursor-pointer hover:bg-surface-container-high transition-colors">
              <input
                type="checkbox"
                checked={agreed.honest}
                onChange={(e) => setAgreed({ ...agreed, honest: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs text-on-surface">
                I understand that tab switches and focus losses are actively tracked, and 3 infractions will trigger immediate termination.
              </span>
            </label>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => navigate('/test')}
              className="px-5 py-2.5 text-xs text-outline hover:text-on-surface font-mono transition-colors"
            >
              ← Cancel & Return
            </button>

            <button
              onClick={handleStartExam}
              disabled={!agreed.ready || !agreed.honest}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all ${
                agreed.ready && agreed.honest
                  ? 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer'
                  : 'bg-outline-variant text-outline cursor-not-allowed opacity-60'
              }`}
            >
              <Maximize2 size={15} /> Enter Fullscreen & Begin Assessment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: ACTIVE EXAMINATION INTERFACE
  // ─────────────────────────────────────────────────────────────────────────────
  const currentQ = questions[currentIndex] || {};
  const currentOptions = Array.isArray(currentQ.options) ? currentQ.options : [];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 300; // < 5 mins
  const isCritical = timeLeft < 60; // < 1 min

  // Metrics
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const totalCount = questions.length;
  const percentCompleted = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between select-none">
      {/* ── TOP PROCTORING HEADER BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-serif font-bold text-sm shadow-sm">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-secondary font-semibold">
                Proctored Examination
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-sm md:text-base font-serif font-bold text-primary truncate max-w-xs md:max-w-md">
              {test?.title || 'Academic Assessment'}
            </h1>
          </div>
        </div>

        {/* Center / Right Control Panel */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Integrity Shield Indicator */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono transition-colors ${
              violations > 0
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-surface border-outline-variant text-on-surface'
            }`}
          >
            <ShieldCheck size={14} className={violations > 0 ? 'text-rose-600' : 'text-emerald-600'} />
            <span className="hidden sm:inline">Violations:</span>
            <strong>
              {violations} / {maxViolations}
            </strong>
          </div>

          {/* Dynamic Countdown Timer */}
          <div
            className={`px-4 py-1.5 rounded-xl flex items-center gap-2 font-mono text-sm font-bold shadow-sm transition-all ${
              isCritical
                ? 'bg-rose-600 text-white animate-pulse'
                : isUrgent
                ? 'bg-amber-600 text-white'
                : 'bg-primary text-on-primary'
            }`}
          >
            <Clock size={15} />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Finish & Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Finalize & Submit</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE: SPLIT SCREEN ──────────────────────────────────── */}
      <main className="flex-1 w-full p-4 md:px-8 lg:px-10 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: QUESTION VIEWER (8 cols on lg) */}
        <section className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-3xl p-6 md:p-10 shadow-sm flex flex-col justify-between min-h-[580px] space-y-6">
          <div>
            {/* Question Subheader */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-outline">
                  Question {currentIndex + 1} of {totalCount}
                </span>
                {flagged[currentIndex] && (
                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded font-mono text-[10px] flex items-center gap-1">
                    <Bookmark size={10} className="fill-amber-600" /> Review Later
                  </span>
                )}
                {answers[currentIndex] !== undefined && (
                  <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded font-mono text-[10px] flex items-center gap-1">
                    <Check size={10} /> Saved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-outline">
                <span className="px-2 py-0.5 bg-surface rounded border border-outline-variant">
                  {currentQ.points || 1} {currentQ.points === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-xl md:text-2xl font-serif font-bold text-primary leading-relaxed">
              {currentQ.question || 'Loading question content...'}
            </h2>

            {/* Interactive Options */}
            <div className="space-y-3 pt-6">
              {currentOptions.map((optionText, optIndex) => {
                const isSelected = answers[currentIndex] === optIndex;
                const letter = String.fromCharCode(65 + optIndex);

                return (
                  <div
                    key={optIndex}
                    onClick={() => handleSelectOption(optIndex)}
                    className={`group w-full p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-md scale-[1.005]'
                        : 'bg-surface hover:bg-surface-container border-outline-variant text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-surface text-primary shadow-inner'
                            : 'bg-surface-container text-on-surface-variant group-hover:bg-surface-container-high'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="text-sm font-medium leading-normal">{optionText}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-white bg-white text-primary'
                          : 'border-outline-variant group-hover:border-primary'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Toolbar */}
          <div className="pt-6 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  flagged[currentIndex]
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-surface hover:bg-surface-container border-outline-variant text-outline hover:text-on-surface'
                }`}
              >
                <Bookmark size={13} className={flagged[currentIndex] ? 'fill-amber-600' : ''} />
                <span>{flagged[currentIndex] ? 'Flagged for Review' : 'Mark for Review'}</span>
              </button>

              {answers[currentIndex] !== undefined && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-outline hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
                className={`px-4 py-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all ${
                  currentIndex === 0
                    ? 'border-outline-variant text-outline/50 cursor-not-allowed opacity-50'
                    : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface cursor-pointer'
                }`}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {currentIndex < totalCount - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((c) => Math.min(totalCount - 1, c + 1))}
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  Save & Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send size={13} /> Complete Exam
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: QUESTION MATRIX PALETTE (4 cols on lg) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-outline block">
                Session Navigation
              </span>
              <h3 className="font-serif font-bold text-base text-primary mt-0.5">Question Matrix</h3>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-outline">
                <span>Progress: {percentCompleted}%</span>
                <span>
                  {answeredCount} of {totalCount} Answered
                </span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-outline-variant">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentCompleted}%` }}
                />
              </div>
            </div>

            {/* Status Counters */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="block text-emerald-800 font-bold text-sm">{answeredCount}</span>
                <span className="text-[10px] text-emerald-700 uppercase">Answered</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="block text-amber-800 font-bold text-sm">{flaggedCount}</span>
                <span className="text-[10px] text-amber-700 uppercase">Review</span>
              </div>
              <div className="p-2.5 bg-surface border border-outline-variant rounded-xl">
                <span className="block text-outline font-bold text-sm">
                  {totalCount - answeredCount}
                </span>
                <span className="text-[10px] text-outline uppercase">Pending</span>
              </div>
            </div>

            {/* Question Matrix Buttons */}
            <div>
              <span className="font-mono text-[10px] uppercase text-outline block mb-2.5">
                Jump to Question:
              </span>
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                {questions.map((_, qIdx) => {
                  const isCurrent = qIdx === currentIndex;
                  const isAnswered = answers[qIdx] !== undefined;
                  const isFlagged = !!flagged[qIdx];

                  let buttonStyle = 'bg-surface border-outline-variant text-outline hover:text-on-surface';
                  if (isAnswered && isFlagged) {
                    buttonStyle = 'bg-amber-500 text-white border-amber-600 font-bold ring-2 ring-emerald-500';
                  } else if (isAnswered) {
                    buttonStyle = 'bg-emerald-600 text-white border-emerald-700 font-bold';
                  } else if (isFlagged) {
                    buttonStyle = 'bg-amber-100 border-amber-400 text-amber-900 font-bold';
                  }

                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => setCurrentIndex(qIdx)}
                      className={`relative h-10 rounded-xl font-mono text-xs border transition-all flex items-center justify-center cursor-pointer ${buttonStyle} ${
                        isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                    >
                      <span>{qIdx + 1}</span>
                      {isFlagged && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Legend */}
            <div className="pt-3 border-t border-outline-variant grid grid-cols-2 gap-2 text-[11px] font-mono text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-400 inline-block" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-surface border border-outline-variant inline-block" />
                <span>Unattempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md border-2 border-primary inline-block" />
                <span>Current Question</span>
              </div>
            </div>
          </div>

          {/* Shortcut Keys Tip */}
          <div className="p-4 bg-surface rounded-2xl border border-outline-variant text-[11px] text-outline space-y-1 font-mono">
            <span className="text-secondary font-bold block">Quick Keyboard Shortcuts:</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant">A</kbd>, <kbd className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant">B</kbd>, <kbd className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant">C</kbd>, <kbd className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant">D</kbd> to select answers directly.</span>
          </div>
        </aside>
      </main>

      {/* ── ANTI-CHEAT WARNING MODAL ───────────────────────────────────────── */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-rose-500 rounded-3xl max-w-md w-full p-6 md:p-8 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600 font-bold">
                Security Strike {violations} of {maxViolations}
              </span>
              <h3 className="font-serif text-xl font-bold text-rose-700 mt-1">
                Integrity Protocol Violation
              </h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                <strong>{warningReason || 'Window blur or tab-switching detected.'}</strong> This examination is strictly proctored. Navigating away from the active exam window is prohibited.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-mono text-rose-900">
              {maxViolations - violations > 0 ? (
                <span>
                  <strong>Warning:</strong> You have {maxViolations - violations} strike(s) remaining before automatic termination and exam failure.
                </span>
              ) : (
                <span>Reaching maximum violations. Exam is terminating...</span>
              )}
            </div>

            <button
              onClick={() => {
                setIsWarningModalOpen(false);
                requestFullscreen();
              }}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-colors"
            >
              Acknowledge & Return to Examination
            </button>
          </div>
        </div>
      )}

      {/* ── SUBMISSION CONFIRMATION MODAL ─────────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-outline">Submission Review</span>
                <h3 className="font-serif text-xl font-bold text-primary">Finalize Examination?</h3>
              </div>
            </div>

            {/* Overview breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center font-mono">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-xl font-bold text-emerald-800 block">{answeredCount}</span>
                <span className="text-[10px] uppercase text-emerald-700 block">Answered</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-xl font-bold text-amber-800 block">{flaggedCount}</span>
                <span className="text-[10px] uppercase text-amber-700 block">Review Flagged</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-xl font-bold text-rose-800 block">{totalCount - answeredCount}</span>
                <span className="text-[10px] uppercase text-rose-700 block">Unanswered</span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Once submitted, your responses will be locked and automatically evaluated. You will immediately receive your comprehensive score report and certificate (if passing grade is achieved).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface text-xs font-mono font-medium cursor-pointer transition-colors"
              >
                Keep Reviewing
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitQuizDirect();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                {submitting ? 'Evaluating...' : 'Confirm & Submit Exam →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
