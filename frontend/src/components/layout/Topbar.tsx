import { Bell, BrainCircuit, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  currentRole: string;
  setRole: (role: string) => void;
}

export default function Topbar({ currentRole, setRole }: TopbarProps) {
  const navigate = useNavigate();
  // Retrieve the name we typed in during login
  const userName = localStorage.getItem('bodhsight_name') || 'Administrator';

  const handleLogout = () => {
    localStorage.removeItem('bodhsight_role');
    localStorage.removeItem('bodhsight_name');
    navigate('/login');
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
        
        {/* Fast Demo Role Selector */}
        <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs">
          <Shield size={14} className="text-indigo-300" />
          <span className="text-indigo-200 font-medium">Role:</span>
          <select 
            value={currentRole} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="Principal" className="text-gray-900">Principal</option>
            <option value="Management" className="text-gray-900">Management</option>
            <option value="IQAC" className="text-gray-900">IQAC</option>
            <option value="Dean" className="text-gray-900">Dean of Academics</option>
            <option value="HOD" className="text-gray-900">Department HOD</option>
            <option value="Faculty" className="text-gray-900">Faculty Member</option>
          </select>
        </div>

        <button className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-indigo-100">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-indigo-900">2</span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/20">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white shadow-sm uppercase">
            {userName.substring(0, 2)}
          </div>
          <div className="hidden md:flex flex-col text-xs">
            <span className="font-bold text-white truncate max-w-[120px]">
              {userName}
            </span>
            <span className="text-indigo-200">{currentRole} View</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="ml-2 p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
