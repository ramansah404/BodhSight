import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen, 
  Building2, 
  Layers, 
  Users, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  Settings,
  ShieldAlert
} from "lucide-react";

export default function Sidebar() {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";
  
  // Define menu items with required minimum privilege
  const allNavItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard, roles: ["Dean", "HOD", "Faculty"] },
    { name: "Trends", path: "/trends", icon: TrendingUp, roles: ["Dean", "HOD"] },
    { name: "Courses", path: "/courses", icon: BookOpen, roles: ["Dean", "HOD", "Faculty"] },
    { name: "Departments", path: "/departments", icon: Building2, roles: ["Dean"] },
    { name: "Sections", path: "/sections", icon: Layers, roles: ["Dean", "HOD", "Faculty"] },
    { name: "Batches", path: "/batches", icon: Users, roles: ["Dean", "HOD"] },
    { name: "Students (At-Risk)", path: "/students", icon: ShieldAlert, roles: ["Dean", "HOD", "Faculty"] },
    { name: "Anomalies", path: "/anomalies", icon: AlertTriangle, roles: ["Dean", "HOD", "Faculty"] },
    { name: "Recommendations", path: "/recommendations", icon: Lightbulb, roles: ["Dean", "HOD", "Faculty"] },
    { name: "Executive Reports", path: "/reports", icon: FileText, roles: ["Dean"] },
    { name: "Settings", path: "/settings", icon: Settings, roles: ["Dean", "HOD", "Faculty"] },
  ];

  // Filter navigation items strictly based on current role
  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-300">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400">Agent 10 Security</h2>
        <div className="text-sm font-bold text-white mt-1 capitalize">
          Scope: {currentRole === "Dean" ? "Institutional (Dean/Principal)" : currentRole === "HOD" ? "Departmental (HOD)" : "Course Instructor (Faculty)"}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center font-medium">
        Strict RBAC Guardrails Active
      </div>
    </aside>
  );
}
