import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState<string>("Dean");
  const [displayRole, setDisplayRole] = useState<string>("Dean");
  const [userName, setUserName] = useState<string>("Guest");

  useEffect(() => {
    const savedRole = localStorage.getItem("bodhsight_role");
    const savedDisplayRole = localStorage.getItem("bodhsight_display_role");
    const savedName = localStorage.getItem("bodhsight_name");

    if (!savedRole && location.pathname !== "/login") {
      navigate("/login");
    } else if (savedRole) {
      setCurrentRole(savedRole);
      setDisplayRole(savedDisplayRole || savedRole);
      if (savedName) setUserName(savedName);
    }
  }, [navigate, location.pathname]);

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setDisplayRole(role);
    localStorage.setItem("bodhsight_role", role);
    localStorage.setItem("bodhsight_display_role", role);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Pass Name and Display Role to Topbar */}
        <Topbar currentRole={currentRole} displayRole={displayRole} setRole={handleRoleChange} userName={userName} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet context={{ currentRole, userName }} />
        </main>
      </div>
    </div>
  );
}
