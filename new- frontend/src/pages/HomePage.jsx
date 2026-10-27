import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, ClipboardCheck, Award, ArrowRight, ShieldCheck, Search,
  Lock, Building2, Menu, X, CheckCircle, CheckCircle2, UserCheck,
  Code2, Database, Cpu, Layers, Clock, LifeBuoy, ExternalLink, GraduationCap, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const base = import.meta.env.BASE_URL || '/portal/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#ea580c] selection:text-white">

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <BrandLogo className="h-10 sm:h-11 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-[#07241a] hover:text-[#ea580c] transition-colors">
              Home
            </Link>
            {user ? (
              <Link to="/courses" className="text-sm font-medium text-slate-600 hover:text-[#ea580c] transition-colors">
                My Courses
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#ea580c] transition-colors flex items-center gap-1">
                <span>Courses</span>
                <Lock size={12} className="text-slate-400" />
              </Link>
            )}
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === 'admin' || user.role === 'instructor' ? '/admin/dashboard' : '/dashboard'}
                className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#ea580c] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-[#ea580c] rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-[#ea580c] rounded-lg hover:bg-slate-50"
            >
              Home
            </Link>
            {user ? (
              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
              >
                My Courses
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Courses (Login Required)
              </Link>
            )}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Link
                  to={user.role === 'admin' || user.role === 'instructor' ? '/admin/dashboard' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#ea580c] text-white font-semibold rounded-xl text-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-[#ea580c] text-white font-semibold rounded-xl text-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-slate-100/60 py-12 sm:py-16 lg:py-20 border-b border-slate-200/80">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid lg:grid-cols-12 gap-8 xl:gap-14 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6">
              {/* Main Headline */}
              <h1 className="font-serif max-w-4xl text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-slate-900 font-bold tracking-[-0.04em] leading-[1.04]">
                CRISMATECH courses, assignments, tests, and certificates in one portal.
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-7 max-w-2xl">
                Sign in to view your enrolled courses, submit work, take scheduled assessments, and download certificates issued by CRISMATECH.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <Link
                    to={user.role === 'admin' || user.role === 'instructor' ? '/admin/dashboard' : '/dashboard'}
                    className="px-7 py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold rounded-xl text-sm sm:text-base inline-flex items-center gap-2 transition-colors shadow-md"
                  >
                    <span>Open Student Dashboard</span>
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-7 py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold rounded-xl text-sm sm:text-base inline-flex items-center gap-2 transition-colors shadow-md"
                    >
                      <UserCheck size={18} />
                      <span>Student Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold rounded-xl text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-2xs hover:border-slate-400"
                    >
                      <span>Register Account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Student Portal Gateway Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-mono uppercase font-bold text-slate-500">
                      STUDENT LEARNING GATEWAY
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase">
                    SECURE PORTAL
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Course Modules & Lectures</span>
                        {!user && <Lock size={11} className="text-slate-400" />}
                      </div>
                      <div className="text-[11px] text-slate-500">Recorded lessons and downloadable course files</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Practical Assignments</span>
                        {!user && <Lock size={11} className="text-slate-400" />}
                      </div>
                      <div className="text-[11px] text-slate-500">Hands-on project submissions with instructor grading</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                      <ClipboardCheck size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Online Assessments (MCQ)</span>
                        {!user && <Lock size={11} className="text-slate-400" />}
                      </div>
                      <div className="text-[11px] text-slate-500">Timed examinations with automatic score calculation</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                      <Award size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Course Certificates</div>
                      <div className="text-[11px] text-slate-500">Download certificates issued to your account</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {user ? (
                    <Link
                      to="/courses"
                      className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Access Enrolled Courses</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Lock size={13} />
                      <span>Sign In to Access Courses</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Academic Disciplines & Core Technical Tracks */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase bg-slate-100 text-slate-700 font-bold">
                <Code2 size={13} className="text-[#9d4225]" />
                Academic Specializations
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-bold tracking-tight mt-2">
                Available technical tracks
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Review the subjects and tools covered in each track. Sign in to see the current syllabus and your enrolled modules.
              </p>
            </div>
            <div className="shrink-0">
              {user ? (
                <Link
                  to="/courses"
                  className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  <span>Open Full Catalogue</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  <Lock size={13} />
                  <span>Sign In for Full Syllabi</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Track 1: Full-Stack Web Architecture */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                  <Code2 size={20} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  <span>Track 01</span>
                  <span>•</span>
                  <span className="text-emerald-700">Full-Stack</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug">
                  Full-Stack Web Architecture
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  React interfaces, application state, relational database design, and authenticated REST APIs.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">Key Technologies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['React.js', 'Node.js', 'Express', 'MySQL', 'Tailwind', 'JWT Auth'].map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60">
                {user ? (
                  <Link to="/courses" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1">
                    <span>View Track Modules</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : (
                  <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                    <Lock size={11} className="text-slate-400" />
                    <span>Login to View Syllabus</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Track 2: Data Science & AI Systems */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                  <Cpu size={20} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  <span>Track 02</span>
                  <span>•</span>
                  <span className="text-amber-800">Intelligence</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug">
                  Data Science & Machine Learning
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Statistical analysis, predictive models, machine learning workflows, and model integration with APIs.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">Key Technologies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Python', 'NumPy', 'Pandas', 'Scikit-Learn', 'Matplotlib', 'Jupyter'].map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60">
                {user ? (
                  <Link to="/courses" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1">
                    <span>View Track Modules</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : (
                  <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                    <Lock size={11} className="text-slate-400" />
                    <span>Login to View Syllabus</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Track 3: Cloud Infrastructure & DevOps */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-4">
                  <Layers size={20} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  <span>Track 03</span>
                  <span>•</span>
                  <span className="text-sky-800">Operations</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug">
                  Cloud DevOps & Containerization
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  CI/CD workflows, Linux administration, Docker containers, reverse proxies, and TLS configuration.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">Key Technologies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Docker', 'Linux / Bash', 'Nginx', 'GitLab/GitHub CI', 'cPanel', 'SSL/TLS'].map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60">
                {user ? (
                  <Link to="/courses" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1">
                    <span>View Track Modules</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : (
                  <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                    <Lock size={11} className="text-slate-400" />
                    <span>Login to View Syllabus</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Track 4: Database Engineering & Security */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
                  <Database size={20} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  <span>Track 04</span>
                  <span>•</span>
                  <span className="text-purple-800">Databases</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug">
                  Database Systems & Data Security
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Relational modeling, query plans, indexes, transactions, parameterized queries, and database access controls.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">Key Technologies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['MySQL 8.0', 'PostgreSQL', 'SQL Optimization', 'ACID Transactions', 'Data Encryption'].map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60">
                {user ? (
                  <Link to="/courses" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1">
                    <span>View Track Modules</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : (
                  <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                    <Lock size={11} className="text-slate-400" />
                    <span>Login to View Syllabus</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official 4-Step Academic Certification Roadmap */}
      <section className="py-14 sm:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <GraduationCap size={14} className="text-emerald-600" />
              Academic Workflow
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-bold tracking-tight mt-2">
              How course completion works
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Course requirements are shown in the student portal. The usual sequence is coursework, submission, assessment, and certificate issuance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-[#07241a] text-white flex items-center justify-center font-mono font-bold text-xs">
                  01
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Phase 1</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Register & Access Syllabus
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create your student profile or sign in with your credentials. Browse approved course tracks, download syllabus guides, and view structured lecture modules.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                <Check size={13} />
                <span>Instant Module Access</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-[#07241a] text-white flex items-center justify-center font-mono font-bold text-xs">
                  02
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Phase 2</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Practical Project Submissions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apply learning by implementing real software assignments. Upload deliverables or source code repositories directly to your student dashboard.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                <Check size={13} />
                <span>Faculty Review & Grades</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-[#07241a] text-white flex items-center justify-center font-mono font-bold text-xs">
                  03
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Phase 3</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Timed Proctored Assessments
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Undergo timed objective evaluations with integrated anti-cheat safeguards and automatic grading. Maintain a minimum score of 60% to qualify for certification.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                <Check size={13} />
                <span>Automatic Grade Calculation</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-mono font-bold text-xs">
                  04
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase">Phase 4</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Certificate Issuance
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                After the recorded course requirements are met, CRISMATECH can issue a certificate to the student account.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                <Check size={13} />
                <span>Certificate PDF download</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Academic Support & Examination Standards Hub */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box 1: Examination & Grading Criteria */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Clock size={16} className="text-emerald-700" />
                <span>Assessment & Passing Guidelines</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Minimum Passing Score:</strong> 60% cumulative across assignments and timed tests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Timed Windows:</strong> Quizzes are locked to predetermined durations; tests auto-submit on timer expiration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Re-evaluation:</strong> Students who score below passing may request an exam reset through their instructor.</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Verification & Credential Security */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck size={16} className="text-emerald-700" />
                <span>Certificate Access</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Student Access:</strong> Issued certificates appear in the student's dashboard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Certificate Record:</strong> Each certificate displays its course, recipient, and issue date.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Download:</strong> Students can save or print the certificate from their account.</span>
                </li>
              </ul>
            </div>

            {/* Box 3: Student Academic Help Desk */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <LifeBuoy size={16} className="text-emerald-700" />
                <span>Student Academic Help Desk</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experiencing portal access issues, enrollment queries, or assignment upload difficulties? Contact our academic coordination team:
              </p>
              <div className="pt-2 text-xs font-mono space-y-1.5 text-slate-700">
                <div><strong>Email:</strong> <a href="mailto:director@crismatech.com" className="text-emerald-800 hover:underline">director@crismatech.com</a></div>
                <div><strong>Support Hours:</strong> Mon to Sat, 9:00 AM to 6:00 PM IST</div>
                <div><strong>Phone:</strong> <a href="tel:+919108118381" className="text-emerald-800 hover:underline">+91 9108118381</a></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-8 lg:px-12 xl:px-16 mt-auto">
        <div className="max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-12">
          {/* Column 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center">
              <BrandLogo className="h-9 w-auto object-contain" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              CRISMATECH student portal for course materials, submissions, assessments, attendance, and issued certificates.
            </p>
            <div className="text-xs font-mono text-slate-500 space-y-1 pt-1">
              <div>Email: <a href="mailto:director@crismatech.com" className="text-slate-800 hover:underline">director@crismatech.com</a></div>
              <div>Phone: <a href="tel:+919108118381" className="text-slate-800 hover:underline">+91 9108118381</a></div>
            </div>

            {/* Social Icons Strip */}
            <div className="pt-2 flex items-center gap-2.5">
              <a
                href="https://www.linkedin.com/company/crismatech-automations/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CRISMATECH on LinkedIn"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#0077b5] text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/crismatech/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CRISMATECH on Instagram"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#E4405F] text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://x.com/crismatech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CRISMATECH on X"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-black text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Student Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><Link to="/login" className="hover:text-[#ea580c] transition-colors">Student Login</Link></li>
              <li><Link to="/register" className="hover:text-[#ea580c] transition-colors">Create Student Account</Link></li>
              <li><Link to="/forgot-password" className="hover:text-[#ea580c] transition-colors">Reset Password</Link></li>
            </ul>
          </div>

          {/* Column 3: Core Disciplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Core Disciplines
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>Full-Stack Web Architecture</li>
              <li>Data Science & AI Systems</li>
              <li>Cloud DevOps & Containers</li>
              <li>Database Systems & Security</li>
            </ul>
          </div>

          {/* Column 4: Official Connect & Socials */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Connect With Us
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-600">
              <li>
                <a
                  href="https://www.linkedin.com/company/crismatech-automations/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#0077b5] transition-colors group"
                >
                  <span className="w-5 h-5 rounded bg-slate-100 group-hover:bg-[#0077b5] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                  </span>
                  <span>LinkedIn / crismatech-automations</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/crismatech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#E4405F] transition-colors group"
                >
                  <span className="w-5 h-5 rounded bg-slate-100 group-hover:bg-[#E4405F] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </span>
                  <span>Instagram / @crismatech</span>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/crismatech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-black transition-colors group"
                >
                  <span className="w-5 h-5 rounded bg-slate-100 group-hover:bg-black group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </span>
                  <span>X (Twitter) / @crismatech</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1720px] mx-auto mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>© {new Date().getFullYear()} CRISMATECH Education. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/crismatech-automations/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              LinkedIn
            </a>
            <span>•</span>
            <a
              href="https://www.instagram.com/crismatech/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              Instagram
            </a>
            <span>•</span>
            <a
              href="https://x.com/crismatech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              X
            </a>
            <span>•</span>
            <span>crismatech.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
