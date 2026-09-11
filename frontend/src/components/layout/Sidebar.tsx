import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Building2, Users, TrendingUp, AlertTriangle, FileText, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Course Performance', icon: BookOpen, path: '/courses' },
  { name: 'Departments', icon: Building2, path: '/departments' },
  { name: 'Section Comparison', icon: Users, path: '/sections' },
  { name: 'Trends', icon: TrendingUp, path: '/trends' },
  { name: 'Exception Center', icon: AlertTriangle, path: '/exceptions' },
  { name: 'Reports', icon: FileText, path: '/reports' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Analytics
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white font-medium' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors w-full">
          <Settings size={20} />
          Settings
        </button>
      </div>
    </aside>
  );
}

