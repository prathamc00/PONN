import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  LogOut,
  GraduationCap,
  ArrowLeft,
  Award,
  ScrollText,
  Activity,
  BarChart,
  Star
} from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';

// All sidebar items with optional "adminOnly" flag
const allItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', adminOnly: false },
  { icon: Users, label: 'Manage Users', path: '/admin/users', adminOnly: true },
  { icon: BookOpen, label: 'Manage Courses', path: '/admin/courses', adminOnly: false },
  { icon: FileText, label: 'Manage Assignments', path: '/admin/assignments', adminOnly: false },
  { icon: ClipboardCheck, label: 'Quiz Scheduler', path: '/admin/quiz', adminOnly: false },
  { icon: Award, label: 'Quiz Results', path: '/admin/quiz-results', adminOnly: true },
  { icon: ScrollText, label: 'Certificates', path: '/admin/certificates', adminOnly: true },
  { icon: Activity, label: 'Activity Feed', path: '/admin/activity', adminOnly: true },
  { icon: BarChart, label: 'Analytics', path: '/admin/analytics', adminOnly: true },
  { icon: Star, label: 'Grading Queue', path: '/admin/grading', adminOnly: false },
];

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filter items based on role
  const sidebarItems = allItems.filter(item => isAdmin || !item.adminOnly);
  const panelTitle = isAdmin ? 'Admin Panel' : 'Instructor Panel';
  const panelInitial = isAdmin ? 'A' : 'I';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-all duration-300 lg:translate-x-0 shadow-xl",
        !isOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">{panelInitial}</div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none tracking-tight text-white">{panelTitle}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-400 mt-1">Crismatech</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <div className="mb-4 px-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Management</p>
            </div>
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group",
                  location.pathname === item.path
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  location.pathname === item.path ? "scale-110" : "group-hover:scale-110"
                )} />
                {item.label}
              </Link>
            ))}

            <div className="mt-8 mb-4 px-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navigation</p>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Student View
            </Link>
          </nav>

          <div className="p-4 mt-auto border-t border-slate-800">
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
