import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AuthAPI } from "../services/api";
import { parsePermissions, type PermissionMatrix, getDefaultPermissions } from "../utils/rbac";

export type AppRole = "Faculty" | "HOD" | "Dean" | "Principal" | "Chairman" | "IQAC" | "Admin" | "Student";

interface RoleContextValue {
  currentRole: AppRole | null;
  isLoading: boolean;
  permissions: PermissionMatrix;
  setSession: (role: string) => void;
  clearSession: () => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

function readStoredRole(): AppRole | null {
  const role = localStorage.getItem("bodhsight_role");
  return role as AppRole | null;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<AppRole | null>(() => readStoredRole());
  const [permissions, setPermissions] = useState<PermissionMatrix>(() => getDefaultPermissions(readStoredRole() || ""));
  const isLoading = false;

  useEffect(() => {
    if (!currentRole) return;
    
    let isMounted = true;
    
    const fetchPerms = async () => {
      try {
        const res = await AuthAPI.getMyPermissions();
        if (isMounted && res.permissions) {
          setPermissions(parsePermissions(res.permissions));
        }
      } catch (err) {
        console.error("Failed to fetch permissions in real-time:", err);
      }
    };

    fetchPerms();
    
    // Poll every 10 seconds for real-time RBAC updates
    const intervalId = setInterval(fetchPerms, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [currentRole]);

  const setSession = (role: string) => setCurrentRole(role as AppRole);
  const clearSession = () => {
    setCurrentRole(null);
    setPermissions(getDefaultPermissions(""));
  };

  return (
    <RoleContext.Provider value={{ currentRole, isLoading, permissions, setSession, clearSession }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}