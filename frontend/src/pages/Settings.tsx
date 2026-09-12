import { useEffect, useState } from "react";
import { Settings as SettingsIcon, User, ShieldCheck, Server, Database, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Agent10API } from "../services/api";

export default function Settings() {
  const role = localStorage.getItem("bodhsight_role") || "Dean";
  const displayRole = localStorage.getItem("bodhsight_display_role") || role;
  const name = localStorage.getItem("bodhsight_name") || "User";
  const email = localStorage.getItem("bodhsight_email") || "—";

  const [healthStatus, setHealthStatus] = useState<"loading" | "ok" | "error">("loading");
  const [healthData, setHealthData] = useState<{ service?: string; environment?: string; agent?: string } | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

  useEffect(() => {
    Agent10API.getHealth()
      .then((data) => {
        setHealthData(data);
        setHealthStatus("ok");
      })
      .catch(() => {
        setHealthStatus("error");
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-surface via-indigo-950 to-slate-950 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-400/30 mb-3">
          <SettingsIcon size={14} /> Agent Configuration
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Settings & RBAC Profile</h1>
        <p className="text-primary text-sm mt-1">Manage session preferences and security guardrails.</p>
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
          <div className="pt-2 border-t border-border/60">
            <p className="text-xs text-secondary font-medium">
              Session is stored in localStorage. No JWT tokens are used.
              Role determines RBAC permissions for all UI actions.
            </p>
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

            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
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
            Role Permissions ({role})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Approve Macro Interventions", roles: ["Dean", "Principal", "Management"] },
              { label: "View All Departments", roles: ["Dean", "Principal", "Management", "IQAC"] },
              { label: "Export Official Reports", roles: ["Dean", "Principal", "Management", "IQAC"] },
              { label: "Trigger System Audit", roles: ["Dean", "Principal", "Management", "IQAC"] },
              { label: "Calibrate Course Difficulty", roles: ["Dean", "Principal", "Management", "HOD"] },
              { label: "Execute Recommendations", roles: ["Dean", "Principal", "Management", "HOD"] },
              { label: "Submit Faculty Feedback", roles: ["HOD", "Faculty"] },
            ].map((perm) => {
              const hasPermission = perm.roles.includes(role);
              return (
                <div
                  key={perm.label}
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    hasPermission
                      ? "bg-emerald-500/10 border-emerald-200"
                      : "bg-surface/40 border-border/60 opacity-60"
                  }`}
                >
                  {hasPermission ? (
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-border shrink-0" />
                  )}
                  <span className={`font-semibold ${hasPermission ? "text-emerald-600 dark:text-emerald-400" : "text-secondary"}`}>
                    {perm.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

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
