import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users, AlertTriangle, ShieldCheck, Sparkles,
  BookOpen, ChevronRight, Activity, Building2, Award, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Agent10API } from "../services/api";
import type { AcademicDashboardMetrics, DepartmentPerformance } from "../types/agent10";

export default function Dashboard() {
  const { currentRole } = useOutletContext<{ currentRole: string }>();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState("");

  const displayRole = localStorage.getItem("bodhsight_display_role") || currentRole;
  const displayName = localStorage.getItem("bodhsight_name") || `${currentRole} User`;

  useEffect(() => {
    let cancelled = false;
    setMetricsLoading(true);
    setMetricsError("");

    Promise.allSettled([
      Agent10API.getDashboard(),
      Agent10API.getDepartments(),
    ]).then(([metricsResult, deptsResult]) => {
      if (cancelled) return;

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      } else {
        setMetricsError("Failed to load dashboard metrics from backend.");
      }

      if (deptsResult.status === "fulfilled" && deptsResult.value.length > 0) {
        setDepartments(deptsResult.value);
      }

      setMetricsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Build chart data from real dept data
  const deptChartData = departments.map((d) => ({
    name: d.department_code,
    passRate: d.pass_rate ?? 0,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 mb-2">
            {displayRole === "Principal" || displayRole === "Management" ? (
              <Award size={14} />
            ) : currentRole === "HOD" ? (
              <Building2 size={14} />
            ) : (
              <BookOpen size={14} />
            )}
            Authenticated as {displayName}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {currentRole === "Dean"
              ? "Institutional Macro Governance Dashboard"
              : currentRole === "HOD"
              ? "Departmental Command Center"
              : "Course Instructor & Telemetry Portal"}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {currentRole === "Dean"
              ? "University-wide academic health, ingestion trust audits, and strategic exceptions."
              : currentRole === "HOD"
              ? "Departmental pass percentages, faculty course distribution, and section disparities."
              : "Assigned course telemetry, formative assessment tracking, and student support."}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <ShieldCheck className="text-emerald-600" size={20} />
          <div className="text-sm font-bold text-emerald-800">
            RBAC Secure
            {metrics && (
              <span className="text-emerald-600 font-normal ml-1">
                • Trust Score: {metrics.data_trust_score}/100
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {metricsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : metricsError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 font-medium text-sm">
          ⚠ {metricsError} — Check backend connection at{" "}
          {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Students Evaluated</div>
              <Users size={16} className="text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">
              {metrics.students_evaluated.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">
              {metrics.total_students
                ? `of ${metrics.total_students.toLocaleString()} registered`
                : "Institutional active scope"}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Pass Rate</div>
              <Activity size={16} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">{metrics.pass_rate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 font-medium mt-1">
              Failure rate: {metrics.failure_rate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Average Marks</div>
              <BookOpen size={16} className="text-blue-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">
              {metrics.average_marks.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">
              {metrics.average_gpa != null
                ? `CGPA: ${metrics.average_gpa.toFixed(2)}`
                : "CGPA: not available in views"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-3xl border border-rose-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
            <div className="flex justify-between items-start relative z-10">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Active Anomalies</div>
              <AlertTriangle size={16} className="text-rose-600" />
            </div>
            <div className="text-3xl font-black text-rose-700 mt-2 relative z-10">
              {metrics.active_anomalies ?? metrics.significant_deviations}
            </div>
            <div className="text-xs text-rose-600 font-bold mt-1 relative z-10">
              Requires administrative attention
            </div>
          </div>
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pass rate gauge card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Department Pass Rate Comparison</h2>
          {deptChartData.length > 0 ? (
            <div style={{ width: "100%", height: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#4b5563", fontWeight: "bold", fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                  <Bar
                    dataKey="passRate"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                    name="Pass Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : metricsLoading ? (
            <div className="h-72 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" /> Loading department data…
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400 font-medium">
              No department data available.
            </div>
          )}
        </div>

        {/* Courses analyzed sidebar */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {currentRole === "HOD" ? "Department Summary" : "Institutional Scope"}
          </h2>
          {metrics ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Courses Analyzed</div>
                <div className="text-2xl font-black text-indigo-700">{metrics.courses_analyzed ?? "—"}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Data Source</div>
                <div className="text-sm font-bold text-gray-700 capitalize">
                  {metrics.data_source === "database" ? "✅ Live Database" : metrics.data_source}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-700 uppercase mb-1">Trust Score</div>
                <div className="text-2xl font-black text-emerald-700">{metrics.data_trust_score}%</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Verified from PostgreSQL views</div>
              </div>
              {departments.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">Departments Active</div>
                  <div className="flex flex-wrap gap-1.5">
                    {departments.map((d) => (
                      <span
                        key={d.department_code}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          d.status === "INTERVENTION_REQUIRED"
                            ? "bg-rose-100 text-rose-700 border-rose-200"
                            : d.status === "MONITORING"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {d.department_code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent 10 Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-100">
          <Sparkles className="text-indigo-400" size={20} />
          Agent 10 Quick Navigation ({displayRole} Scope)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate("/anomalies")}
            className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all group"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-rose-200 transition-colors">
                  View Anomaly Center
                </p>
                <p className="text-xs text-indigo-200/70 mt-1">
                  {metrics?.active_anomalies
                    ? `${metrics.active_anomalies} active anomalie${metrics.active_anomalies !== 1 ? "s" : ""} detected`
                    : "Statistical deviations from database"}
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate("/recommendations")}
            className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all group"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors">
                  Intervention Recommendations
                </p>
                <p className="text-xs text-indigo-200/70 mt-1">Deploy prioritized remediation actions</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate("/courses")}
            className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all group flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <Activity className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                  Course Performance Audit
                </p>
                <p className="text-xs text-indigo-200/70 mt-1">
                  {metrics?.courses_analyzed
                    ? `${metrics.courses_analyzed} sections analyzed`
                    : "Real-time course telemetry"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
