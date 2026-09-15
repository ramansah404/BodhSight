import BrandLogo from "../ui/BrandLogo";

import { Bell, LogOut, Menu } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useState } from 'react';

import NotificationPanel from '../ui/NotificationPanel';

import { useNotifications } from '../../contexts/NotificationContext';

import ThemeToggle from '../ui/ThemeToggle';
import { useRole } from '../../contexts/RoleContext';

interface TopbarProps {

  currentRole: string;

  onMenuToggle: () => void;

}



export default function Topbar({ currentRole, onMenuToggle }: TopbarProps) {

  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { unreadCount } = useNotifications();
  const { clearSession } = useRole();

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
    clearSession();

    navigate("/login");

  };



  return (

    <>

    <header className="glass-panel h-16 border-b border-border/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 text-primary">

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

          className="glass-control relative p-2 rounded-xl hover:bg-white/20 text-primary"

          aria-label="Notifications"

        >

          <Bell size={18} />

          {unreadCount > 0 && (

            <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-primary flex items-center justify-center font-bold ring-2 ring-[#020817]">

              {unreadCount > 9 ? '9+' : unreadCount}

            </span>

          )}

        </button>



        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-border relative group cursor-pointer">

          <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs md:text-sm font-bold text-white shadow-sm tracking-widest">

            {getInitials(displayName)}

          </div>

          <div className="hidden lg:flex flex-col text-xs">

            <span className="font-bold text-primary tracking-wide">

              {displayName}

            </span>

            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Academic Scope: {displayRole}</span>

          </div>

          

          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">

            <button 

              onClick={() => navigate("/settings")}

              className="w-full text-left px-4 py-2.5 text-sm font-medium text-primary hover:bg-surface-secondary flex items-center gap-2"

            >

              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>

              Settings

            </button>

            <div className="h-px bg-border my-1 w-full" />

            <button 

              onClick={handleSignOut}

              className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"

            >

              <LogOut size={16} />

              Sign Out

            </button>

          </div>

        </div>

      </div>

    </header>

      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

    </>

  );

}

