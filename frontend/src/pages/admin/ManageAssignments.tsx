import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, CheckCircle, Clock, ChevronRight, Download, Award, ArrowLeft, Send, Plus, Trash2, X, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../utils/api';
import { showConfirm, showError, showSuccess } from '../../utils/dialog';

interface AssignmentRecord {
  id?: string | number;
  _id: string;
  title: string;
  description?: string;
  type: string;
  course: { id?: string | number; _id?: string; title: string } | string;
  dueDate: string;
  maxMarks: number;
  createdAt: string;
}

interface SubmissionRecord {
  id?: string | number;
  _id: string;
  student: { id?: string | number; _id?: string; name: string; email: string };
  assignment: string;
  type: string;
  filePath?: string;
  textContent?: string;
  codeContent?: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
}

export default function ManageAssignments() {
  const getEntityIdCandidates = (obj: any): string[] => {
    const raw = [obj?.id, obj?._id]
      .map((v) => (v == null ? '' : String(v).trim()))
      .filter((v) => v.length > 0);
    return Array.from(new Set(raw));
  };

  const getEntityId = (obj: any): string => getEntityIdCandidates(obj)[0] || '';

  const isRouteNotFoundError = (err: any): boolean =>
    String(err?.message || '').toLowerCase().includes('route not found');

  const [view, setView] = useState<'list' | 'submissions' | 'grading'>('list');
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRecord | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', course: '', type: 'file_upload', dueDate: '', maxMarks: 100 });

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const [aData, cData] = await Promise.all([
        apiFetch('/assignments/manage').catch(() => ({ assignments: [] })),
        apiFetch('/courses/manage').catch(() => ({ courses: [] })),
      ]);
      setAssignments(aData.assignments || []);
      setCourses(cData.courses || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load assignments');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAssignments(); }, []);

  const handleViewSubmissions = async (a: AssignmentRecord) => {
    setSelectedAssignment(a);
    try {
      const assignmentIdCandidates = getEntityIdCandidates(a);
      if (assignmentIdCandidates.length === 0) throw new Error('Assignment ID is missing');

      let data: any = null;
      let lastErr: any = null;
      for (const assignmentId of assignmentIdCandidates) {
        try {
          data = await apiFetch(`/assignments/${assignmentId}/submissions`);
          break;
        } catch (err: any) {
          lastErr = err;
          if (!isRouteNotFoundError(err)) throw err;
        }
      }

      if (!data) throw lastErr || new Error('Unable to load submissions.');
      setSubmissions(data.submissions || []);
      setView('submissions');
    } catch (err: any) {
      await showError('Failed to load submissions', err.message || 'Unable to load submissions.');
    }
  };

  const handleGradeView = (sub: SubmissionRecord) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade != null ? String(sub.grade) : '');
    setFeedback(sub.feedback || '');
    setView('grading');
  };

  const submitGrade = async () => {
    if (!selectedSubmission) return;
    try {
      const submissionIdCandidates = getEntityIdCandidates(selectedSubmission);
      if (submissionIdCandidates.length === 0) throw new Error('Submission ID is missing');

      let graded = false;
      let lastErr: any = null;
      for (const submissionId of submissionIdCandidates) {
        try {
          await apiFetch(`/submissions/${submissionId}/grade`, {
            method: 'PUT',
            body: JSON.stringify({ grade: Number(grade), feedback }),
          });
          graded = true;
          break;
        } catch (err: any) {
          lastErr = err;
          if (!isRouteNotFoundError(err)) throw err;
        }
      }
      if (!graded) throw lastErr || new Error('Unable to submit grade.');

      await showSuccess('Grade submitted!', 'Student grade has been saved.');
      // Refresh submissions
      if (selectedAssignment) {
        const assignmentIdCandidates = getEntityIdCandidates(selectedAssignment);
        for (const assignmentId of assignmentIdCandidates) {
          try {
            const data = await apiFetch(`/assignments/${assignmentId}/submissions`);
            setSubmissions(data.submissions || []);
            break;
          } catch (err: any) {
            if (!isRouteNotFoundError(err)) throw err;
          }
        }
      }
      setView('submissions');
    } catch (err: any) {
      await showError('Failed to submit grade', err.message || 'Unable to submit grade.');
    }
  };

  const createAssignment = async () => {
    try {
      await apiFetch('/assignments', { method: 'POST', body: JSON.stringify(form) });
      setIsCreateOpen(false);
      await loadAssignments();
    } catch (err: any) {
      await showError('Failed to create assignment', err.message || 'Unable to create assignment.');
    }
  };

  const deleteAssignment = async (assignment: AssignmentRecord) => {
    const shouldDelete = await showConfirm({
      title: 'Delete assignment?',
      text: 'Delete this assignment?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!shouldDelete) return;
    try {
      const idCandidates = getEntityIdCandidates(assignment);
      if (idCandidates.length === 0) throw new Error('Assignment ID is missing');
      let deleted = false;
      let lastErr: any = null;
      for (const idCandidate of idCandidates) {
        try {
          await apiFetch(`/assignments/${idCandidate}`, { method: 'DELETE' });
          deleted = true;
          break;
        } catch (err: any) {
          lastErr = err;
          if (!isRouteNotFoundError(err)) throw err;
        }
      }
      if (!deleted) throw lastErr || new Error('Unable to delete assignment.');
      await loadAssignments();
    } catch (err: any) {
      await showError('Failed to delete assignment', err.message || 'Unable to delete assignment.');
    }
  };

  const filteredAssignments = assignments.filter(a => a.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = submissions.filter(s => s.grade == null).length;
  const gradedCount = submissions.filter(s => s.grade != null).length;
  const getCourseName = (a: AssignmentRecord) => typeof a.course === 'object' && a.course ? a.course.title : '—';
  const getInitials = (name: string) => (name || '?').split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button onClick={loadAssignments} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Retry</button>
        </div>
      )}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Assignment Management</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Create assignments and grade student work.</p>
              </div>
              <button onClick={() => { setForm({ title: '', description: '', course: getEntityId(courses[0]), type: 'file_upload', dueDate: '', maxMarks: 100 }); setIsCreateOpen(true); }}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Assignment
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600"><FileText className="w-6 h-6" /></div>
                  <div><p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Assignments</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.length}</h3></div>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div>
                  <div><p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.filter(a => new Date(a.dueDate) > new Date()).length}</h3></div>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600"><Award className="w-6 h-6" /></div>
                  <div><p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Past Due</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.filter(a => new Date(a.dueDate) <= new Date()).length}</h3></div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search assignments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Assignment</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Course</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Due Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                    ) : filteredAssignments.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No assignments found</td></tr>
                    ) : filteredAssignments.map(a => (
                      <tr key={getEntityId(a)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                          <p className="text-xs text-slate-400 mt-1">Max: {a.maxMarks} marks</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{getCourseName(a)}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">{a.type.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleViewSubmissions(a)} className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-xl font-bold text-xs hover:bg-brand-600 hover:text-white transition-all flex items-center gap-1">
                              Submissions <ChevronRight className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteAssignment(a)} className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

        ) : view === 'submissions' ? (
          <motion.div key="submissions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Submissions</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedAssignment?.title} — {submissions.length} submission(s)</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Submitted</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Grade</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {submissions.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No submissions yet</td></tr>
                  ) : submissions.map(sub => (
                    <tr key={getEntityId(sub)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{getInitials(sub.student?.name || '?')}</div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.student?.name}</p>
                            <p className="text-xs text-slate-400">{sub.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {sub.grade != null ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">{sub.grade}/{selectedAssignment?.maxMarks}</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleGradeView(sub)} className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-xl font-bold text-xs hover:bg-brand-600 hover:text-white transition-all">
                          {sub.grade != null ? 'Edit Grade' : 'Grade Now'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

        ) : (
          <motion.div key="grading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('submissions')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Grade Submission</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Reviewing {selectedSubmission?.student?.name}'s work</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submission Content</h3>
                  {selectedSubmission?.filePath && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-600 border border-slate-200 dark:border-slate-700"><FileText className="w-6 h-6" /></div>
                        <p className="font-bold text-slate-900 dark:text-white">{selectedSubmission.filePath.split('/').pop()}</p>
                      </div>
                      <a href={`/${selectedSubmission.filePath}`} target="_blank" className="p-2.5 bg-white dark:bg-slate-900 text-brand-600 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-brand-50 transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {selectedSubmission?.textContent && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedSubmission.textContent}</p>
                    </div>
                  )}
                  {selectedSubmission?.codeContent && (
                    <pre className="p-6 bg-slate-900 text-green-400 rounded-3xl border border-slate-700 overflow-x-auto text-sm font-mono">{selectedSubmission.codeContent}</pre>
                  )}
                </div>
              </div>
              <div>
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 sticky top-28">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Grading & Feedback</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Grade (out of {selectedAssignment?.maxMarks})</label>
                      <input type="number" value={grade} onChange={e => setGrade(e.target.value)} max={selectedAssignment?.maxMarks} min={0}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Feedback</label>
                      <textarea rows={6} value={feedback} onChange={e => setFeedback(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-900 dark:text-white font-medium resize-none"
                        placeholder="Write constructive feedback..." />
                    </div>
                    <button onClick={submitGrade} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Submit Grade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Assignment Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create Assignment</h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium" placeholder="Assignment title" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course</label>
                    <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium appearance-none">
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={getEntityId(c)} value={getEntityId(c)}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium appearance-none">
                      <option value="file_upload">File Upload</option>
                      <option value="case_study">Case Study</option>
                      <option value="code">Code</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                    <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Max Marks</label>
                    <input type="number" value={form.maxMarks} onChange={e => setForm(p => ({ ...p, maxMarks: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium" min="1" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium resize-none" rows={3} />
                </div>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
                <button onClick={() => setIsCreateOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={createAssignment} className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">Create Assignment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
