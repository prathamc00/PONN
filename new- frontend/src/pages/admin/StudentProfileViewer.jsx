import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Mail, Phone, GraduationCap, Award, BookOpen, CheckCircle, Clock, Calendar, ArrowLeft, ShieldCheck, FileText, CheckCircle2, XCircle, RotateCcw
} from 'lucide-react';
import { apiFetch, resolveUrl } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function StudentProfileViewer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userRes, courseRes, certRes, asgRes, quizRes, attRes] = await Promise.all([
        apiFetch('/users').catch(() => ({ users: [] })),
        apiFetch('/courses').catch(() => ({ courses: [] })),
        apiFetch('/certificates').catch(() => ({ certificates: [] })),
        apiFetch('/assignments').catch(() => ({ assignments: [] })),
        apiFetch('/tests/my-attempts').catch(() => ({ attempts: [] })),
        apiFetch('/attendance').catch(() => ({ records: [] })),
      ]);

      const foundUser = userRes.users?.find(u => String(u._id || u.id) === String(id));
      setStudent(foundUser || null);

      if (foundUser) {
        // Enrolled courses
        const enrolledIds = (foundUser.enrolledCourseIds || foundUser.enrolledCourses || []).map(e => String(e._id || e.id || e));
        setCourses((courseRes.courses || []).filter(c => enrolledIds.includes(String(c._id || c.id))));

        // Certificates
        setCertificates((certRes.certificates || []).filter(c => {
          const sId = String(c?.user?._id || c?.user?.id || c?.userId || c?.student || '');
          return sId === String(id);
        }));

        // Quiz attempts
        setQuizAttempts((quizRes.attempts || []).filter(q => String(q?.student?._id || q?.userId) === String(id)));

        // Attendance records
        setAttendance((attRes.records || []).filter(a => String(a?.student?._id || a?.userId) === String(id)));

        // Assignment submissions
        const allAssignments = asgRes.assignments || [];
        const mySubs = [];
        for (const asg of allAssignments) {
          const asgId = asg._id || asg.id;
          try {
            const subRes = await apiFetch(`/assignments/${asgId}/submissions`);
            const sub = (subRes.submissions || []).find(s => String(s?.student?._id || s?.student?.id || s?.student) === String(id));
            if (sub) mySubs.push({ ...sub, assignment: asg });
          } catch {
            // Ignore if instructor cannot read this assignment
          }
        }
        setAssignments(mySubs);
      }
    } catch (err) {
      console.error('Failed to load student dossier', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleVerifyAadhaar = async () => {
    try {
      await apiFetch(`/users/${id}/aadhaar-verify`, {
        method: 'PUT',
        body: JSON.stringify({ aadhaarVerified: 1 }),
      });
      await showSuccess('Verified', 'Aadhaar document marked verified.');
      loadData();
    } catch (err) {
      await showError('Error', err.message || 'Failed to verify');
    }
  };

  const handleResetQuizAttempts = async () => {
    const ok = await showConfirm({
      title: 'Reset Quiz Attempts?',
      text: `Clear all test attempts for ${student?.name || 'this student'}? They will be allowed to retake from attempt 1.`,
      confirmText: 'Reset Attempts',
    });
    if (!ok) return;

    try {
      await apiFetch(`/users/${id}/reset-quiz-attempts`, { method: 'POST' });
      await showSuccess('Reset Complete', 'All quiz attempts for this student have been cleared.');
      loadData();
    } catch (err) {
      await showError('Error', err.message || 'Failed to reset quiz attempts');
    }
  };

  if (loading) return <div className="p-8 text-center text-outline font-mono text-sm">Loading student academic record...</div>;
  if (!student) return (
    <div className="p-8 text-center">
      <p className="text-rose-600 font-medium">Student record not found.</p>
      <Link to="/admin/users" className="mt-4 inline-block text-primary underline text-sm">← Back to User Directory</Link>
    </div>
  );

  return (
    <div className="w-full space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-outline hover:text-primary transition-colors">
        <ArrowLeft size={14} /> Back to User Directory
      </Link>

      {/* Header Dossier Banner */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold font-serif shadow-inner">
              {(student.name || 'S').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-primary">{student.name}</h1>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-mono text-xs rounded uppercase">
                  {student.role || 'Student'}
                </span>
              </div>
              <p className="text-xs font-mono text-outline mt-1">{student.email} • ID: {student._id || student.id}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-on-surface-variant">
                <span>College: <strong>{student.college || '—'}</strong></span>
                <span>•</span>
                <span>Branch: <strong>{student.branch || '—'}</strong></span>
                <span>•</span>
                <span>Semester: <strong>{student.semester || '—'}</strong></span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!student.aadhaarVerified && student.aadhaarCardPath && (
              <button
                onClick={handleVerifyAadhaar}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={14} /> Verify Aadhaar
              </button>
            )}
            <button
              onClick={handleResetQuizAttempts}
              className="px-3.5 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <RotateCcw size={14} /> Reset Quiz Attempts
            </button>
          </div>
        </div>

        {/* Identity & Aadhaar Status Strip */}
        <div className="mt-6 pt-6 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase text-outline">Aadhaar Status:</span>
            {student.aadhaarVerified ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle2 size={13} /> Verified</span>
            ) : student.aadhaarCardPath ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1"><Clock size={13} /> Uploaded, Pending Verification</span>
            ) : (
              <span className="text-rose-700 font-semibold flex items-center gap-1"><XCircle size={13} /> Not Uploaded</span>
            )}
          </div>
          {student.aadhaarCardPath && (
            <a
              href={resolveUrl(student.aadhaarCardPath)}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-mono text-xs flex items-center gap-1"
            >
              <FileText size={13} /> View Uploaded Aadhaar Document ↗
            </a>
          )}
        </div>
      </div>

      {/* Grid of Student Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrolled Courses */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <BookOpen size={16} /> Enrolled Courses ({courses.length})
            </h2>
          </div>
          {courses.length ? (
            <div className="divide-y divide-outline-variant">
              {courses.map(course => (
                <div key={course._id || course.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-on-surface">{course.title}</h3>
                    <p className="text-xs text-outline">{course.category || 'General'} • {course.level || 'All levels'}</p>
                  </div>
                  <span className="font-mono text-xs text-primary font-medium">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-outline py-4 text-center">No enrolled courses on record.</p>
          )}
        </div>

        {/* Issued Certificates */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <Award size={16} /> Credentials & Certificates ({certificates.length})
            </h2>
          </div>
          {certificates.length ? (
            <div className="divide-y divide-outline-variant">
              {certificates.map(cert => (
                <div key={cert._id || cert.certificateId} className="py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-on-surface">{cert.courseTitle || 'Certificate of Completion'}</h3>
                    <p className="text-xs font-mono text-outline">ID: {cert.certificateId}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded font-bold uppercase">
                    Issued
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-outline py-4 text-center">No certificates issued yet.</p>
          )}
        </div>

        {/* Submissions & Grades */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <FileText size={16} /> Assignment Submissions ({assignments.length})
            </h2>
          </div>
          {assignments.length ? (
            <div className="divide-y divide-outline-variant">
              {assignments.map((sub, i) => (
                <div key={sub._id || i} className="py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-on-surface">{sub.assignment?.title || 'Coursework'}</h3>
                    <p className="text-xs text-outline">Status: {sub.status || 'submitted'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {sub.score !== undefined && sub.score !== null ? `${sub.score} / ${sub.assignment?.maxScore || 100}` : 'Ungraded'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-outline py-4 text-center">No assignments submitted yet.</p>
          )}
        </div>

        {/* Quiz Attempts */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <Clock size={16} /> Quiz & Test Attempts ({quizAttempts.length})
            </h2>
          </div>
          {quizAttempts.length ? (
            <div className="divide-y divide-outline-variant">
              {quizAttempts.map((attempt, i) => (
                <div key={attempt._id || i} className="py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-on-surface">{attempt.quizTitle || attempt.testId?.title || 'Quiz Assessment'}</h3>
                    <p className="text-xs text-outline">Attempt #{attempt.attemptNumber || 1}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-semibold ${attempt.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {attempt.score}% ({attempt.passed ? 'Passed' : 'Failed'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-outline py-4 text-center">No test attempts on record.</p>
          )}
        </div>
      </div>
    </div>
  );
}
