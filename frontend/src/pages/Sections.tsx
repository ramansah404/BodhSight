import { useEffect, useState } from "react";
import { Layers, AlertTriangle, CheckCircle , AlertCircle, Info } from "lucide-react";
import { Agent10API } from "../services/api";
import { useFilters } from "../contexts/FilterContext";
import type { SectionComparison } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel } from "../utils/exportUtils";

type LoadState = "loading" | "success" | "error" | "empty";

export default function Sections() {
  const { filters } = useFilters();
  const [sections, setSections] = useState<SectionComparison[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    Agent10API.getSections()
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setState("empty");
        } else {
          setSections(data);
          setState("success");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load section data.");
        setState("error");
      });

    return () => { cancelled = true; };
  }, []);

  // Apply department filter
  const visible = filters.department
    ? sections.filter((s) => s.department === filters.department)
    : sections;

  const disparityCount = visible.filter((s) => s.disparity_flag).length;

  const handleExportExcel = () => {
    const exportData = visible.map(s => ({
      "Course Code": s.course_code,
      "Course Title": s.course_title,
      "Section": s.section,
      "Department": s.department,
      "Students": s.students_appeared,
      "Pass Rate (%)": s.pass_rate,
      "Average Marks": s.avg_marks,
      "Disparity Flag": s.disparity_flag ? "FLAGGED" : "Normal"
    }));
    exportToExcel(exportData, `Section_Performance_${filters.department || 'All'}`);
  };

  const handleExportPDF = () => {
    const paragraphs = [
      `Section-Level Disparity Telemetry`,
      `Generated for: ${filters.department || 'All Departments'}`,
      `Total Sections: ${visible.length} | Flagged Disparities: ${disparityCount}`
    ];
    
    const tableData = [
      ["Course Code", "Course Title", "Section", "Department", "Students", "Pass Rate (%)", "Avg Marks", "Disparity"],
      ...visible.map(s => [
        s.course_code, 
        s.course_title, 
        s.section, 
        s.department, 
        String(s.students_appeared), 
        String(s.pass_rate), 
        String(s.avg_marks), 
        s.disparity_flag ? "FLAGGED" : "Normal"
      ])
    ];

    exportToPDF(`Section Disparity Analysis`, paragraphs, tableData, `Section_Performance_${filters.department || 'All'}`);
  };

  const handleExportWord = () => {
    const paragraphs = [
      `Section-Level Disparity Telemetry`,
      `Generated for: ${filters.department || 'All Departments'}`,
      `Total Sections: ${visible.length} | Flagged Disparities: ${disparityCount}`
    ];
    
    const tableData = [
      ["Course Code", "Course Title", "Section", "Department", "Students", "Pass Rate (%)", "Avg Marks", "Disparity"],
      ...visible.map(s => [
        s.course_code, 
        s.course_title, 
        s.section, 
        s.department, 
        String(s.students_appeared), 
        String(s.pass_rate), 
        String(s.avg_marks), 
        s.disparity_flag ? "FLAGGED" : "Normal"
      ])
    ];

    exportToWord(`Section Disparity Analysis`, paragraphs, tableData, `Section_Performance_${filters.department || 'All'}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-500/20 mb-2">
            <Layers size={14} /> Section Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Section-Level Disparity Telemetry</h1>
          <p className="text-secondary text-sm mt-1">
            Comparing section performance across identical course offerings to surface pedagogical disparities.
          </p>
        </div>
        {state === "success" && disparityCount > 0 && (
          <div className="bg-gradient-to-br from-amber-400 to-orange-600 border border-orange-400/30 rounded-2xl px-6 py-4 text-center shadow-lg shadow-orange-500/20 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-3xl font-black text-white drop-shadow-md">{disparityCount}</div>
            <div className="text-[10px] font-bold text-orange-50 uppercase tracking-widest mt-1">Sections Flagged</div>
          </div>
        )}
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4">
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
        <div className="bg-surface rounded-3xl border border-rose-500/20 shadow-sm flex flex-col items-center justify-center py-16 gap-4 px-6">
          <AlertCircle size={40} className="text-rose-600 dark:text-rose-400" />
          <div className="text-center">
            <p className="font-bold text-lg text-primary">Failed to load sections</p>
            <p className="text-sm text-secondary mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-secondary px-6">
          <Info size={36} />
          <p className="font-semibold text-secondary">No section data found.</p>
          <p className="text-sm text-center">The database may not have section-level assessment records yet.</p>
        </div>
      )}

      {/* Data */}
      {state === "success" && (
        <>
          {visible.length === 0 ? (
            <div className="bg-surface rounded-3xl border border-border/60 shadow-sm py-12 text-center text-secondary text-sm font-medium">
              No sections found for department <strong>{filters.department}</strong>.
            </div>
          ) : (
            <div className="bg-surface rounded-3xl border border-border/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/60 flex justify-between items-center">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Layers className="text-blue-600" size={20} />
                  Section Performance Matrix ({visible.length} sections)
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {disparityCount > 0 && (
                    <span className="text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-500/20">
                      {disparityCount} disparity flag{disparityCount !== 1 ? "s" : ""} active
                    </span>
                  )}
                  <ExportMenu 
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                    onExportWord={handleExportWord}
                    disabled={state !== "success" || visible.length === 0}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface/40 text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                      <th className="py-4 px-6 font-bold">Course</th>
                      <th className="py-4 px-6 font-bold">Section</th>
                      <th className="py-4 px-6 font-bold">Dept</th>
                      <th className="py-4 px-6 font-bold">Students</th>
                      <th className="py-4 px-6 font-bold">Pass Rate</th>
                      <th className="py-4 px-6 font-bold">Avg Marks</th>
                      <th className="py-4 px-6 font-bold">Disparity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {visible.map((s, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-surface/40/80 transition-colors ${s.disparity_flag ? "bg-rose-500/10/30" : ""}`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-primary">{s.course_title || s.course_code}</div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{s.course_code}</div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-primary">{s.section}</td>
                        <td className="py-4 px-6 font-medium text-secondary">{s.department}</td>
                        <td className="py-4 px-6 font-medium text-secondary">{s.students_appeared}</td>
                        <td className="py-4 px-6">
                          {s.pass_rate != null ? (
                            <span className={`font-extrabold ${s.pass_rate < 70 ? "text-rose-600" : "text-emerald-500"}`}>
                              {s.pass_rate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-secondary">
                          {s.avg_marks != null ? s.avg_marks.toFixed(1) : "—"}
                        </td>
                        <td className="py-4 px-6">
                          {s.disparity_flag ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/20">
                              <AlertTriangle size={12} /> Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle size={12} /> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disparity explanation */}
          {disparityCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900 font-medium">
              <strong className="font-bold text-amber-600 dark:text-amber-400">Disparity Flag Explanation:</strong> A section is flagged when its pass rate deviates
              significantly from peer sections teaching the same course in the same term (threshold: ≥15 percentage points).
              This may indicate differences in teaching delivery, attendance patterns, or assessment consistency.
            </div>
          )}
        </>
      )}
    </div>
  );
}
