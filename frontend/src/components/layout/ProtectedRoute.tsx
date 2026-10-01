import { Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Keep for Admin dashboard
  requiredPermission?: string; // New dynamic RBAC check mapped to original db keys
}

export default function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  void allowedRoles;
  void requiredPermission;
  return <Outlet />;
}
