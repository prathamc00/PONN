import React, { useState, useEffect } from 'react';
import { Award, Search, Download, CheckCircle, Trash2, X, BookOpen, GraduationCap, Calendar, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../utils/api';

interface Certificate {
  _id: string;
  certificateId: string;
  title: string;
  type: string;
  grade: string;
  scorePercent: number;
  earnedDate: string;
  user: {
    _id: string;
    name: string;
    email: string;
    college?: string;
    branch?: string;
  };
  course: {
    _id: string;
    title: string;
    category: string;
    instructor?: string;
    level?: string;
  };
}

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/certificates');
      setCertificates(data.certificates || []);
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCertificates(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this certificate? This cannot be undone.')) return;
    try {
      await apiFetch(`/certificates/${id}`, { method: 'DELETE' });
      setCertificates(prev => prev.filter(c => c._id !== id));
      setSelectedCert(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const header = 'Certificate ID,Student Name,Email,College,Branch,Course,Category,Grade,Score (%),Earned Date\n';
    const rows = certificates.map(c =>
      `"${c.certificateId}","${c.user?.name || ''}","${c.user?.email || ''}","${c.user?.college || ''}","${c.user?.branch || ''}","${c.course?.title || ''}","${c.course?.category || ''}","${c.grade || ''}","${c.scorePercent ?? ''}","${new Date(c.earnedDate).toLocaleDateString()}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificates_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = certificates.filter(c =>
    [c.user?.name, c.user?.email, c.course?.title, c.certificateId]
      .some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getGradeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (grade === 'B+') return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
    if (grade === 'B') return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Certificates</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">View and manage all student-earned certificates.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Certificates', value: certificates.length, icon: Award, color: 'text-brand-purple bg-brand-purple/10' },
          { label: 'A / A+ Grades', value: certificates.filter(c => ['A', 'A+'].includes(c.grade)).length, icon: Medal, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20' },
          { label: 'Unique Students', value: new Set(certificates.map(c => c.user?._id)).size, icon: GraduationCap, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, course, or certificate ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Student', 'Course', 'Certificate ID', 'Grade', 'Score', 'Earned Date', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No certificates found</p>
                </td></tr>
              ) : (
                filtered.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{cert.user?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{cert.user?.email || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[200px]">{cert.course?.title || '—'}</p>
                        <p className="text-xs text-slate-400">{cert.course?.category || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-lg border border-brand-purple/20">
                        {cert.certificateId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeColor(cert.grade)}`}>
                        {cert.grade || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{cert.scorePercent ?? '—'}%</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {cert.earnedDate ? new Date(cert.earnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-100 transition-colors"
                          title="View Details"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                          title="Revoke Certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500">Showing {filtered.length} of {certificates.length} certificates</p>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8 max-w-lg w-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-purple/20 border border-brand-purple/30 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-brand-purple" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Certificate Detail</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedCert.certificateId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCert(null)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { icon: GraduationCap, label: 'Student', value: `${selectedCert.user?.name} (${selectedCert.user?.email})` },
                  { icon: GraduationCap, label: 'College / Branch', value: [selectedCert.user?.college, selectedCert.user?.branch].filter(Boolean).join(' — ') || 'Not specified' },
                  { icon: BookOpen, label: 'Course', value: selectedCert.course?.title },
                  { icon: BookOpen, label: 'Category', value: selectedCert.course?.category },
                  { icon: Medal, label: 'Grade', value: `${selectedCert.grade} (${selectedCert.scorePercent}%)` },
                  { icon: Calendar, label: 'Earned On', value: new Date(selectedCert.earnedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleDelete(selectedCert._id)}
                className="mt-6 w-full px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Revoke Certificate
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
