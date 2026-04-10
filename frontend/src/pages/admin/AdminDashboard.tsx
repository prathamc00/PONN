import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, TrendingUp, ArrowUpRight, Activity, Calendar, ChevronRight, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalAssignments: 0, pendingInstructors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, coursesData] = await Promise.all([
          apiFetch('/users'),
          apiFetch('/courses/manage'),
        ]);
        const users = usersData.users || [];
        const courses = coursesData.courses || [];
        setStats({
          totalUsers: users.length,
          totalCourses: courses.length,
          totalAssignments: 0,
          pendingInstructors: users.filter((u: any) => u.role === 'instructor' && u.approvalStatus === 'pending').length,
        });
      } catch (err) { console.error('Failed to load dashboard stats', err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
    { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
    { label: 'Pending Instructors', value: stats.pendingInstructors, icon: Activity, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
    { label: 'Completion Rate', value: '—', icon: TrendingUp, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{user?.role === 'admin' ? 'Admin' : 'Instructor'} Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back{user ? `, ${user.name}` : ''}. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? '...' : stat.value}
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Manage Users', desc: 'View, approve, and manage all platform users', href: '/admin/users', adminOnly: true },
              { label: 'Manage Courses', desc: 'Create courses, upload videos and PDF notes', href: '/admin/courses', adminOnly: false },
              { label: 'Assignments', desc: 'Create assignments and grade submissions', href: '/admin/assignments', adminOnly: false },
              { label: 'Quiz Scheduler', desc: 'Create and schedule quizzes for students', href: '/admin/quiz', adminOnly: false },
              { label: 'Quiz Results', desc: 'View student attempts and export results', href: '/admin/quiz-results', adminOnly: true },
            ].filter(action => user?.role === 'admin' || !action.adminOnly).map((action) => (
              <a key={action.href} href={action.href} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{action.label}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{action.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-brand-500 transition-all" />
              </a>
            ))}
          </div>
        </div>

        {/* Platform Info */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Platform Overview</h3>
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Users</span>
                <span className="text-sm font-bold text-brand-600">{stats.totalUsers}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Courses</span>
                <span className="text-sm font-bold text-violet-600">{stats.totalCourses}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {stats.pendingInstructors > 0 && (
            <div className="mt-12 p-6 bg-brand-50 dark:bg-brand-900/20 rounded-3xl border border-brand-100 dark:border-brand-900/30">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-brand-600" />
                <h4 className="font-bold text-brand-900 dark:text-brand-100">Attention Needed</h4>
              </div>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300 leading-relaxed">
                You have {stats.pendingInstructors} pending instructor application{stats.pendingInstructors > 1 ? 's' : ''}. Review them to expand your teaching team.
              </p>
              <a href="/admin/users" className="mt-4 w-full block text-center py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-all">
                Review Now
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
