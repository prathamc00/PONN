import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Search, CheckCircle2, Clock, ExternalLink, Star, ChevronDown, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../utils/api';
import { showAlert, showError } from '../../utils/dialog';

interface Submission {
  _id: string;
  status: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  filePath?: string;
  student: { _id: string; name: string; email: string };
  assignment: { _id: string; title: string; maxGrade: number; dueDate: string; course?: { title: string } };
}

export default function GradingQueue() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const asgData = await apiFetch('/assignments/manage');
      const assignments = asgData.assignments || [];

      // Fetch submissions for each assignment concurrently
      const results = await Promise.allSettled(
        assignments.map((a: any) => apiFetch(`/assignments/${a._id}/submissions`))
      );

      const all: Submission[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const subs = r.value.submissions || [];
          subs.forEach((s: any) => {
            all.push({ ...s, assignment: assignments[i] });
          });
        }
      });

      all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setSubmissions(all);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGrade = async (submissionId: string) => {
    const grade = Number(gradeInput);
    if (isNaN(grade)) {
      await showAlert({ title: 'Invalid grade', text: 'Please enter a valid grade', icon: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/submissions/${submissionId}/grade`, {
        method: 'PUT',
        body: JSON.stringify({ grade, feedback: feedbackInput }),
      });
      setGradingId(null);
      setGradeInput('');
      setFeedbackInput('');
      await load();
    } catch (err: any) {
      await showError('Failed to submit grade', err.message || 'Unable to submit grade.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = submissions.filter(s => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'pending' ? (!s.grade && s.status !== 'graded') :
      (!!s.grade || s.status === 'graded');
    const matchSearch = [s.student?.name, s.student?.email, s.assignment?.title, s.assignment?.course?.title]
      .some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const pendingCount = submissions.filter(s => !s.grade && s.status !== 'graded').length;
  const gradedCount = submissions.filter(s => !!s.grade || s.status === 'graded').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Grading Queue</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">All assignment submissions across courses in one place.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Submissions', value: submissions.length, color: 'text-brand-purple bg-brand-purple/10', icon: ClipboardList },
          { label: 'Needs Grading', value: pendingCount, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400', icon: Clock },
          { label: 'Graded', value: gradedCount, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400', icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search by student, assignment..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'graded'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-700'}`}>
                {f === 'pending' ? `Pending (${pendingCount})` : f === 'graded' ? `Graded (${gradedCount})` : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Student', 'Assignment', 'Submitted', 'Status', 'Grade', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading submissions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">
                    {filter === 'pending' ? 'No pending submissions 🎉' : 'No submissions found'}
                  </p>
                </td></tr>
              ) : filtered.map(sub => (
                <React.Fragment key={sub._id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.student?.name}</p>
                      <p className="text-xs text-slate-400">{sub.student?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[180px] truncate">{sub.assignment?.title}</p>
                      {sub.assignment?.course?.title && (
                        <p className="text-xs text-slate-400">{sub.assignment.course.title}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {(sub.grade !== undefined && sub.grade !== null) || sub.status === 'graded' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Graded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(sub.grade !== undefined && sub.grade !== null)
                        ? <span className="text-sm font-bold text-slate-900 dark:text-white">{sub.grade} / {sub.assignment?.maxGrade || 100}</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sub.filePath && (
                          <a href={`${(import.meta as any).env.VITE_BACKEND_URL || ''}/${sub.filePath}`} target="_blank" rel="noreferrer"
                            className="p-2 bg-sky-50 dark:bg-sky-900/20 text-sky-500 rounded-xl hover:bg-sky-100 transition-colors" title="View File">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setGradingId(gradingId === sub._id ? null : sub._id)}
                          className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-100 transition-colors"
                          title="Grade"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Inline grading panel */}
                  <AnimatePresence>
                    {gradingId === sub._id && (
                      <tr>
                        <td colSpan={6} className="px-0 py-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="px-6 py-4 bg-brand-50 dark:bg-brand-900/10 border-t border-brand-100 dark:border-brand-900/30"
                          >
                            <div className="flex flex-wrap gap-4 items-end">
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                  Grade (max {sub.assignment?.maxGrade || 100})
                                </label>
                                <input
                                  type="number" min="0" max={sub.assignment?.maxGrade || 100}
                                  value={gradeInput}
                                  onChange={e => setGradeInput(e.target.value)}
                                  placeholder="e.g. 85"
                                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-28 outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Feedback (optional)</label>
                                <input
                                  type="text"
                                  value={feedbackInput}
                                  onChange={e => setFeedbackInput(e.target.value)}
                                  placeholder="Well done! or Try to improve..."
                                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                              </div>
                              <button
                                onClick={() => handleGrade(sub._id)}
                                disabled={submitting || !gradeInput}
                                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
                              >
                                {submitting ? 'Saving...' : 'Submit Grade'}
                              </button>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500">Showing {filtered.length} of {submissions.length} submissions</p>
        </div>
      </div>
    </div>
  );
}
