import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, ClipboardCheck, Calendar, ArrowUpRight, Clock, Award, ChevronRight, Sparkles, TrendingUp, Zap, Target, Activity, Bell, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalCourses: 0, pendingAssignments: 0, testsCompleted: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allCoursesData, enrollmentsData, assignmentsData, attemptsData] = await Promise.all([
          apiFetch('/courses').catch(() => ({ courses: [] })),
          apiFetch('/courses/my-enrollments').catch(() => ({ courses: [] })),
          apiFetch('/assignments/my-submissions').catch(() => ({ submissions: [] })),
          apiFetch('/tests/my-attempts').catch(() => ({ attempts: [] })),
        ]);

        const allCourses = allCoursesData.courses || [];
        const enrolledCourses = enrollmentsData.courses || [];
        const submissions = assignmentsData.submissions || [];
        const attempts = attemptsData.attempts || [];

        const topCourses = enrolledCourses.slice(0, 3);
        const progressPromises = topCourses.map(c => 
          apiFetch(`/courses/${c._id}/progress`).catch(() => ({ completedModules: [] }))
        );
        const progressResults = await Promise.all(progressPromises);

        const coursesWithProgress = topCourses.map((c, i) => {
          const completedCount = progressResults[i]?.completedModules?.length || 0;
          const totalCount = c.modules?.length || 0;
          const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          return { ...c, progressPercentage, completedCount, totalCount };
        });

        setCourses(coursesWithProgress);
        setStats({
          totalCourses: allCourses.length,
          pendingAssignments: 0,
          testsCompleted: attempts.filter((a: any) => a.completedAt).length,
        });

        // Gather upcoming tasks from assignments
        const tasks: any[] = [];
        // We need all assignments to find ones without submissions
        try {
          const allAssignments = await apiFetch('/assignments');
          const submittedIds = new Set(submissions.map((s: any) => typeof s.assignment === 'object' ? s.assignment._id : s.assignment));
          const pending = (allAssignments.assignments || []).filter((a: any) => !submittedIds.has(a._id) && new Date(a.dueDate) > new Date());
          setStats(prev => ({ ...prev, pendingAssignments: pending.length }));
          pending.slice(0, 3).forEach((a: any) => {
            const dueDate = new Date(a.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            tasks.push({ title: a.title, due: diffDays <= 1 ? 'Tomorrow' : `${diffDays} days left`, type: 'Assignment', color: 'bg-amber-400' });
          });
        } catch {}

        setPendingTasks(tasks);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Student';

  const statCards = [
    { label: 'Total Courses', value: String(stats.totalCourses), icon: BookOpen, color: 'text-brand-purple', bg: 'bg-brand-purple/10', trend: '' },
    { label: 'Assignments Pending', value: String(stats.pendingAssignments).padStart(2, '0'), icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10', trend: '' },
    { label: 'Tests Completed', value: String(stats.testsCompleted).padStart(2, '0'), icon: ClipboardCheck, color: 'text-brand-blue', bg: 'bg-brand-blue/10', trend: '' },
    { label: 'Courses Available', value: String(stats.totalCourses), icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-12 max-w-[1600px] mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-16 w-96 bg-white/5 rounded-2xl" />
          <Skeleton className="h-6 w-[500px] bg-white/5 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[3rem] bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="p-2 bg-brand-purple/10 rounded-lg border border-brand-purple/20">
              <Sparkles className="w-5 h-5 text-brand-purple" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-purple">Academic Overview</span>
          </motion.div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
            Welcome back, <span className="gradient-text">{firstName}!</span> 👋
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
            You have <span className="text-brand-purple font-bold">{stats.pendingAssignments}</span> pending assignments and <span className="text-brand-blue font-bold">{stats.totalCourses}</span> active courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="/courses" className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg glow-shadow active:scale-95 group">
            <Zap className="w-5 h-5 group-hover:fill-white transition-all" /> Continue Learning
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 rounded-[3rem] border-white/5 shadow-xl backdrop-blur-3xl group hover:border-white/10 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-purple/10 transition-colors" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.bg} rounded-[1.5rem] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Course Progress */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="glass-panel p-10 rounded-[3.5rem] border-white/5 shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-brand-blue/20 rounded-2xl flex items-center justify-center border border-brand-blue/20">
                <Target className="w-6 h-6 text-brand-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Your Courses</h2>
                <p className="text-slate-500 text-xs font-medium">Browse the courses available to you</p>
              </div>
            </div>
            <div className="grid gap-10">
              {courses.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 px-4 bg-white/5 rounded-[2.5rem] border border-white/10 border-dashed">
                  <div className="w-20 h-20 bg-brand-purple/10 rounded-full flex items-center justify-center mx-auto mb-6 glow-shadow border border-brand-purple/20">
                    <BookOpen className="w-8 h-8 text-brand-purple" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Your learning journey awaits</h3>
                  <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium leading-relaxed">Explore our catalog and enroll in your first course to start earning achievements.</p>
                  <a href="/courses" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg glow-shadow active:scale-95 group">
                    Explore Catalog <ArrowUpRight className="w-5 h-5 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />
                  </a>
                </motion.div>
              ) : courses.map((course, i) => (
                <div key={course._id} className="space-y-5 cursor-pointer group hover:bg-white/5 p-4 -m-4 rounded-3xl transition-all" onClick={() => window.location.href = `/courses/${course._id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-slate-500 group-hover:text-brand-blue transition-colors" />
                      <span className="font-bold text-slate-300 text-lg tracking-tight group-hover:text-white transition-colors">{course.title}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{course.completedCount}/{course.totalCount} lessons ({course.progressPercentage}%)</span>
                  </div>
                  <div className="h-5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${course.progressPercentage}%` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 * i }}
                      className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              ))}
              <a href="/courses" className="text-center font-bold text-sm text-brand-blue hover:text-brand-purple transition-all pt-4 border-t border-white/5 uppercase tracking-[0.2em] block">View All Courses</a>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-10">
          {/* Pending Tasks */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
            className="glass-panel p-10 rounded-[3.5rem] border-white/5 shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20">
                  <Bell className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Tasks</h2>
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400 border border-white/5">{pendingTasks.length}</div>
            </div>
            <div className="space-y-8">
              {pendingTasks.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 glow-shadow">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-lg">No pending tasks</p>
                  <p className="text-slate-500 text-sm mt-1 font-medium">You're all caught up! 🎉</p>
                </motion.div>
              ) : pendingTasks.map((item, i) => (
                <motion.div key={i} whileHover={{ x: 5 }}
                  className="flex items-start gap-6 p-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="relative">
                    <div className={`w-4 h-4 mt-2 ${item.color} rounded-full glow-shadow group-hover:scale-125 transition-transform`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white group-hover:text-brand-purple transition-colors tracking-tight">{item.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{item.type}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">Due {item.due}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <a href="/assignments" className="w-full mt-12 py-5 bg-white/5 text-slate-400 rounded-2xl font-bold text-xs hover:bg-white/10 hover:text-white transition-all border border-white/5 uppercase tracking-[0.3em] block text-center">
              View All Tasks
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
