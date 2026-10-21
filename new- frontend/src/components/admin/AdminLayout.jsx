import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Award,
  BarChart,
  Activity,
  ClipboardList,
  LogOut,
  Menu,
  X,
  UserCircle,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import BrandLogo from '../BrandLogo.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== 'admin' && user.role !== 'instructor') {
    return <Navigate to="/dashboard" replace />;
  }

  const adminSections = [
    {
      group: 'Core Administration',
      items: [
        { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/users', label: 'User Directory', icon: Users, adminOnly: true },
        { path: '/admin/courses', label: 'Course Management', icon: BookOpen },
        { path: '/admin/assignments', label: 'Assignments', icon: FileText },
      ],
    },
    {
      group: 'Assessments & Grading',
      items: [
        { path: '/admin/quiz', label: 'Quiz Scheduler', icon: Calendar },
        { path: '/admin/quiz-results', label: 'Exam Results', icon: Award, adminOnly: true },
        { path: '/admin/grading', label: 'Grading Queue', icon: ClipboardList },
        { path: '/admin/certificates', label: 'Certificate Registry', icon: UserCircle },
      ],
    },
    {
      group: 'Analytics & Audit',
      items: [
        { path: '/admin/analytics', label: 'Platform Analytics', icon: BarChart, adminOnly: true },
        { path: '/admin/activity', label: 'Activity Logs', icon: Activity, adminOnly: true },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* ── ADMIN SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-sm lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top: Brand Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <BrandLogo className="h-9 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            {adminSections.map((section, sIdx) => {
              const visibleItems = section.items.filter(
                (item) => user.role === 'admin' || !item.adminOnly
              );
              if (!visibleItems.length) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mb-1.5 font-sans">
                    {section.group}
                  </span>
                  {visibleItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group ${
                          active
                            ? 'bg-[#07241a]/8 text-[#07241a] font-semibold'
                            : 'text-slate-600 hover:text-[#07241a] hover:bg-slate-100/70 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#07241a]" />
                          )}
                          <item.icon
                            size={17}
                            className={active ? 'text-[#07241a]' : 'text-slate-400 group-hover:text-[#07241a]'}
                          />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-[11px] text-slate-500 truncate capitalize">
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>
            </div>

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
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-mono text-[10px] font-semibold uppercase">
                {user.role === 'admin' ? 'Administrative Suite' : 'Faculty Portal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
