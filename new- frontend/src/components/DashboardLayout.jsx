import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardCheck,
  Calendar,
  User,
  Award,
  LogOut,
  Menu,
  X,
  Search,
  Sparkles,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import BrandLogo from './BrandLogo.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  const navigationSections = [
    {
      group: 'Academics & Learning',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/courses', label: 'My Courses', icon: BookOpen },
        { path: '/test', label: 'Assessments', icon: ClipboardCheck },
        { path: '/assignments', label: 'Assignments', icon: FileText },
      ],
    },
    {
      group: 'Records & Credentials',
      items: [
        { path: '/certificate', label: 'Certificates', icon: Award },
        { path: '/attendance', label: 'Attendance', icon: Calendar },
      ],
    },
    {
      group: 'Settings',
      items: [
        { path: '/profile', label: 'Student Profile', icon: User },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ST';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* ── SIDEBAR NAVIGATION ────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-sm lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <BrandLogo className="h-9 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            {navigationSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mb-1.5 font-sans">
                  {section.group}
                </span>
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group ${
                        active
                          ? 'bg-[#ea580c]/10 text-[#ea580c] font-semibold'
                          : 'text-slate-600 hover:text-[#ea580c] hover:bg-orange-50/50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#ea580c]" />
                        )}
                        <item.icon
                          size={17}
                          className={active ? 'text-[#ea580c]' : 'text-slate-400 group-hover:text-[#ea580c]'}
                        />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom: Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all">
            <Link to="/profile" className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-500 truncate capitalize">
                    {user?.role || 'Student'}
                  </span>
                </div>
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Dark Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-64 md:w-80">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses, lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-1.5 bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </span>
            </form>
          </div>

          {/* Right Header Status & Controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Active Term Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200/70 rounded-full text-[11px] font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Fall 2026 Academic Term</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Avatar Pill */}
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
