import React, { useState, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Camera, Edit3, Save, Sparkles, ShieldCheck, BadgeCheck, Upload, FileText, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { showError, showSuccess } from '../utils/dialog';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = {
    name: user?.name || 'Student',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    branch: user?.branch || '',
    semester: user?.semester ? `Semester ${user.semester}` : '',
    dob: '',
    address: '',
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleAadharUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAadhar(true);
    const formData = new FormData();
    formData.append('aadhaarCard', file);

    try {
      await apiFetch('/auth/me/aadhaar', { method: 'POST', body: formData });
      await showSuccess('Upload successful', 'Aadhar card uploaded successfully! Pending admin verification.');
      window.location.reload();
    } catch (err: any) {
      await showError('Upload failed', err.message || 'Upload failed');
    } finally {
      setUploadingAadhar(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">User Profile</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Personal <span className="gradient-text">Account</span></h1>
          <p className="text-slate-400 mt-2 font-medium leading-relaxed">Manage your personal information and academic credentials.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg glow-shadow active:scale-95 group ${
            isEditing ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-gradient-to-r from-brand-purple to-brand-blue text-white'
          }`}
        >
          {isEditing ? <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-10 rounded-[3rem] border-white/5 shadow-2xl text-center relative overflow-hidden backdrop-blur-3xl group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-purple to-brand-blue" />
            <div className="relative inline-block mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 rounded-full flex items-center justify-center text-5xl font-bold text-white border-4 border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl group-hover:scale-105 transition-transform duration-500">
                {getInitials(profile.name)}
              </div>
              <button className="absolute bottom-2 right-2 p-3.5 bg-brand-purple text-white rounded-2xl border-4 border-slate-900 shadow-xl hover:scale-110 transition-transform glow-shadow">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h2>
              <BadgeCheck className="w-5 h-5 text-brand-blue" />
            </div>
            <p className="text-slate-400 font-medium text-sm mb-8">{profile.branch}{profile.semester && ` • ${profile.semester}`}</p>
            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-white/5 text-brand-purple rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/5">
              <ShieldCheck className="w-4 h-4" />
              {user?.role || 'student'}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-panel p-8 rounded-[2.5rem] border-white/5 shadow-xl backdrop-blur-2xl">
            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2 tracking-tight">
              <GraduationCap className="w-5 h-5 text-brand-purple" /> Academic Info
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm group">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-brand-purple transition-colors border border-white/5">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Institution</p>
                  <span className="text-slate-300 font-medium">{profile.college || 'Not specified'}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm group">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-brand-purple transition-colors border border-white/5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined</p>
                  <span className="text-slate-300 font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-blue" /> Identity Verification
              </h3>
              
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleAadharUpload} />
              
              {user?.aadhaarCardPath ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-400">Aadhaar Uploaded</p>
                      <p className="text-xs text-emerald-500 font-medium">
                        {user.aadhaarVerified ? 'Verified' : 'Verification Pending'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                    Re-upload
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAadhar}
                  className="w-full p-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-purple/50 hover:bg-brand-purple/5 transition-all group"
                >
                  <Upload className={`w-6 h-6 ${uploadingAadhar ? 'animate-bounce text-brand-purple' : 'text-slate-500 group-hover:text-brand-purple'}`} />
                  <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                    {uploadingAadhar ? 'Uploading...' : 'Upload Aadhaar Card'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">PDF, JPG, PNG (Max 5MB)</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Details Form UI & Gamification Badges */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-panel p-10 md:p-14 rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-8">Personal Details</h3>
            <div className="grid md:grid-cols-2 gap-10">
              {[
                { label: 'Full Name', icon: User, value: profile.name, type: 'text' },
                { label: 'Email Address', icon: Mail, value: profile.email, type: 'email' },
                { label: 'Phone Number', icon: Phone, value: profile.phone, type: 'text' },
                { label: 'College', icon: GraduationCap, value: profile.college, type: 'text' },
              ].map((field, i) => (
                <div key={i} className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{field.label}</label>
                  <div className={`flex items-center gap-4 p-4 bg-white/5 border rounded-2xl transition-all ${
                    isEditing ? 'border-brand-purple/30 bg-white/10' : 'border-white/5'
                  }`}>
                    <field.icon className={`w-5 h-5 ${isEditing ? 'text-brand-purple' : 'text-slate-500'}`} />
                    <input type={field.type} disabled={!isEditing} defaultValue={field.value}
                      className="bg-transparent border-none outline-none text-white font-bold w-full disabled:text-slate-400 placeholder:text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gamification: Achievements/Badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel p-10 md:p-14 rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-8 flex items-center gap-3">
              <Award className="w-6 h-6 text-brand-purple" /> Your Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'First Goal', icon: Sparkles, color: 'text-brand-purple', bg: 'bg-brand-purple/10', border: 'border-brand-purple/20', unlocked: true },
                { label: 'Fast Learner', icon: Award, color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/20', unlocked: true },
                { label: 'Perfect Score', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', unlocked: false },
                { label: 'Top 10%', icon: User, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', unlocked: false }
              ].map((badge, i) => (
                <div key={i} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all ${
                  badge.unlocked ? `${badge.bg} ${badge.border} glow-shadow hover:scale-105 cursor-pointer` : 'bg-white/5 border-white/5 opacity-50 grayscale'
                }`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${badge.unlocked ? `${badge.bg} ${badge.border}` : 'bg-white/10 border-transparent'}`}>
                    <badge.icon className={`w-7 h-7 ${badge.unlocked ? badge.color : 'text-slate-500'}`} />
                  </div>
                  <span className="text-sm font-bold text-white text-center leading-tight">{badge.label}</span>
                  {!badge.unlocked && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Locked</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
