import { useEffect, useState } from "react";
import { ShieldAlert, Users, AlertTriangle , AlertCircle, Info, BookOpen } from "lucide-react";
import { Agent10API } from "../services/api";
import type { TrendsResponse } from "../types/agent10";

type LoadState = "loading" | "success" | "error" | "empty";

export default function Students() {
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    // Student backlog data comes from the trends endpoint which includes student_backlog_trend
    Agent10API.getTrends()
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState("empty");
        } else {
          setTrendsData(data);
          setState("success");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load student data.");
        setState("error");
      });

    return () => { cancelled = true; };
  }, []);

  const backlog = trendsData?.student_backlog_trend;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-rose-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full text-xs font-bold border border-rose-400/30 mb-2">
          <ShieldAlert size={14} /> At-Risk Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">At-Risk Student Cohort Management</h1>
        <p className="text-rose-100 text-sm mt-1">
          Identifying persistent underperformance via backlog analysis and deploying targeted support actions.
        </p>
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0B1120] p-6 rounded-3xl border border-slate-800/60 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/2 mb-4" />
              <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-800/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="bg-[#0B1120] rounded-3xl border border-rose-500/20 shadow-sm flex flex-col items-center justify-center py-16 gap-4 px-6">
          <AlertCircle size={40} className="text-rose-400" />
          <div className="text-center">
            <p className="font-bold text-lg text-white">Failed to load student data</p>
            <p className="text-sm text-slate-400 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-slate-500 px-6">
          <Info size={36} />
          <p className="font-semibold text-slate-400">No student backlog data found.</p>
        </div>
      )}

      {/* Data */}
      {state === "success" && backlog && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0B1120] p-6 rounded-3xl border border-slate-800/60 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</div>
                <Users size={16} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {backlog.total_students.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Active in institution</div>
            </div>

            <div className="bg-[#0B1120] p-6 rounded-3xl border border-amber-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">With Backlogs</div>
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-400 mt-2">
                {backlog.students_with_backlogs.toLocaleString()}
              </div>
              <div className="text-xs text-amber-600 font-medium mt-1">
                {backlog.total_students > 0
                  ? `${((backlog.students_with_backlogs / backlog.total_students) * 100).toFixed(1)}% of cohort`
                  : "—"}
              </div>
            </div>

            <div className="bg-[#0B1120] p-6 rounded-3xl border border-rose-500/20 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600">High Backlogs (≥3)</div>
                <ShieldAlert size={16} className="text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-400 mt-2">
                {backlog.students_high_backlogs.toLocaleString()}
              </div>
              <div className="text-xs text-rose-600 font-medium mt-1">Critical intervention needed</div>
            </div>
          </div>

          {/* Risk breakdown */}
          <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-rose-600" size={20} />
              Backlog Risk Classification
            </h2>

            <div className="space-y-3">
              {/* High risk */}
              <div className="bg-rose-500/10 rounded-2xl p-5 border border-rose-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-extrabold rounded-full border border-rose-500/20">
                        CRITICAL RISK
                      </span>
                      <span className="text-xs font-bold text-slate-400">≥3 active backlogs</span>
                    </div>
                    <h3 className="text-base font-bold text-white">Persistent High-Backlog Students</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {backlog.students_high_backlogs} student{backlog.students_high_backlogs !== 1 ? "s" : ""} flagged
                      for persistent underperformance with 3 or more active backlogs.
                    </p>
                  </div>
                  <div className="text-3xl font-black text-rose-400 shrink-0">
                    {backlog.students_high_backlogs}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-rose-500/20">
                  <p className="text-xs font-bold text-rose-400">Recommended Intervention:</p>
                  <p className="text-sm text-rose-400 font-medium mt-1">
                    Mandatory academic counselling session. Assign peer mentor. HOD review of progress within 2 weeks.
                  </p>
                </div>
              </div>

              {/* Moderate risk */}
              {(backlog.students_with_backlogs - backlog.students_high_backlogs) > 0 && (
                <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-extrabold rounded-full border border-amber-200">
                          MODERATE RISK
                        </span>
                        <span className="text-xs font-bold text-slate-400">1–2 active backlogs</span>
                      </div>
                      <h3 className="text-base font-bold text-white">Students with Backlogs (1–2)</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {backlog.students_with_backlogs - backlog.students_high_backlogs} student
                        {backlog.students_with_backlogs - backlog.students_high_backlogs !== 1 ? "s" : ""} with 1–2 backlogs.
                        Early intervention recommended.
                      </p>
                    </div>
                    <div className="text-3xl font-black text-amber-400 shrink-0">
                      {backlog.students_with_backlogs - backlog.students_high_backlogs}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-xs font-bold text-amber-400">Recommended Intervention:</p>
                    <p className="text-sm text-amber-400 font-medium mt-1">
                      Enrol in supplemental tutorial sessions. Faculty advisory meeting within 1 month.
                    </p>
                  </div>
                </div>
              )}

              {/* No backlog */}
              <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-200">
                        ON TRACK
                      </span>
                      <span className="text-xs font-bold text-slate-400">0 backlogs</span>
                    </div>
                    <h3 className="text-base font-bold text-white">Students on Track</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {(backlog.total_students - backlog.students_with_backlogs).toLocaleString()} student
                      {(backlog.total_students - backlog.students_with_backlogs) !== 1 ? "s" : ""} with no active backlogs.
                    </p>
                  </div>
                  <div className="text-3xl font-black text-emerald-400 shrink-0">
                    {(backlog.total_students - backlog.students_with_backlogs).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data source note */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium px-2">
            <BookOpen size={14} />
            Data sourced from <code className="bg-slate-800/50 px-1 rounded">people.v_student_profile</code> via Agent 10 analytics engine.
          </div>
        </>
      )}
    </div>
  );
}
