import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, Filter, Download, CheckCircle, XCircle, Trash2, Mail, ChevronLeft, ChevronRight, ShieldCheck, FileText, Plus, RotateCcw, UserCheck, ExternalLink, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../utils/api.js';
import { showConfirm, showSuccess, showError } from '../../utils/dialog.js';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ name: '', email: '', password: '', phone: '' });

  // Bulk Onboarding State
  const [courses, setCourses] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    apiFetch('/courses')
      .then((data) => setCourses(data.courses || []))
      .catch(() => setCourses([]));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkCsvText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) {
      showError('Empty Data', 'Please paste CSV lines or upload a CSV file.');
      return;
    }

    const lines = bulkCsvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const students = [];

    // Skip header line if it contains "email"
    const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        students.push({
          name: parts[0],
          email: parts[1],
          college: parts[2] || 'CRISMATECH Academy',
          branch: parts[3] || 'Computer Science',
          phone: parts[4] || '',
          password: parts[5] || 'Crismatech@2026',
        });
      }
    }

    if (!students.length) {
      showError('Parsing Error', 'No valid student records found. Expected format: Name, Email, College, Branch');
      return;
    }

    setBulkLoading(true);
    try {
      const res = await apiFetch('/users/bulk-import', {
        method: 'POST',
        body: JSON.stringify({
          students,
          courseId: selectedCourseId || null,
        }),
      });

      await showSuccess('Import Complete', res.message || `Processed ${students.length} student records.`);
      setShowBulkModal(false);
      setBulkCsvText('');
      loadUsers();
    } catch (err) {
      showError('Import Error', err.message || 'Failed to process bulk import.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiFetch(`/users/${id}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ approvalStatus: 'approved' }),
      });
      await showSuccess('Approved', 'Instructor has been approved.');
      loadUsers();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await apiFetch(`/users/${id}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ approvalStatus: 'rejected' }),
      });
      await showSuccess('Rejected', 'Instructor status set to rejected.');
      loadUsers();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleVerifyAadhaar = async (id) => {
    try {
      await apiFetch(`/users/${id}/aadhaar-verify`, {
        method: 'PUT',
        body: JSON.stringify({ aadhaarVerified: 1 }),
      });
      await showSuccess('Verified', 'Aadhaar document marked verified.');
      loadUsers();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await showConfirm({
      title: 'Delete User?',
      text: `Are you sure you want to permanently delete ${name}? All their enrollments and submissions will be removed.`,
      confirmText: 'Delete User',
    });
    if (!ok) return;

    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      await showSuccess('Deleted', 'User removed successfully.');
      loadUsers();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await apiFetch('/users/instructors', {
        method: 'POST',
        body: JSON.stringify(newInstructor),
      });
      await showSuccess('Instructor Added', 'New instructor account created and pre-approved.');
      setShowAddModal(false);
      setNewInstructor({ name: '', email: '', password: '', phone: '' });
      loadUsers();
    } catch (err) {
      showError('Failed to Create', err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleExportCSV = () => {
    const data = filteredUsers.map(u => ({
      ID: u._id || u.id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      College: u.college || '',
      Branch: u.branch || '',
      Semester: u.semester || '',
      Phone: u.phone || '',
      ApprovalStatus: u.approvalStatus || 'approved',
      AadhaarVerified: u.aadhaarVerified ? 'Yes' : 'No',
      Joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `crismatech_users_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.college || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const studentsCount = users.filter(u => u.role === 'student').length;
  const instructorsCount = users.filter(u => u.role === 'instructor').length;
  const pendingApprovals = users.filter(u => u.role === 'instructor' && u.approvalStatus === 'pending').length;

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Platform Administration</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">User Directory</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage enrolled students, instructor credentials, and government identity verifications.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 bg-[#ea580c]/10 hover:bg-[#ea580c]/15 text-[#ea580c] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#ea580c]/20 shadow-2xs"
          >
            <Upload size={14} /> Bulk Onboard Students
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus size={14} /> Add Instructor
          </button>
        </div>
      </div>

      {/* Metric summary strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <span className="font-mono text-xs uppercase text-outline">Enrolled Students</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{studentsCount}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Active learners across tracks</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <span className="font-mono text-xs uppercase text-outline">Faculty & Instructors</span>
          <p className="text-3xl font-serif font-bold text-primary mt-2">{instructorsCount}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Course authors & evaluators</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <span className="font-mono text-xs uppercase text-outline">Pending Instructor Approvals</span>
          <p className="text-3xl font-serif font-bold text-amber-700 mt-2">{pendingApprovals}</p>
          <span className="text-xs text-on-surface-variant mt-1 block">Awaiting admin authorization</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-3 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-outline" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-outline-variant rounded text-xs font-mono uppercase text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="student">Students ({studentsCount})</option>
            <option value="instructor">Instructors ({instructorsCount})</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-outline font-mono text-xs">Loading user accounts...</div>
        ) : filteredUsers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant font-mono uppercase text-outline text-[11px]">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role & Status</th>
                  <th className="p-4">Academic Institutional Info</th>
                  <th className="p-4">Aadhaar Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredUsers.map((u) => {
                  const uid = u._id || u.id;
                  return (
                    <tr key={uid} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4">
                        <Link to={`/admin/users/${uid}`} className="font-semibold text-primary hover:underline flex items-center gap-1.5 text-sm">
                          {u.name} <ExternalLink size={12} className="text-outline" />
                        </Link>
                        <span className="font-mono text-outline text-[11px] block mt-0.5">{u.email}</span>
                        {u.phone && <span className="font-mono text-outline text-[10px] block">{u.phone}</span>}
                      </td>

                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 bg-surface-container font-mono text-[10px] rounded uppercase font-semibold text-on-surface">
                          {u.role}
                        </span>
                        {u.role === 'instructor' && (
                          <div className="mt-1">
                            {u.approvalStatus === 'approved' ? (
                              <span className="text-emerald-700 font-mono text-[10px]">● Approved</span>
                            ) : u.approvalStatus === 'rejected' ? (
                              <span className="text-rose-700 font-mono text-[10px]">● Rejected</span>
                            ) : (
                              <span className="text-amber-700 font-mono text-[10px]">● Pending Approval</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="block text-on-surface font-medium">{u.college || '—'}</span>
                        <span className="block text-outline text-[11px]">
                          {u.branch ? `${u.branch}` : ''} {u.semester ? `• Sem ${u.semester}` : ''}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.aadhaarVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold uppercase">
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : u.aadhaarCardPath ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono text-[10px] font-bold uppercase">
                              Uploaded
                            </span>
                            <button
                              onClick={() => handleVerifyAadhaar(uid)}
                              className="block text-primary hover:underline font-mono text-[10px]"
                            >
                              Verify Now →
                            </button>
                          </div>
                        ) : (
                          <span className="text-outline text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {u.role === 'instructor' && u.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(uid)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(uid)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          to={`/admin/users/${uid}`}
                          className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded text-[11px] font-medium inline-block"
                        >
                          View Profile
                        </Link>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(uid, u.name)}
                            className="p-1 text-outline hover:text-rose-600 transition-colors inline-block"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
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
          <div className="p-12 text-center text-outline font-mono text-xs">No users match your filter criteria.</div>
        )}
      </div>

      {/* Add Instructor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h2 className="text-lg font-serif font-bold text-primary">Add Faculty Instructor</h2>
              <button onClick={() => setShowAddModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>

            <form onSubmit={handleCreateInstructor} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-outline mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newInstructor.name}
                  onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                  placeholder="Dr. Rajesh Kumar"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                  placeholder="instructor@crismatech.com"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Default Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newInstructor.password}
                  onChange={(e) => setNewInstructor({ ...newInstructor, password: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-outline mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newInstructor.phone}
                  onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded text-on-surface text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium shadow-sm"
                >
                  {adding ? 'Creating...' : 'Create Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BULK STUDENT ONBOARDING MODAL ────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ea580c]/10 text-[#ea580c] flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Bulk Onboard Students</h3>
                  <p className="text-xs text-slate-500">Create multiple student accounts and enroll them in batch.</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              {/* Optional Course Enrollment */}
              <div>
                <label className="block font-mono uppercase text-slate-400 text-[10px] font-semibold mb-1.5">
                  Target Curriculum to Auto-Enroll (Optional)
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#ea580c]"
                >
                  <option value="">No Course (Account Creation Only)</option>
                  {courses.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.title} ({c.category || 'Technology'})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Dropzone */}
              <div>
                <label className="block font-mono uppercase text-slate-400 text-[10px] font-semibold mb-1.5">
                  Upload CSV Spreadsheet
                </label>
                <div className="p-4 border-2 border-dashed border-slate-200 hover:border-[#ea580c]/40 rounded-2xl text-center bg-slate-50/60 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ea580c] file:text-white hover:file:bg-[#c2410c] cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                    Accepts .csv format: Name, Email, College, Branch, Phone
                  </span>
                </div>
              </div>

              {/* Direct Paste CSV Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-mono uppercase text-slate-400 text-[10px] font-semibold">
                    Or Paste Comma-Separated Rows
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">1 row per student</span>
                </div>
                <textarea
                  rows={5}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder={`Rahul Verma, rahul@gmail.com, IIT Delhi, Computer Science, 9876543210\nSneha Patel, sneha@gmail.com, BITS Pilani, AI & Machine Learning, 9876543211`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#ea580c] transition-all"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-relaxed font-mono">
                Default password for new accounts is <strong>Crismatech@2026</strong>. Students can log in immediately.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="px-5 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {bulkLoading ? 'Processing Batch...' : 'Import & Enroll Batch →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
