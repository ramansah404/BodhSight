import BrandLogo from "../ui/BrandLogo";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen, 
  Building2, 
  Layers, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  ShieldAlert,
  X,
  Menu,
  Database,
  FileWarning,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const currentRole = localStorage.getItem("bodhsight_role") || "Chairman";
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const overviewLabel = currentRole === "Faculty" ? "Course Overview" : currentRole === "HOD" ? "Department Overview" : currentRole === "Chairman" ? "Strategic Health" : currentRole === "IQAC" ? "Quality Overview" : "Academic Health";
  const coursesLabel = currentRole === "Faculty" ? "My Courses" : "Courses";
  
  const allNavItems = [
    { name: overviewLabel, path: "/dashboard", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: LayoutDashboard },
    { name: "Trends", path: "/trends", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD"], icon: TrendingUp },
    { name: coursesLabel, path: "/courses", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: BookOpen },
    { name: "Departments", path: "/departments", roles: ["Chairman", "Principal", "IQAC", "Dean"], icon: Building2 },
    { name: "Sections", path: "/sections", roles: ["Chairman", "Principal", "Dean", "HOD", "Faculty"], icon: Layers },
    { name: "Students (At-Risk)", path: "/students", roles: ["Chairman", "Principal", "Dean", "HOD", "Faculty"], icon: ShieldAlert },
    { name: "Problems", path: "/anomalies", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: AlertTriangle },
    { name: "Exceptions", path: "/exceptions", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: FileWarning },
    { name: "Recommendations", path: "/recommendations", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: Lightbulb },
    { name: "Executive Reports", path: "/reports", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD"], icon: FileText },
    { name: "Ingestion workspace", path: "/data-hub", roles: ["HOD", "Faculty"], icon: Database },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isDesktopCollapsed;
    
    return (
      <div className={`${collapsed ? 'w-20' : 'w-64'} bg-surface border-r border-border flex flex-col h-full text-primary transition-all duration-300 shadow-[4px_0_24px_rgba(15,23,42,0.04)]`}>
        <div className={`px-5 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-20 shrink-0`}>
          <BrandLogo isCollapsed={collapsed} />
        {/* Mobile close button inside sidebar */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden text-secondary hover:text-primary p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {!collapsed && <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Workspace</div>}
        {navItems.filter((item) => [overviewLabel, "Trends", coursesLabel, "Courses", "Departments", "Sections"].includes(item.name)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group
                ${isActive 
                  ? 'bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20'
                  : 'text-secondary hover:bg-surface-secondary hover:text-primary border border-transparent'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? "text-teal-700 dark:text-teal-300" : "text-secondary group-hover:text-primary"} />
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </>
              )}
            </NavLink>
          );
        })}
        {!collapsed && <div className="px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Action & Evidence</div>}
        {navItems.filter((item) => ["Students (At-Risk)", "Problems", "Exceptions", "Recommendations", "Executive Reports", "Ingestion workspace"].includes(item.name)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${isActive ? 'bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20' : 'text-secondary hover:bg-surface-secondary hover:text-primary border border-transparent'}`}
            >
              {({ isActive }) => <><Icon size={17} className={isActive ? "text-teal-700 dark:text-teal-300" : "text-secondary group-hover:text-primary"} />{!collapsed && <span className="whitespace-nowrap">{item.name}</span>}</>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border flex flex-col items-center shrink-0">
        {!isMobile && (
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="w-full flex justify-center py-2 text-secondary hover:text-primary transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        )}
        {!collapsed && (
          <div className="text-[10px] text-secondary text-center font-bold tracking-widest uppercase mt-2">
            RBAC scope enforced
          </div>
        )}
      </div>
    </div>
  );
  };

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:block h-screen z-10 shrink-0">
        <SidebarContent isMobile={false} />
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
              className="md:hidden fixed inset-0 bg-background backdrop-blur-sm z-40"
            />
            {/* Sliding Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 h-screen shadow-2xl shadow-indigo-900/20"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
