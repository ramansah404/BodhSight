import { Bell, BrainCircuit, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  currentRole: string;
}

export default function Topbar({ currentRole }: TopbarProps) {
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
    <header className="h-16 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 border-b border-indigo-800 flex items-center justify-between px-6 sticky top-0 z-20 shadow-md text-white">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
          <BrainCircuit size={22} className="text-indigo-200" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">BodhSight</span>
          <span className="ml-2 text-xs font-semibold bg-indigo-500/50 text-indigo-100 px-2 py-0.5 rounded-full border border-indigo-400/30 hidden sm:inline-block">Agent 10</span>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-indigo-100">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-indigo-900">3</span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/20">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white shadow-sm tracking-widest">
            {getInitials(displayName)}
          </div>
          <div className="hidden md:flex flex-col text-xs">
            <span className="font-bold text-white tracking-wide">
              {displayName}
            </span>
            <span className="text-indigo-200">{displayRole} Scope Active</span>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-1.5 ml-2 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 hover:text-white rounded-lg transition-colors text-xs font-bold border border-rose-500/30 shadow-sm"
        >
          <LogOut size={14} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
