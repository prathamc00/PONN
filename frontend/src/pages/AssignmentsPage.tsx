import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Download, Clock, CheckCircle2, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';

interface AssignmentView {
  _id: string;
  title: string;
  course: { _id: string; title: string } | string;
  dueDate: string;
  maxMarks: number;
  type: string;
  submitted: boolean;
  grade?: number;
  feedback?: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignData, subData] = await Promise.all([
          apiFetch('/assignments').catch(() => ({ assignments: [] })),
          apiFetch('/assignments/my-submissions').catch(() => ({ submissions: [] })),
        ]);
        const allAssignments = assignData.assignments || [];
        const submissions = subData.submissions || [];
        const subMap = new Map<string, any>();
        submissions.forEach((s: any) => {
          const aId = typeof s.assignment === 'object' && s.assignment ? s.assignment._id : s.assignment;
          if (aId) subMap.set(aId, s);
        });

        const merged = allAssignments.map((a: any) => {
          const sub = subMap.get(a._id);
          return { ...a, submitted: !!sub, grade: sub?.grade, feedback: sub?.feedback };
        });
        setAssignments(merged);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const getCourseName = (a: AssignmentView) => typeof a.course === 'object' && a.course ? a.course.title : '—';
  const getStatus = (a: AssignmentView) => {
    if (a.grade != null) return 'Graded';
    if (a.submitted) return 'Submitted';
    return 'Pending';
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Academic Tasks</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Your <span className="gradient-text">Assignments</span></h1>
          <p className="text-slate-400 mt-2 font-medium">Manage and submit your course assignments with ease.</p>
        </div>
        <Link to="/assignments/upload"
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg glow-shadow active:scale-95 group">
          <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> New Submission
        </Link>
      </div>

      <div className="glass-panel rounded-[3rem] border-white/5 shadow-2xl overflow-hidden backdrop-blur-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Assignment Title</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Course</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Due Date</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-10 py-16 text-center text-slate-400 font-medium">Loading assignments...</td></tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center border-b-0">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6 glow-shadow border border-brand-blue/20">
                        <FileText className="w-10 h-10 text-brand-blue" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">You're all caught up!</h3>
                      <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">There are no assignments pending for your courses at this time. Enjoy your free time or explore new courses.</p>
                      <Link to="/courses" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 hover:border-white/20 transition-all border border-white/10 active:scale-95 group">
                         Browse Courses <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>
                  </td>
                </tr>
              ) : assignments.map((item, i) => {
                const status = getStatus(item);
                return (
                  <motion.tr key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/5 transition-all group cursor-pointer">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-brand-purple/10 group-hover:text-brand-purple transition-all border border-white/5">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-white group-hover:text-brand-purple transition-colors tracking-tight">{item.title}</span>
                          <p className="text-xs text-slate-500 mt-1">Max: {item.maxMarks} marks</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-sm font-bold text-slate-400">{getCourseName(item)}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                        <Clock className="w-4 h-4 text-brand-purple" />
                        {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        status === 'Submitted' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                        status === 'Graded' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                        'bg-amber-400/10 text-amber-400 border-amber-400/20'
                      }`}>
                        {status === 'Submitted' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         status === 'Pending' ? <AlertCircle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {status} {item.grade != null && `(${item.grade}/${item.maxMarks})`}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      {status === 'Pending' && (
                        <Link to="/assignments/upload"
                          className="px-6 py-2.5 bg-white/5 text-white text-xs font-bold rounded-2xl hover:bg-brand-purple transition-all border border-white/10 inline-flex items-center gap-2">
                          Upload <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
