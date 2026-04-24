import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, Video, BookOpen, Users, Star,
  ArrowLeft, GripVertical, FileText, Upload, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { showConfirm } from '../../utils/dialog';

interface Module {
  id?: string;
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  notesUrl?: string;
  duration?: string;
  order: number;
}

interface Course {
  _id: string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  description?: string;
  durationHours?: number;
  modules: Module[];
  isActive: boolean;
}

export default function ManageCourses() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'manager'>('list');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Course Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', instructor: '', category: '', level: 'Beginner', description: '', durationHours: 8 });

  // Lesson Modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', duration: '', order: '' });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

  const getModuleId = (m: Module) => String(m._id || m.id || '');

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/courses/manage');
      setCourses(data.courses || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(); }, []);

  const loadModules = async (courseId: string) => {
    try {
      const data = await apiFetch(`/courses/${courseId}/modules`);
      const normalized = (data.modules || []).map((m: any) => ({
        ...m,
        _id: String(m._id || m.id || ''),
        id: String(m.id || m._id || ''),
      }));
      setModules(normalized);
    } catch (err) { console.error(err); }
  };

  const handleManageVideos = (course: Course) => {
    setSelectedCourse(course);
    setView('manager');
    loadModules(course._id);
  };

  // Course CRUD
  const openAddCourse = () => {
    setEditingCourseId(null);
    setCourseForm({ title: '', instructor: user?.name || '', category: '', level: 'Beginner', description: '', durationHours: 8 });
    setIsAddModalOpen(true);
  };

  const openEditCourse = (c: Course) => {
    setEditingCourseId(c._id);
    setCourseForm({ title: c.title, instructor: c.instructor, category: c.category, level: c.level, description: c.description || '', durationHours: c.durationHours || 8 });
    setIsAddModalOpen(true);
  };

  const saveCourse = async () => {
    try {
      if (editingCourseId) {
        await apiFetch(`/courses/${editingCourseId}`, { method: 'PUT', body: JSON.stringify(courseForm) });
      } else {
        await apiFetch('/courses', { method: 'POST', body: JSON.stringify(courseForm) });
      }
      setIsAddModalOpen(false);
      await loadCourses();
      toast.success(editingCourseId ? 'Course updated successfully' : 'Course created successfully');
    } catch (err: any) { toast.error(err.message || 'Failed to save course'); }
  };

  const deleteCourse = async (id: string) => {
    const shouldDelete = await showConfirm({
      title: 'Delete course?',
      text: 'Delete this course and all its lessons?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!shouldDelete) return;
    try {
      await apiFetch(`/courses/${id}`, { method: 'DELETE' });
      await loadCourses();
      toast.success('Course deleted securely');
    } catch (err: any) { toast.error(err.message || 'Failed to delete course'); }
  };

  // Lesson CRUD
  const openAddLesson = () => {
    setEditingModuleId(null);
    setLessonForm({ title: '', description: '', duration: '', order: '' });
    setVideoFile(null);
    setNotesFile(null);
    setUploadProgress(0);
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (m: Module) => {
    setEditingModuleId(getModuleId(m));
    setLessonForm({ title: m.title, description: m.description || '', duration: m.duration || '', order: String(m.order + 1) });
    setVideoFile(null);
    setNotesFile(null);
    setUploadProgress(0);
    setIsLessonModalOpen(true);
  };

  const saveLesson = async () => {
    if (!selectedCourse) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('title', lessonForm.title);
    formData.append('description', lessonForm.description);
    formData.append('duration', lessonForm.duration);
    if (lessonForm.order) formData.append('order', String(Number(lessonForm.order) - 1));
    if (videoFile) formData.append('video', videoFile);
    if (notesFile) formData.append('notes', notesFile);

    const url = editingModuleId
      ? `${API_BASE}/courses/${selectedCourse._id}/modules/${editingModuleId}`
      : `${API_BASE}/courses/${selectedCourse._id}/modules`;
    const method = editingModuleId ? 'PUT' : 'POST';
    const token = localStorage.getItem('token');

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 10 * 60 * 1000;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setIsLessonModalOpen(false);
          loadModules(selectedCourse._id);
          toast.success(editingModuleId ? 'Lesson updated' : 'Lesson uploaded successfully');
          resolve();
        } else {
          let msg = 'Failed to save lesson';
          try { msg = JSON.parse(xhr.responseText).message || msg; } catch {}
          toast.error(msg);
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => { setIsUploading(false); toast.error('Network error during upload'); reject(new Error('Network error')); };
      xhr.send(formData);
    });
  };

  const deleteLesson = async (moduleId: string) => {
    if (!selectedCourse) return;
    const shouldDelete = await showConfirm({
      title: 'Delete lesson?',
      text: 'Delete this lesson?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!shouldDelete) return;
    try {
      await apiFetch(`/courses/${selectedCourse._id}/modules/${moduleId}`, { method: 'DELETE' });
      await loadModules(selectedCourse._id);
      toast.success('Lesson deleted securely');
    } catch (err: any) { toast.error(err.message || 'Failed to delete lesson'); }
  };

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Course Management</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Create, edit, and manage your curriculum.</p>
              </div>
              <button onClick={openAddCourse} className="px-4 py-2.5 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Course
              </button>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Course Grid */}
            {loading ? (
              <div className="text-center py-20 text-slate-400 font-medium">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-medium">No courses found. Click "Add New Course" to create one.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <div key={course._id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-600/20 to-violet-600/20 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-brand-400/40" />
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white">{course.level}</span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">{course.title}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4" /> {course.instructor}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lessons</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{course.modules?.length || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Videos</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{(course.modules || []).filter(m => m.videoUrl).length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleManageVideos(course)}
                          className="flex-1 py-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl font-bold text-sm hover:bg-brand-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" /> Manage Videos
                        </button>
                        <button onClick={() => openEditCourse(course)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCourse(course._id)} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="manager" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            {/* Manager Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => { setView('list'); loadCourses(); }} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Video Manager</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedCourse?.title} — {modules.length} lesson(s)</p>
                </div>
              </div>
              <button onClick={openAddLesson} className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Lesson
              </button>
            </div>

            {/* Lessons List */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Structure</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Drag and drop to reorder lessons.</p>
              </div>
              <div className="p-4 space-y-4">
                {modules.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-medium">No lessons yet. Click "Add New Lesson" to get started.</div>
                ) : modules.map((lesson, index) => (
                  <div key={getModuleId(lesson)}
                    className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-brand-500/50 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-slate-500 transition-colors">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-600 font-bold border border-slate-200 dark:border-slate-700">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{lesson.title}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          {lesson.duration && <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lesson.duration}</span>}
                          {lesson.videoUrl && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                              <Video className="w-3 h-3" /> Video
                            </span>
                          )}
                          {lesson.notesUrl && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 uppercase tracking-widest bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full">
                              <FileText className="w-3 h-3" /> PDF Notes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditLesson(lesson)} className="p-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteLesson(getModuleId(lesson))} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Course Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingCourseId ? 'Edit Course' : 'Add New Course'}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course Title</label>
                    <input type="text" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white font-medium" placeholder="Enter course title" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Instructor</label>
                    <input type="text" value={courseForm.instructor} onChange={e => setCourseForm(p => ({ ...p, instructor: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <input type="text" value={courseForm.category} onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white font-medium" placeholder="e.g. Web Development" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Level</label>
                    <select value={courseForm.level} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium appearance-none">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duration (hours)</label>
                    <input type="number" value={courseForm.durationHours} onChange={e => setCourseForm(p => ({ ...p, durationHours: Number(e.target.value) }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium" min="1" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium resize-none" rows={3} />
                </div>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cancel</button>
                <button onClick={saveCourse} className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">{editingCourseId ? 'Save Changes' : 'Create Course'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Lesson Modal */}
      <AnimatePresence>
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUploading && setIsLessonModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingModuleId ? 'Edit Lesson' : 'Add New Lesson'}</h3>
                <button onClick={() => !isUploading && setIsLessonModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Lesson Title *</label>
                    <input type="text" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-900 dark:text-white font-medium" placeholder="Introduction to React Hooks" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                    <input type="text" value={lessonForm.duration} onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium" placeholder="e.g. 12:30" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Lesson Number</label>
                    <input type="number" value={lessonForm.order} onChange={e => setLessonForm(p => ({ ...p, order: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium" min="1" placeholder="Auto" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea value={lessonForm.description} onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium resize-none" rows={2} placeholder="What students will learn..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Video Upload (MP4)</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-brand-500 transition-colors cursor-pointer group relative">
                      <input type="file" accept=".mp4,.mkv,.avi,.webm,.mov" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Video className="w-8 h-8 text-slate-300 group-hover:text-brand-500 transition-colors mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500">{videoFile ? videoFile.name : 'Click to select video'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">PDF Notes (Optional)</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-sky-500 transition-colors cursor-pointer group relative">
                      <input type="file" accept=".pdf" onChange={e => setNotesFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <FileText className="w-8 h-8 text-slate-300 group-hover:text-sky-500 transition-colors mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500">{notesFile ? notesFile.name : 'Click to select PDF'}</p>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600">{uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing on server...'}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
                <button onClick={() => !isUploading && setIsLessonModalOpen(false)} disabled={isUploading} className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={saveLesson} disabled={isUploading || !lessonForm.title} className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50">{isUploading ? 'Uploading...' : editingModuleId ? 'Save Changes' : 'Add Lesson'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
