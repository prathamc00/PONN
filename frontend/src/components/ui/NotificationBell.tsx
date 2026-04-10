import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Info, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isDropdownOpen, setIsDropdownOpen } = useSocket();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsDropdownOpen]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) markAsRead(notif._id);
    setIsDropdownOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-brand-blue" />,
  };

  const backgrounds = {
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    error: 'bg-rose-500/10',
    info: 'bg-brand-blue/10',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-[#1E1B4B]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-[380px] glass-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 bg-slate-900/90 backdrop-blur-3xl"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-white tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-brand-purple hover:text-brand-blue transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <Bell className="w-8 h-8 mb-3 opacity-50" />
                  <p className="font-medium text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <button
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 flex gap-4 text-left transition-all border-b border-white/5 hover:bg-white/5 ${
                        !notif.isRead ? 'bg-brand-purple/5' : ''
                      }`}
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${backgrounds[notif.type]}`}>
                        {icons[notif.type]}
                      </div>
                      <div className="flex-1 pr-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm tracking-tight ${!notif.isRead ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-purple mt-1.5 shrink-0" />}
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
