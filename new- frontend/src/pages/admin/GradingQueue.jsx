import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, Clock, ExternalLink, MessageSquare, Award, ArrowRight, User
} from 'lucide-react';
import { apiFetch, resolveUrl } from '../../utils/api.js';
import { showSuccess, showError } from '../../utils/dialog.js';

export default function GradingQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/submissions/grading-queue');
      setQueue(data.queue || []);
    } catch (err) {
      console.error('Failed to load grading queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleOpenGrade = (sub) => {
    setSelectedSub(sub);
    setScore(sub.score !== undefined && sub.score !== null ? String(sub.score) : '');
    setFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmitting(true);
    const subId = selectedSub._id || selectedSub.id;
    try {
      await apiFetch(`/submissions/${subId}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          score: Number(score),
          feedback,
        }),
      });
      await showSuccess('Graded', 'Submission scored and student notified.');
      setSelectedSub(null);
      loadQueue();
    } catch (err) {
      showError('Grading Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Faculty Assessment Desk</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Grading Queue</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Review student file uploads, case study essays, and source code submissions. Assign marks and release evaluations.
          </p>
        </div>
        <div className="px-4 py-2 bg-secondary-fixed/50 border border-secondary-container/40 rounded-xl flex items-center gap-2">
          <Clock size={16} className="text-secondary" />
          <span className="font-mono text-xs font-semibold text-secondary">
            {queue.length} Submissions Pending
          </span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-outline font-mono text-xs">Loading pending submissions...</div>
        ) : queue.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant font-mono uppercase text-outline text-[11px]">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Course & Assignment</th>
                  <th className="p-4">Submission Type</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {queue.map((item) => {
                  const sId = item._id || item.id;
                  return (
                    <tr key={sId} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-primary text-sm flex items-center gap-1.5">
                          <User size={13} className="text-outline" /> {item.studentName || item.student?.name || 'Student'}
                        </div>
                        <span className="font-mono text-outline text-[11px] block mt-0.5">
                          {item.studentEmail || item.student?.email || 'student@crismatech.com'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-on-surface block text-sm">
                          {item.assignmentTitle || item.assignment?.title || 'Assignment Task'}
                        </span>
                        <span className="text-outline text-[11px] font-mono">
                          Max: {item.assignmentMaxScore || item.assignment?.maxScore || 100} pts
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-surface-container font-mono text-[10px] rounded uppercase font-semibold text-on-surface">
                          {item.submissionType || 'File Upload'}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-outline text-[11px]">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Recent'}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenGrade(item)}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium transition-colors cursor-pointer shadow-sm"
                        >
                          Grade Work →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <CheckCircle size={36} className="text-emerald-600 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-primary">All Caught Up!</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              There are currently no ungraded student submissions in the assessment queue.
            </p>
          </div>
        )}
      </div>

      {/* Grade Submission Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <span className="font-mono text-xs uppercase text-secondary font-semibold">Evaluation Desk</span>
                <h2 className="text-lg font-serif font-bold text-primary mt-0.5">
                  {selectedSub.assignmentTitle || selectedSub.assignment?.title || 'Grade Submission'}
                </h2>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-outline hover:text-on-surface">✕</button>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-outline-variant text-xs space-y-1">
              <p>Student: <strong>{selectedSub.studentName || selectedSub.student?.name || 'Student'}</strong></p>
              <p className="font-mono text-outline">Type: {selectedSub.submissionType || 'file_upload'}</p>
            </div>

            {/* Submitted Content Display */}
            <div className="space-y-2">
              <span className="block font-mono text-xs uppercase text-outline">Submitted Artifact</span>
              {selectedSub.filePath ? (
                <a
                  href={resolveUrl(selectedSub.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-surface hover:bg-surface-container border border-outline-variant rounded-xl flex items-center justify-between text-xs text-primary font-medium transition-colors"
                >
                  <span className="truncate max-w-[280px]">Download / View Submitted File ↗</span>
                  <ExternalLink size={14} />
                </a>
              ) : selectedSub.content ? (
                <div className="p-3 bg-surface border border-outline-variant rounded-xl max-h-40 overflow-y-auto text-xs font-mono text-on-surface whitespace-pre-wrap">
                  {selectedSub.content}
                </div>
              ) : (
                <div className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-outline italic">
                  No preview available.
                </div>
              )}
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-outline mb-1">
                  Score (out of {selectedSub.assignmentMaxScore || selectedSub.assignment?.maxScore || 100})
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={selectedSub.assignmentMaxScore || selectedSub.assignment?.maxScore || 100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 92"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-base font-serif font-bold"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Feedback & Constructive Critique</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Strong structural logic, consider optimizing computational complexity..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium cursor-pointer shadow-sm"
                >
                  {submitting ? 'Releasing Grade...' : 'Sign & Release Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
