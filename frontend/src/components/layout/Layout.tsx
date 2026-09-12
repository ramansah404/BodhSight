import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalFilterBar from "../filters/GlobalFilterBar";
import { FilterProvider } from "../../contexts/FilterContext";
import { NotificationProvider } from "../../contexts/NotificationContext";

export default function Layout() {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <FilterProvider>
      <NotificationProvider>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen} 
        />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
          <Topbar 
            currentRole={currentRole} 
            onMenuToggle={() => setIsMobileMenuOpen(true)} 
          />
          <GlobalFilterBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet context={{ currentRole }} />
          </main>
        </div>
      </div>
      </NotificationProvider>
    </FilterProvider>
  );
}
