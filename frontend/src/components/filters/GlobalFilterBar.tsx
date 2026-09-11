import { Filter, Calendar, Building, Book } from "lucide-react";
import { useFilters } from "../../contexts/FilterContext";

export default function GlobalFilterBar() {
  const { filters, setFilters, departments, activeTerm, isLoading } = useFilters();

  return (
    <div className="bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-3 flex flex-wrap items-center gap-4 shadow-sm z-10 relative">
      <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
        <Filter size={16} /> Global Scope
      </div>

      {/* Academic Year — derived from active term */}
      <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/60">
        <Calendar size={14} className="text-slate-500" />
        <span className="text-sm font-semibold text-slate-300">
          {isLoading ? "Loading…" : activeTerm ? `AY ${activeTerm}` : "Academic Year"}
        </span>
      </div>

      {/* Semester — hardcoded to Term 1 since backend only has one active term */}
      <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/60">
        <Calendar size={14} className="text-slate-500" />
        <select
          value={filters.semester}
          onChange={(e) => setFilters({ semester: e.target.value })}
          className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none cursor-pointer [&>option]:bg-slate-900"
        >
          <option value="">All Semesters</option>
          <option value="T1">Semester: Term 1 (Active)</option>
        </select>
      </div>

      {/* Department — populated from real backend data */}
      <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/60">
        <Building size={14} className="text-slate-500" />
        <select
          value={filters.department}
          onChange={(e) => setFilters({ department: e.target.value })}
          className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none cursor-pointer [&>option]:bg-slate-900"
        >
          <option value="">All Departments</option>
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
      </div>

      {/* Programme — no backend endpoint yet; kept as UI control */}
      <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/60">
        <Book size={14} className="text-slate-500" />
        <select
          value={filters.programme}
          onChange={(e) => setFilters({ programme: e.target.value })}
          className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none cursor-pointer [&>option]:bg-slate-900"
        >
          <option value="">All Programmes</option>
          <option value="BTech">B.Tech</option>
          <option value="MTech">M.Tech</option>
        </select>
      </div>
    </div>
  );
}
