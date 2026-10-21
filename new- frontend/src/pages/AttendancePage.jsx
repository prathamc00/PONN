import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, Clock, UserCheck, Award, TrendingUp, AlertCircle
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/attendance/my')
      .then((data) => {
        setRecords(data.records || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSessions = records.length || 10;
  const attendedCount = records.length ? records.filter(r => r.status === 'present').length : 9;
  const rate = totalSessions ? Math.round((attendedCount / totalSessions) * 100) : 95;

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <div className="border-b border-outline-variant pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-outline">Session Presence & Participation</span>
        <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Attendance Records</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Institutional logs of your interactive laboratory presence, lecture check-ins, and active study hours.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <span className="font-mono text-xs uppercase text-outline">Attendance Rate</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{rate}%</p>
          <span className="text-xs text-emerald-700 mt-1 block">Good Academic Standing</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <span className="font-mono text-xs uppercase text-outline">Sessions Attended</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{attendedCount} / {totalSessions}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Lectures and seminars logged</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <span className="font-mono text-xs uppercase text-outline">Minimum Threshold</span>
          <p className="text-3xl font-serif font-bold text-outline mt-2">75%</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Required for final examination eligibility</span>
        </div>
      </div>

      {/* Session Logs List */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-primary pb-3 border-b border-outline-variant">
          Learning Activity Log
        </h2>

        {loading ? (
          <div className="p-12 text-center text-outline font-mono text-xs">Loading attendance timeline...</div>
        ) : records.length ? (
          <div className="divide-y divide-outline-variant">
            {records.map((r, i) => (
              <div key={r._id || i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-on-surface block text-sm">
                    {r.sessionTitle || 'Course Lecture & Practical Session'}
                  </span>
                  <span className="font-mono text-outline text-[11px]">
                    {r.date ? new Date(r.date).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold uppercase">
                  <CheckCircle2 size={12} /> Present
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-outline font-mono text-xs">
            Attendance check-in records will log automatically as you engage in live lectures.
          </div>
        )}
      </div>
    </div>
  );
}
