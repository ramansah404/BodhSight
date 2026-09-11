import { useState } from "react";
import { BookOpen, AlertTriangle, ShieldCheck, ArrowRight, BarChart2, Layers } from "lucide-react";
import type { CoursePerformance } from "../types/agent10";

export default function Courses() {
  const [courses] = useState<CoursePerformance[]>([
    {
      course_code: "CS301",
      course_name: "Data Structures & Algorithms",
      department: "CSE",
      semester: "2026-T1",
      regulation: "R-24",
      batch: "2024-2028",
      pass_rate: 61.2,
      failure_rate: 38.8,
      avg_marks: 54.1,
      gpa: 6.2,
      students_appeared: 180,
      trend: "DOWN",
      priority: "CRITICAL",
      attribution: "University Question Paper Difficulty (Consistent drop across all sections)",
      contextual_factors: {
        entry_ability_score: 84.5,
        course_difficulty_rating: "High",
        historical_pass_rate: 82.0
      }
    },
    {
      course_code: "EC202",
      course_name: "Digital Signal Processing",
      department: "ECE",
      semester: "2026-T1",
      regulation: "R-24",
      batch: "2024-2028",
      pass_rate: 73.5,
      failure_rate: 26.5,
      avg_marks: 63.0,
      gpa: 7.1,
      students_appeared: 140,
      trend: "DOWN",
      priority: "HIGH",
      attribution: "Section-specific variance (Section B lagging behind Section A by 22%)",
      contextual_factors: {
        entry_ability_score: 79.0,
        course_difficulty_rating: "Moderate",
        historical_pass_rate: 78.5
      }
    },
    {
      course_code: "ME401",
      course_name: "Finite Element Methods",
      department: "MECH",
      semester: "2026-T1",
      regulation: "R-22",
      batch: "2022-2026",
      pass_rate: 88.5,
      failure_rate: 11.5,
      avg_marks: 74.2,
      gpa: 8.4,
      students_appeared: 110,
      trend: "UP",
      priority: "LOW",
      attribution: "Stable baseline performance matching cohort expectations",
      contextual_factors: {
        entry_ability_score: 81.0,
        course_difficulty_rating: "Moderate",
        historical_pass_rate: 86.0
      }
    }
  ]);

  const [selectedCourse, setSelectedCourse] = useState<CoursePerformance | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-200 px-3 py-1 rounded-full text-xs font-bold border border-violet-400/30 mb-2">
          <BookOpen size={14} /> Course Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Course-wise Performance & Risk Audit</h1>
        <p className="text-violet-100 text-sm mt-1">
          Identifying courses requiring attention based on statistical deviation rather than raw failure rates alone.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="text-violet-600" size={20} /> Active Semester Courses ({courses.length})
          </h2>
          <span className="text-xs font-bold bg-violet-50 text-violet-700 px-3 py-1 rounded-full border border-violet-100">
            Regulation R-24 & R-22 Scoped
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="py-4 px-6 font-bold">Course Code & Title</th>
                <th className="py-4 px-6 font-bold">Dept</th>
                <th className="py-4 px-6 font-bold">Students</th>
                <th className="py-4 px-6 font-bold">Pass Rate</th>
                <th className="py-4 px-6 font-bold">Risk Status</th>
                <th className="py-4 px-6 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {courses.map((c) => (
                <tr key={c.course_code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-900">{c.course_name}</div>
                    <div className="text-xs text-indigo-600 font-semibold">{c.course_code} • {c.semester}</div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-700">{c.department}</td>
                  <td className="py-4 px-6 font-medium text-gray-600">{c.students_appeared}</td>
                  <td className="py-4 px-6">
                    <span className={`font-extrabold ${c.pass_rate < 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {c.pass_rate}%
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold inline-block ${
                      c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      c.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {c.priority} RISK
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => setSelectedCourse(c)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors border border-indigo-200"
                    >
                      View Context →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Detail Modal with Contextual Guardrail */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-950 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-violet-300 uppercase">{selectedCourse.course_code} Intelligence Detail</span>
                <h3 className="text-lg font-bold">{selectedCourse.course_name}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-white/80 hover:text-white font-bold text-lg">✕</button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Pass Rate</div>
                  <div className="text-xl font-black text-rose-600 mt-1">{selectedCourse.pass_rate}%</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Average Marks</div>
                  <div className="text-xl font-black text-gray-900 mt-1">{selectedCourse.avg_marks}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">GPA</div>
                  <div className="text-xl font-black text-indigo-900 mt-1">{selectedCourse.gpa}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Heuristic Attribution</h4>
                <p className="text-sm text-gray-700 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 font-semibold">
                  {selectedCourse.attribution}
                </p>
              </div>

              {/* NON-NEGOTIABLE FACULTY GUARDRAIL DISPLAY */}
              <div className="space-y-2 bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> Faculty Guardrail & Context (Non-Crude Ranking)
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Course Difficulty:</span>
                    <strong className="text-white text-sm">{selectedCourse.contextual_factors.course_difficulty_rating}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Entry Ability Score:</span>
                    <strong className="text-white text-sm">{selectedCourse.contextual_factors.entry_ability_score} / 100</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Historical Baseline:</span>
                    <strong className="text-white text-sm">{selectedCourse.contextual_factors.historical_pass_rate}%</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
