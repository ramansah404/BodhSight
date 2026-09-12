import BrandLogo from "../ui/BrandLogo";
import { Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import NotificationPanel from '../ui/NotificationPanel';
import { useNotifications } from '../../contexts/NotificationContext';
import ThemeToggle from '../ui/ThemeToggle';
interface TopbarProps {
  currentRole: string;
  onMenuToggle: () => void;
}

export default function Topbar({ currentRole, onMenuToggle }: TopbarProps) {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const displayRole = localStorage.getItem("bodhsight_display_role") || currentRole;
  const displayName = localStorage.getItem("bodhsight_name") || `${currentRole} User`;
  
  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(n => n.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return `${parts[0][0]}${parts[0][1] || ''}`.toUpperCase();
    return "US";
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
    <header className="h-16 bg-background backdrop-blur-md border-b border-border/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-md text-primary">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 bg-surface-secondary/50 hover:bg-surface-secondary rounded-lg text-primary transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu size={20} />
        </button>
        
        <div className="md:hidden">
          <BrandLogo />
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5">
        <ThemeToggle />
        <button 
          onClick={() => setIsNotifOpen(true)}
          className="relative p-2 rounded-xl bg-surface-secondary/50 hover:bg-surface-secondary transition-colors text-primary" 
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-primary flex items-center justify-center font-bold ring-2 ring-[#020817]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-border">
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs md:text-sm font-bold text-white shadow-sm tracking-widest">
            {getInitials(displayName)}
          </div>
          <div className="hidden lg:flex flex-col text-xs">
            <span className="font-bold text-primary tracking-wide">
              {displayName}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Academic Scope: {displayRole}</span>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          aria-label="Sign Out"
          className="flex items-center gap-1.5 ml-1 md:ml-2 px-2.5 py-1.5 md:px-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 hover:text-primary rounded-lg transition-colors text-xs font-bold border border-rose-500/30 shadow-sm"
        >
          <LogOut size={14} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
