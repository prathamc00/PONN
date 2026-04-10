import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Search, RefreshCw, LogIn, Play, BookOpen, CheckCircle2, Library, Filter, Download, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../utils/api';

interface ActivityRecord {
  _id: string;
  activityType: 'login' | 'video_watch' | 'material_access' | 'module_complete';
  details: string;
  createdAt: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  course?: {
    _id: string;
    title: string;
  };
}

const ACTIVITY_META: Record<string, { label: string; icon: React.FC<any>; color: string; bg: string; border: string }> = {
  login: {
    label: 'Logged In',
    icon: LogIn,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/20',
  },
  video_watch: {
    label: 'Watched Video',
    icon: Play,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
  material_access: {
    label: 'Accessed Material',
    icon: Library,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  module_complete: {
    label: 'Completed Module',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityFeed() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await apiFetch('/attendance');
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to load activity feed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const filtered = records.filter(r => {
    const matchType = typeFilter === 'all' || r.activityType === typeFilter;
    const matchSearch = [r.student?.name, r.student?.email, r.course?.title, r.details]
      .some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchType && matchSearch;
  });

  const uniqueStudents = new Set(records.map(r => r.student?._id)).size;
  // "Active today" = activity in last 24h
  const todayCount = records.filter(r => (Date.now() - new Date(r.createdAt).getTime()) < 86400000).length;

  const handleExport = () => {
    const header = 'Student,Email,Activity,Course,Details,Time\n';
    const rows = filtered.map(r =>
      `"${r.student?.name}","${r.student?.email}","${ACTIVITY_META[r.activityType]?.label}","${r.course?.title || ''}","${r.details || ''}","${new Date(r.createdAt).toLocaleString()}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'activity_feed.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Activity Feed</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Real-time log of student actions across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            {autoRefresh ? 'Live' : 'Auto Refresh'}
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: records.length, icon: Activity, color: 'text-brand-purple bg-brand-purple/10' },
          { label: 'Events Today', value: todayCount, icon: BookOpen, color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400' },
          { label: 'Unique Students', value: uniqueStudents, icon: Users, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' },
          { label: 'Completed Modules', value: records.filter(r => r.activityType === 'module_complete').length, icon: CheckCircle2, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, course..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'login', 'video_watch', 'material_access', 'module_complete'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  typeFilter === type
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : ACTIVITY_META[type]?.label || type}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="px-6 py-16 text-center text-slate-400 text-sm">Loading activity feed...</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No activity found</p>
              <p className="text-slate-500 text-xs mt-1">Student actions will appear here when they use the platform.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((record, i) => {
                const meta = ACTIVITY_META[record.activityType];
                const Icon = meta?.icon || Activity;
                return (
                  <motion.div
                    key={record._id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i < 20 ? i * 0.02 : 0 }}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-white text-xs font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                      {record.student?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                    </div>

                    {/* Activity badge */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${meta?.bg} ${meta?.border}`}>
                      <Icon className={`w-4 h-4 ${meta?.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {record.student?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className={`text-xs font-bold ${meta?.color}`}>{meta?.label}</span>
                        {record.course && (
                          <>
                            <span className="text-xs text-slate-400">in</span>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                              {record.course.title}
                            </span>
                          </>
                        )}
                      </div>
                      {record.details && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{record.details}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{record.student?.email}</p>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                      {timeAgo(record.createdAt)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Showing {filtered.length} of {records.length} events</p>
          {autoRefresh && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Refreshing every 15s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
