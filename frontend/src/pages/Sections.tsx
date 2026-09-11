import { useEffect, useState } from "react";
import { fetchSections } from "../api/agent10";
import type { SectionComparison } from "../types/agent10";
import { Users, AlertTriangle } from "lucide-react";

export default function Sections() {
  const [sections, setSections] = useState<SectionComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections().then(data => {
      setSections(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center text-indigo-600 font-medium">Loading section comparisons...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 via-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
          <Users size={14} /> Cohort Analysis
        </div>
        <h1 className="text-2xl font-bold">Section & Instructor Comparison</h1>
        <p className="text-cyan-100 text-sm mt-0.5">Comparative analysis across sections to identify instructor or cohort performance gaps.</p>
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Section</th>
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Students</th>
              <th className="px-6 py-4">Pass Rate</th>
              <th className="px-6 py-4">Avg Marks</th>
              <th className="px-6 py-4 text-right">Disparity Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sections.map((sec, idx) => (
              <tr key={idx} className={`transition-colors ${sec.disparity_flag ? 'bg-amber-50/60' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{sec.course_code}</div>
                  <div className="text-xs text-gray-500 font-medium">{sec.course_name}</div>
                </td>
                <td className="px-6 py-4 font-extrabold text-indigo-900">{sec.section_name}</td>
                <td className="px-6 py-4 text-gray-700 font-semibold">{sec.instructor_name}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">{sec.students_count}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                    sec.pass_rate < 70 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {sec.pass_rate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700 font-bold">{sec.avg_marks} / 100</td>
                <td className="px-6 py-4 text-right">
                  {sec.disparity_flag ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs font-extrabold border border-amber-200 shadow-sm">
                      <AlertTriangle size={14} className="text-amber-600" /> 22% Disparity Gap
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                      Aligned Cohort
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
