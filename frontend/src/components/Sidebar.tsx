import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, FileText, ClipboardCheck, Calendar, User, Award, LogOut, X, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: FileText, label: 'Assignments', path: '/assignments' },
  { icon: ClipboardCheck, label: 'Tests', path: '/test' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Award, label: 'Certificate', path: '/certificate' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 glass-panel border-y-0 border-l-0 transition-all duration-500 lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg glow-shadow transition-transform group-hover:scale-110">C</div>
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-none tracking-tight gradient-text">Crismatech</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-2">Learning Portal</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                  location.pathname === item.path
                    ? "bg-white/10 text-white glow-shadow border border-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                onClick={() => setIsOpen(false)}
              >
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-6 bg-brand-purple rounded-r-full"
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  location.pathname === item.path ? "text-brand-purple scale-110" : "group-hover:scale-110 group-hover:text-brand-purple"
                )} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-6 mt-auto space-y-4">
            <div className="p-5 glass-card rounded-3xl border-brand-purple/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-purple" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</p>
              </div>
              <button className="text-xs font-bold text-brand-purple hover:underline transition-all">Contact Help Desk</button>
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
