import { Bell, UserCircle, BrainCircuit, Shield } from 'lucide-react';

interface TopbarProps {
  currentRole: string;
  setRole: (role: string) => void;
}

export default function Topbar({ currentRole, setRole }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 text-indigo-700">
        <BrainCircuit size={24} />
        <span className="text-xl font-bold tracking-tight">BodhSight</span>
        <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Agent 10</span>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Role Switcher for Demo */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
          <Shield size={16} className="text-indigo-600" />
          <span className="text-gray-500 text-xs font-medium">Role:</span>
          <select 
            value={currentRole} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent font-semibold text-gray-900 focus:outline-none cursor-pointer"
          >
            <option value="Dean">Dean of Academics</option>
            <option value="HOD">CSE Department HOD</option>
            <option value="Faculty">Course Instructor</option>
          </select>
        </div>

        <button className="text-gray-400 hover:text-gray-600 relative hidden sm:block">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">2</span>
        </button>

        <div className="flex items-center gap-2 border-l pl-6 border-gray-200">
          <UserCircle size={28} className="text-gray-400" />
          <div className="flex flex-col text-sm">
            <span className="font-semibold text-gray-900">
              {currentRole === 'Dean' ? 'Dr. Sharma' : currentRole === 'HOD' ? 'Dr. Rao' : 'Prof. Verma'}
            </span>
            <span className="text-xs text-gray-500">{currentRole} View</span>
          </div>
        </div>
      </div>
    </header>
  );
}
