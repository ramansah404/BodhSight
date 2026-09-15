import { useEffect, useState } from "react";
import { Lightbulb, CheckCircle2, Play, Sparkles, Lock , AlertCircle, Info, Database, Brain } from "lucide-react";
import { Agent10API } from "../services/api";
import { useRole } from "../contexts/RoleContext";
import { useFilters } from "../contexts/FilterContext";
import type { RecommendationItem } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";

type LoadState = "loading" | "success" | "error" | "empty";

export default function Recommendations() {
  const { permissions } = useRole();
  const { filters } = useFilters();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    Agent10API.getRecommendations(filters)
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setState("empty");
        } else {
          setRecommendations(data);
          setState("success");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load recommendations from backend.");
        setState("error");
      });

    return () => { cancelled = true; };
  }, [filters]);

  const handleExecute = async (id: string) => {
    if (!permissions.canExecuteRecommendation) {
      alert("Access Denied: Your current role does not have authorization to execute institutional interventions.");
      return;
    }
    setExecutingId(id);
    try {
      await Agent10API.executeRecommendation(id);
      setExecutingId(null);
      setSuccessId(id);
      // Update the local status to IN_PROGRESS to reflect the DB change
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "IN_PROGRESS" } : r))
      );
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err: any) {
      setExecutingId(null);
      alert(err.message || "Failed to execute recommendation. Ensure the backend is connected.");
    }
  };

  const handleExportExcel = () => {
    const exportData = recommendations.map(r => ({
      "Priority": r.priority,
      "Problem": r.problem,
      "Recommendation": r.recommendation,
      "Expected Impact": r.expected_impact,
      "Affected Population": r.affected_population,
      "Course Code": r.course_code || "N/A",
      "Status": r.status || "PENDING"
    }));
    exportToExcel(exportData, "Recommendations_Log");
  };

  const handleExportPDF = () => {
    const paragraphs = [
      `Actionable Recommendations & Interventions`,
      `Generated for: ${rawRole} View`,
      `Total Interventions: ${recommendations.length}`
    ];
    
    const tableData = [
      ["Priority", "Problem", "Recommendation", "Expected Impact", "Affected Population", "Course Code", "Status"],
      ...recommendations.map(r => [
        r.priority, 
        r.problem, 
        r.recommendation, 
        String(r.expected_impact), 
        String(r.affected_population), 
        r.course_code || "N/A", 
        r.status || "PENDING"
      ])
    ];

    exportToPDF(`Actionable Recommendations`, paragraphs, tableData, "Recommendations_Log");
  };

  const handleExportWord = () => {
    const paragraphs = [
      `Actionable Recommendations & Interventions`,
      `Generated for: ${rawRole} View`,
      `Total Interventions: ${recommendations.length}`
    ];
    
    const tableData = [
      ["Priority", "Problem", "Recommendation", "Expected Impact", "Affected Population", "Course Code", "Status"],
      ...recommendations.map(r => [
        r.priority, 
        r.problem, 
        r.recommendation, 
        String(r.expected_impact), 
        String(r.affected_population), 
        r.course_code || "N/A", 
        r.status || "PENDING"
      ])
    ];

    exportToWord(`Actionable Recommendations`, paragraphs, tableData, "Recommendations_Log");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="recommendations-content">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm">
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-500/20 mb-2">
          <Lightbulb size={14} /> Actionable Intelligence ({rawRole} Scope)
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Recommendation & Priority Center</h1>
        <p className="text-secondary text-sm mt-1">
          {permissions.canExecuteRecommendation
            ? "Execute and authorize prioritized institutional interventions based on Agent 10 anomaly detections."
            : "Review recommended pedagogical support and remediation workflows for your assigned courses."}
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
          <ExportMenu 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
            disabled={state !== "success" || recommendations.length === 0}
          />
        </div>
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
            <p className="font-bold text-lg text-primary">Failed to load recommendations</p>
            <p className="text-sm text-secondary mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-secondary px-6">
          <Info size={36} />
          <p className="font-semibold text-secondary">No recommendations at this time.</p>
          <p className="text-sm text-center text-secondary">
            No actionable anomalies were detected that require intervention. All courses are performing within expected ranges.
          </p>
        </div>
      )}

      {/* Recommendations list */}
      {state === "success" && (
        <div className="space-y-6">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4 hover:border-purple-300 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    item.priority === "CRITICAL"
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : item.priority === "HIGH"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200"
                      : item.priority === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : "bg-surface-secondary/50 text-primary border border-border/60"
                  }`}>
                    {item.priority} PRIORITY
                  </span>
                  <span className="text-xs font-bold text-secondary">
                    Affected: {item.affected_population} student{item.affected_population !== 1 ? "s" : ""}
                  </span>
                  {item.course_code && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                      {item.course_code}
                    </span>
                  )}
                </div>

                {successId === item.id ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={14} /> Action Authorized & Deployed
                  </span>
                ) : permissions.canExecuteRecommendation ? (
                  <button
                    onClick={() => handleExecute(item.id)}
                    disabled={executingId === item.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-primary rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    <Play size={12} fill="currentColor" />
                    {executingId === item.id ? "Deploying…" : "Execute Intervention"}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-surface-secondary/50 px-3 py-1.5 rounded-xl border border-border/60">
                    <Lock size={12} /> View Only
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fact Block */}
                <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    <Database size={14} /> Fact (Verified Evidence)
                  </div>
                  {item.evidence.length > 0 ? (
                    <ul className="list-disc list-outside ml-4 text-sm text-primary font-medium space-y-2 flex-1">
                      {item.evidence.map((ev, idx) => (
                        <li key={idx} className="pl-1 leading-snug">{ev}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-secondary font-medium">No direct evidence provided.</p>
                  )}
                </div>
                
                {/* AI Interpretation Block */}
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">
                    <Brain size={14} /> AI Interpretation
                  </div>
                  <h3 className="text-sm text-amber-950 dark:text-amber-100 font-bold leading-snug">
                    {item.problem}
                  </h3>
                </div>

                {/* Recommendation Block */}
                <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 p-5 rounded-2xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                    <Sparkles size={14} /> Recommendation
                  </div>
                  <p className="text-sm text-indigo-950 dark:text-indigo-100 font-bold leading-snug">
                    {item.recommendation}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-border/60 text-secondary font-semibold">
                <span>
                  Expected Impact:{" "}
                  <strong className="text-emerald-500">{item.expected_impact}</strong>
                </span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={14} /> Backed by real DB evidence
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
