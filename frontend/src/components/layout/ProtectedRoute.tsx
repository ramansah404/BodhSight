import { Navigate, Outlet } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getRolePermissions, InstitutionalRole } from "../../utils/rbac";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";
  const displayRole = localStorage.getItem("bodhsight_display_role") || currentRole;

  // Check if current role is authorized for this route
  const isAuthorized = allowedRoles.includes(currentRole) || allowedRoles.includes(displayRole);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-900">Access Restricted</h2>
            <p className="text-sm text-gray-500">
              Security Protocol Active: The role <strong className="text-gray-900">"{displayRole}"</strong> is not authorized to access this operational module according to institutional RBAC guidelines.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => window.location.href = "/#/"}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} /> Return to Authorized Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
