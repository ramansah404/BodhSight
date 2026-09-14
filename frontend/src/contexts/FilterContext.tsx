/**
 * FilterContext — global scope filter state shared across all pages.
 * Populated from backend data (active term, real department list).
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Agent10API } from "../services/api";

export interface FilterState {
  department: string;   // "" = all
  semester: string;     // active term label from backend, or "" = all
  programme: string;    // "" = all (no backend endpoint yet)
}

interface FilterContextValue {
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  departments: string[];
  activeTerm: string;
  isLoading: boolean;
}

const FilterContext = createContext<FilterContextValue>({
  filters: { department: "", semester: "", programme: "" },
  setFilters: () => {},
  departments: [],
  activeTerm: "",
  isLoading: false,
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>({
    department: localStorage.getItem("bodhsight_department") || "",
    semester: "",
    programme: "",
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  function setFilters(partial: Partial<FilterState>) {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [depts, summary] = await Promise.allSettled([
          Agent10API.getDepartments(),
          Agent10API.getSummary(),
        ]);

        if (cancelled) return;

        if (depts.status === "fulfilled" && depts.value.length > 0) {
          setDepartments(
            depts.value
              .map((d: { department_code?: string }) => d.department_code ?? "")
              .filter(Boolean)
              .sort()
          );
        }

        if (summary.status === "fulfilled") {
          const snap = (summary.value as Record<string, unknown>)
            .dashboard_snapshot as Record<string, unknown> | undefined;
          const date = snap?.as_of_date as string | undefined;
          if (date) {
            // Extract year for display e.g. "2026-09-12" → "2026-27"
            const yr = new Date(date).getFullYear();
            setActiveTerm(`${yr}-${String(yr + 1).slice(2)}`);
          } else {
            setActiveTerm("2026-27");
          }
        } else {
          setActiveTerm("2026-27");
        }
      } catch {
        // Non-critical — filter context degrades gracefully
        setActiveTerm("2026-27");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, departments, activeTerm, isLoading }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}
