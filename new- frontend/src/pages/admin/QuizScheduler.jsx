import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, Clock, CheckCircle, Award, BookOpen, AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function QuizScheduler() {
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    title: '',
    durationMinutes: 30,
    passingScore: 40,
    questions: [
      {
        question: 'Which HTTP method is idempotent and primarily used to retrieve data from a REST endpoint?',
        options: ['GET', 'POST', 'PATCH', 'CONNECT'],
        correctAnswer: 0,
      },
      {
        question: 'What is the primary role of React hooks such as useEffect?',
        options: ['To compile JSX into bytecode', 'To synchronize a component with external systems', 'To replace SQL databases', 'To enforce inline CSS'],
        correctAnswer: 1,
      },
    ],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [testRes, courseRes] = await Promise.all([
        apiFetch('/tests').catch(() => ({ tests: [] })),
        apiFetch('/courses').catch(() => ({ courses: [] })),
      ]);
      setTests(testRes.tests || []);
      setCourses(courseRes.courses || []);
      if (courseRes.courses?.length && !form.courseId) {
        setForm(f => ({ ...f, courseId: courseRes.courses[0]._id || courseRes.courses[0].id }));
      }
    } catch (err) {
      console.error('Failed to load tests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddQuestion = () => {
    setForm(f => ({
      ...f,
      questions: [
        ...f.questions,
        { question: '', options: ['', '', '', ''], correctAnswer: 0 },
      ],
    }));
  };

  const handleUpdateQuestion = (qIndex, field, value) => {
    const updated = [...form.questions];
    updated[qIndex][field] = value;
    setForm({ ...form, questions: updated });
  };

  const handleUpdateOption = (qIndex, oIndex, value) => {
    const updated = [...form.questions];
    updated[qIndex].options[oIndex] = value;
    setForm({ ...form, questions: updated });
  };

  const handleRemoveQuestion = (qIndex) => {
    if (form.questions.length <= 1) return;
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qIndex) }));
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/tests', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await showSuccess('Quiz Published', 'Assessment quiz is live for eligible students.');
      setShowModal(false);
      loadData();
    } catch (err) {
      showError('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = async (id, title) => {
    const ok = await showConfirm({
      title: 'Delete Quiz?',
      text: `Are you sure you want to delete "${title}"?`,
      confirmText: 'Delete',
    });
    if (!ok) return;

    try {
      await apiFetch(`/tests/${id}`, { method: 'DELETE' });
      await showSuccess('Deleted', 'Quiz removed.');
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
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Examination & Testing System</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Quiz Scheduler</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Author multiple choice assessments, anti-cheat timed tests, and passing thresholds for automatic degree certification.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Plus size={14} /> Schedule New Quiz
        </button>
      </div>

      {/* Grid of Quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-outline font-mono text-xs">Loading quiz schedule...</div>
        ) : tests.length ? (
          tests.map((test) => {
            const tId = test._id || test.id;
            const course = courses.find(c => String(c._id || c.id) === String(test.courseId));
            const questionCount = Array.isArray(test.questions) ? test.questions.length : 5;
            return (
              <div
                key={tId}
                className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-outline font-mono">
                    <span className="truncate max-w-[180px]">{course?.title || 'Course Assessment'}</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded uppercase text-[10px]">
                      {test.durationMinutes || 30} mins
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-primary mt-3">{test.title}</h3>
                  
                  <div className="mt-4 pt-4 border-t border-outline-variant grid grid-cols-2 gap-3 text-xs font-mono text-outline">
                    <div>
                      <span className="block text-[10px] uppercase">Questions</span>
                      <strong className="text-sm text-primary">{questionCount} Qs</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">Passing Mark</span>
                      <strong className="text-sm text-emerald-700">{test.passingScore || 40}%</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-700 font-medium">● Published</span>
                  <button
                    onClick={() => handleDeleteTest(tId, test.title)}
                    className="p-1.5 text-outline hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Quiz"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-16 text-center space-y-3 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
            <Calendar size={32} className="text-outline mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary">No Scheduled Assessments</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              Schedule tests to validate student understanding and automate certificate generation.
            </p>
          </div>
        )}
      </div>

      {/* Schedule Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <span className="font-mono text-xs uppercase text-secondary font-semibold">Test Creation</span>
                <h2 className="text-lg font-serif font-bold text-primary mt-0.5">Author Assessment Quiz</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block font-mono uppercase text-outline mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Final Certification Assessment"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Passing Percentage (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={form.passingScore}
                    onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4 pt-3 border-t border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-semibold text-primary">
                    Questions & Answer Keys ({form.questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    + Add Question
                  </button>
                </div>

                {form.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 bg-surface rounded-xl border border-outline-variant space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-outline font-bold">Question #{qIndex + 1}</span>
                      {form.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-rose-600 hover:underline text-[11px] font-mono"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Enter question text here..."
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                      className="w-full p-2 bg-surface-container rounded text-sm text-on-surface border border-outline-variant"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswer === oIndex}
                            onChange={() => handleUpdateQuestion(qIndex, 'correctAnswer', oIndex)}
                            className="cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                            className="w-full p-1.5 bg-surface-container rounded text-xs text-on-surface border border-outline-variant"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Explanation & learning notes (shown to students during post-exam review)..."
                        value={q.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                        className="w-full p-2 bg-surface-container/60 rounded text-xs text-on-surface-variant border border-outline-variant italic"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium shadow-sm cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
