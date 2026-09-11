import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, BookOpen, Building2, GraduationCap, Users, TrendingUp, AlertTriangle, Lightbulb, FileText, Settings } from "lucide-react";

const navItems = [
  { name: "Overview", path: "/", icon: LayoutDashboard, color: "text-indigo-600" },
  { name: "Performance", path: "/performance", icon: BarChart3, color: "text-blue-600" },
  { name: "Courses", path: "/courses", icon: BookOpen, color: "text-violet-600" },
  { name: "Departments", path: "/departments", icon: Building2, color: "text-cyan-600" },
  { name: "Batches", path: "/batches", icon: GraduationCap, color: "text-teal-600" },
  { name: "Students", path: "/students", icon: Users, color: "text-emerald-600" },
  { name: "Trends", path: "/trends", icon: TrendingUp, color: "text-amber-600" },
  { name: "Anomalies", path: "/anomalies", icon: AlertTriangle, color: "text-rose-600" },
  { name: "Recommendations", path: "/recommendations", icon: Lightbulb, color: "text-purple-600" },
  { name: "Reports", path: "/reports", icon: FileText, color: "text-slate-600" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex shrink-0 shadow-sm">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-indigo-900 uppercase tracking-wider bg-indigo-50/60 rounded-xl mb-2">
          Agent 10 Command Center
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-100"
                    : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-white" : item.color} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-3.5 rounded-2xl text-xs space-y-1.5 text-white shadow-md">
          <div className="font-bold text-indigo-200">BodhSight v1.0</div>
          <div className="text-slate-300 text-[11px]">PostgreSQL & FastAPI Linked</div>
          <div className="flex items-center gap-1.5 pt-1 text-emerald-400 font-bold">
            <span className="h-2 w-2 bg-emerald-400 rounded-full inline-block animate-ping"></span>
            Agent Active
          </div>
        </div>
      </div>
    </aside>
  );
}
