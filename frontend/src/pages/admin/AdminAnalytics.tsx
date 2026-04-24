import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, Award, CheckCircle, XCircle, BarChart2, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../utils/api';

// ─── Tiny SVG Bar Chart ──────────────────────────────────────────────────────────
function BarChart({ data, color = '#7C3AED' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-48 w-full pt-6">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 min-w-0 h-full">
          <div className="w-full flex-1 flex flex-col justify-end items-center">
            <div 
               className="w-full flex flex-col justify-end items-center"
               style={{ height: `${(d.value / max) * 100}%` }}
            >
               <span className="text-[11px] font-bold text-slate-500 mb-1.5 -mt-6">{d.value}</span>
               <motion.div
                 initial={{ scaleY: 0 }}
                 animate={{ scaleY: 1 }}
                 transition={{ delay: i * 0.05, duration: 0.4 }}
                 style={{ backgroundColor: color, originY: 1 }}
                 className="w-full flex-1 rounded-t-xl min-h-[4px] opacity-90"
               />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center mt-2 shrink-0">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tiny Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ pass, fail }: { pass: number; fail: number }) {
  const total = pass + fail || 1;
  const passAngle = (pass / total) * 360;
  const r = 40, cx = 56, cy = 56, strokeW = 16;
  const circumference = 2 * Math.PI * r;
  const passOffset = circumference - (passAngle / 360) * circumference;

  return (
    <div className="flex items-center gap-8">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeW} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={strokeW}
          strokeDasharray={circumference} strokeDashoffset={0} strokeLinecap="round" />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={strokeW}
          strokeDasharray={circumference} strokeDashoffset={passOffset} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: passOffset }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Pass: {pass}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Fail: {fail}</span>
        </div>
        <div className="text-xs text-slate-500">
          {Math.round((pass / total) * 100)}% pass rate
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch('/users'),
      apiFetch('/courses'),
      apiFetch('/certificates'),
      apiFetch('/quiz-attempts'),
      apiFetch('/assignments'),
    ]).then(([u, c, cert, qa, asg]) => {
      setUsers(u.users || []);
      setCourses(c.courses || []);
      setCertificates(cert.certificates || []);
      setAttempts(qa.attempts || []);
      setAssignments(asg.assignments || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ──
  const students = users.filter(u => u.role === 'student');
  const instructors = users.filter(u => u.role === 'instructor');
  const passedAttempts = attempts.filter(a => a.passed);
  const failedAttempts = attempts.filter(a => !a.passed);

  // Enrollments per course (top 6)
  const enrollmentData = [...courses]
    .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
    .slice(0, 6)
    .map(c => ({ label: c.title?.split(' ').slice(0, 2).join(' ') || 'Course', value: c.enrolledCount || 0 }));

  // Monthly user signups (last 6 months)
  const now = new Date();
  const monthlySignups = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const value = users.filter(u => {
      const created = new Date(u.createdAt);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    }).length;
    return { label, value };
  });

  // Monthly certs earned (last 6 months)
  const monthlyCerts = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const value = certificates.filter(c => {
      const earned = new Date(c.earnedDate);
      return earned.getFullYear() === d.getFullYear() && earned.getMonth() === d.getMonth();
    }).length;
    return { label, value };
  });

  // Submission status breakdown
  const allSubmissions: any[] = [];
  const pendingGrade = allSubmissions.filter(s => !s.grade).length;
  const graded = allSubmissions.filter(s => s.grade).length;

  const statCards = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-brand-purple bg-brand-purple/10' },
    { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400' },
    { label: 'Certificates Issued', value: certificates.length, icon: Award, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400' },
    { label: 'Quiz Attempts', value: attempts.length, icon: BarChart2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' },
    { label: 'Instructors', value: instructors.length, icon: Users, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400' },
    { label: 'Assignments', value: assignments.length, icon: CheckCircle, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <TrendingUp className="w-6 h-6 animate-pulse mr-3" /> Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Platform-wide performance and engagement insights.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Monthly New Users */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-purple" />
            <h3 className="font-bold text-slate-900 dark:text-white">New Registrations</h3>
          </div>
          <BarChart data={monthlySignups} color="#7C3AED" />
        </motion.div>

        {/* Course Enrollments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Top Courses by Enrollment</h3>
          </div>
          {enrollmentData.length > 0
            ? <BarChart data={enrollmentData} color="#0ea5e9" />
            : <p className="text-slate-400 text-sm text-center py-8">No enrollment data yet</p>}
        </motion.div>

        {/* Quiz Pass/Fail */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Quiz Pass/Fail Rate</h3>
          </div>
          <DonutChart pass={passedAttempts.length} fail={failedAttempts.length} />
        </motion.div>

        {/* Monthly Certs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Certificates Earned (Monthly)</h3>
          </div>
          <BarChart data={monthlyCerts} color="#f59e0b" />
        </motion.div>

        {/* User Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-violet-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">User Breakdown</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Students', count: students.length, color: 'bg-brand-purple', percent: Math.round((students.length / (users.length || 1)) * 100) },
              { label: 'Instructors', count: instructors.length, color: 'bg-violet-500', percent: Math.round((instructors.length / (users.length || 1)) * 100) },
              { label: 'Admins', count: users.filter(u => u.role === 'admin').length, color: 'bg-rose-500', percent: Math.round((users.filter(u => u.role === 'admin').length / (users.length || 1)) * 100) },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>{item.label}</span><span>{item.count}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Courses Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">All Courses — Enrollment Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Course', 'Category', 'Level', 'Enrolled', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {courses.length === 0
                ? <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">No courses yet</td></tr>
                : courses.map(course => (
                  <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{course.title}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{course.category}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 capitalize">{course.level}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{course.enrolledCount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${course.isPublished ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
