import React, { useState, useEffect } from 'react';
import {
  Award, Plus, Trash2, Search, CheckCircle, ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: '',
    courseId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [certRes, userRes, courseRes] = await Promise.all([
        apiFetch('/certificates').catch(() => ({ certificates: [] })),
        apiFetch('/users').catch(() => ({ users: [] })),
        apiFetch('/courses').catch(() => ({ courses: [] })),
      ]);
      setCertificates(certRes.certificates || []);
      setUsers((userRes.users || []).filter(u => u.role === 'student'));
      setCourses(courseRes.courses || []);
      if (userRes.users?.length && courseRes.courses?.length && !form.userId) {
        setForm({
          userId: userRes.users[0]._id || userRes.users[0].id,
          courseId: courseRes.courses[0]._id || courseRes.courses[0].id,
        });
      }
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await showSuccess('Issued', 'Degree certificate issued and securely hashed.');
      setShowModal(false);
      loadData();
    } catch (err) {
      showError('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id, certId) => {
    const ok = await showConfirm({
      title: 'Revoke Certificate?',
      text: `Are you sure you want to revoke certificate ${certId}? It will no longer be available to the student.`,
      confirmText: 'Revoke',
    });
    if (!ok) return;

    try {
      await apiFetch(`/certificates/${id}/revoke`, { method: 'PUT' });
      await showSuccess('Revoked', 'Certificate status updated.');
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Issued Academic Records</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Certificates Desk</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Issue, review, and revoke student course certificates.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Plus size={14} /> Manually Issue Certificate
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-outline font-mono text-xs">Loading certificate ledgers...</div>
        ) : certificates.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant font-mono uppercase text-outline text-[11px]">
                <tr>
                  <th className="p-4">Certificate ID & Hash</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Curriculum Track</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {certificates.map((cert) => {
                  const cId = cert._id || cert.id;
                  const isRevoked = cert.isRevoked || cert.status === 'revoked';
                  return (
                    <tr key={cId} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-primary block text-sm">
                          {cert.certificateId}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-on-surface block text-sm">
                          {cert.studentName || cert.user?.name || 'Student'}
                        </span>
                        <span className="font-mono text-outline text-[11px] block">
                          {cert.studentEmail || cert.user?.email || '—'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-on-surface">
                          {cert.courseTitle || 'Technology Program'}
                        </span>
                      </td>

                      <td className="p-4">
                        {isRevoked ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-mono text-[10px] font-bold uppercase">
                            Revoked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                            <ShieldCheck size={11} /> Valid
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-outline text-[11px]">
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevoke(cId, cert.certificateId)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3 bg-surface-container-low border border-dashed border-outline-variant rounded-xl">
            <Award size={32} className="text-outline mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary">No Certificates Issued Yet</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              Certificates are generated automatically when students score 40% or more on course exams, or can be issued manually above.
            </p>
          </div>
        )}
      </div>

      {/* Manual Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h2 className="text-lg font-serif font-bold text-primary">Issue Academic Certificate</h2>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-outline mb-1">Select Student</label>
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                >
                  {users.map(u => (
                    <option key={u._id || u.id} value={u._id || u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Select Course</label>
                <select
                  required
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                >
                  {courses.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium shadow-sm cursor-pointer"
                >
                  {submitting ? 'Issuing...' : 'Generate Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
