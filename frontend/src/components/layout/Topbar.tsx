import { Bell, BrainCircuit, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  currentRole: string;
  onMenuToggle: () => void;
}

export default function Topbar({ currentRole, onMenuToggle }: TopbarProps) {
  const navigate = useNavigate();
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
    <header className="h-16 bg-[#020817]/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-md text-slate-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:block p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
          <BrainCircuit size={22} className="text-indigo-200" />
        </div>
        <div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-white">BodhSight</span>
          <span className="ml-2 text-[10px] md:text-xs font-semibold bg-indigo-500/50 text-indigo-100 px-2 py-0.5 rounded-full border border-indigo-400/30 hidden sm:inline-block">Agent 10</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5">
        <button className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-indigo-100" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-[#020817]">3</span>
        </button>

        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-slate-700">
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs md:text-sm font-bold text-white shadow-sm tracking-widest">
            {getInitials(displayName)}
          </div>
          <div className="hidden lg:flex flex-col text-xs">
            <span className="font-bold text-white tracking-wide">
              {displayName}
            </span>
            <span className="text-indigo-200">{displayRole} Scope Active</span>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          aria-label="Sign Out"
          className="flex items-center gap-1.5 ml-1 md:ml-2 px-2.5 py-1.5 md:px-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 hover:text-white rounded-lg transition-colors text-xs font-bold border border-rose-500/30 shadow-sm"
        >
          <LogOut size={14} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
