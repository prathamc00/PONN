import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  PlayCircle,
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  ClipboardCheck,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../utils/api.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/courses/my-enrollments').catch(() => ({ courses: [] })),
      apiFetch('/assignments').catch(() => ({ assignments: [] })),
      apiFetch('/certificates/my-certificates').catch(() => ({ certificates: [] })),
      apiFetch('/tests').catch(() => ({ tests: [] })),
    ])
      .then(([courseRes, asgRes, certRes, testRes]) => {
        setCourses(courseRes.courses || []);
        setAssignments(asgRes.assignments || []);
        setCertificates(certRes.certificates || []);
        setTests(testRes.tests || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const studentName = user?.name?.split(' ')[0] || 'Student';

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* ── GREETING & HERO BANNER ─────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#ea580c]/5 text-[#ea580c] border border-[#ea580c]/15 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1">
                <Sparkles size={12} className="text-[#9d4225]" /> {todayFormatted}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-full text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active Student
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#ea580c]">
              Welcome back, {studentName}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Continue your structured coursework, submit pending assignments, and earn verified industry credentials.
            </p>
          </div>

          {/* Quick Header CTA */}
          <div className="flex items-center gap-3 self-start md:self-center">
            {courses.length > 0 && (
              <Link
                to={`/courses/${courses[0]._id || courses[0].id}`}
                className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all hover:shadow-sm"
              >
                <PlayCircle size={15} /> Resume Current Course →
              </Link>
            )}
            <Link
              to="/courses"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#ea580c] rounded-xl text-xs font-medium transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>

        {/* Status Mini Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Academic Track</span>
            <span className="font-semibold text-slate-800 mt-0.5 block truncate">
              {user?.branch || 'Information Technology'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Active Courses</span>
            <span className="font-semibold text-[#ea580c] mt-0.5 block">
              {courses.length} Enrolled
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Assessments</span>
            <span className="font-semibold text-[#9d4225] mt-0.5 block">
              {tests.length} Scheduled
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Degree Certificates</span>
            <span className="font-semibold text-emerald-700 mt-0.5 block">
              {certificates.length} Issued
            </span>
          </div>
        </div>
      </section>

      {/* ── 4-METRIC STATS OVERVIEW CARDS ─────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Courses */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover-lift animate-fade-in-up delay-75 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
              Enrolled Tracks
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ea580c]/10 text-[#ea580c] flex items-center justify-center">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#ea580c]">{courses.length}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Active Curriculum</span>
              <Link to="/courses" className="text-[#ea580c] hover:text-[#c2410c] hover:underline font-semibold">
                View all →
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Assignments */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover-lift animate-fade-in-up delay-150 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
              Assignments
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#ea580c]">{assignments.length}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Pending Tasks</span>
              <Link to="/assignments" className="text-[#ea580c] hover:text-[#c2410c] hover:underline font-semibold">
                Upload work →
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3: Assessments */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover-lift animate-fade-in-up delay-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
              Proctored Exams
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#9d4225]/10 text-[#9d4225] flex items-center justify-center">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#ea580c]">{tests.length}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Ready for Testing</span>
              <Link to="/test" className="text-[#9d4225] hover:underline font-semibold">
                Take exam →
              </Link>
            </div>
          </div>
        </div>

        {/* Card 4: Certificates */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover-lift animate-fade-in-up delay-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
              Credentials
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-700">{certificates.length}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Verified Diplomas</span>
              <Link to="/certificate" className="text-emerald-700 hover:underline font-semibold">
                Vault →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ASYMMETRICAL MAIN CONTENT GRID (8 COLS / 4 COLS) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ACTIVE COURSES & ASSESSMENTS (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Courses Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#ea580c]">Current Coursework</h2>
                <p className="text-xs text-slate-500">Pick up where you left off in your enrolled curricula.</p>
              </div>
              <Link
                to="/courses"
                className="text-xs font-semibold text-[#ea580c] hover:text-[#c2410c] flex items-center gap-1"
              >
                Browse All <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs bg-white rounded-2xl border border-slate-200">
                Loading coursework...
              </div>
            ) : courses.length ? (
              <div className="grid grid-cols-1 gap-4">
                {courses.map((course) => {
                  const cId = course._id || course.id;
                  return (
                    <div
                      key={cId}
                      className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover-lift transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold uppercase tracking-wider font-mono">
                              {course.category || 'Technology'}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#9d4225]/10 text-[#9d4225] rounded text-[10px] font-semibold uppercase font-mono">
                              {course.level || 'Beginner'}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-[#ea580c] leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description || 'Hands-on curriculum with video lectures and continuous verification.'}
                          </p>
                        </div>

                        <div className="sm:text-right text-xs text-slate-400 font-mono shrink-0">
                          <span>{course.durationHours || 12} Hours Total</span>
                          <span className="block text-slate-700 font-sans font-medium mt-0.5">
                            Instructor: {course.instructor || 'CRISMATECH Faculty'}
                          </span>
                        </div>
                      </div>

                      {/* Course Progress bar */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Progress</span>
                          <span className="font-semibold text-[#ea580c] font-mono">Active</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#ea580c] rounded-full w-2/5" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to={`/courses/${cId}`}
                          className="px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <PlayCircle size={14} /> Resume Lessons →
                        </Link>
                        <Link
                          to={`/courses/${cId}`}
                          className="text-xs text-slate-500 hover:text-[#ea580c] font-medium"
                        >
                          View Full Syllabus
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-3 bg-white border border-dashed border-slate-200 rounded-2xl">
                <BookOpen size={32} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-[#ea580c]">No Enrolled Courses</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse the academic course catalog to enroll in digital skill tracks.
                </p>
                <Link
                  to="/courses"
                  className="mt-3 inline-block px-4 py-2 bg-[#ea580c] text-white rounded-xl text-xs font-semibold"
                >
                  Browse Course Catalog
                </Link>
              </div>
            )}
          </section>

          {/* Examinations & Testing Desk Showcase */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#ea580c]">Proctored Examinations</h2>
                <p className="text-xs text-slate-500">Validate competencies and unlock verified degree credentials.</p>
              </div>
              <Link
                to="/test"
                className="text-xs font-semibold text-[#ea580c] hover:text-[#c2410c] flex items-center gap-1"
              >
                All Exams <ChevronRight size={14} />
              </Link>
            </div>

            {tests.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests.slice(0, 2).map((test) => {
                  const tId = test._id || test.id;
                  return (
                    <div
                      key={tId}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover-lift flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                            {test.durationMinutes || 30} Mins
                          </span>
                          <span className="text-emerald-700 font-semibold font-mono">Pass: 40%</span>
                        </div>
                        <h4 className="text-base font-bold text-[#ea580c] mt-2.5">
                          {test.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          Proctored assessment with instant auto-grading and certificate verification.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          to={`/test/take/${tId}`}
                          className="w-full py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <ClipboardCheck size={14} /> Start Exam Session →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No active exams currently scheduled.
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: ASSIGNMENTS & CREDENTIALS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pending Coursework Widget */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#9d4225]" />
                <h3 className="font-bold text-sm text-[#ea580c]">Assignments & Due Dates</h3>
              </div>
              <Link to="/assignments" className="text-xs text-[#ea580c] hover:underline font-semibold">
                View All
              </Link>
            </div>

            {assignments.length ? (
              <div className="space-y-3">
                {assignments.slice(0, 3).map((asg) => (
                  <div
                    key={asg._id || asg.id}
                    className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs text-slate-800 truncate">{asg.title}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'Self-paced'}
                      </span>
                    </div>
                    <Link
                      to={`/assignments/upload?assignmentId=${asg._id || asg.id}`}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#ea580c] rounded-lg text-[11px] font-semibold shrink-0 shadow-2xs"
                    >
                      Submit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No assignments pending submission.</p>
            )}
          </div>

          {/* Certificates Showcase Widget */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-emerald-700" />
                <h3 className="font-bold text-sm text-[#ea580c]">Verified Credentials</h3>
              </div>
              <Link to="/certificate" className="text-xs text-[#ea580c] hover:underline font-semibold">
                Vault
              </Link>
            </div>

            {certificates.length ? (
              <div className="space-y-3">
                {certificates.slice(0, 3).map((cert) => (
                  <div
                    key={cert.certificateId}
                    className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-emerald-900 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-700" /> Verified Certificate
                      </span>
                      {cert.grade && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[10px] font-bold">
                          Grade {cert.grade}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-xs text-[#ea580c]">
                      {cert.title || cert.courseTitle || 'Certificate of Completion'}
                    </h4>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="font-mono text-slate-400 text-[10px]">ID: {cert.certificateId}</span>
                      <Link
                        to="/certificate"
                        className="text-emerald-800 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        Download <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 space-y-2">
                <Award size={28} className="mx-auto text-slate-300" />
                <p>Pass your final course assessments with 40%+ to unlock verified degree certificates.</p>
              </div>
            )}
          </div>

          {/* Academic Resource Shortcuts */}
          <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider font-mono">
              Academic Support
            </h4>
            <div className="space-y-1.5 text-xs">
              <Link
                to="/attendance"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white text-slate-700 transition-colors"
              >
                <span>Attendance & Activity Ledger</span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
              <Link
                to="/courses"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white text-slate-700 transition-colors"
              >
                <span>Explore Full Curricula Catalog</span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
              <Link
                to="/profile"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white text-slate-700 transition-colors"
              >
                <span>Student ID & Profile Settings</span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
