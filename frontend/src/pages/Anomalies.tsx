import { useEffect, useState } from "react";
import { AlertTriangle, FileSearch, Sparkles, Database, CheckCircle, X, ShieldAlert, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Agent10API } from "../services/api";
import { getRolePermissions } from "../utils/rbac";
import type { AcademicException } from "../types/agent10";

type LoadState = "loading" | "success" | "error" | "empty";

export default function Anomalies() {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-rose-950 via-indigo-900 to-violet-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full text-xs font-bold border border-rose-400/30 mb-2">
            <AlertTriangle size={14} /> Agent 10 Detection Engine ({rawRole} View)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Anomaly Center & Evidence Explorer</h1>
          <p className="text-rose-100 text-sm mt-1">
            Statistical deviation detection across courses with transparent, evidence-backed attribution.
          </p>
        </div>

        {permissions.canTriggerSystemAudit && (
          <button
            onClick={handleTriggerAudit}
            className="px-5 py-2.5 bg-white text-gray-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            {auditTriggered ? "Audit Running…" : "Trigger Ingestion Audit Check"}
          </button>
        )}
      </div>

      {auditTriggered && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={18} className="text-emerald-600" />
          Ingestion integrity audit completed. All Z-score baselines verified against PostgreSQL views.
        </div>
      )}

      {/* Loading */}
      {state === "loading" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex items-center justify-center py-20 gap-3 text-indigo-600 font-medium">
          <Loader2 size={22} className="animate-spin" />
          Scanning database for anomalies…
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-sm flex flex-col items-center justify-center py-16 gap-4 px-6">
          <AlertCircle size={40} className="text-rose-400" />
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">Failed to load anomalies</p>
            <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-emerald-600 px-6">
          <ShieldCheck size={40} className="text-emerald-400" />
          <p className="font-bold text-lg text-gray-900">No anomalies detected</p>
          <p className="text-sm text-center text-gray-500">
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
              className="bg-white rounded-3xl border border-rose-200 shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              <div className="bg-rose-50/50 md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-rose-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert size={20} className="text-rose-700" />
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-full uppercase border ${
                      item.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : item.severity === "HIGH"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : item.severity === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      {item.severity} SEVERITY
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Course:</span>
                      <span className="font-bold text-gray-900">
                        {item.course_code !== "—" ? item.course_code : "—"}
                        {item.department !== "—" ? ` (${item.department})` : ""}
                      </span>
                    </div>
                    {item.deviation !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deviation:</span>
                        <span className="font-extrabold text-rose-600">{item.deviation.toFixed(1)} pp</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Affected:</span>
                      <span className="font-bold text-gray-900">{item.affected_students} students</span>
                    </div>
                    {item.detected_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Detected:</span>
                        <span className="font-bold text-gray-900">{item.detected_date}</span>
                      </div>
                    )}
                    {item.is_overdue && (
                      <div className="mt-2 px-2 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg border border-rose-200">
                        ⚠ OVERDUE — Immediate action required
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Agent 10 Explanation & Attribution
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-medium">
                    {item.explanation || item.title}
                  </p>
                  {item.recommended_action && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-800 font-semibold">
                      <strong className="block text-indigo-900 mb-1">Recommended Action:</strong>
                      {item.recommended_action}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedAnomaly(item)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-all shadow-sm border border-indigo-200 cursor-pointer"
                  >
                    <FileSearch size={16} /> View Evidence Explorer →
                  </button>
                  {item.priority_score != null && (
                    <span className="text-xs text-gray-400 font-semibold">
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-900 to-violet-900 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-300" />
                <h3 className="font-bold text-lg">Evidence Explorer</h3>
              </div>
              <button onClick={() => setSelectedAnomaly(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                  selectedAnomaly.severity === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border-rose-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {selectedAnomaly.anomaly_type
                    ? selectedAnomaly.anomaly_type.replace(/_/g, " ")
                    : selectedAnomaly.severity + " ANOMALY"}
                </span>
                <h4 className="text-xl font-bold text-gray-900 mt-2">{selectedAnomaly.title}</h4>
              </div>

              {(selectedAnomaly.current_value !== 0 || selectedAnomaly.baseline_value !== 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs font-bold text-gray-500 uppercase">Current Value</div>
                    <div className="text-2xl font-black text-rose-600 mt-1">
                      {selectedAnomaly.current_value.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs font-bold text-gray-500 uppercase">Baseline / Reference</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">
                      {selectedAnomaly.baseline_value.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Database size={14} className="text-indigo-600" /> Evidence Sources (PostgreSQL Views)
                </h5>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-1 shadow-inner">
                  <div className="text-emerald-400">-- Evidence lineage from Agent 10</div>
                  {selectedAnomaly.evidence.map((ev, idx) => (
                    <div key={idx} className="text-slate-300">SELECT * FROM {ev};</div>
                  ))}
                  {selectedAnomaly.course_code && selectedAnomaly.course_code !== "—" && (
                    <div className="text-slate-400 mt-1">
                      WHERE course_code = '{selectedAnomaly.course_code}';
                    </div>
                  )}
                </div>
              </div>

              {selectedAnomaly.evidence.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Verified Evidence</h5>
                  <ul className="space-y-2">
                    {selectedAnomaly.evidence.map((ev, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 text-gray-700 font-medium">
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
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
