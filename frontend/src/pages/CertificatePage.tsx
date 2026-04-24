import React, { useState, useEffect } from 'react';
import { Award, Download, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AnimatedTiltCard from '../components/ui/AnimatedTiltCard';
import { showError } from '../utils/dialog';

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

async function toDataUrl(src: string): Promise<string> {
  const response = await fetch(src, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${src}`);
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to convert asset to data URL'));
    reader.readAsDataURL(blob);
  });
}

async function firstSuccessfulDataUrl(candidates: string[]): Promise<string> {
  for (const src of candidates) {
    try {
      return await toDataUrl(src);
    } catch {
      // Try next candidate
    }
  }
  throw new Error('No valid image candidate found');
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE TEMPLATE  ✏️  Edit this component to change the design
// What you see in the browser preview = exactly what is downloaded as PNG
// ─────────────────────────────────────────────────────────────────────────────
function CertificateTemplate({
  cert,
  userName,
  forExport = false,
  logoDataUrls,
}: {
  cert: CertRecord;
  userName: string;
  forExport?: boolean;
  logoDataUrls: { cta: string; msme: string; signature: string };
}) {
  const W = 1122;
  const H = 794;
  const PREVIEW_SCALE = 0.47;

  const courseTitle = (cert.course?.title || cert.title || 'Course')
    .replace(/[–—-]?\s*Quiz\s*Completion/gi, '')
    .trim();

  const instructor = cert.course?.instructor || 'Crismatech Automation';
  const issueDate  = new Date(cert.earnedDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const logoSrc = logoDataUrls.cta;
  const msmeSrc = logoDataUrls.msme;
  const signatureSrc = logoDataUrls.signature;
  const [ctaLoadFailed, setCtaLoadFailed] = useState(false);
  const [msmeLoadFailed, setMsmeLoadFailed] = useState(false);
  const [signatureLoadFailed, setSignatureLoadFailed] = useState(false);

  return (
    <div
      style={{
        width:           W,
        height:          H,
        transform:       forExport ? undefined : `scale(${PREVIEW_SCALE})`,
        transformOrigin: 'top left',
        backgroundColor: '#ffffff',
        position:        'relative',
        overflow:        'hidden',
        fontFamily:      '"Times New Roman", Times, serif',
        boxSizing:       'border-box',
        border:          '1px solid #d4d4d8',
        boxShadow:       forExport ? 'none' : '0 8px 40px rgba(0,0,0,0.18)',
      }}
    >
      {/* Decorative border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 10,
          border: '4px solid #6D28D9',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 20,
          border: '1.5px solid #A78BFA',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 30,
          border: '1px dashed rgba(109, 40, 217, 0.45)',
          pointerEvents: 'none',
        }}
      />
      {[
        { top: 22, left: 22, rotate: 0 },
        { top: 22, right: 22, rotate: 90 },
        { bottom: 22, right: 22, rotate: 180 },
        { bottom: 22, left: 22, rotate: 270 },
      ].map(({ rotate, ...cornerPos }, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            pointerEvents: 'none',
            borderTop: '3px solid #6D28D9',
            borderLeft: '3px solid #6D28D9',
            transform: `rotate(${rotate}deg)`,
            ...cornerPos,
          }}
        />
      ))}

      {/* ── HEADER: CTA logo | Company name + UDYAM | MSME logo ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '36px 60px 0 60px',
      }}>
        {ctaLoadFailed ? (
          <div
            style={{
              height: 90,
              minWidth: 210,
              padding: '0 12px',
              border: '1px solid #6D28D9',
              color: '#6D28D9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            CRISMATECH
          </div>
        ) : (
          <img
            src={logoSrc}
            alt="Crismatech Automation"
            crossOrigin="anonymous"
            onError={() => setCtaLoadFailed(true)}
            style={{ height: 90, width: 'auto', objectFit: 'contain' }}
          />
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#6D28D9', letterSpacing: 1 }}>
            Crismatech Automation
          </div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#6D28D9', marginTop: 4 }}>
            UDYAM-KR-19-0001627
          </div>
        </div>

        {msmeLoadFailed ? (
          <div
            style={{
              height: 108,
              minWidth: 130,
              padding: '0 10px',
              border: '1px solid #6D28D9',
              color: '#6D28D9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 13,
              letterSpacing: 1,
            }}
          >
            MSME
          </div>
        ) : (
          <img
            src={msmeSrc}
            alt="MSME"
            crossOrigin="anonymous"
            onError={() => setMsmeLoadFailed(true)}
            style={{ height: 108, width: 'auto', objectFit: 'contain' }}
          />
        )}
      </div>

      {/* ── PURPLE SEPARATOR ── */}
      <div style={{ height: 3, background: '#6D28D9', margin: '14px 60px 0 60px' }} />

      {/* ── DATE ── */}
      <div style={{ textAlign: 'right', padding: '10px 62px 0 0', fontSize: 15, color: '#222' }}>
        Date: {issueDate}
      </div>

      {/* ── CURSIVE TITLE ── */}
      <div style={{ padding: '6px 62px 0 62px' }}>
        <span style={{
          fontFamily: '"Brush Script MT", "Palatino Linotype", cursive',
          fontSize: 46, color: '#6D28D9', fontWeight: 'normal', fontStyle: 'italic',
        }}>
          Certificate of Achievement
        </span>
      </div>

      {/* ── BODY TEXT ── */}
      <div style={{ padding: '16px 62px 0 62px', lineHeight: 1.9, color: '#1a1a1a', fontSize: 16, textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>
          This is to certify that{' '}
          <strong style={{ color: '#DC2626' }}>{userName}</strong>,{' '}
          has successfully completed the assessment for{' '}
          <strong style={{ color: '#DC2626' }}>"{courseTitle} — Course Completion"</strong>{' '}
          in our Organization with a score of{' '}
          <strong style={{ color: '#1D4ED8' }}>{cert.scorePercent}%</strong>{' '}
          and has been awarded a grade of{' '}
          <strong style={{ color: '#1D4ED8' }}>{cert.grade}</strong>.
        </p>
        <p style={{ marginBottom: 16 }}>
          The performance during the assessment was found satisfactory, demonstrating keen
          interest to learn and a commitment to academic excellence.
        </p>
        <p>
          We appreciate the effort and wish continued success in all future endeavors.
        </p>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position: 'absolute', bottom: 32, left: 62, right: 62,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#777', marginBottom: 3 }}>Issue Date</div>
          <div style={{ fontWeight: 'bold', fontSize: 13, borderTop: '1.5px solid #6D28D9', paddingTop: 4 }}>{issueDate}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#777', marginBottom: 3 }}>Certificate ID</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', borderTop: '1.5px solid #6D28D9', paddingTop: 4 }}>{cert.certificateId}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 220 }}>
          {signatureLoadFailed ? (
            <>
              <div style={{
                fontFamily: '"Brush Script MT", cursive', fontSize: 32, color: '#1E1B4B',
                borderBottom: '2px solid #6D28D9', paddingBottom: 4, minWidth: 180, marginBottom: 4,
              }}>{instructor}</div>
              <div style={{ fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Authorized Signatory</div>
            </>
          ) : (
            <img
              src={signatureSrc}
              alt="Authorized Signature"
              crossOrigin="anonymous"
              onError={() => setSignatureLoadFailed(true)}
              style={{ height: 96, width: 'auto', objectFit: 'contain', display: 'block', marginLeft: 'auto' }}
            />
          )}
        </div>
      </div>

      {/* ── WATERMARK ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.2, pointerEvents: 'none', zIndex: 0,
      }}>
        {!ctaLoadFailed ? (
          <img src={logoSrc} alt="" style={{ width: 420, height: 'auto' }} crossOrigin="anonymous" onError={() => setCtaLoadFailed(true)} />
        ) : (
          <div
            style={{
              fontSize: 74,
              fontWeight: 'bold',
              color: '#6D28D9',
              letterSpacing: 6,
              transform: 'rotate(-18deg)',
              whiteSpace: 'nowrap',
            }}
          >
            CRISMATECH
          </div>
        )}
      </div>
    </div>
  );

}

// ─── Helper: load an <img> from a src URL / data URL ─────────────────────────
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

async function tryLoadImg(src: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImg(src);
  } catch {
    return null;
  }
}

// ─── Pure-canvas certificate generator (no CORS, no html2canvas) ─────────────
async function buildCertificateDataUrl(
  cert: CertRecord,
  userName: string,
  logoDataUrls: { cta: string; msme: string; signature: string },
): Promise<string> {
  const W = 1122, H = 794, S = 2; // S = scale factor for retina

  const courseTitle = (cert.course?.title || cert.title || 'Course')
    .replace(/[–—-]?\s*Quiz\s*Completion/gi, '').trim();
  const instructor = cert.course?.instructor || 'Crismatech Automation';
  const issueDate  = new Date(cert.earnedDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const [ctaImg, msmeImg, signatureImg] = await Promise.all([
    tryLoadImg(logoDataUrls.cta),
    tryLoadImg(logoDataUrls.msme),
    tryLoadImg(logoDataUrls.signature),
  ]);

  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const c = cv.getContext('2d')!;
  c.scale(S, S);

  // Background
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, W, H);

  // Decorative border frame (mirror of JSX template)
  c.strokeStyle = '#6D28D9';
  c.lineWidth = 4;
  c.strokeRect(10, 10, W - 20, H - 20);

  c.strokeStyle = '#A78BFA';
  c.lineWidth = 1.5;
  c.strokeRect(20, 20, W - 40, H - 40);

  c.setLineDash([6, 6]);
  c.strokeStyle = 'rgba(109, 40, 217, 0.45)';
  c.lineWidth = 1;
  c.strokeRect(30, 30, W - 60, H - 60);
  c.setLineDash([]);

  c.strokeStyle = '#6D28D9';
  c.lineWidth = 3;
  const corner = 60;
  const m = 22;
  // top-left
  c.beginPath(); c.moveTo(m, m + corner); c.lineTo(m, m); c.lineTo(m + corner, m); c.stroke();
  // top-right
  c.beginPath(); c.moveTo(W - m - corner, m); c.lineTo(W - m, m); c.lineTo(W - m, m + corner); c.stroke();
  // bottom-right
  c.beginPath(); c.moveTo(W - m, H - m - corner); c.lineTo(W - m, H - m); c.lineTo(W - m - corner, H - m); c.stroke();
  // bottom-left
  c.beginPath(); c.moveTo(m + corner, H - m); c.lineTo(m, H - m); c.lineTo(m, H - m - corner); c.stroke();

  // ── Header logos ──
  if (ctaImg) {
    const ctaH = 90;
    const ctaW = ctaImg.naturalWidth * (ctaH / ctaImg.naturalHeight);
    c.drawImage(ctaImg, 60, 36, ctaW, ctaH);
  } else {
    c.strokeStyle = '#6D28D9';
    c.lineWidth = 1;
    c.strokeRect(60, 36, 210, 90);
    c.fillStyle = '#6D28D9';
    c.font = 'bold 14px Arial, sans-serif';
    c.textAlign = 'center';
    c.fillText('CRISMATECH', 165, 88);
  }

  if (msmeImg) {
    const msmeH = 108;
    const msmeW = msmeImg.naturalWidth * (msmeH / msmeImg.naturalHeight);
    c.drawImage(msmeImg, W - 60 - msmeW, 28, msmeW, msmeH);
  } else {
    const boxW = 130;
    c.strokeStyle = '#6D28D9';
    c.lineWidth = 1;
    c.strokeRect(W - 60 - boxW, 28, boxW, 108);
    c.fillStyle = '#6D28D9';
    c.font = 'bold 13px Arial, sans-serif';
    c.textAlign = 'center';
    c.fillText('MSME', W - 60 - boxW / 2, 88);
  }

  // Company name (centre)
  c.textAlign = 'center'; c.fillStyle = '#6D28D9';
  c.font = 'bold 28px "Times New Roman", serif';
  c.fillText('Crismatech Automation', W / 2, 76);
  c.font = 'bold 18px "Times New Roman", serif';
  c.fillText('UDYAM-KR-19-0001627', W / 2, 104);

  // ── Purple separator ──
  c.fillStyle = '#6D28D9'; c.fillRect(60, 150, W - 120, 3);

  // ── Date (right) ──
  c.textAlign = 'right'; c.fillStyle = '#222'; c.font = '15px "Times New Roman", serif';
  c.fillText('Date: ' + issueDate, W - 62, 176);

  // ── Cursive title ──
  c.textAlign = 'left'; c.fillStyle = '#6D28D9';
  c.font = 'italic normal 46px "Brush Script MT", cursive';
  c.fillText('Certificate of Achievement', 62, 228);

  // ── Body text (center-aligned with coloured spans) ──
  const lh = 30;
  let y = 274;
  const bodyCenterX = W / 2;

  function drawCenteredSegments(segments: Array<{ text: string; color: string; bold?: boolean }>, rowY: number) {
    const widths = segments.map((segment) => {
      c.font = `${segment.bold ? 'bold ' : ''}16px "Times New Roman", serif`;
      return c.measureText(segment.text).width;
    });
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    let x = bodyCenterX - totalWidth / 2;

    segments.forEach((segment, idx) => {
      c.font = `${segment.bold ? 'bold ' : ''}16px "Times New Roman", serif`;
      c.fillStyle = segment.color;
      c.textAlign = 'left';
      c.fillText(segment.text, x, rowY);
      x += widths[idx];
    });
  }

  drawCenteredSegments([
    { text: 'This is to certify that ', color: '#1a1a1a' },
    { text: `${userName},`, color: '#DC2626', bold: true },
    { text: ' has successfully completed the assessment for', color: '#1a1a1a' },
  ], y);

  y += lh;
  drawCenteredSegments([
    { text: `"${courseTitle} — Course Completion"`, color: '#DC2626', bold: true },
    { text: ' in our Organization with a score of', color: '#1a1a1a' },
  ], y);

  y += lh;
  drawCenteredSegments([
    { text: `${cert.scorePercent}%`, color: '#1D4ED8', bold: true },
    { text: ' and has been awarded a grade of ', color: '#1a1a1a' },
    { text: `${cert.grade}.`, color: '#1D4ED8', bold: true },
  ], y);

  y += lh + 8;
  c.fillStyle = '#1a1a1a';
  c.font = '16px "Times New Roman", serif';
  c.textAlign = 'center';
  c.fillText('The performance during the assessment was found satisfactory, demonstrating keen', bodyCenterX, y);
  y += lh;
  c.fillText('interest to learn and a commitment to academic excellence.', bodyCenterX, y);
  y += lh + 8;
  c.fillText('We appreciate the effort and wish continued success in all future endeavors.', bodyCenterX, y);

  // ── Watermark ──
  c.save();
  c.globalAlpha = 0.2;
  if (ctaImg) {
    const wmH = 320;
    const wmW = ctaImg.naturalWidth * (wmH / ctaImg.naturalHeight);
    c.drawImage(ctaImg, (W - wmW) / 2, (H - wmH) / 2, wmW, wmH);
  } else {
    c.textAlign = 'center';
    c.fillStyle = '#6D28D9';
    c.font = 'bold 74px "Times New Roman", serif';
    c.translate(W / 2, H / 2);
    c.rotate((-18 * Math.PI) / 180);
    c.fillText('CRISMATECH', 0, 0);
  }
  c.restore();

  // ── Footer ──
  const fy = H - 30;
  const drawFooterCol = (label: string, value: string, tx: number, align: CanvasTextAlign) => {
    c.textAlign = align;
    c.fillStyle = '#777'; c.font = '11px Arial, sans-serif';
    c.fillText(label, tx, fy - 20);
    c.strokeStyle = '#6D28D9'; c.lineWidth = 1.5;
    const lw = 140;
    const lx = align === 'left' ? tx : align === 'right' ? tx - lw : tx - lw / 2;
    c.beginPath(); c.moveTo(lx, fy - 10); c.lineTo(lx + lw, fy - 10); c.stroke();
    c.fillStyle = '#1e293b'; c.font = `bold 12px ${label === 'Certificate ID' ? 'monospace' : 'Arial, sans-serif'}`;
    c.fillText(value, tx, fy);
  };
  drawFooterCol('Issue Date', issueDate, 62, 'left');
  drawFooterCol('Certificate ID', cert.certificateId, W / 2, 'center');

  // Signature
  if (signatureImg) {
    const sigH = 96;
    const sigW = signatureImg.naturalWidth * (sigH / signatureImg.naturalHeight);
    c.drawImage(signatureImg, W - 62 - sigW, fy - 100, sigW, sigH);
  } else {
    c.textAlign = 'right'; c.fillStyle = '#1E1B4B';
    c.font = 'italic 30px "Brush Script MT", cursive';
    c.fillText(instructor, W - 62, fy - 8);
    c.strokeStyle = '#6D28D9'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(W - 62 - 180, fy - 1); c.lineTo(W - 62, fy - 1); c.stroke();
    c.fillStyle = '#666'; c.font = '10px Arial, sans-serif';
    c.fillText('AUTHORIZED SIGNATORY', W - 62, fy + 14);
  }

  return cv.toDataURL('image/png', 1.0);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CertificatePage() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [certificates, setCertificates] = useState<CertRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [downloading, setDownloading]   = useState<string | null>(null);
  // Initialize with real URL paths so the page renders immediately;
  // upgraded to base64 data URLs in the background for download quality.
  const [logoDataUrls, setLogoDataUrls] = useState({
    cta:  `${base}/cta_logo.png`,
    msme: `${base}/msme_logo.png`,
    signature: `${base}/signature.png`,
  });

  const { user } = useAuth();

  // Upgrade logos to base64 so html2canvas has zero CORS issues on download
  useEffect(() => {
    const origin = window.location.origin;
    Promise.all([
      firstSuccessfulDataUrl([
        `${base}/cta_logo.png`,
        `${base}/crismatech_header.png`,
        `${origin}/portal/cta_logo.png`,
        `${origin}/cta_logo.png`,
      ]),
      firstSuccessfulDataUrl([
        `${base}/msme_logo.png`,
        `${origin}/portal/msme_logo.png`,
        `${origin}/msme_logo.png`,
      ]),
      firstSuccessfulDataUrl([
        `${base}/signature.png`,
        `${origin}/portal/signature.png`,
        `${origin}/signature.png`,
      ]),
    ])
      .then(([cta, msme, signature]) => setLogoDataUrls({ cta, msme, signature }))
      .catch(() => { /* keep fallback URL paths on error */ });
  }, [base]);

  useEffect(() => {
    apiFetch('/certificates/my-certificates')
      .then(data => setCertificates(data.certificates || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: CertRecord) => {
    try {
      setDownloading(cert.certificateId);
      const dataUrl = await buildCertificateDataUrl(cert, user?.name || 'Student', logoDataUrls);
      const link = document.createElement('a');
      link.download = `Certificate_${cert.certificateId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Certificate download failed:', err);
      await showError('Download failed', 'Please try again.');
    } finally {
      setDownloading(null);
    }
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
                <div className="p-4 flex items-center justify-center bg-white/5 border-b border-white/5 overflow-hidden">
                  <div style={{
                    width:  1122 * 0.47,
                    height: 794  * 0.47,
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                    borderRadius: 4,
                  }}>
                    <CertificateTemplate cert={cert} userName={user?.name || 'Student'} logoDataUrls={logoDataUrls} />
                  </div>
                </div>



                {/* ── Card meta + download ── */}
                <div className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl text-white tracking-tight group-hover:text-brand-purple transition-colors">
                        {(cert.course?.title || cert.title || '').replace(/[–—-]?\s*Quiz\s*Completion/gi, '').trim()} — Course Completion
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
                    onClick={() => handleDownload(cert)}
                    disabled={!!downloading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg glow-shadow group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading === cert.certificateId ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating certificate...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
                        Download Certificate
                      </>
                    )}
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
