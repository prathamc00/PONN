import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, GraduationCap, Award, BookOpen, CheckCircle, Clock, Calendar, ArrowLeft, Activity, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../utils/api';

export default function StudentProfileViewer() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    // We can't fetch *all* global things and filter locally for a production app, but since
    // we don't have dedicated admin endpoints for a specific student's full history, we 
    // fetch the global admin lists and filter them by the student ID.
    Promise.all([
      apiFetch('/users'),
      apiFetch('/courses'),
      apiFetch('/certificates'),
      apiFetch('/assignments/manage'), // We need assignments to get their submissions inside
      apiFetch('/quiz-attempts'),
      apiFetch('/attendance')
    ]).then(async ([userRes, courseRes, certRes, asgRes, quizRes, attRes]) => {
      
      const foundUser = userRes.users?.find((u: any) => u._id === id);
      setStudent(foundUser || null);

      if (foundUser) {
        // Enrolled courses details
        const enrolledIds = foundUser.enrolledCourses || [];
        setCourses(courseRes.courses?.filter((c: any) => enrolledIds.includes(c._id)) || []);

        // Certificates
        setCertificates(certRes.certificates?.filter((c: any) => c.user?._id === id) || []);

        // Quiz bounds
        setQuizAttempts(quizRes.attempts?.filter((q: any) => q.student?._id === id) || []);
        
        // Attendance
        setAttendance(attRes.records?.filter((a: any) => a.student?._id === id) || []);

        // For assignments, we need to fetch submissions for all assignments and filter
        const allAssignments = asgRes.assignments || [];
        const subPromises = allAssignments.map((a: any) => apiFetch(`/assignments/${a._id}/submissions`));
        const subResults = await Promise.allSettled(subPromises);
        
        const mySubs: any[] = [];
        subResults.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const subs = r.value.submissions || [];
            const mySub = subs.find((s: any) => s.student?._id === id);
            if (mySub) mySubs.push({ ...mySub, assignment: allAssignments[i] });
          }
        });
        setAssignments(mySubs);
      }
    }).catch(console.error).finally(() => setLoading(false));

  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading student profile...</div>;
  if (!student) return <div className="p-8 text-center text-rose-400">Student not found.</div>;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-purple/20 to-brand-blue/20" />
        <div className="p-8 relative pt-16 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 rounded-[2rem] bg-brand-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl border-4 border-slate-900 shrink-0">
            {getInitials(student.name)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
              {student.name}
              {student.aadhaarVerified && <CheckCircle className="w-5 h-5 text-emerald-500" title="Aadhaar Verified" />}
            </h1>
            <p className="text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" /> {student.email}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
              {[
                { icon: GraduationCap, label: student.college || 'No college' },
                { icon: BookOpen, label: student.branch || 'No branch' },
                { icon: Calendar, label: student.semester ? `Semester ${student.semester}` : 'No semester' },
                { icon: Phone, label: student.phone || 'No phone' }
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                  <item.icon className="w-3.5 h-3.5" /> {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center min-w-[200px]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Account Status</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              student.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
              student.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {student.approvalStatus === 'pending' ? 'Pending' : student.approvalStatus === 'rejected' ? 'Rejected' : 'Active'}
            </span>
            <p className="text-xs text-slate-400 mt-3 font-medium">Joined {new Date(student.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Enrolled Courses */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" /> Enrolled Courses
            </h2>
            <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-3 py-1 rounded-xl text-xs font-bold">{courses.length}</span>
          </div>
          <div className="space-y-3">
            {courses.length === 0 ? <p className="text-slate-400 text-sm">No courses enrolled.</p> : courses.map(c => (
              <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Certificates
            </h2>
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-xl text-xs font-bold">{certificates.length}</span>
          </div>
          <div className="space-y-3">
            {certificates.length === 0 ? <p className="text-slate-400 text-sm">No certificates earned.</p> : certificates.map(c => (
              <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{c.certificateId}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-600">{c.grade} ({c.scorePercent}%)</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(c.earnedDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-rose-500" /> Assignment Submissions
            </h2>
            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-xl text-xs font-bold">{assignments.length}</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {assignments.length === 0 ? <p className="text-slate-400 text-sm">No submissions.</p> : assignments.map(a => (
              <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{a.assignment?.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{new Date(a.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  {a.grade !== undefined && a.grade !== null ? (
                    <span className="inline-flex flex-col items-end">
                      <span className="text-sm font-bold text-emerald-500">{a.grade} / {a.assignment?.maxGrade || 100}</span>
                      <span className="text-[10px] text-slate-400 cursor-help" title={a.feedback}>Graded</span>
                    </span>
                  ) : (
                    <span className="text-amber-500 text-xs font-bold inline-flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quizzes */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Quiz Attempts
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">{quizAttempts.length}</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {quizAttempts.length === 0 ? <p className="text-slate-400 text-sm">No quizzes attempted.</p> : quizAttempts.map(q => (
              <div key={q._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{q.quiz?.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{new Date(q.completedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm font-bold ${q.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {q.score} / {q.totalMarks}
                  </span>
                  <p className="text-[10px] text-slate-400">{q.passed ? 'Passed' : 'Failed'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
