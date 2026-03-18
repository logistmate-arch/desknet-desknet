import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiBell as Bell, 
  HiChatBubbleLeftRight as MessageSquare, 
  HiTicket as Ticket, 
  HiXMark as X,
  HiCheckCircle as CheckCircle,
  HiClock as Clock,
  HiTrash as Trash
} from 'react-icons/hi2';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'ticket': return <Ticket className="w-4 h-4 text-emerald-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error': return <X className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-dark">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-brand-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-bottom border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-[10px] font-bold text-brand-teal uppercase tracking-widest hover:text-teal-300 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-xs text-white/40">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 border-bottom border-white/5 flex gap-3 group transition-colors relative ${notif.read ? 'opacity-60' : 'bg-brand-teal/5'}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.read ? 'bg-white/5' : 'bg-brand-teal/10'
                    }`}>
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-xs font-bold truncate ${notif.read ? 'text-white/60' : 'text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-white/30 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash className="w-3 h-3" />
                    </button>

                    {!notif.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-teal" />
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-top border-white/5 text-center bg-white/5">
                <button className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                  View all activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
