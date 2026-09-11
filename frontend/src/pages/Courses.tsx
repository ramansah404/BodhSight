import { useEffect, useState } from 'react';
import { fetchCourses } from '../api/agent10';
import type { CoursePerformance } from '../types/agent10';
import { Search, Filter, Sparkles, X, TrendingDown, ArrowRight } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState<CoursePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [investigateCourse, setInvestigateCourse] = useState<CoursePerformance | null>(null);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading courses...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed metrics and anomaly detection across all registered courses.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search course..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-indigo-500" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Students</th>
              <th className="px-6 py-4">Pass Rate</th>
              <th className="px-6 py-4">Avg GPA</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Agent Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((course) => (
              <tr key={course.course_code} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{course.course_code}</div>
                  <div className="text-xs text-gray-500 truncate w-48">{course.course_name}</div>
                </td>
                <td className="px-6 py-4 text-gray-700">{course.department}</td>
                <td className="px-6 py-4 text-gray-700">{course.students_appeared}</td>
                <td className="px-6 py-4">
                  <div className={`font-semibold ${course.trend === 'DOWN' ? 'text-red-600' : 'text-gray-900'}`}>
                    {course.pass_rate}%
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{course.gpa}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    course.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                    course.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {course.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {course.trend === 'DOWN' && (
                    <button 
                      onClick={() => setInvestigateCourse(course)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 rounded-md text-xs font-bold transition-colors"
                    >
                      <Sparkles size={14} /> Investigate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Investigation Modal */}
      {investigateCourse && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles size={20} />
                <h3 className="font-bold text-lg">Agent 10 Insight</h3>
              </div>
              <button onClick={() => setInvestigateCourse(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{investigateCourse.course_code}: {investigateCourse.course_name}</h4>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-red-600 font-bold flex items-center"><TrendingDown size={16} className="mr-1"/> {investigateCourse.pass_rate}% Pass Rate</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">Historical Baseline: 82%</span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                <strong className="text-gray-900">Why did this change?</strong><br/><br/>
                Based on current semester data, the pass rate has dropped significantly compared to the previous 3 batches. 
                Analysis of <strong>academics.v_offering_roster</strong> reveals this decline is consistent across all sections (A, B, and C). 
                Because the drop is uniform across multiple faculty members, the root cause is highly likely related to <strong>course difficulty, syllabus complexity, or a significantly harder university assessment</strong> rather than an isolated teaching issue.
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  View Full Evidence Trace <ArrowRight size={16} />
                </button>
                <button onClick={() => setInvestigateCourse(null)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">
                  Close Insight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
