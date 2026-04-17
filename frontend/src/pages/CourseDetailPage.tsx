import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, PlayCircle, FileText, Download, Sparkles, Clock, User, BarChart, Lock, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { apiFetch } from '../utils/api';
import PremiumVideoPlayer from '../components/PremiumVideoPlayer';

// Resolve a relative upload path to a full URL
const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api', '');
const resolveUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}/${path.replace(/^\//, '')}`;
};

/* ...rest of imports and interface... */
interface ModuleItem {
  id: string;      // PHP backend uses 'id', not '_id'
  _id?: string;    // keep for compat just in case
  title: string;
  description?: string;
  videoUrl?: string;
  notesUrl?: string;
  duration?: string;
  order: number;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [markingComplete, setMarkingComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseData = await apiFetch(`/courses/${id}`);
        const c = courseData.course || courseData;
        setCourse(c);
        setIsEnrolled(!!c.isEnrolled);
        if (c.isEnrolled) {
          const [modulesData, progressData] = await Promise.all([
            apiFetch(`/courses/${id}/modules`),
            apiFetch(`/courses/${id}/progress`),
          ]);
          const mods = modulesData.modules || [];
          setModules(mods);
          setCompletedModules((progressData.completedModules || []).map(String));

          // Auto-select first available module
          const firstPlayable = mods.find((m: ModuleItem) => m.videoUrl);
          if (firstPlayable) {
            setActiveVideo(firstPlayable.videoUrl!);
            setActiveTitle(firstPlayable.title);
            setActiveModuleId(firstPlayable.id || firstPlayable._id || '');
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiFetch(`/courses/${id}/enroll`, { method: 'POST' });
      setIsEnrolled(true);
      const [modulesData, progressData] = await Promise.all([
        apiFetch(`/courses/${id}/modules`),
        apiFetch(`/courses/${id}/progress`),
      ]);
      const mods = modulesData.modules || [];
      setModules(mods);
      setCompletedModules((progressData.completedModules || []).map(String));
      const firstVideo = mods.find((m: ModuleItem) => m.videoUrl);
      if (firstVideo) {
        setActiveVideo(firstVideo.videoUrl!);
        setActiveTitle(firstVideo.title);
        setActiveModuleId(firstVideo.id || firstVideo._id || '');
      }
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const isModuleUnlocked = (mod: ModuleItem, index: number): boolean => {
    if (index === 0) return true; // First module is always unlocked
    const prevModule = modules[index - 1];
    return completedModules.includes(String(prevModule.id || prevModule._id || ''));
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#3b82f6', '#10b981']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#3b82f6', '#10b981']
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const getModId = (m: ModuleItem) => m.id || m._id || '';

  const handlePlayVideo = (mod: ModuleItem, index: number) => {
    if (!isModuleUnlocked(mod, index)) return;
    if (mod.videoUrl) {
      setActiveVideo(mod.videoUrl);
      setActiveTitle(mod.title);
      setActiveModuleId(getModId(mod));
    }
  };

  const handleVideoEnded = async () => {
    if (!activeModuleId || !id) return;
    if (completedModules.includes(String(activeModuleId))) return;
    
    setMarkingComplete(true);
    try {
      const result = await apiFetch(`/courses/${id}/modules/${activeModuleId}/complete`, { method: 'POST' });
      const newCompleted = (result.completedModules || []).map(String);
      setCompletedModules(newCompleted);
      
      if (newCompleted.length === modules.length && modules.length > 0) {
        fireConfetti();
      }
    } catch (err) {
      console.error('Failed to mark module complete:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleDownloadNotes = (mod: ModuleItem) => {
    if (mod.notesUrl) {
      window.open(resolveUrl(mod.notesUrl), '_blank');
    }
  };

  const progressPercentage = modules.length > 0
    ? Math.round((completedModules.length / modules.length) * 100)
    : 0;

  if (loading) return <div className="text-center py-20 text-slate-400 font-medium">Loading course...</div>;
  if (!course) return <div className="text-center py-20 text-slate-400 font-medium">Course not found</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Link to="/courses" className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-purple font-bold text-sm transition-all group">
          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-brand-purple/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back to Courses
        </Link>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Video Player / Lock Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-video glass-panel rounded-[3rem] overflow-hidden border-white/5 relative group shadow-2xl glow-shadow"
          >
            {isEnrolled && activeVideo ? (
              <PremiumVideoPlayer 
                src={resolveUrl(activeVideo)}
                onEnded={handleVideoEnded}
                poster={`https://picsum.photos/seed/${id}/1920/1080`}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10">
                  <Lock className="w-12 h-12 text-slate-500" />
                </div>
                {!isEnrolled ? (
                  <>
                    <p className="text-slate-400 font-bold text-lg">Enroll to unlock course content</p>
                    <div className="relative p-[2px] rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#7C3AED,#3B82F6,#10b981,#3B82F6,#7C3AED)] animate-spin-slow" />
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="relative px-10 py-4 bg-[#030014] text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all disabled:opacity-60 z-10"
                      >
                        {enrolling ? 'Enrolling...' : '🎓 Enroll Now — Free'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 font-medium">Select a lesson to start watching</p>
                )}
              </div>
            )}
            {isEnrolled && activeTitle && (
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-brand-purple" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Now Playing</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{activeTitle}</h2>
              </div>
            )}
            {/* Module complete toast */}
            {markingComplete && (
              <div className="absolute top-4 right-4 z-20 bg-emerald-500/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving progress...
              </div>
            )}
          </motion.div>

          {/* ── Lesson Notes Panel ── */}
          {isEnrolled && activeModuleId && (() => {
            const activeMod = modules.find(m => getModId(m) === activeModuleId);
            return activeMod?.notesUrl ? (
              <motion.div
                key={activeModuleId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-[2rem] border-white/5 overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lesson Notes</p>
                      <p className="text-sm font-bold text-white">{activeMod.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">PDF study material for this lesson</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadNotes(activeMod)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-brand-blue/20 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download Notes (PDF)
                  </button>
                </div>
              </motion.div>
            ) : isEnrolled && (
              <div className="flex items-center gap-3 px-6 py-4 glass-panel rounded-[2rem] border-white/5">
                <FileText className="w-5 h-5 text-slate-600 shrink-0" />
                <p className="text-sm text-slate-500 font-medium">No notes available for this lesson.</p>
              </div>
            );
          })()}

          {/* Course Info */}
          <div className="glass-panel p-10 rounded-[3rem] border-white/5">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h1 className="text-4xl font-bold text-white tracking-tight">{course.title}</h1>
              {isEnrolled && (
                <span className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Enrolled
                </span>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg font-medium">{course.description || 'No description available.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center"><User className="w-6 h-6 text-brand-purple" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instructor</p>
                  <p className="text-sm font-bold text-white mt-1">{course.instructor}</p>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center"><BarChart className="w-6 h-6 text-brand-blue" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Level</p>
                  <p className="text-sm font-bold text-white mt-1">{course.level || 'All Levels'}</p>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center"><Clock className="w-6 h-6 text-emerald-400" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lessons</p>
                  <p className="text-sm font-bold text-white mt-1">{modules.length} Lessons</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Sidebar */}
        <div className="space-y-8">
          {/* Progress Bar */}
          {isEnrolled && modules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-[2rem] border-white/5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">Your Progress</span>
                <span className="text-sm font-bold text-brand-purple">{progressPercentage}%</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
                />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2">
                {completedModules.length} of {modules.length} lessons completed
              </p>
            </motion.div>
          )}

          <div className="glass-panel rounded-[3rem] border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-bold text-white tracking-tight">Course Content</h3>
              <p className="text-xs text-slate-500 font-medium mt-2">
                {isEnrolled ? `${modules.length} lesson${modules.length !== 1 ? 's' : ''}` : 'Enroll to access lessons'}
              </p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {!isEnrolled ? (
                <div className="text-center py-10 flex flex-col items-center gap-4">
                  <Lock className="w-10 h-10 text-slate-600" />
                  <p className="text-slate-500 text-sm font-medium">Enroll to unlock all lessons</p>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="px-8 py-3 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl text-sm font-bold hover:scale-105 transition-all disabled:opacity-60"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </div>
              ) : modules.length === 0 ? (
                <p className="text-slate-500 text-center py-10 text-sm">No lessons added yet.</p>
              ) : modules.map((mod, i) => {
                const unlocked = isModuleUnlocked(mod, i);
                const isComplete = completedModules.includes(String(getModId(mod)));
                const isActive = activeTitle === mod.title;

                return (
                  <button
                    key={getModId(mod)}
                    onClick={() => handlePlayVideo(mod, i)}
                    disabled={!unlocked}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all border group ${
                      !unlocked
                        ? 'border-transparent opacity-50 cursor-not-allowed'
                        : isActive
                          ? 'bg-white/10 border-brand-purple/30'
                          : 'border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : !unlocked
                            ? 'bg-white/5 text-slate-600'
                            : isActive
                              ? 'bg-brand-purple/20 text-brand-purple'
                              : 'bg-white/5 text-slate-500 group-hover:text-brand-purple group-hover:scale-110'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : !unlocked ? (
                          <Lock className="w-4 h-4" />
                        ) : mod.videoUrl ? (
                          <PlayCircle className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${
                          isComplete ? 'text-emerald-400' : isActive ? 'text-brand-purple' : unlocked ? 'text-white' : 'text-slate-500'
                        }`}>{mod.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {isComplete ? '✓ Completed' : !unlocked ? '🔒 Locked' : mod.duration || `Lesson ${i + 1}`}
                        </p>
                      </div>
                    </div>
                    {unlocked && mod.notesUrl && (
                      <button onClick={(e) => { e.stopPropagation(); handleDownloadNotes(mod); }}
                        className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-brand-blue transition-colors" title="Download PDF Notes">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
