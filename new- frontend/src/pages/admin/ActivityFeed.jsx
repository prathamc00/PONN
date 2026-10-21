import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, UserCheck, FileText, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api.js';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/users').catch(() => ({ users: [] })),
      apiFetch('/tests/my-attempts').catch(() => ({ attempts: [] })),
      apiFetch('/certificates').catch(() => ({ certificates: [] })),
    ]).then(([uRes, tRes, cRes]) => {
      const feed = [];

      (uRes.users || []).forEach(u => {
        feed.push({
          id: `u-${u._id || u.id}`,
          type: 'user_registered',
          title: 'New Student Enrollment',
          description: `${u.name} registered on the platform (${u.college || 'Direct'}).`,
          date: u.createdAt || new Date(),
        });
      });

      (tRes.attempts || []).forEach(a => {
        feed.push({
          id: `t-${a._id || Math.random()}`,
          type: 'quiz_submitted',
          title: `Quiz Examination: ${a.quizTitle || 'Assessment'}`,
          description: `Score recorded: ${a.score}% (${a.passed ? 'PASSED' : 'FAILED'}).`,
          date: a.completedAt || new Date(),
        });
      });

      (cRes.certificates || []).forEach(c => {
        feed.push({
          id: `c-${c._id || c.certificateId}`,
          type: 'certificate_issued',
          title: 'Official Credential Issued',
          description: `Issued ID ${c.certificateId} for ${c.courseTitle || 'Course'}.`,
          date: c.issuedAt || new Date(),
        });
      });

      feed.sort((a, b) => new Date(b.date) - new Date(a.date));
      setActivities(feed);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <div className="border-b border-outline-variant pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-outline">Audit Trail & Security Telemetry</span>
        <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Activity Feed</h1>
        <p className="text-on-surface-variant text-sm mt-1">Real-time audit log of student registrations, submissions, and cryptographic certifications.</p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-outline font-mono text-xs">Loading platform audit logs...</div>
        ) : activities.length ? (
          <div className="relative border-l-2 border-outline-variant pl-6 ml-4 space-y-8">
            {activities.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-sm" />
                <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      {item.title}
                    </span>
                    <span className="font-mono text-outline text-[10px]">
                      {new Date(item.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface mt-2 font-medium leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-outline font-mono text-xs">No recorded platform activity yet.</div>
        )}
      </div>
    </div>
  );
}
