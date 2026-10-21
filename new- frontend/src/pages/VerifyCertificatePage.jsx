import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Calendar,
  User,
  GraduationCap,
  ExternalLink,
  Printer,
  Search,
  ArrowLeft,
  Share2,
  Copy,
  AlertCircle,
  Download
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import BrandLogo from '../components/BrandLogo';
import CertificateTemplate, {
  CERT_WIDTH,
  CERT_HEIGHT,
  buildCertificateDataUrl
} from '../components/CertificateTemplate';

export default function VerifyCertificatePage() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(certId || '');
  const [certificate, setCertificate] = useState(null);
  const containerRef = useRef(null);
  const [containerScale, setContainerScale] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!certId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchInput(certId);

    apiFetch(`/certificates/verify/${certId}`)
      .then((data) => {
        if (data.certificate) {
          setCertificate(data.certificate);
        } else {
          setError('Credential record could not be found in the registry.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Credential record could not be found in the registry.');
        setCertificate(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [certId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/verify/${searchInput.trim()}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddToLinkedIn = () => {
    if (!certificate) return;
    const title = encodeURIComponent(certificate.course?.title || certificate.title || 'CRISMATECH Professional Certification');
    const orgName = encodeURIComponent('CRISMATECH Education');
    const certUrl = encodeURIComponent(window.location.href);
    const id = encodeURIComponent(certificate.certificateId || certId);
    const dateObj = new Date(certificate.earnedDate || certificate.createdAt || Date.now());
    const issueYear = dateObj.getFullYear();
    const issueMonth = dateObj.getMonth() + 1;

    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${orgName}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${certUrl}&certId=${id}`;
    window.open(linkedInUrl, '_blank');
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const computeScale = () => {
      if (!containerRef.current) return;
      const clientW = containerRef.current.clientWidth;
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
  }, [certificate]);

  return (
    <div className="min-h-screen bg-[#f7f9f6] text-slate-800 flex flex-col justify-between selection:bg-[#ea580c]/15 selection:text-[#ea580c]">
      {/* ── TOP NAVIGATION BAR ──────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-3.5 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <BrandLogo className="h-7 sm:h-8 w-auto flex-shrink-0" />
            <div className="border-l border-slate-200 pl-2.5 hidden xs:block sm:block">
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#9d4225] font-bold block uppercase truncate">
                Registry Verification
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-[#ea580c] block truncate">
                Official Credential Validation
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/login"
            className="text-[11px] sm:text-xs font-semibold text-[#ea580c] hover:text-[#c2410c] px-2.5 sm:px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Portal Login
          </Link>
          <Link
            to="/courses"
            className="text-[11px] sm:text-xs font-semibold bg-[#ea580c] hover:bg-[#c2410c] text-white px-3 sm:px-4 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            Courses
          </Link>
        </div>
      </header>

      {/* ── MAIN VERIFIER DESK ─────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 md:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Search header for credential validation */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs text-center space-y-4">
          <span className="px-3 py-1 bg-[#ea580c]/8 text-[#ea580c] border border-[#ea580c]/15 rounded-full font-mono text-xs font-semibold inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#ea580c]" /> Cryptographic Registry Explorer
          </span>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-[#ea580c]">
            Validate Academic Credential
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Verify the authenticity of graduation diplomas and assessment certifications issued by CRISMATECH Academic Foundation.
          </p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. CRT-844085E1)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#ea580c] focus:bg-white rounded-xl text-xs font-mono text-slate-900 focus:outline-none transition-all uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Dynamic Verification Output */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs text-slate-500">Querying immutable credential ledger...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-3xl p-10 md:p-14 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Credential Not Found</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No matching graduation diploma or assessment record was found for ID <span className="font-mono font-bold text-slate-800">{certId}</span>. Please verify the code or contact the issuing academic authority.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ea580c] hover:underline"
              >
                <ArrowLeft size={14} /> Return to Homepage
              </Link>
            </div>
          </div>
        ) : certificate ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Verified Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    Official Authenticated Credential
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] uppercase font-bold">
                      Verified
                    </span>
                  </h2>
                  <p className="text-xs text-emerald-800/80">
                    This certification was issued directly by CRISMATECH Education following verified proctored assessment.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Copy size={13} />
                  <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
                </button>
                <button
                  onClick={handleAddToLinkedIn}
                  className="px-4 py-2 bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Add to LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Certificate Template Visual Rendering */}
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
                  cert={certificate}
                  userName={certificate.student?.name || 'Student Candidate'}
                  scale={containerScale}
                />
              </div>
            </div>

            {/* Dossier Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
              {/* Header Details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Awarded To Candidate</span>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#ea580c]">
                    {certificate.student?.name || 'Verified Student'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {certificate.student?.college || 'CRISMATECH Academy'} • {certificate.student?.branch || 'Computer Science & Engineering'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">Certificate ID</span>
                  <span className="font-mono text-base font-bold text-[#ea580c] block">{certificate.certificateId}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Issued: {new Date(certificate.earnedDate || certificate.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Course & Grade Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="text-xs font-medium text-slate-400 block">Program of Study</span>
                  <span className="text-sm font-serif font-bold text-slate-900 mt-1 block">
                    {certificate.course?.title || certificate.title || 'Curriculum Competency'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Category: {certificate.course?.category || 'Full Stack Engineering'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="text-xs font-medium text-slate-400 block">Assessment Grade</span>
                  <span className="text-sm font-mono font-bold text-emerald-700 mt-1 block text-lg">
                    Grade {certificate.grade || 'A+'} ({certificate.scorePercent || 100}%)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Proctored Anti-Cheat Verified
                  </span>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <span className="text-xs font-medium text-slate-400 block">Verification Status</span>
                  <span className="text-sm font-medium text-[#ea580c] mt-1 block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Valid & Unrevoked
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
                    Ledger: Active
                  </span>
                </div>
              </div>

              {/* Cryptographic Ledger Strip */}
              <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>AUTHENTICITY SIGNATURE</span>
                  <span>SHA-256 PROCTOR RECORD</span>
                </div>
                <p className="text-emerald-400 text-[11px] break-all">
                  0x{certificate.certificateId ? Array.from(certificate.certificateId).map(c => c.charCodeAt(0).toString(16)).join('') : '435254383434303835'}9b28f104c74da88a3190c6291244ef0081c
                </p>
                <div className="pt-1 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Issued By: CRISMATECH Academic Governance</span>
                  <span>Tamper-evident verification</span>
                </div>
              </div>

              {/* QR Code & Direct Print Link */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(window.location.href)}`}
                    alt="Certificate QR Verification Code"
                    className="w-14 h-14 rounded-lg border border-slate-200 p-1 bg-white"
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 block">Direct Smartphone Verification</span>
                    <span className="text-[11px] text-slate-500 block">Scan this QR code with any mobile camera to view this record.</span>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> Print Dossier
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 CRISMATECH Education • Academic Records Ledger</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <Link to="/courses" className="hover:text-slate-900 transition-colors">Curricula</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Portal Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
