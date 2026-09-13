import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, ShieldCheck, Server, Database, CheckCircle2, AlertCircle, Loader2, LogOut, RefreshCw, Lock, Sliders, Bell, Camera, Save } from "lucide-react";
import { Agent10API, ProfileAPI, AuthAPI } from "../services/api";
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
  
  const [profileData, setProfileData] = useState<{ full_name: string; phone_number: string; profile_image_url?: string } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await ProfileAPI.getProfile(email);
      if (res.success) {
        setProfileData({
          full_name: res.full_name,
          phone_number: res.phone_number || "",
          profile_image_url: res.profile_image_url
        });
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  }, [email]);

  const handleProfileSave = async () => {
    if (!profileData) return;
    setProfileSaving(true);
    try {
      const res = await ProfileAPI.updateProfile({
        identifier: email,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number
      });
      if (res.success) {
        setIsEditingProfile(false);
        localStorage.setItem("bodhsight_name", res.full_name);
      }
    } catch (e) {
      console.error("Failed to update profile", e);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await ProfileAPI.uploadImage(email, file);
      if (res.success) {
        setProfileData(prev => prev ? { ...prev, profile_image_url: res.profile_image_url } : null);
      }
    } catch (err) {
      console.error("Failed to upload image", err);
    }
  };
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const enable = !twoFactorEnabled;
      const res = await AuthAPI.toggle2fa({ identifier: email, enable });
      if (res.success) {
        setTwoFactorEnabled(enable);
      }
    } catch (e) {
      console.error("Failed to toggle 2FA", e);
    } finally {
      setToggling2FA(false);
    }
  };

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
    fetchProfile();
  }, [checkHealth, fetchProfile]);

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
        {/* Profile Management */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <User className="text-indigo-600 dark:text-indigo-400" size={20} />
              Profile Management
            </h2>
            {!isEditingProfile ? (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
              >
                {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 overflow-hidden bg-surface-secondary flex items-center justify-center">
                {profileData?.profile_image_url ? (
                  <img src={`${apiBase.replace("/api/v1", "")}${profileData.profile_image_url}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-secondary" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-colors"
                title="Change Avatar"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-surface/40 rounded-xl border border-border/60">
              <span className="font-bold text-secondary w-1/3">Full Name</span>
              {isEditingProfile ? (
                <input 
                  type="text"
                  value={profileData?.full_name || ""}
                  onChange={(e) => setProfileData(p => p ? {...p, full_name: e.target.value} : null)}
                  className="w-2/3 bg-background border border-border rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <span className="font-bold text-primary">{profileData?.full_name || name}</span>
              )}
            </div>
            <div className="flex justify-between items-center p-3 bg-surface/40 rounded-xl border border-border/60">
              <span className="font-bold text-secondary w-1/3">Phone Number</span>
              {isEditingProfile ? (
                <input 
                  type="text"
                  value={profileData?.phone_number || ""}
                  onChange={(e) => setProfileData(p => p ? {...p, phone_number: e.target.value} : null)}
                  className="w-2/3 bg-background border border-border rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <span className="font-bold text-primary">{profileData?.phone_number || "—"}</span>
              )}
            </div>
            <div className="flex justify-between p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Email</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{email}</span>
            </div>
            <div className="flex justify-between p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Role</span>
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

        {/* Communication & Notifications */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Bell className="text-amber-500" size={20} />
            Communication & Notifications
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-surface/40 rounded-xl border border-border/60">
              <div>
                <span className="font-bold text-secondary block">Email Alerts</span>
                <span className="text-xs text-secondary opacity-80">Weekly summaries & Actions</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface/40 rounded-xl border border-border/60">
              <div>
                <span className="font-bold text-secondary block">Two-Step Verification (2FA)</span>
                <span className="text-xs text-secondary opacity-80">Require an OTP after password to log in</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={twoFactorEnabled} 
                  onChange={handleToggle2FA}
                  disabled={toggling2FA}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-surface/40 rounded-xl border border-border/60">
              <div>
                <span className="font-bold text-secondary block">WhatsApp Notifications</span>
                <span className="text-xs text-secondary opacity-80">Urgent Anomalies & Auth OTPs</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mt-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Active Integrations</span>
              <div className="flex gap-2">
                <span className="bg-surface text-xs font-bold px-2 py-1 rounded border border-border">SendGrid</span>
                <span className="bg-surface text-xs font-bold px-2 py-1 rounded border border-border">Twilio WhatsApp</span>
              </div>
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
              { label: "Calibrate Course Difficulty",   granted: perms.canCalibrateDifficulty },
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
