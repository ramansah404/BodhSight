import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, Building2, Users, TrendingUp, AlertTriangle, FileText, Settings } from "lucide-react";

const navItems = [
  { name: "Analytics Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Course Performance", path: "/courses", icon: BookOpen },
  { name: "Departments", path: "/departments", icon: Building2 },
  { name: "Section Comparison", path: "/sections", icon: Users },
  { name: "Multi-Term Trends", path: "/trends", icon: TrendingUp },
  { name: "Exception Center", path: "/exceptions", icon: AlertTriangle },
  { name: "Audit Reports", path: "/reports", icon: FileText },
  { name: "System Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Agent 10 Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
          <div className="font-bold text-gray-900">BodhSight v1.0</div>
          <div className="text-gray-500">PostgreSQL Synchronized</div>
          <div className="flex items-center gap-1.5 pt-1 text-emerald-600 font-medium">
            <span className="h-2 w-2 bg-emerald-500 rounded-full inline-block"></span>
            Agent Active
          </div>
        </div>
      </div>
    </aside>
  );
}
