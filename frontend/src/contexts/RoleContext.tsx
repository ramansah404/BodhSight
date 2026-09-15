import { createContext, useContext, useState, type ReactNode } from "react";

export type AppRole = "Faculty" | "HOD" | "Dean" | "Principal" | "Chairman" | "IQAC" | "Admin";

interface RoleContextValue {
  currentRole: AppRole | null;
  isLoading: boolean;
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
  const isLoading = false;

  const setSession = (role: string) => setCurrentRole(role as AppRole);
  const clearSession = () => setCurrentRole(null);

  return (
    <RoleContext.Provider value={{ currentRole, isLoading, setSession, clearSession }}>
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