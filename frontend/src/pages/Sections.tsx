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

  if (loading) return <div className="p-6 text-gray-500">Loading section comparisons...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="text-indigo-600" size={28} />
          Section & Instructor Comparison
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comparative analysis across different sections to identify instructor or cohort-level performance gaps.
        </p>
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
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
              <tr key={idx} className={`hover:bg-gray-50 transition-colors ${sec.disparity_flag ? 'bg-orange-50/40' : ''}`}>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{sec.course_code}</div>
                  <div className="text-xs text-gray-500">{sec.course_name}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">{sec.section_name}</td>
                <td className="px-6 py-4 text-gray-700">{sec.instructor_name}</td>
                <td className="px-6 py-4 text-gray-700">{sec.students_count}</td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${sec.pass_rate < 70 ? 'text-red-600' : 'text-gray-900'}`}>
                    {sec.pass_rate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{sec.avg_marks} / 100</td>
                <td className="px-6 py-4 text-right">
                  {sec.disparity_flag ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-bold">
                      <AlertTriangle size={12} /> 22% Gap Detected
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Aligned</span>
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
