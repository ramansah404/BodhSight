import { useState, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ErrorBoundary from "../ui/ErrorBoundary";
import GlobalFilterBar from "../filters/GlobalFilterBar";
import { FilterProvider } from "../../contexts/FilterContext";
import { NotificationProvider } from "../../contexts/NotificationContext";

// Page transition variants — subtle fade+slide from KrishakMitra pattern
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

export default function Layout() {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);



  return (
    <FilterProvider>
      <NotificationProvider>
      <div className="flex h-[100dvh] min-h-0 min-w-0 bg-transparent overflow-hidden font-sans text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen} 
        />
        
        <div className="flex-1 min-h-0 min-w-0 flex flex-col h-[100dvh] overflow-hidden w-full relative">
          <Topbar 
            currentRole={currentRole} 
            onMenuToggle={() => setIsMobileMenuOpen(true)} 
          />
          <GlobalFilterBar />
          <main ref={mainRef} className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="min-h-full pb-8"
              >
                <ErrorBoundary>
                  <Outlet context={{ currentRole }} />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      </NotificationProvider>
    </FilterProvider>
  );
}
