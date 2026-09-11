import { useEffect, useState } from "react";
import { Layers, AlertTriangle, CheckCircle , AlertCircle, Info } from "lucide-react";
import { Agent10API } from "../services/api";
import { useFilters } from "../contexts/FilterContext";
import type { SectionComparison } from "../types/agent10";

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30 mb-2">
            <Layers size={14} /> Section Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Section-Level Disparity Telemetry</h1>
          <p className="text-blue-100 text-sm mt-1">
            Comparing section performance across identical course offerings to surface pedagogical disparities.
          </p>
        </div>
        {state === "success" && disparityCount > 0 && (
          <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl px-5 py-3 text-center">
            <div className="text-2xl font-black text-rose-200">{disparityCount}</div>
            <div className="text-xs font-bold text-rose-300 mt-0.5">Sections Flagged</div>
          </div>
        )}
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm p-6 space-y-4">
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-1/4 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-10 w-1/4 bg-slate-800/50 rounded-xl animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="bg-[#0B1120] rounded-3xl border border-rose-500/20 shadow-sm flex flex-col items-center justify-center py-16 gap-4 px-6">
          <AlertCircle size={40} className="text-rose-400" />
          <div className="text-center">
            <p className="font-bold text-lg text-white">Failed to load sections</p>
            <p className="text-sm text-slate-400 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-slate-500 px-6">
          <Info size={36} />
          <p className="font-semibold text-slate-400">No section data found.</p>
          <p className="text-sm text-center">The database may not have section-level assessment records yet.</p>
        </div>
      )}

      {/* Data */}
      {state === "success" && (
        <>
          {visible.length === 0 ? (
            <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm py-12 text-center text-slate-400 text-sm font-medium">
              No sections found for department <strong>{filters.department}</strong>.
            </div>
          ) : (
            <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-800/60 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="text-blue-600" size={20} />
                  Section Performance Matrix ({visible.length} sections)
                </h2>
                {disparityCount > 0 && (
                  <span className="text-xs font-bold bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full border border-rose-500/20">
                    {disparityCount} disparity flag{disparityCount !== 1 ? "s" : ""} active
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800/60">
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
                        className={`hover:bg-slate-900/40/80 transition-colors ${s.disparity_flag ? "bg-rose-500/10/30" : ""}`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{s.course_title || s.course_code}</div>
                          <div className="text-xs text-indigo-400 font-semibold">{s.course_code}</div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-300">{s.section}</td>
                        <td className="py-4 px-6 font-medium text-slate-400">{s.department}</td>
                        <td className="py-4 px-6 font-medium text-slate-400">{s.students_appeared}</td>
                        <td className="py-4 px-6">
                          {s.pass_rate != null ? (
                            <span className={`font-extrabold ${s.pass_rate < 70 ? "text-rose-600" : "text-emerald-500"}`}>
                              {s.pass_rate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-400">
                          {s.avg_marks != null ? s.avg_marks.toFixed(1) : "—"}
                        </td>
                        <td className="py-4 px-6">
                          {s.disparity_flag ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/20">
                              <AlertTriangle size={12} /> Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200">
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
              <strong className="font-bold text-amber-400">Disparity Flag Explanation:</strong> A section is flagged when its pass rate deviates
              significantly from peer sections teaching the same course in the same term (threshold: ≥15 percentage points).
              This may indicate differences in teaching delivery, attendance patterns, or assessment consistency.
            </div>
          )}
        </>
      )}
    </div>
  );
}
