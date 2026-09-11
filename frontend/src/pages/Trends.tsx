import { useEffect, useState } from "react";
import { fetchTrends } from "../api/agent10";
import type { TrendData } from "../types/agent10";
import { TrendingUp, Calendar, Award } from "lucide-react";

export default function Trends() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends().then(data => {
      setTrends(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading historical trends...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" size={28} />
          Multi-Semester Academic Trends
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Historical tracking of pass rates, GPA averages, and cohort evaluation sizes across terms.
        </p>
      </div>

      {/* Trends Table & Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Semester</th>
              <th className="px-6 py-4">Students Evaluated</th>
              <th className="px-6 py-4">Pass Rate</th>
              <th className="px-6 py-4">Average Marks</th>
              <th className="px-6 py-4">Average GPA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trends.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  {item.semester}
                </td>
                <td className="px-6 py-4 text-gray-700">{item.evaluation_count.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${item.pass_rate < 83 ? 'text-red-600' : 'text-green-700'}`}>
                    {item.pass_rate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{item.average_marks} / 100</td>
                <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-1">
                  <Award size={16} className="text-amber-500" />
                  {item.avg_gpa}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
