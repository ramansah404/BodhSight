import { useEffect, useState } from 'react';
import { fetchCourses } from '../api/agent10';
import type { CoursePerformance } from '../types/agent10';
import { Search, Filter, Sparkles, X, TrendingDown, ArrowRight, BookOpen } from 'lucide-react';

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

  if (loading) return <div className="p-12 text-center text-indigo-600 font-medium">Loading course telemetry...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen size={14} /> Curriculum Analytics
          </div>
          <h1 className="text-2xl font-bold">Course Performance & Anomaly Detection</h1>
          <p className="text-blue-100 text-sm mt-0.5">Real-time metrics and AI-driven performance tracking across all registered courses.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search course..." className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-none focus:bg-white/20" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Students</th>
              <th className="px-6 py-4">Pass Rate</th>
              <th className="px-6 py-4">Avg GPA</th>
              <th className="px-6 py-4">Priority Status</th>
              <th className="px-6 py-4 text-right">Agent Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((course) => (
              <tr key={course.course_code} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{course.course_code}</div>
                  <div className="text-xs text-gray-500 truncate w-48 font-medium">{course.course_name}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-indigo-900">{course.department}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">{course.students_appeared}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                    course.pass_rate < 75 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {course.pass_rate}%
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{course.gpa}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${
                    course.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                    course.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                    'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {course.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {course.trend === 'DOWN' && (
                    <button 
                      onClick={() => setInvestigateCourse(course)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all shadow-sm"
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-900 to-violet-900 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-300" />
                <h3 className="font-bold text-lg">Agent 10 Diagnostic Insight</h3>
              </div>
              <button onClick={() => setInvestigateCourse(null)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{investigateCourse.course_code}: {investigateCourse.course_name}</h4>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="text-rose-600 font-extrabold flex items-center bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                    <TrendingDown size={16} className="mr-1"/> {investigateCourse.pass_rate}% Pass Rate
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 font-semibold">Historical Baseline: 82%</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed shadow-inner">
                <strong className="text-indigo-900 block mb-1">Why did this change?</strong>
                Analysis of <code className="text-indigo-600 font-bold">assessment.v_offering_roster</code> reveals this decline is consistent across multiple sections. Because the drop is uniform, the root cause is highly likely related to <strong>course difficulty, syllabus complexity, or a harder university assessment</strong> rather than an isolated faculty issue.
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-4">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2">
                  View Full Evidence Trace <ArrowRight size={16} />
                </button>
                <button onClick={() => setInvestigateCourse(null)} className="px-5 py-3 bg-white border border-gray-200 hover:bg-slate-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
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
