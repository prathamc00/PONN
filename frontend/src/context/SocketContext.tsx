import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const baseUrl = (import.meta as any).env.VITE_BACKEND_URL || window.location.origin;

    const newSocket = io(baseUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    // Initial fetch
    apiFetch('/notifications').then((data) => {
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    });

    // Real-time listener
    newSocket.on('new_notification', (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Trigger sliding toast
      setToast(data);
      setTimeout(() => setToast(null), 5000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/read/${id}`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-brand-blue" />,
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead, markAllAsRead, isDropdownOpen, setIsDropdownOpen }}>
      {children}
      
      {/* Global Toast Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 glass-panel p-5 rounded-2xl border-white/10 shadow-2xl flex items-start gap-4 max-w-sm w-full backdrop-blur-3xl bg-slate-900/90"
          >
            <div className="shrink-0 mt-1">{icons[toast.type]}</div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm tracking-tight">{toast.title}</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </SocketContext.Provider>
  );
};
