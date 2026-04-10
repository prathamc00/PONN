import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Sparkles, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/attendance/my')
      .then(data => setRecords(data.records || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const total = records.length;
  const uniqueCourses = new Set(records.map(r => r.course?._id).filter(Boolean)).size;
  const loginEvents = records.filter(r => r.activityType === 'login').length;

  const activityLabel = (type: string) => {
    const map: Record<string, string> = {
      login: 'Enrolled / Logged In',
      video_watch: 'Watched Video',
      material_access: 'Accessed Material',
      module_complete: 'Completed Module',
    };
    return map[type] || type;
  };

  const activityColour = (type: string) => {
    const map: Record<string, string> = {
      login: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
      video_watch: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
      material_access: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      module_complete: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
    };
    return map[type] || 'bg-white/5 text-slate-400 border-white/10';
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Presence Tracking</span>
        </motion.div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Your <span className="gradient-text">Attendance</span></h1>
        <p className="text-slate-400 mt-2 font-medium leading-relaxed">Activity log based on your enrollments and course interactions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Activities', value: total, icon: BookOpen, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
          { label: 'Courses Attended', value: uniqueCourses, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Enrollments', value: loginEvents, icon: TrendingUp, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-panel p-8 rounded-[2.5rem] border-white/5 shadow-xl relative overflow-hidden group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/5`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h2 className={`text-4xl font-bold tracking-tighter ${stat.color}`}>{loading ? '—' : stat.value}</h2>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all" />
          </motion.div>
        ))}
      </div>

      {/* Activity Table */}
      <div className="glass-panel rounded-[3rem] border-white/5 shadow-2xl overflow-hidden backdrop-blur-2xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium">Loading your activity...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-slate-600" />
            <p className="text-slate-400 font-medium">No activity yet.<br/>Enroll in a course to start tracking your attendance!</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Course</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Time</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((item, i) => (
                  <motion.tr
                    key={item._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-brand-purple/10 group-hover:text-brand-purple transition-all border border-white/5">
                          <Calendar className="w-7 h-7" />
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                        {item.course?.title || 'General'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                        <Clock className="w-4 h-4 text-brand-purple" />
                        {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${activityColour(item.activityType)}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {activityLabel(item.activityType)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
