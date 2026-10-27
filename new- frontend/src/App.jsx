import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { apiFetch } from './utils/api.js';

// Public pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

// Layouts
import DashboardLayout from './components/DashboardLayout.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';

// Student pages
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import AssignmentUploadPage from './pages/AssignmentUploadPage.jsx';
import TestPage from './pages/TestPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import TestResultPage from './pages/TestResultPage.jsx';
import CertificatePage from './pages/CertificatePage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import StudentProfileViewer from './pages/admin/StudentProfileViewer.jsx';
import ManageCourses from './pages/admin/ManageCourses.jsx';
import ManageAssignments from './pages/admin/ManageAssignments.jsx';
import QuizScheduler from './pages/admin/QuizScheduler.jsx';
import QuizResults from './pages/admin/QuizResults.jsx';
import AdminCertificates from './pages/admin/AdminCertificates.jsx';
import ActivityFeed from './pages/admin/ActivityFeed.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import GradingQueue from './pages/admin/GradingQueue.jsx';
import ChatbotWidget from './components/ChatbotWidget.jsx';

import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function CoursesCatalogPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/courses')
      .then(data => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <div className="border-b border-outline-variant pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-outline">Academic Programs</span>
        <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Course Catalogue</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Explore structured curricula designed around practical industry development, neural systems, and full-stack software.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-outline font-mono text-xs">Loading catalogue...</div>
        ) : courses.length ? (
          courses.map((course, index) => {
            const cId = course._id || course.id;
            return (
              <div
                key={cId || index}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover-lift flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold uppercase font-mono">
                      {course.category || 'Technology'}
                    </span>
                    <span className="px-2 py-0.5 bg-[#9d4225]/10 text-[#9d4225] rounded uppercase text-[10px] font-semibold font-mono">
                      {course.level || 'Beginner'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#ea580c] mt-3">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                    {course.description || 'Comprehensive technology curriculum.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Faculty: <strong className="text-slate-700 font-sans">{course.instructor || 'CRISMATECH'}</strong></span>
                    <span>{course.durationHours || 12}h total</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/courses/${cId}`}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs ${
                      course.isEnrolled
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-[#ea580c] hover:bg-[#c2410c] text-white'
                    }`}
                  >
                    {course.isEnrolled ? 'Resume Lessons →' : 'Enroll / View Curriculum →'}
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-16 text-center text-outline font-mono text-xs">
            No courses available yet.
          </div>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-16 text-center text-outline font-mono text-xs">Authenticating session...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/portal/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/portal/reset-password" element={<ResetPasswordPage />} />

      {/* Student Portal Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesCatalogPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/assignments/upload" element={<AssignmentUploadPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/certificate" element={<CertificatePage />} />
      </Route>

      {/* Fullscreen Examination Session */}
      <Route path="/test/take/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      <Route path="/test/result" element={<ProtectedRoute><TestResultPage /></ProtectedRoute>} />

      {/* Admin & Faculty Portal Routes */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="users/:id" element={<StudentProfileViewer />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="assignments" element={<ManageAssignments />} />
        <Route path="quiz" element={<QuizScheduler />} />
        <Route path="quiz-results" element={<QuizResults />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="activity" element={<ActivityFeed />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="grading" element={<GradingQueue />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ChatbotWidget />
    </>
  );
}
