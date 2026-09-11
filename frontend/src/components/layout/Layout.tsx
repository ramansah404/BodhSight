import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalFilterBar from "../filters/GlobalFilterBar";
import { FilterProvider } from "../../contexts/FilterContext";

export default function Layout() {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";

  return (
    <FilterProvider>
      <div className="flex h-screen bg-[#020817] overflow-hidden font-sans text-slate-300 selection:bg-indigo-500/30 selection:text-indigo-200">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar currentRole={currentRole} />
          <GlobalFilterBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet context={{ currentRole }} />
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}
