import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCircle2, AlertCircle, Info, ExternalLink, Loader2 } from "lucide-react";
import { NotificationAPI, type NotificationItem } from "../../services/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationAPI.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      refreshUnreadCount();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      try {
        await NotificationAPI.markRead(n.id);
        setNotifications(notifications.map(x => x.id === n.id ? { ...x, is_read: true } : x));
        refreshUnreadCount();
      } catch (e) {
        console.error(e);
      }
    }
    
    if (n.link) {
      onClose();
      navigate(n.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'alert': return <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />;
      case 'success': return <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />;
      default: return <Info size={16} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 glass-overlay z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div className={`glass-panel fixed inset-y-0 right-0 h-[100dvh] max-h-[100dvh] w-full sm:w-[400px] min-h-0 border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 glass-surface-strong">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-primary">Notifications</h2>
          </div>
          <div className="flex items-center gap-3">
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-md"
              >
                <Check size={14} /> Mark all read
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-secondary gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-secondary gap-3">
              <Bell size={32} className="opacity-20" />
              <p className="text-sm font-medium">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  n.is_read 
                    ? 'glass-card border-border/50 hover:bg-surface/60' 
                    : 'glass-card bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:bg-indigo-950/40'
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`text-sm font-semibold ${n.is_read ? 'text-primary' : 'text-primary'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] font-medium text-secondary whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${n.is_read ? 'text-secondary' : 'text-secondary'}`}>
                      {n.message}
                    </p>
                    
                    {n.link && (
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        View details <ExternalLink size={12} />
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
