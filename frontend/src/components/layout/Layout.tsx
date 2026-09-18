import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ErrorBoundary from "../ui/ErrorBoundary";
import GlobalFilterBar from "../filters/GlobalFilterBar";
import { FilterProvider } from "../../contexts/FilterContext";
import { NotificationProvider } from "../../contexts/NotificationContext";
import { useRole } from "../../contexts/RoleContext";
import CommandPalette from "../ui/CommandPalette";

import ChatWidget from "../ui/ChatWidget";

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
  const { currentRole, isLoading } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] bg-background items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-secondary font-medium">Authenticating...</div>
        </div>
      </div>
    );
  }

  if (!currentRole) {
    return null;
  }

  return (
    <FilterProvider>
      <NotificationProvider>
      <div className="flex h-[100dvh] bg-background overflow-hidden font-sans text-primary selection:bg-teal-500/20">
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen} 
        />
        
        <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden w-full relative">
          <Topbar 
            currentRole={currentRole} 
            onMenuToggle={() => setIsMobileMenuOpen(true)}
            onSearchClick={() => setIsCommandPaletteOpen(true)}
          />
          {currentRole !== "Admin" && <GlobalFilterBar />}
          <main ref={mainRef} className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6 lg:px-10">
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
                  <Outlet />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <ChatWidget />
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
        />
      </div>
      </NotificationProvider>
    </FilterProvider>
  );
}
