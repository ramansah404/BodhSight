import BrandLogo from "../ui/BrandLogo";
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
  ShieldAlert,
  X,
  Menu,
  Database
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
  
  const allNavItems = [
    { name: "Overview", path: "/dashboard", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: LayoutDashboard },
    { name: "Trends", path: "/trends", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD"], icon: TrendingUp },
    { name: "Courses", path: "/courses", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: BookOpen },
    { name: "Departments", path: "/departments", roles: ["Chairman", "Principal", "IQAC", "Dean"], icon: Building2 },
    { name: "Sections", path: "/sections", roles: ["Chairman", "Principal", "Dean", "HOD", "Faculty"], icon: Layers },
    { name: "Batches", path: "/batches", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD"], icon: Users },
    { name: "Students (At-Risk)", path: "/students", roles: ["Chairman", "Principal", "Dean", "HOD", "Faculty"], icon: ShieldAlert },
    { name: "Problems", path: "/anomalies", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: AlertTriangle },
    { name: "Recommendations", path: "/recommendations", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"], icon: Lightbulb },
    { name: "Executive Reports", path: "/reports", roles: ["Chairman", "Principal", "IQAC", "Dean", "HOD"], icon: FileText },
    { name: "Data Hub", path: "/data-hub", roles: ["HOD", "Faculty"], icon: Database },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isDesktopCollapsed;
    
    return (
      <div className={`${collapsed ? 'w-20' : 'w-64'} bg-surface/50 dark:bg-background backdrop-blur-xl border-r border-border/60 flex flex-col h-full text-primary transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none`}>
        <div className={`p-6 border-b border-border/60 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-16 md:h-20 shrink-0`}>
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
                  ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                  : 'text-secondary hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 border border-transparent'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-secondary group-hover:text-secondary"} />
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/60 flex flex-col items-center shrink-0">
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
            Strict RBAC Active
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
