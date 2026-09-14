import { useEffect, useState, useMemo } from "react";
import { BookOpen, ShieldCheck, BarChart2, AlertCircle , X, Info } from "lucide-react";
import { Agent10API } from "../services/api";
import { useFilters } from "../contexts/FilterContext";
import type { CoursePerformance } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";

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

    Agent10API.getCourses(filters)
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setState("empty");
        } else {
          setCourses(data);
          setState("success");
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("Failed to fetch courses:", err);
        const msg = err?.response?.data?.detail || err?.message || String(err);
        setErrorMsg(msg);
        setState("error");
      });

    return () => { cancelled = true; };
  }, [filters]);

  // Apply department filter from GlobalFilterBar
  const visible = useMemo(() => {
    return filters.department
      ? courses.filter((c) => c.department === filters.department)
      : courses;
  }, [courses, filters.department]);

  const handleExportExcel = () => {
    const exportData = visible.map(c => ({
      "Course Code": c.course_code,
      "Course Title": c.course_name,
      "Department": c.department,
      "Semester": c.semester,
      "Students": c.students_appeared,
      "Pass Rate (%)": c.pass_rate,
      "Average Marks": c.avg_marks,
      "Risk Status": c.priority
    }));
    exportToExcel(exportData, `Course_Performance_${filters.department || 'All'}`);
  };

  const handleExportPDF = () => {
    const paragraphs = [
      `Course Performance Audit`,
      `Department Filter: ${filters.department || 'All Departments'}`,
      `Total Courses Analysed: ${visible.length}`
    ];
    
    const tableData = [
      ["Course Code", "Department", "Students", "Pass Rate (%)", "Risk Status"],
      ...visible.map(c => [
        c.course_code, c.department, String(c.students_appeared), String(c.pass_rate), c.priority
      ])
    ];

    exportToPDF(`Course Performance Audit`, paragraphs, tableData, `Course_Performance_${filters.department || 'All'}`);
  };

  const handleExportWord = () => {
    const paragraphs = [
      `Course Performance Audit`,
      `Department Filter: ${filters.department || 'All Departments'}`,
      `Total Courses Analysed: ${visible.length}`
    ];
    
    const tableData = [
      ["Course Code", "Department", "Students", "Pass Rate (%)", "Risk Status"],
      ...visible.map(c => [
        c.course_code, c.department, String(c.students_appeared), String(c.pass_rate), c.priority
      ])
    ];

    exportToWord(`Course Performance Audit`, paragraphs, tableData, `Course_Performance_${filters.department || 'All'}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="courses-content">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm">
        <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 px-3 py-1 rounded-full text-xs font-bold border border-violet-200 dark:border-violet-500/20 mb-2">
          <BookOpen size={14} /> Course Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Course-wise Performance & Risk Audit</h1>
        <p className="text-secondary text-sm mt-1">
          Identifying courses requiring attention based on statistical deviation from institutional baseline.
        </p>
      </div>

      <div className="bg-surface rounded-3xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <BarChart2 className="text-violet-500" size={20} />
            {state === "success"
              ? `Active Semester Courses (${visible.length}${filters.department ? ` in ${filters.department}` : ""})`
              : "Active Semester Courses"}
          </h2>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full border border-violet-500/20">
              Live Database
            </span>
            <ExportMenu 
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onExportWord={handleExportWord}
              disabled={state !== "success" || visible.length === 0}
            />
          </div>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <div className="p-6 space-y-4">
            <div className="flex gap-4 mb-6">
              <div className="h-10 w-1/4 bg-surface-secondary/50 rounded-xl animate-pulse" />
              <div className="h-10 w-1/4 bg-surface-secondary/50 rounded-xl animate-pulse" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-slate-800/30 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-rose-600 px-6">
            <AlertCircle size={40} className="text-rose-600 dark:text-rose-400" />
            <div className="text-center">
              <p className="font-bold text-lg text-primary">Failed to load courses</p>
              <p className="text-sm text-secondary mt-1">{errorMsg}</p>
              <p className="text-xs text-secondary mt-2">Verify the backend is running at {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {state === "empty" && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-secondary px-6">
            <Info size={36} />
            <p className="font-semibold text-secondary">No course performance data found.</p>
            <p className="text-sm">The database may not have assessment records for the current term.</p>
          </div>
        )}

        {/* Data table */}
        {state === "success" && (
          <div className="overflow-x-auto">
            {visible.length === 0 ? (
              <div className="py-12 text-center text-secondary text-sm font-medium">
                No courses found for department <strong>{filters.department}</strong>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface/40 text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                    <th className="py-4 px-6 font-bold">Course Code & Title</th>
                    <th className="py-4 px-6 font-bold">Dept</th>
                    <th className="py-4 px-6 font-bold">Students</th>
                    <th className="py-4 px-6 font-bold">Pass Rate</th>
                    <th className="py-4 px-6 font-bold">Avg Marks</th>
                    <th className="py-4 px-6 font-bold">Risk Status</th>
                    <th className="py-4 px-6 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {visible.map((c) => (
                    <tr key={`${c.course_code}-${c.semester}`} className="hover:bg-surface/40/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-primary">{c.course_name || c.course_code}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          {c.course_code}
                          {c.semester && c.semester !== "—" ? ` • ${c.semester}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-primary">{c.department}</td>
                      <td className="py-4 px-6 font-medium text-secondary">{c.students_appeared}</td>
                      <td className="py-4 px-6">
                        <span className={`font-extrabold ${c.pass_rate < 70 ? "text-rose-600" : "text-emerald-500"}`}>
                          {c.pass_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-secondary">
                        {c.avg_marks > 0 ? c.avg_marks.toFixed(1) : "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold inline-block ${
                          c.priority === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : c.priority === "HIGH"
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200"
                            : c.priority === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200"
                        }`}>
                          {c.priority} RISK
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedCourse(c)}
                          className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs transition-colors border border-indigo-200"
                        >
                          View Context →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border/60 animate-in zoom-in-95">
            <div className="px-6 py-4 bg-surface-secondary/50 border-b border-border/60 flex justify-between items-center text-primary">
              <div>
                <span className="text-xs font-bold text-secondary uppercase">{selectedCourse.course_code} Intelligence Detail</span>
                <h3 className="text-lg font-bold text-primary">{selectedCourse.course_name || selectedCourse.course_code}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-primary/80 hover:text-primary cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* KPI grid */}
              <div className="grid grid-cols-3 gap-4 bg-surface/40 p-4 rounded-2xl border border-border/60 text-center">
                <div>
                  <div className="text-[11px] font-bold text-secondary uppercase">Pass Rate</div>
                  <div className={`text-xl font-black mt-1 ${selectedCourse.pass_rate < 70 ? "text-rose-600" : "text-emerald-500"}`}>
                    {selectedCourse.pass_rate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-secondary uppercase">Avg Marks</div>
                  <div className="text-xl font-black text-primary mt-1">
                    {selectedCourse.avg_marks > 0 ? selectedCourse.avg_marks.toFixed(1) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-secondary uppercase">Students</div>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{selectedCourse.students_appeared}</div>
                </div>
              </div>

              {/* Additional analytics */}
              <div className="space-y-2 bg-surface text-slate-100 p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> Statistical Evidence (Agent 10)
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-secondary block">Internal Avg:</span>
                    <strong className="text-primary text-sm">
                      {selectedCourse.avg_internal != null ? selectedCourse.avg_internal.toFixed(1) : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-secondary block">External Avg:</span>
                    <strong className="text-primary text-sm">
                      {selectedCourse.avg_external != null ? selectedCourse.avg_external.toFixed(1) : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-secondary block">External SD:</span>
                    <strong className="text-primary text-sm">
                      {selectedCourse.sd_external != null ? selectedCourse.sd_external.toFixed(2) : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-secondary block">Int-Ext Corr:</span>
                    <strong className={`text-sm ${
                      selectedCourse.internal_external_corr != null && selectedCourse.internal_external_corr < 0.2
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-primary"
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

              <div className="pt-4 border-t border-border/60 flex justify-end">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-primary rounded-xl text-sm font-bold transition-colors"
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
