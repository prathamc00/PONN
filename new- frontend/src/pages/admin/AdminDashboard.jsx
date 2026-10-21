import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, FileText, Award, Calendar, TrendingUp, CheckCircle, Clock, ArrowRight, ShieldCheck, Activity, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiFetch } from '../../utils/api.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    totalQuizzes: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/users').catch(() => ({ users: [] })),
      apiFetch('/courses').catch(() => ({ courses: [] })),
      apiFetch('/assignments').catch(() => ({ assignments: [] })),
      apiFetch('/tests').catch(() => ({ tests: [] })),
      apiFetch('/submissions/grading-queue').catch(() => ({ queue: [] })),
    ]).then(([userRes, courseRes, asgRes, testRes, queueRes]) => {
      const users = userRes.users || [];
      const courses = courseRes.courses || [];
      const assignments = asgRes.assignments || [];
      const tests = testRes.tests || [];
      const queue = queueRes.queue || [];

      setStats({
        totalUsers: users.length,
        totalStudents: users.filter(u => u.role === 'student').length,
        totalInstructors: users.filter(u => u.role === 'instructor').length,
        totalCourses: courses.length,
        totalAssignments: assignments.length,
        pendingSubmissions: queue.length,
        totalQuizzes: tests.length,
      });

      setRecentUsers(users.slice(0, 5));
      setRecentCourses(courses.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  const adminName = user?.name?.split(' ')[0] || 'Administrator';

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Editorial Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">CRISMATECH Academic Governance</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">
            {user?.role === 'admin' ? `Welcome back, ${adminName}` : `Faculty Desk — ${adminName}`}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Real-time management overview of student cohorts, course curricula, assessments, and credential issuances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/courses"
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <BookOpen size={14} /> Manage Courses
          </Link>
          <Link
            to="/admin/grading"
            className="px-4 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText size={14} /> Grading Desk ({stats.pendingSubmissions})
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-xs uppercase">Students Enrolled</span>
            <Users size={18} className="text-primary" />
          </div>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{loading ? '—' : stats.totalStudents}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Active across all batches</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-xs uppercase">Active Courses</span>
            <BookOpen size={18} className="text-primary" />
          </div>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{loading ? '—' : stats.totalCourses}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Curricula in catalogue</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-xs uppercase">Submissions to Grade</span>
            <FileText size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-serif font-bold text-amber-700 mt-2">{loading ? '—' : stats.pendingSubmissions}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Pending student evaluations</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-xs uppercase">Assessments & Tests</span>
            <Award size={18} className="text-primary" />
          </div>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{loading ? '—' : stats.totalQuizzes}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Scheduled course quizzes</span>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Courses & Curricula overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <div>
                <h2 className="text-base font-semibold text-primary">Academic Curricula</h2>
                <p className="text-xs text-outline">Published learning tracks on the platform</p>
              </div>
              <Link to="/admin/courses" className="text-xs font-mono text-primary hover:underline">
                View All Courses →
              </Link>
            </div>

            <div className="divide-y divide-outline-variant">
              {recentCourses.length ? recentCourses.map((c) => (
                <div key={c._id || c.id} className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-on-surface">{c.title}</h3>
                    <p className="text-xs text-outline">{c.category || 'Technology'} • {c.level || 'All levels'} • {c.durationHours || 12}h</p>
                  </div>
                  <Link
                    to="/admin/courses"
                    className="px-3 py-1 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-xs font-medium"
                  >
                    Manage Syllabus
                  </Link>
                </div>
              )) : (
                <p className="text-xs text-outline py-6 text-center">No courses found in database.</p>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              to="/admin/users"
              className="p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl transition-colors shadow-sm flex flex-col justify-between"
            >
              <Users size={20} className="text-primary mb-2" />
              <div>
                <span className="font-semibold text-xs text-on-surface block">User Directory</span>
                <span className="text-[11px] text-outline">Manage students & staff</span>
              </div>
            </Link>

            <Link
              to="/admin/grading"
              className="p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl transition-colors shadow-sm flex flex-col justify-between"
            >
              <FileText size={20} className="text-secondary mb-2" />
              <div>
                <span className="font-semibold text-xs text-on-surface block">Grading Queue</span>
                <span className="text-[11px] text-outline">Score pending work</span>
              </div>
            </Link>

            <Link
              to="/admin/certificates"
              className="p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl transition-colors shadow-sm flex flex-col justify-between"
            >
              <Award size={20} className="text-primary mb-2" />
              <div>
                <span className="font-semibold text-xs text-on-surface block">Certificates</span>
                <span className="text-[11px] text-outline">Issue & verify hashes</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Col: Recent Registrations */}
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <div>
                <h2 className="text-base font-semibold text-primary">Recent Users</h2>
                <p className="text-xs text-outline">Latest registered accounts</p>
              </div>
              <Link to="/admin/users" className="text-xs font-mono text-primary hover:underline">
                Directory →
              </Link>
            </div>

            <div className="divide-y divide-outline-variant">
              {recentUsers.length ? recentUsers.map((u) => {
                const uid = u._id || u.id;
                return (
                  <div key={uid} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/admin/users/${uid}`} className="font-medium text-xs text-primary hover:underline">
                        {u.name}
                      </Link>
                      <span className="block font-mono text-[10px] text-outline">{u.email}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-mono text-[10px] rounded uppercase">
                      {u.role}
                    </span>
                  </div>
                );
              }) : (
                <p className="text-xs text-outline py-6 text-center">No users registered yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
