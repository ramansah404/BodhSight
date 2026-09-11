import { useEffect, useState } from "react";
import { Agent10API } from "../services/api";
import type { DepartmentPerformance } from "../types/agent10";
import { Building2, Users, Award, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function Departments() {
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Agent10API.getDepartments().then(data => {
      setDepartments(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#0B1120] rounded-2xl border border-slate-800/60 p-6 flex flex-col justify-between h-48 animate-pulse">
          <div className="h-6 w-1/3 bg-slate-800 rounded mb-4"></div>
          <div className="h-4 w-1/2 bg-slate-800/50 rounded mb-2"></div>
          <div className="h-20 w-full bg-slate-800/30 rounded-2xl"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 size={14} /> Institutional Structure
        </div>
        <h1 className="text-2xl font-bold">Department Academic Health</h1>
        <p className="text-violet-100 text-sm mt-0.5">Aggregated performance indicators and anomaly tracking per academic department.</p>
      </div>

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept.department_code} className="bg-[#0B1120] rounded-2xl border border-slate-800/60 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                    {dept.department_code}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2.5">{dept.department_name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                  dept.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-200' : 'bg-amber-500/20 text-amber-400 border border-amber-200'
                }`}>
                  {dept.status === 'OPTIMAL' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {dept.status}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 my-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60/60">
                <div>
                  <div className="text-xs font-bold text-secondary uppercase flex items-center gap-1"><Users size={12} className="text-indigo-400" /> Students</div>
                  <div className="text-xl font-extrabold text-white mt-1">{dept.total_students}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-secondary uppercase">Pass Rate</div>
                  <div className="text-xl font-extrabold text-emerald-500 mt-1">{dept.pass_rate}%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-secondary uppercase flex items-center gap-1"><Award size={12} className="text-amber-500" /> Avg GPA</div>
                  <div className="text-xl font-extrabold text-indigo-400 mt-1">{dept.avg_gpa}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-sm">
              <span className="text-secondary font-medium">
                Active Exceptions: <strong className={dept.active_exceptions > 0 ? "text-rose-600 font-bold" : "text-emerald-500 font-bold"}>{dept.active_exceptions}</strong>
              </span>
              <button className="text-indigo-400 font-bold flex items-center gap-1 hover:text-indigo-800 transition-colors">
                View Report <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
