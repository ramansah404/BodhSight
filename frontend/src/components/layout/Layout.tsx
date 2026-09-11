import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalFilterBar from "../filters/GlobalFilterBar";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState<string>("Dean");

  useEffect(() => {
    const savedRole = localStorage.getItem("bodhsight_role");
    if (!savedRole && location.pathname !== "/login") {
      navigate("/login");
    } else if (savedRole) {
      setCurrentRole(savedRole);
    }
  }, [navigate, location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar currentRole={currentRole} />
        <GlobalFilterBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet context={{ currentRole }} />
        </main>
      </div>
    </div>
  );
}
