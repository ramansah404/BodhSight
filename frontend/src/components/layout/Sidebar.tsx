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
  UploadCloud,
  ShieldAlert,
  X,
  PanelLeftClose,
  PanelLeftOpen
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
    { name: "Upload Marks", path: "/ingestion", roles: ["HOD", "Faculty"], icon: UploadCloud },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isDesktopCollapsed;
    
    return (
      <div className={`${collapsed ? 'w-20' : 'w-64'} glass-panel min-h-0 border-r border-border/80 flex flex-col h-full text-primary transition-[width] duration-300 ease-out`}>
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

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-1">
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
                  : 'text-primary/85 hover:bg-surface/60 hover:text-primary border border-transparent'}
                ${collapsed ? 'justify-center px-3' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-primary/70 group-hover:text-primary"} />
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
            className="glass-control w-full flex items-center justify-center gap-2 py-2 text-primary/85 hover:text-primary hover:bg-surface rounded-lg"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
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
      <aside className="hidden md:block h-[100dvh] min-h-0 z-10 shrink-0">
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
              className="md:hidden fixed inset-0 glass-overlay z-40"
            />
            {/* Sliding Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 h-[100dvh] max-h-[100dvh] shadow-2xl shadow-indigo-900/20"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
