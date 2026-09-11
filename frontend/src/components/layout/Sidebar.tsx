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
  ShieldAlert,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";
  
  const allNavItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard, roles: ["Dean", "HOD", "Faculty"] },
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

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  const SidebarContent = (
    <div className="w-64 bg-[#020817] border-r border-slate-800/60 flex flex-col h-full text-slate-300">
      <div className="p-6 border-b border-slate-800/60 flex items-center justify-between h-16 md:h-20 shrink-0">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Agent 10 Security</h2>
          <div className="text-xs font-bold text-slate-300 mt-1 capitalize">
            Scope: {currentRole === "Dean" ? "Institutional" : currentRole === "HOD" ? "Departmental" : "Instructor"}
          </div>
        </div>
        {/* Mobile close button inside sidebar */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden text-slate-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group
                ${isActive 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/60 text-[10px] text-slate-600 text-center font-bold tracking-widest uppercase shrink-0">
        Strict RBAC Active
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:block h-screen z-10 shrink-0">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-[#020817]/80 backdrop-blur-sm z-40"
            />
            {/* Sliding Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 h-screen shadow-2xl shadow-indigo-900/20"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
