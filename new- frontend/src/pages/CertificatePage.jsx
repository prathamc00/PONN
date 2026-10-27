import React, { useState, useEffect, useRef } from 'react';
import {
  Award, Download, Share2, RefreshCw, Printer, Maximize2, X, ZoomIn, ZoomOut
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showSuccess, showError } from '../utils/dialog.js';
import CertificateTemplate, {
  CERT_WIDTH,
  CERT_HEIGHT,
  buildCertificateDataUrl,
  firstSuccessfulDataUrl
} from '../components/CertificateTemplate.jsx';

export default function CertificatePage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef(null);
  const [containerScale, setContainerScale] = useState(0.85);

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const [logoDataUrls, setLogoDataUrls] = useState({
    cta: `${base}/cta_logo_clean.png`,
    msme: `${base}/msme_logo.png`,
    signature: `${base}/sign_clean.png`,
    stamp: `${base}/stamp.png`,
  });

  // Dynamic responsive scaling with ResizeObserver for mobile, tablet & desktop
  useEffect(() => {
    if (!containerRef.current) return;

    const computeScale = () => {
      if (!containerRef.current) return;
      const clientW = containerRef.current.clientWidth;
      // Subtract padding for comfortable fit
      const availableWidth = Math.max(clientW - (clientW < 640 ? 12 : 32), 240);
      const scale = Math.min(availableWidth / CERT_WIDTH, 1.0);
      setContainerScale(scale);
    };

    computeScale();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => computeScale());
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', computeScale);
    window.addEventListener('orientationchange', computeScale);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', computeScale);
      window.removeEventListener('orientationchange', computeScale);
    };
  }, [certificates, selectedCert]);

  // Upgrade logos to base64 in background for instant, high-res canvas exports
  useEffect(() => {
    const origin = window.location.origin;
    Promise.all([
      firstSuccessfulDataUrl([
        `${base}/cta_logo_clean.png`,
        `${base}/cta_logo.png`,
        `${origin}/portal/cta_logo_clean.png`,
        `/portal/cta_logo_clean.png`,
      ]),
      firstSuccessfulDataUrl([
        `${base}/msme_logo.png`,
        `${origin}/portal/msme_logo.png`,
        `/portal/msme_logo.png`,
      ]),
      firstSuccessfulDataUrl([
        `${base}/sign_clean.png`,
        `${base}/signature.png`,
        `${origin}/portal/sign_clean.png`,
        `/portal/sign_clean.png`,
      ]),
      firstSuccessfulDataUrl([
        `${base}/stamp.png`,
        `${origin}/portal/stamp.png`,
        `/portal/stamp.png`,
      ]),
    ])
      .then(([cta, msme, signature, stamp]) => {
        setLogoDataUrls({ cta, msme, signature, stamp });
      })
      .catch(() => {
        // Fallbacks already in initial state
      });
  }, [base]);

  // Fetch student certificates
  useEffect(() => {
    apiFetch('/certificates/my-certificates')
      .then((data) => {
        const list = data.certificates || [];
        setCertificates(list);
        if (list.length > 0) {
          setSelectedCert(list[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load certificates:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    if (!selectedCert) return;
    try {
      setDownloading(true);
      const studentName = user?.name || selectedCert.studentName || 'Student';
      const dataUrl = await buildCertificateDataUrl(selectedCert, studentName, logoDataUrls);

      const link = document.createElement('a');
      link.download = `Certificate_${selectedCert.certificateId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess('Certificate Downloaded', 'Your high-resolution credential PNG has been saved.');
    } catch (err) {
      console.error('Download failed:', err);
      showError('Download Failed', 'Could not generate the certificate file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleAddToLinkedIn = (cert) => {
    if (!cert) return;
    const title = encodeURIComponent((cert.course?.title || cert.courseTitle || cert.title || 'Course') + ' — Course Completion');
    const orgName = encodeURIComponent('Crismatech Automation');
    const certId = encodeURIComponent(cert.certificateId);
    const rawDate = cert.earnedDate || cert.issuedAt || cert.createdAt || Date.now();
    const dateObj = new Date(rawDate);
    const issueYear = dateObj.getFullYear();
    const issueMonth = dateObj.getMonth() + 1;

    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${orgName}&issueYear=${issueYear}&issueMonth=${issueMonth}&certId=${certId}`;
    window.open(linkedInUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 md:space-y-8 p-3.5 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-outline">
              Issued Course Certificates
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-primary">Your Certificates</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1 max-w-2xl">
            Official certificates of achievement issued by <strong className="text-primary font-semibold">Crismatech Automation</strong> (UDYAM-KR-19-0001627).
          </p>
        </div>

        {/* ── RESPONSIVE ACTIONS TOOLBAR ── */}
        {selectedCert && (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
            {/* Primary Download CTA */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="order-1 sm:order-last w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#6D28D9] hover:bg-[#5b21b6] active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating PNG...
                </>
              ) : (
                <>
                  <Download size={14} /> Download Certificate (PNG)
                </>
              )}
            </button>

            {/* Secondary Action Grid / Bar */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <button
                onClick={() => handleAddToLinkedIn(selectedCert)}
                className="px-3 py-2 bg-[#0077b5] hover:bg-[#006097] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Share2 size={13} /> <span>LinkedIn</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer size={13} /> <span>Print</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENT BODY ── */}
      {loading ? (
        <div className="p-16 sm:p-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-outline">Loading issued certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-3xl p-8 sm:p-16 text-center max-w-2xl mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-container border border-outline-variant text-primary flex items-center justify-center mx-auto">
            <Award size={32} />
          </div>
          <h2 className="text-2xl font-serif text-primary font-bold">No Certificates Yet</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Complete your enrolled course modules and pass the assessment quiz with a score of 40% or higher to earn your official <strong className="text-primary font-semibold">Crismatech Automation</strong> certificate of achievement.
          </p>
          <div className="pt-2">
            <a
              href="/portal/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container transition-colors"
            >
              Browse Enrolled Courses
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Certificate Selector Pills if multiple */}
          {certificates.length > 1 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono text-outline uppercase mr-2">Credentials:</span>
              {certificates.map((c) => {
                const isSelected = selectedCert?.certificateId === c.certificateId;
                return (
                  <button
                    key={c.certificateId}
                    onClick={() => setSelectedCert(c)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#6D28D9] text-white font-bold shadow-md'
                        : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{c.course?.title || c.courseTitle || c.title || 'Course'}</span>
                    <span className="opacity-75">({c.certificateId})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Certificate Card & Exact Template Rendering */}
          {selectedCert && (
            <div className="space-y-4 sm:space-y-6">
              {/* Meta bar */}
              <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6D28D9]/10 text-[#6D28D9] flex items-center justify-center font-bold font-mono text-sm">
                    {selectedCert.grade || 'A+'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-serif font-bold text-primary truncate">
                      {(selectedCert.course?.title || selectedCert.courseTitle || selectedCert.title || '').replace(/[–—-]?\s*Quiz\s*Completion/gi, '').trim()} — Course Completion
                    </h3>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant font-mono">
                      Issued: {new Date(selectedCert.earnedDate || selectedCert.issuedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Score: <span className="font-bold text-[#1D4ED8]">{selectedCert.scorePercent || 100}%</span> • Grade: <span className="font-bold text-[#1D4ED8]">{selectedCert.grade || 'A+'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Fullscreen Zoom"
                  >
                    <Maximize2 size={12} />
                    <span>Zoom In</span>
                  </button>

                </div>
              </div>

              {/* Certificate Canvas / Template Container */}
              <div
                ref={containerRef}
                className="bg-slate-100/80 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 md:p-8 flex items-center justify-center overflow-hidden shadow-inner print:p-0 print:border-none print:bg-transparent"
              >
                <div
                  style={{
                    width: CERT_WIDTH * containerScale,
                    height: CERT_HEIGHT * containerScale,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: containerScale < 0.5 ? 4 : 8,
                    flexShrink: 0,
                    margin: '0 auto',
                  }}
                  className="shadow-xl md:shadow-2xl print:shadow-none bg-white transition-all duration-150"
                >
                  <CertificateTemplate
                    cert={selectedCert}
                    userName={user?.name || selectedCert.studentName || 'Student Candidate'}
                    scale={containerScale}
                    logoDataUrls={logoDataUrls}
                  />
                </div>
              </div>

              {/* Mobile device hint & certificate ledger metadata */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-outline font-mono gap-2 text-center sm:text-left">
                <span>UDYAM-KR-19-0001627 • Crismatech Automation Academic Record</span>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="sm:hidden text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Maximize2 size={12} /> Tap to view full certificate up close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FULLSCREEN ZOOM MODAL (Touch & Mobile Friendly) ── */}
      {isFullscreen && selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-fade-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-violet-400">
                {selectedCert.certificateId}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• High-Res Inspection</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.2))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono text-slate-300 min-w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.2))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-[#6D28D9] hover:bg-[#5b21b6] text-white rounded-lg text-xs font-semibold flex items-center gap-1 ml-2"
              >
                <Download size={13} /> <span className="hidden sm:inline">PNG</span>
              </button>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setZoomLevel(1);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-200 hover:text-white transition-colors ml-2"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body: Pan & Scroll Canvas */}
          <div className="flex-1 overflow-auto rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 flex items-center justify-center">
            <div
              style={{
                width: CERT_WIDTH * zoomLevel,
                height: CERT_HEIGHT * zoomLevel,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 8,
                flexShrink: 0,
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              }}
              className="bg-white"
            >
              <CertificateTemplate
                cert={selectedCert}
                userName={user?.name || selectedCert.studentName || 'Student Candidate'}
                scale={zoomLevel}
                logoDataUrls={logoDataUrls}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
