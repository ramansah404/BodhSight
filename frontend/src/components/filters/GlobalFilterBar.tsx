import { Filter, Calendar, Building, Book } from "lucide-react";
import { useFilters } from "../../contexts/FilterContext";
import { getRolePermissions } from "../../utils/rbac";

export default function GlobalFilterBar() {
  const { filters, setFilters, departments, activeTerm, isLoading } = useFilters();
  const currentRole = localStorage.getItem("bodhsight_role") || "Chairman";
  const { canViewAllDepartments } = getRolePermissions(currentRole);

  return (
    <div className="glass-panel border-b border-border/60 px-6 py-3 flex flex-wrap items-center gap-4 shadow-sm z-10 relative">
      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
        <Filter size={16} /> Global Scope
      </div>

      {/* Academic Year ΓÇö derived from active term */}
      <div className="glass-control flex items-center gap-2 px-3 py-1.5 rounded-lg">
        <Calendar size={14} className="text-secondary" />
        <span className="text-sm font-semibold text-primary">
          {isLoading ? "LoadingΓÇª" : activeTerm ? `AY ${activeTerm}` : "Academic Year"}
        </span>
      </div>

      {/* Semester ΓÇö hardcoded to Term 1 since backend only has one active term */}
      <div className="glass-control flex items-center gap-2 px-3 py-1.5 rounded-lg">
        <Calendar size={14} className="text-secondary" />
        <select
          value={filters.semester}
          onChange={(e) => setFilters({ semester: e.target.value })}
          className="bg-transparent text-sm font-semibold text-primary focus:outline-none cursor-pointer [&>option]:bg-surface"
        >
          <option value="">All Semesters</option>
          <option value="T1">Semester: Term 1 (Active)</option>
        </select>
      </div>

      {/* Department ΓÇö populated from real backend data or locked by RBAC */}
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

      {/* Programme ΓÇö no backend endpoint yet; kept as UI control */}
      <div className="glass-control flex items-center gap-2 px-3 py-1.5 rounded-lg">
        <Book size={14} className="text-secondary" />
        <select
          value={filters.programme}
          onChange={(e) => setFilters({ programme: e.target.value })}
          className="bg-transparent text-sm font-semibold text-primary focus:outline-none cursor-pointer [&>option]:bg-surface"
        >
          <option value="">All Programmes</option>
          <option value="BTech">B.Tech</option>
          <option value="MTech">M.Tech</option>
        </select>
      </div>
    </div>
  );
}
