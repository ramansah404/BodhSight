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

  if (loading) return <div className="p-12 text-center text-indigo-600 font-medium">Loading departmental health...</div>;

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
          <div key={dept.department_code} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                    {dept.department_code}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2.5">{dept.department_name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                  dept.status === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {dept.status === 'OPTIMAL' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {dept.status}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 my-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Users size={12} className="text-indigo-600" /> Students</div>
                  <div className="text-xl font-extrabold text-gray-900 mt-1">{dept.total_students}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase">Pass Rate</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">{dept.pass_rate}%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Award size={12} className="text-amber-500" /> Avg GPA</div>
                  <div className="text-xl font-extrabold text-indigo-900 mt-1">{dept.avg_gpa}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">
                Active Exceptions: <strong className={dept.active_exceptions > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>{dept.active_exceptions}</strong>
              </span>
              <button className="text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-800 transition-colors">
                View Report <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
