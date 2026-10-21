import React, { useState, useRef } from 'react';
import { User, Mail, Phone, GraduationCap, Camera, Edit3, Save, ShieldCheck, BadgeCheck, Upload, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../utils/api.js';
import { showError, showSuccess } from '../utils/dialog.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
    branch: user?.branch || '',
    semester: user?.semester || '',
  });

  const getInitials = (name) => (name || 'Student').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleAadhaarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAadhaar(true);
    const formData = new FormData();
    formData.append('aadhaarCard', file);

    try {
      await apiFetch('/auth/me/aadhaar', { method: 'POST', body: formData });
      await showSuccess('Upload Successful', 'Aadhaar card uploaded! Verification pending by admin.');
      window.location.reload();
    } catch (err) {
      await showError('Upload Failed', err.message || 'Failed to upload Aadhaar card');
    } finally {
      setUploadingAadhaar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiFetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await showSuccess('Profile Updated', 'Your profile details have been saved.');
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      await showError('Update Failed', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-outline">Student Account</span>
          <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">My Profile</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage your academic credentials and verified identity documents.</p>
        </div>
        <button
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded font-medium text-sm hover:bg-primary-container transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          {isEditing ? (
            <><Save size={16} /><span>{saving ? 'Saving...' : 'Save Changes'}</span></>
          ) : (
            <><Edit3 size={16} /><span>Edit Profile</span></>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Badge */}
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 text-center shadow-sm">
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-3xl font-bold font-serif mx-auto border-4 border-surface shadow-inner">
                {getInitials(user?.name)}
              </div>
            </div>
            <h2 className="text-xl font-bold text-on-surface">{user?.name || 'Student'}</h2>
            <p className="text-xs font-mono text-outline mt-1">{user?.email}</p>

            <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container text-primary font-mono text-xs rounded-full uppercase tracking-wider font-semibold">
                <ShieldCheck size={14} />
                {user?.role || 'Student'}
              </span>
              {user?.approvalStatus === 'approved' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs rounded-full">
                  <BadgeCheck size={13} /> Approved
                </span>
              )}
            </div>
          </div>

          {/* Aadhaar Verification Panel */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Aadhaar Verification
              </h3>
              {user?.aadhaarVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded font-bold uppercase">
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : user?.aadhaarCardPath ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono rounded font-bold uppercase">
                  <Clock size={12} /> Pending Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono rounded font-bold uppercase">
                  <AlertCircle size={12} /> Not Uploaded
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Upload your government-issued Aadhaar document for official degree and certificate issuance.
            </p>

            {user?.aadhaarCardPath && (
              <div className="mb-4 p-2.5 bg-surface-container rounded border border-outline-variant flex items-center justify-between text-xs">
                <span className="truncate max-w-[180px] font-mono text-outline">aadhaar_document.pdf</span>
                <span className="text-primary font-medium">Uploaded</span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAadhaarUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAadhaar}
              className="w-full py-2.5 px-4 bg-surface hover:bg-surface-container text-on-surface border border-outline-variant rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Upload size={14} />
              <span>{uploadingAadhaar ? 'Uploading...' : user?.aadhaarCardPath ? 'Re-upload Aadhaar' : 'Upload Aadhaar Card'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Profile & Academic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-primary text-base pb-3 border-b border-outline-variant mb-6 flex items-center gap-2">
              <User size={18} /> Personal & Contact Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                ) : (
                  <div className="p-2.5 bg-surface/50 rounded text-sm font-medium text-on-surface">{user?.name || '—'}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1">Email Address (Read-only)</label>
                <div className="p-2.5 bg-surface-container rounded text-sm text-on-surface-variant font-mono">{user?.email || '—'}</div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                ) : (
                  <div className="p-2.5 bg-surface/50 rounded text-sm text-on-surface">{user?.phone || 'Not provided'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-primary text-base pb-3 border-b border-outline-variant mb-6 flex items-center gap-2">
              <GraduationCap size={18} /> Academic Institutional Records
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-outline mb-1">College / Institute</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="Enter College or University Name"
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                ) : (
                  <div className="p-2.5 bg-surface/50 rounded text-sm text-on-surface">{user?.college || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1">Branch / Major</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    placeholder="Computer Science, Electronics, etc."
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                ) : (
                  <div className="p-2.5 bg-surface/50 rounded text-sm text-on-surface">{user?.branch || 'Not specified'}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-outline mb-1">Semester</label>
                {isEditing ? (
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-outline-variant rounded text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-surface/50 rounded text-sm text-on-surface">
                    {user?.semester ? `Semester ${user.semester}` : 'Not specified'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
