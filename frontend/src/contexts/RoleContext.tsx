import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AuthAPI } from "../services/api";

export type AppRole = "Faculty" | "HOD" | "Dean" | "Principal" | "Chairman" | "IQAC" | "Admin";

interface RoleContextValue {
  currentRole: AppRole | null;
  isLoading: boolean;
  permissions: Record<string, boolean>;
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
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const setSession = (role: string) => {
    setCurrentRole(role as AppRole);
    setIsLoading(true); // Restart loading when role changes
  };

  const clearSession = () => {
    setCurrentRole(null);
    setPermissions({});
  };

  useEffect(() => {
    if (!currentRole) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const fetchPerms = async (initial: boolean = false) => {
      try {
        if (initial && mounted) setIsLoading(true);
        const permsArray = await AuthAPI.getMyPermissions();
        if (mounted) {
          const permMap: Record<string, boolean> = {};
          if (Array.isArray(permsArray)) {
            permsArray.forEach((p: string) => { permMap[p] = true; });
          }
          setPermissions(permMap);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to sync permissions", err);
        if (mounted) setIsLoading(false);
      }
    };

    fetchPerms(true); // Initial fetch
    const interval = setInterval(() => fetchPerms(false), 10000); // Polling (no loader)

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentRole]);

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