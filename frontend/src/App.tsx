import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from './components/DashboardLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentUploadPage from './pages/AssignmentUploadPage';
import TestPage from './pages/TestPage';
import QuizPage from './pages/QuizPage';
import TestResultPage from './pages/TestResultPage';
import AttendancePage from './pages/AttendancePage';
import ProfilePage from './pages/ProfilePage';
import CertificatePage from './pages/CertificatePage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCourses from './pages/admin/ManageCourses';
import ManageAssignments from './pages/admin/ManageAssignments';
import QuizScheduler from './pages/admin/QuizScheduler';
import QuizResults from './pages/admin/QuizResults';
import AdminCertificates from './pages/admin/AdminCertificates';
import ActivityFeed from './pages/admin/ActivityFeed';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import GradingQueue from './pages/admin/GradingQueue';
import StudentProfileViewer from './pages/admin/StudentProfileViewer';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import PageTransition from './components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore: key is required for AnimatePresence but not actively typed in RoutesProps */}
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
        <Route path="/password/reset.html" element={<PageTransition><ResetPasswordPage /></PageTransition>} />

        {/* Dashboard Routes */}
        <Route element={<PageTransition><DashboardLayout /></PageTransition>}>
          <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
          <Route path="/courses" element={<PageTransition><CoursesPage /></PageTransition>} />
          <Route path="/courses/:id" element={<PageTransition><CourseDetailPage /></PageTransition>} />
          <Route path="/assignments" element={<PageTransition><AssignmentsPage /></PageTransition>} />
          <Route path="/assignments/upload" element={<PageTransition><AssignmentUploadPage /></PageTransition>} />
          <Route path="/test" element={<PageTransition><TestPage /></PageTransition>} />
          <Route path="/test/take/:id" element={<PageTransition><QuizPage /></PageTransition>} />
          <Route path="/test/result" element={<PageTransition><TestResultPage /></PageTransition>} />
          <Route path="/attendance" element={<PageTransition><AttendancePage /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/certificate" element={<PageTransition><CertificatePage /></PageTransition>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<PageTransition><AdminLayout /></PageTransition>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="users" element={<PageTransition><ManageUsers /></PageTransition>} />
          <Route path="courses" element={<PageTransition><ManageCourses /></PageTransition>} />
          <Route path="assignments" element={<PageTransition><ManageAssignments /></PageTransition>} />
          <Route path="quiz" element={<PageTransition><QuizScheduler /></PageTransition>} />
          <Route path="quiz-results" element={<PageTransition><QuizResults /></PageTransition>} />
          <Route path="certificates" element={<PageTransition><AdminCertificates /></PageTransition>} />
          <Route path="activity" element={<PageTransition><ActivityFeed /></PageTransition>} />
          <Route path="analytics" element={<PageTransition><AdminAnalytics /></PageTransition>} />
          <Route path="grading" element={<PageTransition><GradingQueue /></PageTransition>} />
          <Route path="users/:id" element={<PageTransition><StudentProfileViewer /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '1rem', border: '1px solid #334155' } }} />
          <AnimatedRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
