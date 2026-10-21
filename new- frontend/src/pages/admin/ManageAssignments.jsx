import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Calendar, BookOpen, Clock, CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    title: '',
    description: '',
    type: 'file_upload',
    maxScore: 100,
    dueDate: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgRes, courseRes] = await Promise.all([
        apiFetch('/assignments').catch(() => ({ assignments: [] })),
        apiFetch('/courses').catch(() => ({ courses: [] })),
      ]);
      setAssignments(asgRes.assignments || []);
      setCourses(courseRes.courses || []);
      if (courseRes.courses?.length && !form.courseId) {
        setForm(f => ({ ...f, courseId: courseRes.courses[0]._id || courseRes.courses[0].id }));
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await showSuccess('Created', 'Assignment published for enrolled students.');
      setShowModal(false);
      setForm({
        courseId: courses[0]?._id || '',
        title: '',
        description: '',
        type: 'file_upload',
        maxScore: 100,
        dueDate: '',
      });
      loadData();
    } catch (err) {
      showError('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await showConfirm({
      title: 'Delete Assignment?',
      text: `Are you sure you want to delete "${title}"?`,
      confirmText: 'Delete',
    });
    if (!ok) return;

    try {
      await apiFetch(`/assignments/${id}`, { method: 'DELETE' });
      await showSuccess('Deleted', 'Assignment removed.');
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Coursework & Deliverables</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Assignments Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Create student assignments, define submission criteria, deadlines, and maximum score metrics.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Plus size={14} /> Create Assignment
        </button>
      </div>

      {/* Grid of assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-outline font-mono text-xs">Loading course assignments...</div>
        ) : assignments.length ? (
          assignments.map((asg) => {
            const aId = asg._id || asg.id;
            const course = courses.find(c => String(c._id || c.id) === String(asg.courseId));
            return (
              <div
                key={aId}
                className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-outline font-mono">
                    <span className="truncate max-w-[180px]">{course?.title || 'General Course'}</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded uppercase text-[10px]">
                      {asg.type?.replace('_', ' ') || 'File Upload'}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-primary mt-3">{asg.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-3 mt-2 leading-relaxed">
                    {asg.description || 'Complete the assignment according to provided specifications.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-mono text-outline">
                    <span>Max Score: <strong>{asg.maxScore || 100} pts</strong></span>
                    <span>Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'No deadline'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-[11px] font-mono text-primary font-medium">Active Task</span>
                  <button
                    onClick={() => handleDelete(aId, asg.title)}
                    className="p-1.5 text-outline hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Assignment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-16 text-center space-y-3 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
            <FileText size={32} className="text-outline mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary">No Assignments Created</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              Start by creating course assignments with deadlines and submission formats for your students.
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h2 className="text-lg font-serif font-bold text-primary">Create Course Assignment</h2>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-outline mb-1">Target Course</label>
                <select
                  required
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                >
                  {courses.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Build an E-Commerce Cart with React State"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Submission Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-xs font-mono"
                  >
                    <option value="file_upload">File Upload (PDF/Zip)</option>
                    <option value="case_study">Case Study / Essay</option>
                    <option value="code">Source Code Submission</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Maximum Score</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={form.maxScore}
                    onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Detailed Instructions</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Outline the steps, acceptance criteria, and deliverable format..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium shadow-sm"
                >
                  {submitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
