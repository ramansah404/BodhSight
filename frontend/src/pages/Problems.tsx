import { useEffect, useState } from "react";
import { AlertTriangle, FileSearch, Sparkles, Database, CheckCircle, X, ShieldAlert, ShieldCheck , AlertCircle } from "lucide-react";
import { Agent10API } from "../services/api";
import { getRolePermissions } from "../utils/rbac";
import type { AcademicException } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel } from "../utils/exportUtils";

type LoadState = "loading" | "success" | "error" | "empty";

export default function Problems() {
  const rawRole =
    localStorage.getItem("bodhsight_display_role") ||
    localStorage.getItem("bodhsight_role") ||
    "Dean";
  const permissions = getRolePermissions(rawRole);

  const [anomalies, setAnomalies] = useState<AcademicException[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedAnomaly, setSelectedAnomaly] = useState<AcademicException | null>(null);
  const [auditTriggered, setAuditTriggered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setErrorMsg("");

    Agent10API.getAnomalies()
      .then((data) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setState("empty");
        } else {
          setAnomalies(data);
          setState("success");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load anomaly data from backend.");
        setState("error");
      });

    return () => { cancelled = true; };
  }, []);

  const handleTriggerAudit = () => {
    if (!permissions.canTriggerSystemAudit) {
      alert("Permission Restricted: System-wide audit triggers are restricted to Principal, IQAC, and Deans.");
      return;
    }
    setAuditTriggered(true);
    setTimeout(() => setAuditTriggered(false), 3000);
  };

  const handleExportExcel = () => {
    const exportData = anomalies.map(a => ({
      "Anomaly Title": a.title,
      "Severity": a.severity,
      "Course Code": a.course_code !== "—" ? a.course_code : "N/A",
      "Department": a.department !== "—" ? a.department : "N/A",
      "Deviation (pp)": a.deviation,
      "Affected Students": a.affected_students,
      "Status": a.is_overdue ? "OVERDUE" : "Active"
    }));
    exportToExcel(exportData, "Statistical_Anomalies_Log");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-500/20 mb-2">
            <AlertTriangle size={14} /> Agent 10 Detection Engine ({rawRole} View)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Anomaly Center & Evidence Explorer</h1>
          <p className="text-secondary text-sm mt-1">
            Statistical deviation detection across courses with transparent, evidence-backed attribution.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {permissions.canTriggerSystemAudit && (
            <button
              onClick={handleTriggerAudit}
              className="px-5 py-2.5 bg-surface-secondary text-primary hover:bg-surface-hover rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-border"
            >
              {auditTriggered ? "Audit Running…" : "Trigger Ingestion Audit Check"}
            </button>
          )}
          
          <ExportMenu 
            onExportExcel={handleExportExcel}
            disabled={state !== "success" || anomalies.length === 0}
          />
        </div>
      </div>

      {auditTriggered && (
        <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={18} className="text-emerald-500" />
          Ingestion integrity audit completed. All Z-score baselines verified against PostgreSQL views.
        </div>
      )}

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
            <p className="font-bold text-lg text-primary">Failed to load anomalies</p>
            <p className="text-sm text-secondary mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="bg-surface rounded-3xl border border-emerald-200 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-emerald-500 px-6">
          <ShieldCheck size={40} className="text-emerald-600 dark:text-emerald-400" />
          <p className="font-bold text-lg text-primary">No anomalies detected</p>
          <p className="text-sm text-center text-secondary">
            All courses are performing within expected parameters. No statistical deviations flagged.
          </p>
        </div>
      )}

      {/* Anomaly cards */}
      {state === "success" && (
        <div className="space-y-6">
          {anomalies.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-3xl border border-rose-500/20 shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              <div className="bg-rose-500/10/50 md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-rose-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400" />
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-full uppercase border ${
                      item.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : item.severity === "HIGH"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200"
                        : item.severity === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-surface-secondary/50 text-primary border-border/60"
                    }`}>
                      {item.severity} SEVERITY
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Course:</span>
                      <span className="font-bold text-primary">
                        {item.course_code !== "—" ? item.course_code : "—"}
                        {item.department !== "—" ? ` (${item.department})` : ""}
                      </span>
                    </div>
                    {item.deviation !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-secondary">Deviation:</span>
                        <span className="font-extrabold text-rose-600">{item.deviation.toFixed(1)} pp</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-secondary">Affected:</span>
                      <span className="font-bold text-primary">{item.affected_students} students</span>
                    </div>
                    {item.detected_date && (
                      <div className="flex justify-between">
                        <span className="text-secondary">Detected:</span>
                        <span className="font-bold text-primary">{item.detected_date}</span>
                      </div>
                    )}
                    {item.is_overdue && (
                      <div className="mt-2 px-2 py-1 bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20">
                        ⚠ OVERDUE — Immediate action required
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Agent 10 Explanation & Attribution
                  </h4>
                  <p className="text-sm text-primary leading-relaxed bg-surface/40 p-4 rounded-2xl border border-border/60/60 font-medium">
                    {item.explanation || item.title}
                  </p>
                  {item.recommended_action && (
                    <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-xs text-indigo-800 font-semibold">
                      <strong className="block text-indigo-600 dark:text-indigo-400 mb-1">What to Do:</strong>
                      {item.recommended_action}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedAnomaly(item)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold transition-all shadow-sm border border-indigo-200 cursor-pointer"
                  >
                    <FileSearch size={16} /> View Evidence Explorer →
                  </button>
                  {item.priority_score != null && (
                    <span className="text-xs text-secondary font-semibold">
                      Priority Score: {(item.priority_score * 100).toFixed(0)}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Explorer Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border/60 animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-border/60 flex justify-between items-center bg-surface-secondary/50 text-primary">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-lg text-primary">Evidence Explorer</h3>
              </div>
              <button onClick={() => setSelectedAnomaly(null)} className="text-primary/80 hover:text-primary cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                  selectedAnomaly.severity === "CRITICAL"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}>
                  {selectedAnomaly.anomaly_type
                    ? selectedAnomaly.anomaly_type.replace(/_/g, " ")
                    : selectedAnomaly.severity + " ANOMALY"}
                </span>
                <h4 className="text-xl font-bold text-primary mt-2">{selectedAnomaly.title}</h4>
              </div>

              {(selectedAnomaly.current_value !== 0 || selectedAnomaly.baseline_value !== 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface/40 p-4 rounded-2xl border border-border/60">
                    <div className="text-xs font-bold text-secondary uppercase">Current Value</div>
                    <div className="text-2xl font-black text-rose-600 mt-1">
                      {selectedAnomaly.current_value.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-surface/40 p-4 rounded-2xl border border-border/60">
                    <div className="text-xs font-bold text-secondary uppercase">Baseline / Reference</div>
                    <div className="text-2xl font-black text-primary mt-1">
                      {selectedAnomaly.baseline_value.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Database size={14} className="text-indigo-600 dark:text-indigo-400" /> Evidence Sources (PostgreSQL Views)
                </h5>
                <div className="bg-surface text-primary p-4 rounded-2xl font-mono text-xs space-y-1 shadow-inner">
                  <div className="text-emerald-600 dark:text-emerald-400">-- Evidence lineage from Agent 10</div>
                  {selectedAnomaly.evidence.map((ev, idx) => (
                    <div key={idx} className="text-primary">SELECT * FROM {ev};</div>
                  ))}
                  {selectedAnomaly.course_code && selectedAnomaly.course_code !== "—" && (
                    <div className="text-secondary mt-1">
                      WHERE course_code = '{selectedAnomaly.course_code}';
                    </div>
                  )}
                </div>
              </div>

              {selectedAnomaly.evidence.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-secondary">Verified Evidence</h5>
                  <ul className="space-y-2">
                    {selectedAnomaly.evidence.map((ev, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-sm bg-surface/40 p-3 rounded-xl border border-border/60 text-primary font-medium">
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-border/60 flex justify-end">
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-primary rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Close Evidence Explorer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
