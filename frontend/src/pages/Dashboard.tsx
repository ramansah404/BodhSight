import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users, AlertTriangle, ShieldCheck, Sparkles,
  BookOpen, ChevronRight, Activity, Building2, Award, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFilters } from "../contexts/FilterContext";
import { Agent10API } from "../services/api";
import type { AcademicDashboardMetrics, DepartmentPerformance } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";

export default function Dashboard() {
  const { filters } = useFilters();
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
      Agent10API.getDashboard(filters),
      Agent10API.getDepartments(filters),
    ]).then(([metricsResult, deptsResult]) => {
      if (cancelled) return;

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      } else {
        const err = metricsResult.reason;
        const msg = err?.response?.data?.detail || err?.message || String(err);
        setMetricsError(`Failed to load dashboard metrics from backend: ${msg}`);
      }

      if (deptsResult.status === "fulfilled" && deptsResult.value.length > 0) {
        setDepartments(deptsResult.value);
      }

      setMetricsLoading(false);

      // Silently warm the cache for adjacent tabs after dashboard renders
      if (!cancelled) {
        Agent10API.prefetchDashboardData(filters);
      }
    });

    return () => { cancelled = true; };
  }, [filters]);

  const deptChartData = departments.map((d) => ({
    name: d.department_code,
    passRate: d.pass_rate ?? 0,
    status: d.status
  }));

  const handleExportExcel = () => {
    // Generate institutional summary data
    const summaryData = [{
      "Metric": "Students Evaluated",
      "Value": metrics?.students_evaluated || 0
    }, {
      "Metric": "Total Students",
      "Value": metrics?.total_students || 0
    }, {
      "Metric": "Pass Rate (%)",
      "Value": metrics?.pass_rate || 0
    }, {
      "Metric": "Average Marks",
      "Value": metrics?.average_marks || 0
    }, {
      "Metric": "Active Problems",
      "Value": metrics?.active_anomalies || metrics?.significant_deviations || 0
    }];
    
    // Generate department data
    const deptData = departments.map(d => ({
      "Department": d.department_code,
      "Pass Rate (%)": d.pass_rate || 0,
      "Status": d.status
    }));

    exportToExcel([...summaryData, {}, ...deptData], "Institutional_Overview_Dashboard");
  };

  const handleExportPDF = () => {
    exportToPDF("dashboard-content", "Institutional_Overview_Report", `BodhSight Executive Overview - ${currentRole}`);
  };

  const handleExportWord = () => {
    const paragraphs = [
      `Institutional Macro Governance Report`,
      `Students Evaluated: ${metrics?.students_evaluated || 0} (out of ${metrics?.total_students || 0})`,
      `Institutional Pass Rate: ${metrics?.pass_rate?.toFixed(1) || 0}%`,
      `Average Marks: ${metrics?.average_marks?.toFixed(1) || 0}`,
      `Active Problems Requiring Attention: ${metrics?.active_anomalies || metrics?.significant_deviations || 0}`
    ];
    
    const tableData = [
      ["Department", "Pass Rate (%)", "Status"],
      ...departments.map(d => [d.department_code, String(d.pass_rate), d.status])
    ];

    exportToWord(`BodhSight Executive Overview - ${currentRole}`, paragraphs, tableData, "Institutional_Overview_Report");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="dashboard-content">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-surface p-6 rounded-3xl border border-border/60 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20 mb-3">
            {displayRole === "Principal" || displayRole === "Management" ? (
              <Award size={14} />
            ) : currentRole === "HOD" ? (
              <Building2 size={14} />
            ) : (
              <BookOpen size={14} />
            )}
            Authenticated as {displayName}
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {currentRole === "Dean"
              ? "Institutional Macro Governance"
              : currentRole === "HOD"
              ? "Departmental Command Center"
              : "Course Instructor Telemetry"}
          </h1>
          <p className="text-secondary font-medium mt-1">
            {currentRole === "Dean"
              ? "University-wide academic health, trust audits, and strategic exceptions."
              : currentRole === "HOD"
              ? "Departmental pass percentages, faculty distribution, and section disparities."
              : "Assigned course telemetry, formative assessment tracking, and student support."}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="text-emerald-500 dark:text-emerald-400" size={20} />
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              RBAC Secure
              {metrics && (
                <span className="text-emerald-700 dark:text-emerald-500 font-normal ml-1">
                  • Trust Score: {metrics.data_trust_score}/100
                </span>
              )}
            </div>
          </div>
          
          <ExportMenu 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
            disabled={metricsLoading || !!metricsError}
          />
        </div>
      </div>

      {/* KPI Cards */}
      {metricsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm animate-pulse">
              <div className="h-3 bg-surface-secondary rounded w-3/4 mb-4" />
              <div className="h-8 bg-surface-secondary rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-secondary/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : metricsError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-600 dark:text-rose-400 font-medium text-sm">
          ⚠ {metricsError} — Check backend connection at{" "}
          {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface hover:bg-surface/80 transition-colors p-6 rounded-3xl border border-border/60 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-secondary">Students Evaluated</div>
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-primary mt-3">
              {metrics.students_evaluated.toLocaleString()}
            </div>
            <div className="text-xs text-secondary font-medium mt-1">
              {metrics.total_students
                ? `of ${metrics.total_students.toLocaleString()} registered`
                : "Institutional active scope"}
            </div>
          </div>

          <div className="bg-surface hover:bg-surface/80 transition-colors p-6 rounded-3xl border border-border/60 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-secondary">Pass Rate</div>
              <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-primary mt-3">{metrics.pass_rate.toFixed(1)}%</div>
            <div className="text-xs text-secondary font-medium mt-1">
              Failure rate: {metrics.failure_rate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-surface hover:bg-surface/80 transition-colors p-6 rounded-3xl border border-border/60 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-secondary">Average Marks</div>
              <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-primary mt-3">
              {metrics.average_marks.toFixed(1)}
            </div>
            <div className="text-xs text-secondary font-medium mt-1">
              {metrics.average_gpa != null
                ? `CGPA: ${metrics.average_gpa.toFixed(2)}`
                : "CGPA: not available in views"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface to-surface/80 p-6 rounded-3xl border border-rose-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Active Problems</div>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-primary mt-3 relative z-10">
              {metrics.active_anomalies ?? metrics.significant_deviations}
            </div>
            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 relative z-10">
              Requires administrative attention
            </div>
          </div>
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pass rate gauge card */}
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-border/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-6">Department Pass Rate Comparison</h2>
          {deptChartData.length > 0 ? (
            <div style={{ width: "100%", height: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontWeight: "600", fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: "#1e293b" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc" }}
                  />
                  <Bar
                    dataKey="passRate"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                    name="Pass Rate %"
                  >
                    {deptChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.status === 'INTERVENTION_REQUIRED' ? '#ef4444' : entry.status === 'MONITORING' ? '#f59e0b' : '#6366f1'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : metricsLoading ? (
            <div className="h-72 flex items-center justify-center gap-2 text-secondary">
              <Loader2 size={18} className="animate-spin" /> Loading department data…
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-secondary font-medium">
              No department data available.
            </div>
          )}
        </div>

        {/* Courses analyzed sidebar */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-4">
            {currentRole === "HOD" ? "Department Summary" : "College Overview"}
          </h2>
          {metrics ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <div className="text-xs font-bold text-secondary uppercase mb-1">Courses Analyzed</div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.courses_analyzed ?? "—"}</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <div className="text-xs font-bold text-secondary uppercase mb-1">Data Source</div>
                <div className="text-sm font-bold text-primary capitalize">
                  {metrics.data_source === "database" ? "✅ Live Database" : metrics.data_source}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-500 uppercase mb-1">Trust Score</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.data_trust_score}%</div>
                <div className="text-xs text-emerald-500/70 font-medium mt-1">Verified from PostgreSQL views</div>
              </div>
              {departments.length > 0 && (
                <div className="p-4 rounded-2xl bg-surface border border-border">
                  <div className="text-xs font-bold text-secondary uppercase mb-3">Departments Active</div>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((d) => (
                      <span
                        key={d.department_code}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          d.status === "INTERVENTION_REQUIRED"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : d.status === "MONITORING"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
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
                <div key={i} className="h-20 bg-surface-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent 10 Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-indigo-950/40 to-surface rounded-3xl p-6 border border-border/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary relative z-10">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
          Agent 10 Quick Navigation ({displayRole} Scope)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div
            onClick={() => navigate("/anomalies")}
            className="bg-surface/60 hover:bg-surface-secondary border border-border hover:border-border rounded-2xl p-4 cursor-pointer transition-all group"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-primary group-hover:text-rose-300 transition-colors">
                  View Anomaly Center
                </p>
                <p className="text-xs text-secondary mt-1">
                  {metrics?.active_anomalies
                    ? `${metrics.active_anomalies} active anomalie${metrics.active_anomalies !== 1 ? "s" : ""} detected`
                    : "Statistical deviations from database"}
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate("/recommendations")}
            className="bg-surface/60 hover:bg-surface-secondary border border-border hover:border-border rounded-2xl p-4 cursor-pointer transition-all group"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-primary group-hover:text-emerald-300 transition-colors">
                  Intervention Recommendations
                </p>
                <p className="text-xs text-secondary mt-1">Deploy prioritized remediation actions</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate("/courses")}
            className="bg-surface/60 hover:bg-surface-secondary border border-border hover:border-border rounded-2xl p-4 cursor-pointer transition-all group flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <Activity className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-primary group-hover:text-amber-300 transition-colors">
                  Course Performance Audit
                </p>
                <p className="text-xs text-secondary mt-1">
                  {metrics?.courses_analyzed
                    ? `${metrics.courses_analyzed} sections analyzed`
                    : "Real-time course telemetry"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
