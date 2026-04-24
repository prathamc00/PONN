import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlayCircle, FileText, BookOpen, Sparkles, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/Loading';
import { apiFetch } from '../utils/api';
import AnimatedTiltCard from '../components/ui/AnimatedTiltCard';
import RippleButton from '../components/ui/RippleButton';
import { showError } from '../utils/dialog';

const gradientColors = [
  'from-brand-purple to-brand-blue',
  'from-indigo-500 to-purple-500',
  'from-brand-blue to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-600',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-fuchsia-500',
];

export default function CoursesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [cData, eData] = await Promise.all([
        apiFetch('/courses'),
        apiFetch('/courses/my-enrollments').catch(() => ({ courses: [] })),
      ]);
      setCourses(cData.courses || []);
      const ids = new Set<string>((eData.courses || []).map((c: any) => c._id));
      setEnrolledIds(ids);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' });
      setEnrolledIds(prev => new Set([...prev, courseId]));
    } catch (err: any) {
      await showError('Enrollment failed', err.message || 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  const filtered = courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Course Catalog</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Explore <span className="gradient-text">Courses</span></h1>
          <p className="text-slate-400 mt-2 font-medium">Enroll in a course to unlock content, videos, and quizzes.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
          <input type="text" placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/50 w-full md:w-80 text-white placeholder:text-slate-500 transition-all shadow-sm backdrop-blur-md font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-[2.5rem] border-white/5 p-8 space-y-6">
              <Skeleton className="aspect-video w-full rounded-[2rem] bg-white/5" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-1/2 bg-white/5" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-slate-400 font-medium">No courses found</div>
        ) : (
          filtered.map((course, i) => {
            const isEnrolled = enrolledIds.has(course._id);
            const isEnrolling = enrollingId === course._id;
            return (
              <AnimatedTiltCard key={course._id} intensity={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden hover:border-brand-purple/20 transition-all group relative h-full"
              >
                <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${gradientColors[i % gradientColors.length]} flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <BookOpen className="w-20 h-20 text-white/30 group-hover:scale-110 transition-transform duration-700 blur-[1px] group-hover:blur-0" />
                  <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest shadow-xl">
                    {course.level || 'Course'}
                  </div>
                  {isEnrolled && (
                    <div className="absolute top-6 left-6 bg-emerald-500/80 backdrop-blur-xl border border-emerald-400/30 px-4 py-2 rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Enrolled
                    </div>
                  )}
                </div>
                <div className="p-10">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-purple transition-colors tracking-tight">{course.title}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-8">{course.instructor}</p>

                  <div className="flex items-center gap-8 mb-10 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-purple/10 rounded-lg flex items-center justify-center">
                        <PlayCircle className="w-4 h-4 text-brand-purple" />
                      </div>
                      {course.modules?.length || 0} Modules
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-brand-blue" />
                      </div>
                      PDF Notes
                    </div>
                  </div>

                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course._id}`}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group/btn"
                    >
                      <PlayCircle className="w-5 h-5" /> Continue Learning <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <RippleButton
                      onClick={() => handleEnroll(course._id)}
                      disabled={isEnrolling}
                      className="w-full py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-center rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg glow-shadow active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Lock className="w-4 h-4" />
                      {isEnrolling ? 'Enrolling...' : 'Enroll Now — Free'}
                    </RippleButton>
                  )}
                </div>
              </motion.div>
              </AnimatedTiltCard>
            );
          })
        )}
      </div>
    </div>
  );
}
