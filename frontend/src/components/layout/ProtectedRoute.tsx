import { Outlet, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  allowedRoles?: string[]; // If omitted, only checks for a valid session
}

/**
 * ProtectedRoute — dual-purpose guard:
 * 1. Redirects to /login if the user has NO active session (bodhsight_role not set)
 * 2. Shows "Access Restricted" if the user's role is not in allowedRoles
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("bodhsight_role");
  const displayRole = localStorage.getItem("bodhsight_display_role") || currentRole;

  // If no session at all, redirect to login
  useEffect(() => {
    if (!currentRole) {
      navigate("/login", { replace: true });
    }
  }, [currentRole, navigate]);

  if (!currentRole) {
    // Render nothing while the redirect effect fires
    return null;
  }

  // If specific roles required, check authorization
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.includes(currentRole) || allowedRoles.includes(displayRole ?? "");
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
                Security Protocol Active: The role <strong className="text-primary">"{displayRole}"</strong> is not
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
  }

  return <Outlet />;
}
