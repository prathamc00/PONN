import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, Upload, ArrowRight, Award, AlertCircle
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/assignments').catch(() => ({ assignments: [] })),
      apiFetch('/assignments/my-submissions').catch(() => ({ submissions: [] })),
    ]).then(([asgRes, subRes]) => {
      setAssignments(asgRes.assignments || []);
      setSubmissions(subRes.submissions || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Coursework & Deliverables</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">My Assignments</h1>
          <p className="text-on-surface-variant text-sm mt-1">Submit required project files, case studies, and code for instructor grading.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-outline font-mono text-xs">Loading course assignments...</div>
        ) : assignments.length ? (
          assignments.map((asg) => {
            const aId = asg._id || asg.id;
            const sub = submissions.find(s => String(s.assignmentId) === String(aId));
            const isSubmitted = !!sub;
            const isGraded = sub && sub.score !== undefined && sub.score !== null;

            return (
              <div
                key={aId}
                className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-outline font-mono">
                    <span className="px-2 py-0.5 bg-surface-container rounded uppercase text-[10px]">
                      {asg.type?.replace('_', ' ') || 'File Upload'}
                    </span>
                    <span>Max: {asg.maxScore || 100} pts</span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-primary mt-3">{asg.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-3 mt-2 leading-relaxed">
                    {asg.description || 'Deliver project artifacts according to specifications.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between text-xs font-mono">
                    <span className="text-outline">Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'Self-paced'}</span>
                    {isGraded ? (
                      <span className="text-emerald-700 font-bold">Graded: {sub.score} / {asg.maxScore || 100}</span>
                    ) : isSubmitted ? (
                      <span className="text-amber-700 font-medium">Under Review</span>
                    ) : (
                      <span className="text-rose-700 font-medium">Pending Submission</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between">
                  {isSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium font-mono">
                      <CheckCircle2 size={14} /> Submitted
                    </span>
                  ) : (
                    <Link
                      to={`/assignments/upload?assignmentId=${aId}`}
                      className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Upload size={14} /> Submit Work →
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-16 text-center space-y-3 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
            <FileText size={32} className="text-outline mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary">No Assignments Active</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              Your enrolled courses do not currently have any pending assignments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
