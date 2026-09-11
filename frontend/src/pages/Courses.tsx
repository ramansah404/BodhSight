import { useEffect, useState } from "react";
import { BookOpen, ShieldCheck, BarChart2, AlertCircle, Loader2, X, Info } from "lucide-react";
import { Agent10API } from "../services/api";
import { useFilters } from "../contexts/FilterContext";
import type { CoursePerformance } from "../types/agent10";

type LoadState = "loading" | "success" | "error" | "empty";

export default function Courses() {
  const { filters } = useFilters();
  const [courses, setCourses] = useState<CoursePerformance[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<CoursePerformance | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setErrorMsg("");

    Agent10API.getCourses()
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setState("empty");
        } else {
          setCourses(data);
          setState("success");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load course data from backend.");
        setState("error");
      });

    return () => { cancelled = true; };
  }, []);

  // Apply department filter from GlobalFilterBar
  const visible = filters.department
    ? courses.filter((c) => c.department === filters.department)
    : courses;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-200 px-3 py-1 rounded-full text-xs font-bold border border-violet-400/30 mb-2">
          <BookOpen size={14} /> Course Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Course-wise Performance & Risk Audit</h1>
        <p className="text-violet-100 text-sm mt-1">
          Identifying courses requiring attention based on statistical deviation from institutional baseline.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="text-violet-600" size={20} />
            {state === "success"
              ? `Active Semester Courses (${visible.length}${filters.department ? ` in ${filters.department}` : ""})`
              : "Active Semester Courses"}
          </h2>
          <span className="text-xs font-bold bg-violet-50 text-violet-700 px-3 py-1 rounded-full border border-violet-100">
            Live Database
          </span>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <div className="flex items-center justify-center py-20 gap-3 text-indigo-600 font-medium">
            <Loader2 size={22} className="animate-spin" />
            Loading course performance from database…
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-rose-600 px-6">
            <AlertCircle size={40} className="text-rose-400" />
            <div className="text-center">
              <p className="font-bold text-lg text-gray-900">Failed to load courses</p>
              <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
              <p className="text-xs text-gray-400 mt-2">Verify the backend is running at {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {state === "empty" && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 px-6">
            <Info size={36} />
            <p className="font-semibold text-gray-600">No course performance data found.</p>
            <p className="text-sm">The database may not have assessment records for the current term.</p>
          </div>
        )}

        {/* Data table */}
        {state === "success" && (
          <div className="overflow-x-auto">
            {visible.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm font-medium">
                No courses found for department <strong>{filters.department}</strong>.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="py-4 px-6 font-bold">Course Code & Title</th>
                    <th className="py-4 px-6 font-bold">Dept</th>
                    <th className="py-4 px-6 font-bold">Students</th>
                    <th className="py-4 px-6 font-bold">Pass Rate</th>
                    <th className="py-4 px-6 font-bold">Avg Marks</th>
                    <th className="py-4 px-6 font-bold">Risk Status</th>
                    <th className="py-4 px-6 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {visible.map((c) => (
                    <tr key={`${c.course_code}-${c.semester}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{c.course_name || c.course_code}</div>
                        <div className="text-xs text-indigo-600 font-semibold">
                          {c.course_code}
                          {c.semester && c.semester !== "—" ? ` • ${c.semester}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-700">{c.department}</td>
                      <td className="py-4 px-6 font-medium text-gray-600">{c.students_appeared}</td>
                      <td className="py-4 px-6">
                        <span className={`font-extrabold ${c.pass_rate < 70 ? "text-rose-600" : "text-emerald-600"}`}>
                          {c.pass_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-600">
                        {c.avg_marks > 0 ? c.avg_marks.toFixed(1) : "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold inline-block ${
                          c.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : c.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : c.priority === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
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
            )}
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-950 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-violet-300 uppercase">{selectedCourse.course_code} Intelligence Detail</span>
                <h3 className="text-lg font-bold">{selectedCourse.course_name || selectedCourse.course_code}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* KPI grid */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Pass Rate</div>
                  <div className={`text-xl font-black mt-1 ${selectedCourse.pass_rate < 70 ? "text-rose-600" : "text-emerald-600"}`}>
                    {selectedCourse.pass_rate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Avg Marks</div>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    {selectedCourse.avg_marks > 0 ? selectedCourse.avg_marks.toFixed(1) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Students</div>
                  <div className="text-xl font-black text-indigo-900 mt-1">{selectedCourse.students_appeared}</div>
                </div>
              </div>

              {/* Additional analytics */}
              <div className="space-y-2 bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> Statistical Evidence (Agent 10)
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Internal Avg:</span>
                    <strong className="text-white text-sm">
                      {selectedCourse.avg_internal != null ? selectedCourse.avg_internal.toFixed(1) : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">External Avg:</span>
                    <strong className="text-white text-sm">
                      {selectedCourse.avg_external != null ? selectedCourse.avg_external.toFixed(1) : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">External SD:</span>
                    <strong className="text-white text-sm">
                      {selectedCourse.sd_external != null ? selectedCourse.sd_external.toFixed(2) : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Int-Ext Corr:</span>
                    <strong className={`text-sm ${
                      selectedCourse.internal_external_corr != null && selectedCourse.internal_external_corr < 0.2
                        ? "text-rose-400"
                        : "text-white"
                    }`}>
                      {selectedCourse.internal_external_corr != null
                        ? selectedCourse.internal_external_corr.toFixed(3)
                        : "N/A"}
                    </strong>
                  </div>
                </div>
                {selectedCourse.internal_external_corr != null &&
                  selectedCourse.internal_external_corr < 0.2 && (
                  <div className="mt-3 p-3 bg-rose-900/30 rounded-xl border border-rose-800 text-rose-300 text-xs font-semibold">
                    ⚠ Low internal-external correlation detected. May indicate lenient internal marking.
                  </div>
                )}
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
