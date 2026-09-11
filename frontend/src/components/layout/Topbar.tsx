import { Bell, UserCircle, BrainCircuit } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 text-indigo-700">
        <BrainCircuit size={24} />
        <span className="text-xl font-bold tracking-tight">BodhSight</span>
        <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Agent 10</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-sm font-medium text-gray-600 hidden md:block">
          Academic Year: <span className="text-gray-900">2026-27 Term 1</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">2</span>
        </button>
        <div className="flex items-center gap-2 border-l pl-6 border-gray-200">
          <UserCircle size={28} className="text-gray-400" />
          <div className="flex flex-col text-sm">
            <span className="font-semibold text-gray-900">Dr. Sharma</span>
            <span className="text-xs text-gray-500">Dean of Academics</span>
          </div>
        </div>
      </div>
    </header>
  );
}

