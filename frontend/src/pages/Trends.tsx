import { useEffect, useState } from "react";
import { TrendingUp, CalendarDays, TrendingDown, Info , AlertCircle, BarChart2 } from "lucide-react";
import { Agent10API } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TrendsResponse } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";

type LoadState = "loading" | "success" | "error";

export default function Trends() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    Agent10API.getTrends()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setState("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load trends data.");
        setState("error");
      });

    return () => { cancelled = true; };
  }, []);

  const handleExportExcel = () => {
    if (!data) return;
    
    const aboveData = data.courses_above_mean.map(c => ({
      "Course Code": c.course_code,
      "Title": c.course_title,
      "Pass Rate (%)": c.pass_pct,
      "Delta vs Mean": c.delta_vs_mean
    }));
    
    const belowData = data.courses_below_mean.map(c => ({
      "Course Code": c.course_code,
      "Title": c.course_title,
      "Pass Rate (%)": c.pass_pct,
      "Delta vs Mean": c.delta_vs_mean
    }));

    exportToExcel([...aboveData, {}, ...belowData], "Institutional_Trends");
  };

  const handleExportPDF = () => {
    exportToPDF("trends-content", "Institutional_Trends_Report", "Institutional Trend Analysis");
  };

  const handleExportWord = () => {
    if (!data) return;
    
    const paragraphs = [
      `Institutional Trend Analysis`,
      `Average Pass Rate: ${data.current_term_summary?.avg_pass_rate?.toFixed(1) || 0}%`,
      `Average Marks: ${data.current_term_summary?.avg_marks?.toFixed(1) || 0}`,
      `Students Evaluated: ${data.current_term_summary?.students_evaluated || 0}`
    ];
    
    const tableData = [
      ["Course Code", "Title", "Pass Rate (%)", "Delta vs Mean (pp)"],
      ...data.courses_above_mean.map(c => [c.course_code, c.course_title, String(c.pass_pct), `+${c.delta_vs_mean.toFixed(1)}`]),
      ...data.courses_below_mean.map(c => [c.course_code, c.course_title, String(c.pass_pct), String(c.delta_vs_mean.toFixed(1))])
    ];

    exportToWord(`Institutional Trend Analysis`, paragraphs, tableData, "Institutional_Trends_Report");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="trends-content">
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex justify-between items-start md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30 mb-3">
              <TrendingUp size={14} /> Historical Timeline
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Institutional Trend Analysis</h1>
            <p className="text-amber-100/80 text-sm mt-1 max-w-2xl">
              Relative performance analysis across courses compared to the institutional mean for the current academic term.
            </p>
          </div>
          
          <ExportMenu 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
            disabled={state !== "success"}
          />
        </div>
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
          <p className="font-bold text-lg text-white">Failed to load trends</p>
          <p className="text-sm text-secondary">{errorMsg}</p>
        </div>
      )}

      {state === "success" && data && (
        <>
          {/* Historical data notice */}
          {!data.historical_data_available && (
            <div className="bg-amber-500/10 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-amber-900">
              <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400">Multi-term trend analysis unavailable</p>
                <p className="text-sm mt-1">
                  {data.insufficient_history_note ??
                    "Only one academic term is present in the database. Showing relative performance vs institutional mean instead."}
                </p>
              </div>
            </div>
          )}

          {/* Current term summary */}
          {data.current_term_summary && (
            <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarDays className="text-amber-600" size={20} />
                  Current Term Summary
                </h2>
                <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
                  Live Database
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 text-center">
                  <div className="text-xs font-bold text-secondary uppercase">Avg Pass Rate</div>
                  <div className="text-2xl font-black text-emerald-500 mt-1">
                    {data.current_term_summary.avg_pass_rate != null
                      ? `${data.current_term_summary.avg_pass_rate.toFixed(1)}%`
                      : "—"}
                  </div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 text-center">
                  <div className="text-xs font-bold text-secondary uppercase">Avg Marks</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {data.current_term_summary.avg_marks != null
                      ? data.current_term_summary.avg_marks.toFixed(1)
                      : "—"}
                  </div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 text-center">
                  <div className="text-xs font-bold text-secondary uppercase">Course Sections</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    {data.current_term_summary.total_sections}
                  </div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 text-center">
                  <div className="text-xs font-bold text-secondary uppercase">Students Evaluated</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    {data.current_term_summary.students_evaluated.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Above mean / Below mean */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Above mean */}
            <div className="bg-[#0B1120] rounded-3xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-emerald-500/20 flex items-center gap-2 bg-emerald-500/10">
                <TrendingUp size={18} className="text-emerald-500" />
                <h3 className="font-bold text-emerald-400">
                  Above Institutional Mean ({data.courses_above_mean.length})
                </h3>
              </div>
              {data.courses_above_mean.length === 0 ? (
                <div className="py-10 text-center text-sm text-text-secondary font-medium">
                  No courses above the institutional mean.
                </div>
              ) : (
                <>
                  <div style={{ width: "100%", height: 180 }} className="p-4 border-b border-border">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.courses_above_mean.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="course_code" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} width={60} />
                        <Tooltip cursor={{ fill: "#1e293b" }} contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc" }} />
                        <Bar dataKey="delta_vs_mean" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} name="Delta (pp)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="divide-y divide-border h-64 overflow-y-auto custom-scrollbar">
                    {data.courses_above_mean.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                      <div>
                        <div className="font-bold text-white text-sm">{c.course_title || c.course_code}</div>
                        <div className="text-xs text-secondary font-semibold">{c.course_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-emerald-500">{c.pass_pct.toFixed(1)}%</div>
                        <div className="text-xs text-emerald-500 font-bold">
                          +{c.delta_vs_mean.toFixed(1)} pp
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </div>

            {/* Below mean */}
            <div className="bg-[#0B1120] rounded-3xl border border-rose-500/20 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-rose-500/20 flex items-center gap-2 bg-rose-500/10">
                <TrendingDown size={18} className="text-rose-600" />
                <h3 className="font-bold text-rose-400">
                  Below Institutional Mean ({data.courses_below_mean.length})
                </h3>
              </div>
              {data.courses_below_mean.length === 0 ? (
                <div className="py-10 text-center text-sm text-text-secondary font-medium">
                  No courses below the institutional mean.
                </div>
              ) : (
                <>
                  <div style={{ width: "100%", height: 180 }} className="p-4 border-b border-border">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.courses_below_mean.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="course_code" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} width={60} />
                        <Tooltip cursor={{ fill: "#1e293b" }} contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc" }} />
                        <Bar dataKey="delta_vs_mean" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={16} name="Delta (pp)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="divide-y divide-border h-64 overflow-y-auto custom-scrollbar">
                    {data.courses_below_mean.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                      <div>
                        <div className="font-bold text-white text-sm">{c.course_title || c.course_code}</div>
                        <div className="text-xs text-secondary font-semibold">{c.course_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-rose-600">{c.pass_pct.toFixed(1)}%</div>
                        <div className="text-xs text-rose-500 font-bold">
                          {c.delta_vs_mean.toFixed(1)} pp
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          </div>

          {/* Backlog trend */}
          {data.student_backlog_trend && (
            <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="text-amber-600" size={20} />
                Student Backlog Trend
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 text-center">
                  <div className="text-xs font-bold text-secondary uppercase">Total Students</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {data.student_backlog_trend.total_students.toLocaleString()}
                  </div>
                </div>
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-200 text-center">
                  <div className="text-xs font-bold text-amber-600 uppercase">With Backlogs</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {data.student_backlog_trend.students_with_backlogs.toLocaleString()}
                  </div>
                </div>
                <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-center">
                  <div className="text-xs font-bold text-rose-600 uppercase">High Backlogs (≥3)</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {data.student_backlog_trend.students_high_backlogs.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
