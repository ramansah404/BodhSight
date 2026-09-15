import { Outlet, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useRole } from "../../contexts/RoleContext";

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Keep for Admin dashboard
  requiredPermission?: string; // New dynamic RBAC check mapped to original db keys
}

/**
 * ProtectedRoute — dual-purpose guard:
 * 1. Redirects to /login if the user has NO active session
 * 2. Shows "Access Restricted" if the user lacks the required permission or role
 */
export default function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { currentRole, permissions, isLoading } = useRole();
  const displayRole = localStorage.getItem("bodhsight_display_role") || currentRole;

  // If no session at all, redirect to login
  useEffect(() => {
    if (!isLoading && !currentRole) {
      navigate("/login", { replace: true });
    }
  }, [currentRole, isLoading, navigate]);

  if (isLoading || !currentRole) {
    return null;
  }

  let isAuthorized = true;

  // If specific roles required (used primarily for Admin)
  if (allowedRoles && allowedRoles.length > 0) {
    isAuthorized = allowedRoles.includes(currentRole) || allowedRoles.includes(displayRole ?? "");
  }

  // If dynamic permission required
  if (requiredPermission) {
    isAuthorized = isAuthorized && permissions[requiredPermission] === true;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-surface rounded-3xl border border-rose-200 dark:border-rose-800/50 shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-primary">Access Restricted</h2>
            <p className="text-sm text-secondary">
              Security Protocol Active: Your current role is not
              authorized to access this operational module according to institutional RBAC guidelines.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
