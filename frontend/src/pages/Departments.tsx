import { useEffect, useState } from "react";
import { fetchDepartments } from "../api/agent10";
import type { DepartmentPerformance } from "../types/agent10";
import { Building2, Users, Award, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function Departments() {
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments().then(data => {
      setDepartments(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading departments...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="text-indigo-600" size={28} />
          Department Academic Health
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Aggregated performance indicators and anomaly tracking per academic department.
        </p>
      </div>

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept.department_code} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {dept.department_code}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">{dept.department_name}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  dept.status === 'OPTIMAL' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {dept.status === 'OPTIMAL' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {dept.status}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 my-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Users size={12} /> Students</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{dept.total_students}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pass Rate</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{dept.pass_rate}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Award size={12} /> Avg GPA</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{dept.avg_gpa}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Active Exceptions: <strong className={dept.active_exceptions > 0 ? "text-orange-600" : "text-gray-900"}>{dept.active_exceptions}</strong>
              </span>
              <button className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                View Department Report <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
