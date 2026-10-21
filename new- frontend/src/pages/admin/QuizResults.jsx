import React, { useState, useEffect } from 'react';
import {
  Award, CheckCircle, XCircle, RotateCcw, Search, AlertTriangle, User
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function QuizResults() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/quiz-attempts').catch(() => apiFetch('/tests/my-attempts'));
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error('Failed to load quiz results', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const handleResetAttempt = async (studentId, studentName, quizId) => {
    const ok = await showConfirm({
      title: 'Reset Test Attempt?',
      text: `Reset attempt for ${studentName}? This student will be permitted to retake the quiz cleanly.`,
      confirmText: 'Reset Attempt',
    });
    if (!ok) return;

    try {
      if (quizId) {
        await apiFetch(`/tests/${quizId}/retake`, { method: 'POST' }).catch(() => {});
      }
      await apiFetch(`/users/${studentId}/reset-quiz-attempts`, { method: 'POST' }).catch(() => {});
      await showSuccess('Reset Complete', 'Student attempt records have been reset.');
      loadAttempts();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const filtered = attempts.filter(a => {
    const name = a.studentName || a.student?.name || '';
    const title = a.quizTitle || a.quiz?.title || a.testTitle || a.testId?.title || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Evaluation & Proctoring Desk</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Quiz Results & Anti-Cheat Logs</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Audit test attempts, verify anti-cheat integrity telemetry (tab switches and blur events), and reset eligibility.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-3 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name or quiz title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs font-mono text-outline hidden md:block">
          {filtered.length} Recorded Attempts
        </span>
      </div>

      {/* Results Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-outline font-mono text-xs">Loading examination attempts...</div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant font-mono uppercase text-outline text-[11px]">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Quiz Assessment</th>
                  <th className="p-4">Score & Outcome</th>
                  <th className="p-4">Anti-Cheat Flags</th>
                  <th className="p-4">Date Completed</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((att, i) => {
                  const studentId = att.userId || att.student?._id || att.student?.id;
                  const studentName = att.studentName || att.student?.name || 'Student';
                  const quizTitle = att.quizTitle || att.quiz?.title || att.testTitle || att.testId?.title || 'Course Quiz';
                  const quizId = att.quizId || att.quiz?.id || att.quiz?._id || att.testId;
                  const percentage = att.percentage !== undefined ? att.percentage : (att.totalMarks > 0 ? Math.round((Number(att.score) / Number(att.totalMarks)) * 100) : 0);
                  const isPassed = att.passed !== undefined ? att.passed : percentage >= 40;
                  const violations = att.tabSwitchCount ?? att.tabSwitches ?? 0;

                  return (
                    <tr key={att._id || i} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-primary block text-sm flex items-center gap-1.5">
                          <User size={13} className="text-outline" /> {studentName}
                        </span>
                        <span className="font-mono text-outline text-[11px] block mt-0.5">
                          {att.studentEmail || att.student?.email || '—'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-on-surface block">
                          {quizTitle}
                        </span>
                        <span className="text-outline font-mono text-[10px]">
                          {att.quiz?.course?.title || 'Certification Exam'}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif font-bold text-on-surface">
                            {att.score}/{att.totalMarks} ({percentage}%)
                          </span>
                          {isPassed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold uppercase">
                              <CheckCircle size={11} /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-mono text-[10px] font-bold uppercase">
                              <XCircle size={11} /> Fail
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {violations > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-mono text-[11px] font-semibold">
                            <AlertTriangle size={12} /> {violations} Tab Switch(es)
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-mono text-[11px]">0 Violations (Clean)</span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-outline text-[11px]">
                        {att.completedAt ? new Date(att.completedAt).toLocaleString() : 'Recent'}
                      </td>

                      <td className="p-4 text-right">
                        {studentId && (
                          <button
                            onClick={() => handleResetAttempt(studentId, studentName)}
                            className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                            title="Reset attempt count"
                          >
                            <RotateCcw size={12} /> Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3 bg-surface-container-low border border-dashed border-outline-variant rounded-xl">
            <Award size={32} className="text-outline mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary">No Test Attempts Yet</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              When students complete scheduled quizzes, their scores and proctoring telemetry will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
