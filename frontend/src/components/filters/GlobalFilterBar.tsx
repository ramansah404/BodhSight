import { Filter, Calendar, Building } from "lucide-react";
import { useFilters } from "../../contexts/FilterContext";
import { getRolePermissions } from "../../utils/rbac";

export default function GlobalFilterBar() {
  const { filters, setFilters, departments, activeTerm, isLoading } = useFilters();
  const currentRole = localStorage.getItem("bodhsight_role") || "Chairman";
  const { canViewAllDepartments } = getRolePermissions(currentRole);

  return (
    <div className="bg-surface border-b border-border px-4 md:px-8 py-2.5 flex flex-wrap items-center gap-2.5 shadow-sm z-10 relative">
      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider bg-teal-50 dark:bg-teal-500/10 px-3 py-1.5 rounded-md border border-teal-200 dark:border-teal-500/20">
        <Filter size={16} /> Global Scope
      </div>

      {/* Academic Year — derived from active term */}
      <div className="glass-control flex items-center gap-2 px-3 py-1.5 rounded-lg">
        <Calendar size={14} className="text-secondary" />
        <span className="text-sm font-semibold text-primary">
          {isLoading ? "Loading…" : activeTerm ? `AY ${activeTerm}` : "Academic Year"}
        </span>
      </div>

      {/* Semester/term values are not discoverable from a current backend endpoint. */}
      <div className="glass-control flex items-center gap-2 px-3 py-1.5 rounded-lg">
        <Calendar size={14} className="text-secondary" />
        <span className="text-sm font-semibold text-primary">{activeTerm ? `AY ${activeTerm}` : "Academic term"}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Context only</span>
      </div>

      {/* Department — populated from real backend data or locked by RBAC */}
      <div className={`flex items-center gap-2 bg-surface/50 px-3 py-1.5 rounded-lg border ${!canViewAllDepartments ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/60'}`}>
        <Building size={14} className={!canViewAllDepartments ? "text-amber-500" : "text-secondary"} />
        <select
          value={filters.department}
          onChange={(e) => setFilters({ department: e.target.value })}
          disabled={!canViewAllDepartments}
          className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer [&>option]:bg-surface ${
            !canViewAllDepartments ? "text-amber-600 dark:text-amber-500 opacity-90 cursor-not-allowed" : "text-primary"
          }`}
        >
          {canViewAllDepartments && <option value="">All Departments</option>}
          {departments.length > 0
            ? departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))
            : (
              // Fallback while loading or if API unavailable
              <>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </>
            )}
        </select>
        {!canViewAllDepartments && (
          <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded ml-1">Locked</span>
        )}
      </div>

      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary" title="Gender, admission route, entry qualification, and programme option discovery are not exposed by the current API.">
        Demographic slicers pending backend support
      </div>
    </div>
  );
}
