import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  Plus, 
  Search, 
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const stats = [
  { label: 'Total Students', value: '1,284', icon: Users, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400', trend: '+12%' },
  { label: 'Active Courses', value: '24', icon: BookOpen, color: 'from-brand-purple/20 to-brand-blue/20', iconColor: 'text-brand-purple', trend: '+3' },
  { label: 'Assignments', value: '156', icon: FileText, color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400', trend: '+42' },
  { label: 'Tests Conducted', value: '89', icon: ClipboardCheck, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400', trend: '+8%' },
];

const recentActivities = [
  { id: 1, type: 'registration', user: 'Alice Johnson', detail: 'Enrolled in IoT Fundamentals', time: '2 mins ago', icon: Users, color: 'text-blue-400' },
  { id: 2, type: 'submission', user: 'Bob Smith', detail: 'Submitted Assignment 3', time: '15 mins ago', icon: FileText, color: 'text-amber-400' },
  { id: 3, type: 'test', user: 'Charlie Brown', detail: 'Completed Cloud Computing Test', time: '1 hour ago', icon: ClipboardCheck, color: 'text-purple-400' },
  { id: 4, type: 'course', user: 'Admin', detail: 'Added new course: Machine Learning', time: '3 hours ago', icon: BookOpen, color: 'text-brand-purple' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-brand-purple/10 rounded-lg border border-brand-purple/20">
              <ShieldCheck className="w-5 h-5 text-brand-purple" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-purple">System Administrator</span>
          </motion.div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
            Command <span className="gradient-text">Center</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
            Orchestrate your academic ecosystem with advanced analytics and real-time management tools.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all active:scale-95">
            <Download className="w-5 h-5" /> Export Data
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg glow-shadow active:scale-95 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add New Course
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 rounded-[3rem] border-white/5 shadow-xl backdrop-blur-3xl group hover:border-white/10 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-purple/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-[1.5rem] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">{stat.trend}</span>
                </div>
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-10"
        >
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-[2rem] border border-white/5 w-fit backdrop-blur-xl">
            {['overview', 'students', 'courses', 'tests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-[1.5rem] text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-lg glow-shadow' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-[3.5rem] border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl">
            <div className="p-10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-purple/20 rounded-2xl flex items-center justify-center border border-brand-purple/20">
                  <Users className="w-6 h-6 text-brand-purple" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Active Students</h2>
                  <p className="text-slate-500 text-xs font-medium">Real-time enrollment monitoring</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-purple transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm text-white outline-none focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 transition-all w-full sm:w-72 placeholder:text-slate-600 font-bold"
                  />
                </div>
                <button className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Identity</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Program</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Status</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Performance</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: 'Alice Johnson', email: 'alice@example.com', course: 'IoT Fundamentals', status: 'Active', grade: '92%' },
                    { name: 'Bob Smith', email: 'bob@example.com', course: 'Web Technologies', status: 'Pending', grade: '78%' },
                    { name: 'Charlie Brown', email: 'charlie@example.com', course: 'Cloud Computing', status: 'Active', grade: '85%' },
                    { name: 'Diana Prince', email: 'diana@example.com', course: 'Machine Learning', status: 'Active', grade: '96%' },
                    { name: 'Ethan Hunt', email: 'ethan@example.com', course: 'Cyber Security', status: 'Inactive', grade: '64%' },
                  ].map((student, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 rounded-2xl flex items-center justify-center text-sm font-bold text-white border border-white/5 group-hover:scale-110 transition-transform duration-500">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="text-base font-bold text-white tracking-tight block">{student.name}</span>
                            <span className="text-slate-500 text-xs font-medium">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-sm font-bold text-slate-300 tracking-tight">{student.course}</span>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border ${
                          student.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : student.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-20">
                            <div 
                              className="h-full bg-gradient-to-r from-brand-purple to-brand-blue"
                              style={{ width: student.grade }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white">{student.grade}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Area */}
        <div className="space-y-10">
          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel p-10 rounded-[3.5rem] border-white/5 shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-brand-blue/20 rounded-2xl flex items-center justify-center border border-brand-blue/20">
                <LayoutDashboard className="w-6 h-6 text-brand-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Operations</h2>
            </div>
            <div className="grid gap-5">
              {[
                { label: 'Upload Materials', icon: BookOpen, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
                { label: 'Create Assignment', icon: FileText, color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
                { label: 'New Online Test', icon: ClipboardCheck, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
                { label: 'Issue Certificates', icon: TrendingUp, color: 'from-brand-purple/20 to-brand-blue/20', iconColor: 'text-brand-purple' },
              ].map((action, i) => (
                <button key={i} className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-brand-purple/30 hover:bg-white/10 transition-all group">
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                    <action.icon className={`w-7 h-7 ${action.iconColor}`} />
                  </div>
                  <span className="font-bold text-slate-300 group-hover:text-white transition-colors tracking-tight text-lg">{action.label}</span>
                  <ArrowUpRight className="w-5 h-5 ml-auto text-slate-600 group-hover:text-brand-purple transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel p-10 rounded-[3.5rem] border-white/5 shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Activity Log</h2>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-widest text-brand-purple hover:underline">View All</button>
            </div>
            
            <div className="space-y-8">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-5 group">
                  <div className="relative">
                    <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 relative z-10 group-hover:border-brand-purple/30 transition-colors`}>
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    {activity.id !== recentActivities.length && (
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-8 bg-white/5" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white tracking-tight">{activity.user}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{activity.time}</span>
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
