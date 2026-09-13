import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, ShieldCheck, Server, Database, CheckCircle2, AlertCircle, Loader2, LogOut, RefreshCw, Lock, Sliders, Bell } from "lucide-react";
import { Agent10API } from "../services/api";
import { getRolePermissions } from "../utils/rbac";

export default function Settings() {
  const navigate = useNavigate();
  const role = localStorage.getItem("bodhsight_role") || "Dean";
  const displayRole = localStorage.getItem("bodhsight_display_role") || role;
  const name = localStorage.getItem("bodhsight_name") || "User";
  const email = localStorage.getItem("bodhsight_email") || "—";

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const [healthStatus, setHealthStatus] = useState<"loading" | "ok" | "error">("loading");
  const [healthData, setHealthData] = useState<{ service?: string; environment?: string; agent?: string } | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const perms = getRolePermissions(role);

  const checkHealth = useCallback(() => {
    setHealthStatus("loading");
    Agent10API.getHealth()
      .then((data) => { setHealthData(data); setHealthStatus("ok"); })
      .catch(() => setHealthStatus("error"));
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm">
        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 mb-3">
          <SettingsIcon size={14} /> Agent Configuration
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">System Settings & RBAC Profile</h1>
        <p className="text-secondary text-sm mt-1">Manage session preferences and security guardrails.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session details */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <User className="text-indigo-600 dark:text-indigo-400" size={20} />
            Active Session
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-surface/40 rounded-xl border border-border/60">
              <span className="font-bold text-secondary">Authenticated User</span>
              <span className="font-bold text-primary">{name}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface/40 rounded-xl border border-border/60">
              <span className="font-bold text-secondary">Email</span>
              <span className="font-bold text-primary">{email}</span>
            </div>
            <div className="flex justify-between p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Role Code</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{role}</span>
            </div>
            <div className="flex justify-between p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Display Role</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{displayRole}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-border/60">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              <LogOut size={16} /> Sign Out of BodhSight
            </button>
          </div>
        </div>

        {/* Backend health */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Server className="text-emerald-500" size={20} />
            Backend Connection
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-surface/40 rounded-xl border border-border/60">
              <span className="font-bold text-secondary">API Base URL</span>
              <span className="font-mono text-xs text-primary">{apiBase}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className={`p-4 rounded-xl border flex items-center gap-3 flex-1 ${
                healthStatus === "ok"
                  ? "bg-emerald-500/10 border-emerald-200"
                  : healthStatus === "error"
                  ? "bg-rose-500/10 border-rose-500/20"
                  : "bg-surface/40 border-border/60"
              }`}>
                {healthStatus === "loading" && <Loader2 size={18} className="text-secondary animate-spin" />}
                {healthStatus === "ok" && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
                {healthStatus === "error" && <AlertCircle size={18} className="text-rose-600 shrink-0" />}
                <div>
                  <div className={`font-bold text-sm ${
                    healthStatus === "ok" ? "text-emerald-600 dark:text-emerald-400" : healthStatus === "error" ? "text-rose-600 dark:text-rose-400" : "text-secondary"
                  }`}>
                    {healthStatus === "loading"
                      ? "Checking connection…"
                      : healthStatus === "ok"
                      ? "Backend Connected & Healthy"
                      : "Backend Connection Failed"}
                  </div>
                  {healthData && (
                    <div className="text-xs text-emerald-500 font-medium mt-0.5">
                      {healthData.service} • {healthData.agent} • {healthData.environment}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={checkHealth}
                className="ml-3 p-2.5 rounded-xl border border-border text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
                title="Refresh health check"
              >
                <RefreshCw size={16} className={healthStatus === "loading" ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex justify-between p-3 bg-surface/40 rounded-xl border border-border/60">
              <span className="font-bold text-secondary">Data Source</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">PostgreSQL / Supabase (Live)</span>
            </div>
          </div>
        </div>

        {/* RBAC permissions */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4 md:col-span-2">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
            Role Permissions — {displayRole}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {([
              { label: "View All Departments",         granted: perms.canViewAllDepartments },
              { label: "Export Official Reports",       granted: perms.canExportOfficialReports },
              { label: "Approve Macro Interventions",   granted: perms.canApproveMacroInterventions },
              { label: "Execute Recommendations",       granted: perms.canExecuteRecommendation },
              { label: "Trigger System Audit",          granted: perms.canTriggerSystemAudit },
              { label: "Calibrate Course Difficulty",   granted: perms.canCalibrateCourseDifficulty },
              { label: "Submit Faculty Feedback",       granted: perms.canSubmitFacultyFeedback },
              { label: "Override Student Data",         granted: perms.canOverrideStudentData ?? false },
            ] as { label: string; granted: boolean }[]).map((perm) => (
              <div
                key={perm.label}
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  perm.granted
                    ? "bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-surface/40 border-border/60 opacity-50"
                }`}
              >
                {perm.granted ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <Lock size={14} className="text-secondary shrink-0" />
                )}
                <span className={`font-semibold text-xs ${ perm.granted ? "text-emerald-600 dark:text-emerald-400" : "text-secondary"}`}>
                  {perm.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent 10 Preferences (RBAC Restricted) */}
        {(role === "Chairman" || role === "Principal") && (
          <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4 md:col-span-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sliders className="text-indigo-600 dark:text-indigo-400" size={20} />
              Agent 10 Preferences
            </h2>
            <p className="text-sm text-secondary">
              As a top-level administrator, you can configure the global behavior of the BodhSight AI engine.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-xl border border-border bg-surface/40 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-primary">Anomaly Sensitivity</span>
                  <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold">Strict</span>
                </div>
                <p className="text-xs text-secondary mb-2">Dictates how aggressively Agent 10 flags anomalies in course pass rates.</p>
                <input type="range" min="1" max="100" defaultValue="70" className="w-full accent-indigo-600" />
                <div className="flex justify-between text-[10px] text-secondary font-bold px-1">
                  <span>Lenient</span>
                  <span>Strict</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface/40 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-primary">Notification Threshold</span>
                  <Bell size={16} className="text-secondary" />
                </div>
                <p className="text-xs text-secondary mb-2">Minimum severity required before sending automated alerts to HODs.</p>
                <select className="bg-surface border border-border rounded-lg text-sm p-2 text-primary focus:ring-1 focus:ring-indigo-500">
                  <option>All Anomalies</option>
                  <option>Medium and Above</option>
                  <option>High and Above</option>
                  <option selected>Critical Only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Database views */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4 md:col-span-2">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Database className="text-violet-600" size={20} />
            Data Sources (PostgreSQL Views)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { view: "assessment.v_course_performance", desc: "Course pass rates, marks, SD" },
              { view: "academics.v_offering_roster", desc: "Enrollments, sections, departments" },
              { view: "people.v_student_profile", desc: "CGPA, backlogs, student status" },
              { view: "agentops.v_open_flags", desc: "Active risk flags, anomalies" },
            ].map((item) => (
              <div key={item.view} className="p-3 bg-surface rounded-xl border border-border">
                <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{item.view}</div>
                <div className="text-xs text-secondary mt-1 font-medium">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
