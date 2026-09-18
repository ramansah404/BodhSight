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

  MessageSquare,

  X,

  Menu,

  Database,
  FileWarning,
  BookOpenCheck
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";



interface SidebarProps {

  isOpen: boolean;

  setIsOpen: (isOpen: boolean) => void;

}



export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {

  const { currentRole, permissions } = useRole();

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  

  // Student/Parent portal-only nav items
  const isStudentOrParent = currentRole === "Student" || currentRole === "Parent";

  const allNavItems = [
    { name: "My Portal", path: "/student-dashboard", requiredPermission: "canViewStudentDashboard", icon: LayoutDashboard },
    { name: "Overview", path: "/dashboard", requiredPermission: "view_overview", icon: LayoutDashboard },
    { name: "Trends", path: "/trends", requiredPermission: "view_trends", icon: TrendingUp },

    { name: "Courses", path: "/courses", requiredPermission: "view_courses", icon: BookOpen },

    { name: "Departments", path: "/departments", requiredPermission: "view_departments", icon: Building2 },

    { name: "Sections", path: "/sections", requiredPermission: "view_sections", icon: Layers },

    { name: "Students (At-Risk)", path: "/students", requiredPermission: "view_students", icon: ShieldAlert },

    { name: "Problems", path: "/anomalies", requiredPermission: "manage_exceptions", icon: AlertTriangle },

    { name: "Exceptions", path: "/exceptions", requiredPermission: "manage_exceptions", icon: FileWarning },

    { name: "Recommendations", path: "/recommendations", requiredPermission: "manage_exceptions", icon: Lightbulb },

    { name: "Executive Reports", path: "/reports", requiredPermission: "view_reports", icon: FileText },

    { name: "Data Hub", path: "/data-hub", requiredPermission: "view_data_hub", icon: Database },
    
    { name: "Messages", path: "/messages", icon: MessageSquare },

    { name: "Manage Marks", path: "/manage-marks", roles: ["Faculty", "HOD", "Admin"], icon: BookOpenCheck },

    { name: "User Management", path: "/admin/users", roles: ["Admin"], icon: ShieldAlert },

  ];

  // Student & Parent only see their own portal — nothing else
  const studentParentItems = [
    { name: currentRole === "Parent" ? "Child's Portal" : "My Portal", path: "/student-dashboard", icon: LayoutDashboard },
  ];

  const navItems = isStudentOrParent ? studentParentItems : allNavItems.filter(item => {
    // Non-students/parents shouldn't see "My Portal"
    if (item.path === "/student-dashboard") {
      return false;
    }
    
    // If the item explicitly restricts by role, check it
    if (item.roles) {
      if (!item.roles.includes(currentRole ?? "")) return false;
      // If it passes role check and has no other permissions required, allow
      if (!item.requiredPermission) return true;
    }

    // Admins bypass standard permission checks for non-role-restricted items
    if (currentRole === "Admin" && !item.roles) {
      return true;
    }

    // Filter by dynamic RBAC permissions
    if (item.requiredPermission) {
      return permissions[item.requiredPermission] === true;
    }
    
    return true; // General routes like /messages
  });



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
                  ? 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'text-secondary hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 border border-transparent'}
              `}

            >

              {({ isActive }) => (

                <>

                  <Icon size={18} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-secondary group-hover:text-emerald-600 dark:group-hover:text-emerald-400"} />

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

