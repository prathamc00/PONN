import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Bell, User, Menu, Search, Sparkles, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import CursorGlow from './ui/CursorGlow';
import { SocketProvider } from '../context/SocketContext';
import NotificationBell from './ui/NotificationBell';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isLoading } = useAuth();

  // Don't show sidebar/navbar on public pages
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);
  if (isPublicPage) return <Outlet />;

  // If not loading and not authenticated, redirect to login
  if (!isLoading && !user) return <Navigate to="/login" replace />;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SocketProvider>
    <div className="min-h-screen overflow-x-hidden bg-[#030014] text-slate-100 selection:bg-brand-purple/30 selection:text-brand-purple transition-colors student-theme">
      <CursorGlow />
      {/* Background Glows (Animated) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }} 
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/10 rounded-full blur-[120px]" 
        />
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 glass-panel border-x-0 border-t-0 lg:px-8 transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-400 lg:hidden hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-2xl text-slate-400 w-80 border border-white/10 focus-within:border-brand-purple/50 transition-all group">
              <Search className="w-4 h-4 group-focus-within:text-brand-purple transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources, courses..." 
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Gamification: Daily Streak */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20 group cursor-default">
              <Flame className="w-4 h-4 text-orange-500 group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold text-orange-500">3 Day Streak</span>
            </div>
            
            <NotificationBell />
            
            <div className="flex items-center gap-4 pl-4 ml-1 border-l border-white/10">
              <ThemeToggle />
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{user?.name || 'Student'}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 mt-1.5 tracking-wider">{user?.role || 'student'}</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl flex items-center justify-center text-white font-bold shadow-lg glow-shadow transition-transform hover:scale-105 cursor-pointer">
                {user ? getInitials(user.name) : '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
    </SocketProvider>
  );
}
