import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, Video, BookOpen, Users, ArrowLeft, FileText, Upload, Check, PlayCircle,
  X, Loader2, Link2, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { apiFetch, resolveUrl } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    category: 'Full Stack Development',
    level: 'Beginner',
    description: '',
    durationHours: 12,
  });

  // Lesson Modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [uploadingLesson, setUploadingLesson] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState('upload'); // 'upload' | 'url'
  const [videoFile, setVideoFile] = useState(null);
  const [notesSourceType, setNotesSourceType] = useState('upload'); // 'upload' | 'url'
  const [notesFile, setNotesFile] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    duration: '25 min',
    videoUrl: '',
    notesUrl: '',
    order: 1,
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/courses');
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openCourseManager = async (course) => {
    setSelectedCourse(course);
    setLoadingModules(true);
    try {
      const data = await apiFetch(`/courses/${course._id || course.id}/modules`);
      setModules(data.modules || []);
    } catch (err) {
      showError('Error', 'Failed to load course modules');
    } finally {
      setLoadingModules(false);
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const formData = new FormData();
      formData.append('title', courseForm.title);
      formData.append('instructor', courseForm.instructor);
      formData.append('category', courseForm.category);
      formData.append('level', courseForm.level);
      formData.append('description', courseForm.description || '');
      formData.append('durationHours', courseForm.durationHours || 12);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      if (editingCourseId) {
        await apiFetch(`/courses/${editingCourseId}`, {
          method: 'PUT',
          body: formData,
        });
        await showSuccess('Updated', 'Course updated successfully.');
      } else {
        await apiFetch('/courses', {
          method: 'POST',
          body: formData,
        });
        await showSuccess('Created', 'New course created.');
      }
      setShowCourseModal(false);
      setEditingCourseId(null);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setCourseForm({ title: '', instructor: '', category: 'Full Stack Development', level: 'Beginner', description: '', durationHours: 12 });
      loadCourses();
    } catch (err) {
      showError('Save Failed', err.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id, title) => {
    const ok = await showConfirm({
      title: 'Delete Course?',
      text: `Are you sure you want to delete "${title}"? All enrolled students will lose access.`,
      confirmText: 'Delete Course',
    });
    if (!ok) return;

    try {
      await apiFetch(`/courses/${id}`, { method: 'DELETE' });
      await showSuccess('Deleted', 'Course removed.');
      if (selectedCourse && (selectedCourse._id === id || selectedCourse.id === id)) {
        setSelectedCourse(null);
      }
      loadCourses();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    const courseId = selectedCourse._id || selectedCourse.id;
    setUploadingLesson(true);
    try {
      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('description', lessonForm.description || '');
      formData.append('duration', lessonForm.duration || '20 min');
      formData.append('order', modules.length + 1);

      if (videoSourceType === 'upload') {
        if (videoFile) {
          formData.append('video', videoFile);
        }
      } else if (lessonForm.videoUrl) {
        formData.append('videoUrl', lessonForm.videoUrl);
      }

      if (notesSourceType === 'upload') {
        if (notesFile) {
          formData.append('pdf', notesFile);
          formData.append('notes', notesFile);
        }
      } else if (lessonForm.notesUrl) {
        formData.append('notesUrl', lessonForm.notesUrl);
        formData.append('pdfUrl', lessonForm.notesUrl);
      }

      await apiFetch(`/courses/${courseId}/modules`, {
        method: 'POST',
        body: formData,
      });

      await showSuccess('Lesson Added', 'Curriculum module with local assets uploaded.');
      setShowLessonModal(false);
      setVideoFile(null);
      setNotesFile(null);
      setLessonForm({ title: '', description: '', duration: '25 min', videoUrl: '', notesUrl: '', order: 1 });
      openCourseManager(selectedCourse);
    } catch (err) {
      showError('Upload Failed', err.message);
    } finally {
      setUploadingLesson(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    const courseId = selectedCourse._id || selectedCourse.id;
    const ok = await showConfirm({
      title: 'Delete Lesson?',
      text: 'Remove this lesson from the curriculum?',
      confirmText: 'Delete',
    });
    if (!ok) return;

    try {
      await apiFetch(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
      await showSuccess('Deleted', 'Lesson removed.');
      openCourseManager(selectedCourse);
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const filteredCourses = courses.filter(c =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.instructor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Academic Curricula Management</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Course Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Author learning modules, publish video lessons, and structure sequential course progressions.</p>
        </div>
        <button
          onClick={() => {
            setEditingCourseId(null);
            setCourseForm({ title: '', instructor: '', category: 'Full Stack Development', level: 'Beginner', description: '', durationHours: 12 });
            setShowCourseModal(true);
          }}
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Plus size={14} /> Create Course
        </button>
      </div>

      {selectedCourse ? (
        /* Lesson / Syllabus Editor for Selected Course */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCourse(null)}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-outline hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to All Courses
          </button>

          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant">
              <div>
                <span className="font-mono text-xs uppercase text-secondary font-semibold">Syllabus Editor</span>
                <h2 className="text-2xl font-serif font-bold text-primary mt-1">{selectedCourse.title}</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Instructor: <strong>{selectedCourse.instructor || 'CRISMATECH Faculty'}</strong> • Category: {selectedCourse.category}
                </p>
              </div>
              <button
                onClick={() => setShowLessonModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Add Lesson Module
              </button>
            </div>

            {/* Modules List */}
            <div className="mt-6 space-y-3">
              {loadingModules ? (
                <div className="p-12 text-center text-outline font-mono text-xs">Loading curriculum syllabus...</div>
              ) : modules.length ? (
                modules.map((m, index) => {
                  const mId = m._id || m.id;
                  return (
                    <div
                      key={mId || index}
                      className="p-4 bg-surface border border-outline-variant rounded-xl flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-surface-container text-primary font-mono text-xs font-bold flex items-center justify-center">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h3 className="font-medium text-sm text-on-surface">{m.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                            <span className="text-outline">{m.duration || '20 min'}</span>
                            {m.videoUrl && (
                              <a
                                href={resolveUrl(m.videoUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded"
                                title="Open / Preview Video"
                              >
                                <PlayCircle size={12} /> {m.videoUrl.startsWith('/uploads') ? 'Local Video File' : 'Video Attached'} <ExternalLink size={10} />
                              </a>
                            )}
                            {(m.notesUrl || m.pdfUrl) && (
                              <a
                                href={resolveUrl(m.notesUrl || m.pdfUrl)}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="text-secondary hover:underline flex items-center gap-1 font-medium bg-secondary/10 px-2 py-0.5 rounded"
                                title="Download PDF Notes"
                              >
                                <FileText size={12} /> {(m.notesUrl || m.pdfUrl).startsWith('/uploads') ? 'Local PDF Notes' : 'PDF Notes'} <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteModule(mId)}
                        className="p-1.5 text-outline hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Lesson"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-outline font-mono text-xs border border-dashed border-outline-variant rounded-xl">
                  No modules added to this course yet. Click "Add Lesson Module" to construct the syllabus.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Course Grid List */
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3 top-3 text-outline pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses by title or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
              />
            </div>
            <span className="text-xs font-mono text-outline hidden md:block">
              {filteredCourses.length} Courses available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => {
              const cId = c._id || c.id;
              return (
                <div
                  key={cId}
                  className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-outline font-mono">
                      <span>{c.category || 'Technology'}</span>
                      <span className="px-2 py-0.5 bg-surface-container rounded uppercase text-[10px]">{c.level || 'Beginner'}</span>
                    </div>

                    <h3 className="text-xl font-serif font-bold text-primary mt-3">{c.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
                      {c.description || 'Structured academic program with practical projects and assessments.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-outline-variant text-xs text-outline flex items-center justify-between font-mono">
                      <span>Faculty: <strong>{c.instructor || 'CRISMATECH'}</strong></span>
                      <span>{c.durationHours || 12}h</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between gap-2">
                    <button
                      onClick={() => openCourseManager(c)}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium transition-colors cursor-pointer shadow-sm"
                    >
                      Edit Lessons →
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCourseId(cId);
                          setCourseForm({
                            title: c.title,
                            instructor: c.instructor,
                            category: c.category || 'Full Stack Development',
                            level: c.level || 'Beginner',
                            description: c.description || '',
                            durationHours: c.durationHours || 12,
                          });
                          setShowCourseModal(true);
                        }}
                        className="p-1.5 text-outline hover:text-on-surface transition-colors cursor-pointer"
                        title="Edit Course Info"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(cId, c.title)}
                        className="p-1.5 text-outline hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h2 className="text-lg font-serif font-bold text-primary">
                {editingCourseId ? 'Edit Course Details' : 'Create New Curriculum Course'}
              </h2>
              <button onClick={() => setShowCourseModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-outline mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Full Stack Web Development & Neural Systems"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Instructor *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.instructor}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    placeholder="Prof. Vance"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={courseForm.durationHours}
                    onChange={(e) => setCourseForm({ ...courseForm, durationHours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-xs font-mono"
                  >
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Cloud Architecture">Cloud Architecture</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono uppercase text-outline mb-1">Difficulty Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-xs font-mono"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Course Thumbnail Image Upload */}
              <div>
                <label className="block font-mono uppercase text-outline mb-1">Course Cover Thumbnail (Optional)</label>
                {thumbnailPreview ? (
                  <div className="relative border border-outline-variant rounded-xl overflow-hidden bg-surface p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={thumbnailPreview} alt="Cover preview" className="w-16 h-12 object-cover rounded-lg border border-outline-variant" />
                      <div>
                        <p className="text-xs font-medium text-on-surface truncate max-w-[200px]">{thumbnailFile?.name || 'Selected Image'}</p>
                        <p className="text-[10px] font-mono text-outline">{thumbnailFile ? `${(thumbnailFile.size / 1024).toFixed(1)} KB` : 'Image Attached'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
                      className="p-1.5 text-outline hover:text-rose-600 rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-4 cursor-pointer transition-colors bg-surface/50 group">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <ImageIcon size={22} className="text-outline group-hover:text-primary transition-colors mb-1" />
                    <span className="text-xs font-medium text-on-surface">Click to upload cover image from local device</span>
                    <span className="text-[10px] font-mono text-outline mt-0.5">PNG, JPG, WebP up to 5MB</span>
                  </label>
                )}
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Description</label>
                <textarea
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Summary of course objectives and prerequisites..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  disabled={savingCourse}
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium shadow-sm flex items-center gap-1.5"
                >
                  {savingCourse ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Course...
                    </>
                  ) : (
                    'Save Course'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <span className="font-mono text-[10px] uppercase text-secondary font-semibold">Course Syllabus</span>
                <h2 className="text-lg font-serif font-bold text-primary">Add Curriculum Lesson</h2>
              </div>
              <button
                disabled={uploadingLesson}
                onClick={() => setShowLessonModal(false)}
                className="text-outline hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddModule} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-outline mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Lesson 1: Introduction to Modern System Architecture"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Estimated Duration</label>
                <input
                  type="text"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  placeholder="25 min"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              {/* Video Lecture Upload / URL */}
              <div className="space-y-2 pt-2 border-t border-outline-variant">
                <div className="flex items-center justify-between">
                  <label className="font-mono uppercase text-outline font-semibold">Video Lecture Source</label>
                  <div className="flex items-center gap-1 bg-surface border border-outline-variant p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('upload')}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        videoSourceType === 'upload' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Upload Local Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('url')}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        videoSourceType === 'url' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Web / YouTube URL
                    </button>
                  </div>
                </div>

                {videoSourceType === 'upload' ? (
                  videoFile ? (
                    <div className="p-3 bg-surface border border-primary/40 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Video size={18} />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-xs text-on-surface truncate">{videoFile.name}</p>
                          <p className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                            <Check size={10} /> {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • Ready for local upload
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="p-1.5 text-outline hover:text-rose-600 rounded transition-colors"
                        title="Remove video file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-5 cursor-pointer transition-colors bg-surface/50 group">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setVideoFile(file);
                        }}
                      />
                      <Video size={24} className="text-outline group-hover:text-primary transition-colors mb-1.5" />
                      <span className="text-xs font-medium text-on-surface text-center">Click to choose video from local disk (.mp4, .webm, .mov, .mkv)</span>
                      <span className="text-[10px] font-mono text-outline mt-1">High-definition lectures supported up to 500MB</span>
                    </label>
                  )
                ) : (
                  <div>
                    <input
                      type="url"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... or direct MP4 URL"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-xs font-mono"
                    />
                    <p className="text-[10px] text-outline font-mono mt-1">Accepts YouTube watch/embed links or direct MP4 streams</p>
                  </div>
                )}
              </div>

              {/* PDF Lecture Notes Upload / URL */}
              <div className="space-y-2 pt-2 border-t border-outline-variant">
                <div className="flex items-center justify-between">
                  <label className="font-mono uppercase text-outline font-semibold">Lecture Notes / PDF Material</label>
                  <div className="flex items-center gap-1 bg-surface border border-outline-variant p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setNotesSourceType('upload')}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        notesSourceType === 'upload' ? 'bg-secondary text-white font-bold shadow-xs' : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Upload Local PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesSourceType('url')}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        notesSourceType === 'url' ? 'bg-secondary text-white font-bold shadow-xs' : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Document URL
                    </button>
                  </div>
                </div>

                {notesSourceType === 'upload' ? (
                  notesFile ? (
                    <div className="p-3 bg-surface border border-secondary/40 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-xs text-on-surface truncate">{notesFile.name}</p>
                          <p className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                            <Check size={10} /> {(notesFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for local upload
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotesFile(null)}
                        className="p-1.5 text-outline hover:text-rose-600 rounded transition-colors"
                        title="Remove PDF notes"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-secondary rounded-xl p-4 cursor-pointer transition-colors bg-surface/50 group">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setNotesFile(file);
                        }}
                      />
                      <FileText size={22} className="text-outline group-hover:text-secondary transition-colors mb-1" />
                      <span className="text-xs font-medium text-on-surface text-center">Click to choose PDF lecture notes from local disk</span>
                      <span className="text-[10px] font-mono text-outline mt-0.5">PDF, DOCX up to 50MB</span>
                    </label>
                  )
                ) : (
                  <div>
                    <input
                      type="url"
                      value={lessonForm.notesUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, notesUrl: e.target.value })}
                      placeholder="https://.../notes.pdf"
                      className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Summary / Objective</label>
                <textarea
                  rows={2}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Topics covered in this module..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              {uploadingLesson && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-xs text-primary font-mono">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>Uploading local video & documents to server. Please wait...</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  disabled={uploadingLesson}
                  onClick={() => setShowLessonModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingLesson}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {uploadingLesson ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading & Adding Lesson...
                    </>
                  ) : (
                    'Add Lesson'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
