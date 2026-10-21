import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-red-500';
      default: return 'text-primary-container';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-80 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-secondary font-medium">{unreadCount} new</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-outline text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n, i) => {
                const Icon = getIcon(n.type);
                return (
                  <div key={i} className="p-3 border-b border-outline-variant/50 hover:bg-surface-container cursor-pointer flex gap-3">
                    <Icon size={16} className={`shrink-0 mt-0.5 ${getColor(n.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{n.title}</p>
                      <p className="text-xs text-outline mt-0.5">{n.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
