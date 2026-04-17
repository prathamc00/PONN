import React, { useState, useEffect, useRef } from 'react';
import { Award, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
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

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE TEMPLATE  ✏️  Edit this component to change the design
// What you see in the browser preview = exactly what is downloaded as PNG
// ─────────────────────────────────────────────────────────────────────────────
function CertificateTemplate({
  cert,
  userName,
  forExport = false,
}: {
  cert: CertRecord;
  userName: string;
  forExport?: boolean;
}) {
  const W = 1122; // A4 landscape width  (px @ 96dpi)
  const H = 794;  // A4 landscape height
  const PREVIEW_SCALE = 0.47; // How big the preview card appears

  const courseTitle = (cert.course?.title || cert.title)
    .replace(/[-–—]\s*Quiz\s*Completion/gi, '— Course Completion')
    .replace(/Quiz\s*Completion/gi, 'Course Completion');
  const instructor  = cert.course?.instructor || 'Crismatech Automation';
  const issueDate   = new Date(cert.earnedDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }); // "15 April 2026"

  return (
    <div
      style={{
        width:  W,
        height: H,
        transform:       forExport ? undefined : `scale(${PREVIEW_SCALE})`,
        transformOrigin: 'top left',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Times New Roman", Times, serif',
        boxSizing: 'border-box',
        boxShadow: forExport ? 'none' : '0 6px 36px rgba(0,0,0,0.22)',
        padding: 0,
      }}
    >
      {/* ── DESIGNED PREMIUM BORDER ────────────────────────────────────── */}
      {/* 1. Outermost thick purple frame */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '12px solid #6D28D9',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* 2. Gold accent line inset */}
      <div style={{
        position: 'absolute',
        inset: 12,
        border: '2px solid #D4AF37', // Gold color
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* 3. Intricate inner pattern frame */}
      <div style={{
        position: 'absolute',
        inset: 22,
        border: '1px solid rgba(109, 40, 217, 0.4)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* 4. Elegant Corner Ornaments (SVG based for detail) */}
      {[
        { top: 0, left: 0, rotate: 0 },
        { top: 0, right: 0, rotate: 90 },
        { bottom: 0, left: 0, rotate: -90 },
        { bottom: 0, right: 0, rotate: 180 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...pos,
          width: 100,
          height: 100,
          zIndex: 11,
          pointerEvents: 'none',
          transform: `rotate(${pos.rotate}deg)`,
        }}>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V12H12V100H0V0Z" fill="#6D28D9"/> {/* Corner Base */}
            <path d="M12 12H40V16H16V40H12V12Z" fill="#D4AF37"/> {/* Gold Corner Inset */}
            <circle cx="12" cy="12" r="8" fill="#D4AF37" /> {/* Decorative Dot */}
            <path d="M100 0L85 15M0 100L15 85" stroke="#D4AF37" strokeWidth="2"/> {/* Accent lines */}
          </svg>
        </div>
      ))}

      {/* 5. Inner subtle texture/border */}
      <div style={{
        position: 'absolute',
        inset: 40,
        border: '1px solid rgba(109, 40, 217, 0.1)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      {/* ── WATERMARK (center, faded logo) ───────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.07,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <img
          src="/portal/cta_logo.png"
          alt=""
          style={{ width: 420, height: 'auto' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ALL CONTENT SITS ABOVE THE WATERMARK (zIndex: 1)
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>

        {/* ── TOP HEADER: logos + purple line ──────────────────────── */}
        <div style={{ padding: '28px 50px 0 50px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>

            {/* LEFT — CTA Logo */}
            <img
              src="/portal/cta_logo.png"
              alt="Crismatech Automation"
              crossOrigin="anonymous"
              style={{ height: 90, width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* RIGHT — MSME Logo */}
            <img
              src="/portal/msme_logo.png"
              alt="MSME"
              crossOrigin="anonymous"
              style={{ height: 80, width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Purple separator line */}
          <div style={{
            height: 3,
            background: '#6D28D9',
            marginTop: 12,
            borderRadius: 2,
          }} />
        </div>

        {/* ── DATE (top-right, below line) ─────────────────────────── */}
        <div style={{
          textAlign: 'right',
          padding: '10px 52px 0 0',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 14,
          color: '#222',
        }}>
          Date: {issueDate}
        </div>

        {/* ── TITLE: "Certificate of Achievement" (cursive) ────────── */}
        <div style={{
          textAlign: 'left',
          padding: '10px 52px 20px 52px',
        }}>
          <span style={{
            fontFamily: '"Brush Script MT", "Dancing Script", cursive',
            fontSize: 52,
            color: '#6D28D9',
            fontWeight: 'normal',
            letterSpacing: 1,
          }}>
            Certificate of Achievement
          </span>
        </div>

        {/* ── BODY TEXT ────────────────────────────────────────────── */}
        <div style={{
          padding: '0 52px',
          lineHeight: 1.85,
          color: '#1a1a1a',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 15.5,
        }}>

          {/* Paragraph 1 */}
          <p style={{ marginBottom: 28, textAlign: 'justify' }}>
            This is to certify that{' '}
            <strong style={{ color: '#DC2626' }}>{userName}</strong>,
            has successfully completed the assessment for{' '}
            <strong style={{ color: '#DC2626' }}>"{courseTitle}"</strong>{' '}
            in our Organization with a score of{' '}
            <strong style={{ color: '#1D4ED8' }}>{cert.scorePercent}%</strong>{' '}
            and has been awarded a grade of{' '}
            <strong style={{ color: '#1D4ED8' }}>{cert.grade}</strong>.
          </p>

          {/* Paragraph 2 */}
          <p style={{ marginBottom: 28, textAlign: 'justify' }}>
            The performance during the assessment was found satisfactory, demonstrating keen
            interest to learn and a commitment to academic excellence.
          </p>

          {/* Paragraph 3 */}
          <p style={{ marginBottom: 36, textAlign: 'justify' }}>
            We appreciate the effort and wish continued success in all future endeavors.
          </p>
        </div>

        {/* ── SIGNATURE ROW ────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '0 60px',
          marginTop: 10,
        }}>
          {/* Left: Certificate ID */}
          <div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#6D28D9', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Certificate ID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151', fontWeight: 700 }}>
              {cert.certificateId}
            </div>
          </div>

          {/* Right: Signature */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Brush Script MT", cursive',
              fontSize: 34,
              color: '#1E1B4B',
              borderBottom: '2px solid #6D28D9',
              paddingBottom: 6,
              minWidth: 200,
              marginBottom: 6,
            }}>
              {instructor}
            </div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Authorized Signatory
            </div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#374151', fontWeight: 600 }}>
              Crismatech Automation
            </div>
          </div>
        </div>

        {/* ── BOTTOM PURPLE BAR ────────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 14,
          background: 'linear-gradient(90deg, #6D28D9, #3B82F6)',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CertificatePage() {
  const [certificates, setCertificates] = useState<CertRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    apiFetch('/certificates/my-certificates')
      .then(data => setCertificates(data.certificates || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: CertRecord, index: number) => {
    const el = exportRefs.current[index];
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
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

      {/* Page title */}
      <div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Academic Achievements</span>
        </motion.div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Your <span className="gradient-text">Certificates</span></h1>
        <p className="text-slate-400 mt-2 font-medium leading-relaxed">Official certificates issued by Crismatech Automation.</p>
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
            Complete course quizzes with a score of 40% or higher to earn your official Crismatech certificate.
          </p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-10">
          {certificates.map((cert: any, i) => (
            <AnimatedTiltCard key={cert._id || cert.id || i}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="glass-panel rounded-[3rem] border-white/5 shadow-2xl overflow-hidden flex flex-col group backdrop-blur-3xl"
              >
                {/* ── Certificate PREVIEW (scaled) ── */}
                <div className="p-4 flex items-start justify-start bg-white/5 border-b border-white/5 overflow-hidden">
                  <div style={{
                    width:  1122 * 0.47,
                    height: 794  * 0.47,
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                    borderRadius: 4,
                  }}>
                    <CertificateTemplate cert={cert} userName={user?.name || 'Student'} />
                  </div>
                </div>

                {/* Hidden full-size element used for html2canvas capture */}
                <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1, pointerEvents: 'none' }}>
                  <div ref={el => { exportRefs.current[i] = el; }}>
                    <CertificateTemplate cert={cert} userName={user?.name || 'Student'} forExport />
                  </div>
                </div>

                {/* ── Card meta + download ── */}
                <div className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl text-white tracking-tight group-hover:text-brand-purple transition-colors">
                        {cert.course?.title || cert.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 font-medium">
                        {new Date(cert.earnedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {' '}• Grade: <span className="text-brand-blue font-bold">{cert.grade}</span>
                        {' '}• Score: <span className="text-brand-purple font-bold">{cert.scorePercent}%</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-400/20 flex-shrink-0 ml-4">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(cert, i)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg glow-shadow group/btn"
                  >
                    <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
                    Download Certificate
                  </button>
                </div>
              </motion.div>
            </AnimatedTiltCard>
          ))}

          {/* "Unlock more" placeholder */}
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
            <p className="text-sm text-slate-400 max-w-xs font-medium leading-relaxed">
              Complete more quizzes to earn additional certificates from Crismatech Automation.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
