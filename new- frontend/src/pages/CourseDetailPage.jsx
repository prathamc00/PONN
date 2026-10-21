import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen, PlayCircle, FileText, CheckCircle2, Lock, ArrowLeft, Clock, ShieldCheck, Download, ChevronRight,
  MessageSquare, Bookmark, Trash2, Paperclip, Code, Sparkles, Send
} from 'lucide-react';
import { apiFetch, resolveUrl } from '../utils/api.js';
import { showSuccess, showError } from '../utils/dialog.js';

export default function CourseDetailPage() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({ completedModules: [] });
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // New interactive lecture states
  const [videoProgress, setVideoProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'qa'
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`crismatech_notes_${id}`) || '[]');
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      author: 'Aarav Sharma',
      date: 'Yesterday',
      question: 'Is it recommended to normalize image pixel matrices between 0 and 1 or standardize using mean/std for this module assignment?',
      answer: 'Standardizing using the channel mean and standard deviation produces faster gradient convergence and stable training.',
      instructorReply: true
    }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, mRes, pRes] = await Promise.all([
        apiFetch(`/courses/${id}`).catch(() => null),
        apiFetch(`/courses/${id}/modules`).catch(() => ({ modules: [] })),
        apiFetch(`/courses/${id}/progress`).catch(() => ({ completedModules: [] })),
      ]);

      const courseObj = cRes?.course || cRes;
      setCourse(courseObj);
      const mods = mRes.modules || [];
      setModules(mods);
      setProgress(pRes || { completedModules: [] });

      if (mods.length > 0) {
        setActiveModule(mods[0]);
      }
      setEnrolled(Boolean(courseObj?.isEnrolled));
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiFetch(`/courses/${id}/enroll`, { method: 'POST' });
      await showSuccess('Enrolled', 'You have been enrolled in this course.');
      loadData();
    } catch (err) {
      showError('Enrollment Failed', err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarkComplete = async (modId) => {
    try {
      await apiFetch(`/courses/${id}/modules/${modId}/complete`, { method: 'POST' });
      await showSuccess('Lesson Completed', 'Progress recorded. Next lesson unlocked!');
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleTimeUpdate = (e) => {
    const vid = e.target;
    if (!vid.duration) return;
    const pct = Math.round((vid.currentTime / vid.duration) * 100);
    setVideoProgress(pct);

    // Smart auto-complete at 85% watched
    if (pct >= 85 && activeModule) {
      const mId = String(activeModule._id || activeModule.id);
      if (!completedList.includes(mId)) {
        handleMarkComplete(mId);
      }
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const currentTime = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
    const mins = Math.floor(currentTime / 60);
    const secs = currentTime % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const newNote = {
      id: Date.now(),
      moduleId: String(activeModule?._id || activeModule?.id),
      moduleTitle: activeModule?.title || 'Lesson',
      timestampSeconds: currentTime,
      timestamp: formatted,
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`crismatech_notes_${id}`, JSON.stringify(updated));
    setNewNoteText('');
    showSuccess('Note Saved', `Pinned note at timestamp ${formatted}`);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    localStorage.setItem(`crismatech_notes_${id}`, JSON.stringify(updated));
  };

  const handleSeekTo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const handlePostQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const newQ = {
      id: Date.now(),
      author: 'You (Student)',
      date: 'Just now',
      question: newQuestionText.trim(),
      answer: null,
      instructorReply: false,
    };
    setQuestions([newQ, ...questions]);
    setNewQuestionText('');
    showSuccess('Question Submitted', 'Your doubt has been posted to the instructor queue.');
  };

  if (loading) return <div className="p-12 text-center text-outline font-mono text-xs">Loading course syllabus...</div>;
  if (!course) return (
    <div className="p-12 text-center">
      <p className="text-rose-600 font-medium">Course not found.</p>
      <Link to="/courses" className="mt-4 inline-block text-primary underline text-sm">← Back to Course Catalogue</Link>
    </div>
  );

  const completedList = (progress.completedModules || []).map(String);
  const totalModules = modules.length;
  const completedCount = completedList.length;
  const percentComplete = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;
  const currentModuleNotes = notes.filter((n) => !n.moduleId || n.moduleId === String(activeModule?._id || activeModule?.id));

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <Link to="/courses" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-outline hover:text-primary transition-colors">
        <ArrowLeft size={14} /> Back to Course Catalogue
      </Link>

      {/* Hero Banner */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-outline uppercase">
              <span>{course.category || 'Technology'}</span>
              <span>•</span>
              <span>{course.level || 'Beginner'}</span>
              <span>•</span>
              <span>{course.durationHours || 12} Total Hours</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-primary mt-2 font-bold">{course.title}</h1>
            <p className="text-on-surface-variant text-sm mt-3 leading-relaxed">
              {course.description || 'Structured academic program with practical projects, continuous assessment, and verified certification.'}
            </p>
            <div className="mt-4 pt-4 border-t border-outline-variant flex items-center gap-6 text-xs text-outline font-mono">
              <span>Instructor: <strong>{course.instructor || 'CRISMATECH Faculty'}</strong></span>
              <span>Curriculum: <strong>{totalModules} Modules</strong></span>
            </div>
          </div>

          {/* Progress / Enrollment Action Card */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5 w-full lg:w-72 shadow-sm flex flex-col justify-between">
            {!enrolled ? (
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-xs uppercase text-slate-400 block font-semibold">Course Enrollment</span>
                  <span className="text-sm font-bold text-[#07241a] mt-1 block">Ready to Start Learning</span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Enroll now to unlock video lectures, download laboratory assets, and earn your verified certificate.
                  </p>
                </div>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-2.5 bg-[#07241a] hover:bg-[#1e3a2f] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <BookOpen size={14} />
                  <span>{enrolling ? 'Enrolling...' : 'Enroll in this Course'}</span>
                </button>
              </div>
            ) : (
              <div>
                <span className="font-mono text-xs uppercase text-outline block">Course Progression</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-serif font-bold text-primary">{percentComplete}%</span>
                  <span className="text-xs text-outline font-mono">Completed</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-primary h-full transition-all duration-500" style={{ width: `${percentComplete}%` }} />
                </div>
                <span className="text-[11px] font-mono text-outline mt-2 block">
                  {completedCount} of {totalModules} lessons finished
                </span>

                {percentComplete === 100 ? (
                  <Link
                    to="/test"
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium text-center block shadow-sm"
                  >
                    Take Final Exam →
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace: Active Video Lesson Player & Sidebar Syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Active Lesson Video & Details (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeModule ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              {/* Video Player Box */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {activeModule.videoUrl ? (
                  activeModule.videoUrl.includes('youtube.com') || activeModule.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={activeModule.videoUrl.replace('watch?v=', 'embed/')}
                      title={activeModule.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      controls
                      onTimeUpdate={handleTimeUpdate}
                      src={resolveUrl(activeModule.videoUrl)}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-8 text-neutral-400">
                    <PlayCircle size={48} className="mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-mono">Stream Ready • Video Lecture Player</p>
                  </div>
                )}
              </div>

              {/* Smart Video Watch Progress Bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={13} className="text-[#07241a]" />
                  <span>Playback Completion: <strong>{videoProgress}%</strong></span>
                  <span className="text-slate-400">• (85% required for auto-verification)</span>
                </div>
                {completedList.includes(String(activeModule._id || activeModule.id)) ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Completed
                  </span>
                ) : videoProgress >= 85 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Threshold Reached
                  </span>
                ) : (
                  <span className="text-slate-400">In Progress</span>
                )}
              </div>

              {/* Lesson Info Header */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs uppercase text-secondary font-semibold">Active Module</span>
                    <h2 className="text-2xl font-serif font-bold text-primary mt-1">{activeModule.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {completedList.includes(String(activeModule._id || activeModule.id)) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded font-mono text-xs font-bold uppercase">
                        <CheckCircle2 size={14} /> Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkComplete(activeModule._id || activeModule.id)}
                        className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 size={14} /> Mark Lesson Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Lecture Tabs Navigation */}
                <div className="border-b border-outline-variant flex items-center gap-6 pt-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'border-[#07241a] text-[#07241a]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Overview & Assets
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'notes'
                        ? 'border-[#07241a] text-[#07241a]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Bookmark size={13} />
                    <span>My Notes ({currentModuleNotes.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('qa')}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'qa'
                        ? 'border-[#07241a] text-[#07241a]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Q&A Doubts ({questions.length})</span>
                  </button>
                </div>

                {/* Tab 1: Overview & Downloadable Resources */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 pt-2">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {activeModule.description || 'Watch the video lecture and review supplementary notes before proceeding to the next lesson.'}
                    </p>

                    {/* Downloadable Assets Strip */}
                    <div className="pt-4 border-t border-outline-variant space-y-3">
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                        Downloadable Learning Assets
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(activeModule.notesUrl || activeModule.pdfUrl) ? (
                          <a
                            href={resolveUrl(activeModule.notesUrl || activeModule.pdfUrl)}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition-all group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                                <FileText size={16} />
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">Lecture Slides & Notes</span>
                                <span className="text-[10px] text-slate-400 block font-mono">PDF Document</span>
                              </div>
                            </div>
                            <Download size={14} className="text-slate-400 group-hover:text-[#07241a]" />
                          </a>
                        ) : null}

                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#07241a]/10 text-[#07241a] flex items-center justify-center">
                              <Code size={16} />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">Sample Code & Data Matrix</span>
                              <span className="text-[10px] text-slate-400 block font-mono">Laboratory Exercises</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold">Included</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Timestamped Notes */}
                {activeTab === 'notes' && (
                  <div className="space-y-6 pt-2">
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                        <Bookmark size={13} className="text-[#9d4225]" />
                        <span>Take a personal note tagged to current playback</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type personal study note or formula..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#07241a] transition-all"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#07241a] hover:bg-[#1e3a2f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Bookmark size={13} /> Save Note
                        </button>
                      </div>
                    </form>

                    {/* Notes List */}
                    <div className="space-y-2 pt-2">
                      {currentModuleNotes.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-mono">
                          No notes recorded for this lesson yet. Type above to pin key formulas or thoughts.
                        </div>
                      ) : (
                        currentModuleNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleSeekTo(note.timestampSeconds)}
                                className="px-2 py-0.5 bg-[#07241a]/10 hover:bg-[#07241a]/20 text-[#07241a] font-mono text-[11px] font-bold rounded cursor-pointer transition-colors"
                                title="Click to jump video to this moment"
                              >
                                {note.timestamp}
                              </button>
                              <div>
                                <p className="text-xs text-slate-800 leading-relaxed">{note.text}</p>
                                <span className="text-[10px] text-slate-400 font-mono mt-1 block">Saved on {note.createdAt}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Q&A Doubts Discussion */}
                {activeTab === 'qa' && (
                  <div className="space-y-6 pt-2">
                    <form onSubmit={handlePostQuestion} className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Have a doubt about this lecture? Ask the instructor..."
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#07241a] transition-all"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#07241a] hover:bg-[#1e3a2f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Send size={13} /> Post Doubt
                        </button>
                      </div>
                    </form>

                    <div className="space-y-3 pt-2">
                      {questions.map((q) => (
                        <div key={q.id} className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-700">{q.author}</span>
                            <span className="font-mono">{q.date}</span>
                          </div>
                          <p className="text-xs text-slate-900 font-medium">{q.question}</p>
                          {q.answer ? (
                            <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                              <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-700" /> Instructor Verified Answer
                              </span>
                              <p className="text-emerald-950/90 leading-relaxed">{q.answer}</p>
                            </div>
                          ) : (
                            <div className="text-[11px] font-mono text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60">
                              Awaiting faculty review...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-outline bg-surface-container-low border border-outline-variant rounded-2xl font-mono text-xs">
              No lesson selected.
            </div>
          )}
        </div>

        {/* Right: Sequential Syllabus Navigator (4 Cols) */}
        <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-outline-variant">
            <h3 className="font-serif font-bold text-primary text-base">Curriculum Modules</h3>
            <span className="font-mono text-xs text-outline block mt-0.5">{totalModules} Sequential Lessons</span>
          </div>

          <div className="space-y-2">
            {modules.map((m, index) => {
              const mId = String(m._id || m.id);
              const isCompleted = completedList.includes(mId);
              const isActive = activeModule && String(activeModule._id || activeModule.id) === mId;
              // Lesson is unlocked if it's the first lesson, or if previous lesson is completed
              const prevModuleId = index > 0 ? String(modules[index - 1]._id || modules[index - 1].id) : null;
              const isUnlocked = index === 0 || completedList.includes(prevModuleId);

              return (
                <button
                  key={mId}
                  disabled={!isUnlocked}
                  onClick={() => setActiveModule(m)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : isUnlocked
                      ? 'bg-surface hover:bg-surface-container border-outline-variant text-on-surface'
                      : 'bg-surface/40 border-outline-variant/40 text-outline opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {isCompleted ? (
                      <CheckCircle2 size={16} className={isActive ? 'text-on-primary' : 'text-emerald-600'} />
                    ) : isUnlocked ? (
                      <PlayCircle size={16} className={isActive ? 'text-on-primary' : 'text-primary'} />
                    ) : (
                      <Lock size={16} className="text-outline" />
                    )}
                    <div className="truncate">
                      <span className={`block text-xs font-medium truncate ${isActive ? 'text-on-primary' : 'text-on-surface'}`}>
                        {index + 1}. {m.title}
                      </span>
                      <span className={`text-[10px] font-mono block ${isActive ? 'text-on-primary/80' : 'text-outline'}`}>
                        {m.duration || '20 min'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={14} className={isActive ? 'text-on-primary' : 'text-outline'} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
