import React, { useState, useEffect, useRef } from 'react';
import { Award, Download, Share2, ShieldCheck, Sparkles, Trophy, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/ui/Skeleton';
import AnimatedTiltCard from '../components/ui/AnimatedTiltCard';

interface CertRecord {
  _id: string;
  title: string;
  certificateId: string;
  type: string;
  grade: string;
  scorePercent: number;
  earnedDate: string;
  course: { _id: string; title: string; instructor: string; category: string; level: string } | null;
}

export default function CertificatePage() {
  const [certificates, setCertificates] = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    apiFetch('/certificates/my-certificates')
      .then(data => setCertificates(data.certificates || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPDF = (cert: CertRecord) => {
    // Create a canvas-based PDF certificate
    const canvas = document.createElement('canvas');
    const w = 1200, h = 850;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0F0A2E');
    bg.addColorStop(1, '#1A1040');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = '#6C63FF';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.strokeStyle = 'rgba(108,99,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Corner decorations
    const cornerSize = 60;
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;
    [[50, 50, 1, 1], [w - 50, 50, -1, 1], [50, h - 50, 1, -1], [w - 50, h - 50, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x as number, (y as number) + (dy as number) * cornerSize);
      ctx.lineTo(x as number, y as number);
      ctx.lineTo((x as number) + (dx as number) * cornerSize, y as number);
      ctx.stroke();
    });

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6C63FF';
    ctx.font = 'bold 14px Arial';
    ctx.letterSpacing = '8px';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', w / 2, 140);

    // Trophy icon (text emoji)
    ctx.font = '48px Arial';
    ctx.fillText('🏆', w / 2, 210);

    // "This is to certify that"
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'italic 16px Georgia';
    ctx.fillText('This is to certify that', w / 2, 270);

    // Student name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Georgia';
    ctx.fillText(user?.name || 'Student', w / 2, 330);

    // "has successfully completed"
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'italic 16px Georgia';
    ctx.fillText('has successfully completed the assessment for', w / 2, 390);

    // Course title
    ctx.fillStyle = '#818CF8';
    ctx.font = 'bold 28px Arial';
    const courseTitle = cert.course?.title || cert.title;
    ctx.fillText(courseTitle, w / 2, 440);

    // Grade badge
    ctx.fillStyle = 'rgba(108,99,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 60, 470, 120, 50, 12);
    ctx.fill();
    ctx.fillStyle = '#A78BFA';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Grade: ${cert.grade}`, w / 2, 503);

    // Score
    ctx.fillStyle = '#64748B';
    ctx.font = '14px Arial';
    ctx.fillText(`Score: ${cert.scorePercent}%`, w / 2, 555);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 590);
    ctx.lineTo(w - 200, 590);
    ctx.stroke();

    // Bottom info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('ISSUE DATE', 120, 640);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(new Date(cert.earnedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 120, 665);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('INSTRUCTOR', w / 2, 640);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(cert.course?.instructor || 'CRISMATECH', w / 2, 665);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('CERTIFICATE ID', w - 120, 640);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(cert.certificateId, w - 120, 665);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial';
    ctx.fillText('© CRISMATECH Learning Portal • Verify at crismatech.com/verify', w / 2, 760);

    // Download
    const link = document.createElement('a');
    link.download = `Certificate_${cert.certificateId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-medium">Loading certificates...</div>;
  }

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Academic Achievements</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Your <span className="gradient-text">Certificates</span></h1>
          <p className="text-slate-400 mt-2 font-medium leading-relaxed">Showcase your verified skills and academic accomplishments.</p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-[3rem] border-2 border-dashed border-white/10 p-16 flex flex-col items-center justify-center text-center"
        >
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-600 mb-6 border border-white/5">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-2xl text-white mb-3 tracking-tight">No Certificates Yet</h3>
          <p className="text-sm text-slate-400 max-w-md font-medium leading-relaxed">
            Complete course quizzes with a score of 40% or higher to earn certificates. Each certificate includes a unique verification ID.
          </p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-10">
          {certificates.map((cert, i) => (
            <AnimatedTiltCard key={cert._id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -10 }}
              className="glass-panel rounded-[3rem] border-white/5 shadow-2xl overflow-hidden flex flex-col group backdrop-blur-3xl"
            >
              <div className="p-10 bg-white/5 border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-full aspect-[1.414/1] bg-slate-900 border-[12px] border-slate-800 p-10 flex flex-col items-center justify-center text-center shadow-2xl relative z-10 rounded-sm">
                  <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-brand-purple opacity-50" />
                  <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-brand-purple opacity-50" />
                  <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-brand-purple opacity-50" />
                  <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-brand-purple opacity-50" />
                  <Trophy className="w-16 h-16 text-brand-purple mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-3">Certificate of Achievement</h3>
                  <p className="text-[10px] text-slate-400 mb-6 italic font-medium">This is to certify that</p>
                  <h2 className="text-3xl font-bold text-white mb-6 font-serif tracking-tight">{user?.name || 'Student'}</h2>
                  <p className="text-[10px] text-slate-400 mb-3 italic font-medium">has successfully completed</p>
                  <h4 className="text-xl font-bold text-brand-blue mb-8 tracking-tight">{cert.course?.title || cert.title}</h4>
                  <div className="flex justify-between w-full mt-6 pt-6 border-t border-white/5">
                    <div className="text-left">
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Issue Date</p>
                      <p className="text-[10px] font-bold text-white">{new Date(cert.earnedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Grade</p>
                      <p className="text-[10px] font-bold text-brand-purple">{cert.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Cert ID</p>
                      <p className="text-[10px] font-bold text-white">{cert.certificateId}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-white tracking-tight group-hover:text-brand-purple transition-colors">{cert.course?.title || cert.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      {new Date(cert.earnedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • Grade: <span className="text-brand-blue">{cert.grade}</span> • Score: <span className="text-brand-purple">{cert.scorePercent}%</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-400/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => handleDownloadPDF(cert)}
                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg glow-shadow group/btn">
                    <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" /> Download Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatedTiltCard>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: certificates.length * 0.15 }}
            className="glass-panel rounded-[3rem] border-2 border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center group hover:border-brand-purple/30 transition-all"
          >
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-600 mb-6 group-hover:scale-110 group-hover:text-brand-purple transition-all border border-white/5">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-2xl text-white mb-3 tracking-tight">Unlock More <span className="gradient-text">Achievements</span></h3>
            <p className="text-sm text-slate-400 max-w-xs font-medium leading-relaxed">Complete more quizzes to unlock premium certificates and boost your professional profile.</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
