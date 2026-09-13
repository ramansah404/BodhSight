import { useState, useEffect } from "react";
import { FileText, ShieldCheck, Printer, Lock, X, TrendingUp, Users, AlertTriangle, BookOpen, BarChart3, Activity, Database } from "lucide-react";
import { getRolePermissions } from "../utils/rbac";
import { useFilters } from "../contexts/FilterContext";
import { Agent10API } from "../services/api";
import type { AcademicDashboardMetrics, DepartmentPerformance } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type ReportItem = {
  id: string;
  title: string;
  type: string;
  generated_date: string;
  category: string;
  size: string;
  description: string;
};

export default function Reports() {
  const rawRole = localStorage.getItem("bodhsight_display_role") || localStorage.getItem("bodhsight_role") || "Dean";
  const permissions = getRolePermissions(rawRole);
  const { filters, activeTerm } = useFilters();

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    setMetricsLoading(true);
    Promise.allSettled([
      Agent10API.getDashboard(filters),
      Agent10API.getDepartments(filters),
    ]).then(([metricsResult, deptsResult]) => {
      if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
      if (deptsResult.status === "fulfilled") setDepartments(deptsResult.value);
      setMetricsLoading(false);
    });
  }, [filters]);

  const reports: ReportItem[] = [
    {
      id: "rep-01",
      title: "Principal & Management Executive Academic Summary",
      type: "PDF",
      generated_date: "2026-09-11",
      category: "Management",
      size: "2.4 MB",
      description: "A comprehensive high-level summary of the institution's academic performance, pass rate trajectories, department health scores, and Agent 10 anomaly detections compiled for the Principal's governance review."
    },
    {
      id: "rep-02",
      title: "Institutional Accreditation Compliance Audit",
      type: "PDF",
      generated_date: "2026-09-10",
      category: "Quality Assurance",
      size: "3.1 MB",
      description: "NAAC/NBA-aligned compliance report covering attendance metrics, pass percentages, course delivery integrity, and faculty compliance across all departments."
    },
    {
      id: "rep-03",
      title: "Agent 10 Exception & Statistical Deviation Log",
      type: "Excel",
      generated_date: "2026-09-10",
      category: "Exceptions",
      size: "840 KB",
      description: "Machine-generated log of all statistical deviations detected by Agent 10. Includes course-level pass rate drops, anomalous attendance patterns, and cross-section disparity flags with full SQL audit lineage."
    },
    {
      id: "rep-04",
      title: "Department-wise Course Priority & Intervention Plan",
      type: "Word",
      generated_date: "2026-09-09",
      category: "Interventions",
      size: "1.9 MB",
      description: "Prioritized department-by-department action plan generated from Agent 10 recommendations. Contains intervention workflows for CRITICAL and HIGH priority courses, assigned to respective HODs."
    }
  ];

  const deptChartData = departments.map((d) => ({
    name: d.department_code,
    passRate: d.pass_rate ?? 0,
    status: d.status
  }));

  const statusColor = (status: string) => {
    if (status === "INTERVENTION_REQUIRED") return "#f43f5e";
    if (status === "MONITORING") return "#f59e0b";
    return "#10b981";
  };

  const handleExportExcel = (rep: ReportItem) => {
    const exportData = [
      { "Report": rep.title, "Category": rep.category, "Date": rep.generated_date, "Type": rep.type },
      {},
      { "Metric": "Students Evaluated", "Value": metrics?.students_evaluated ?? "—" },
      { "Metric": "Pass Rate (%)", "Value": metrics?.pass_rate?.toFixed(1) ?? "—" },
      { "Metric": "Avg Marks", "Value": metrics?.average_marks?.toFixed(1) ?? "—" },
      { "Metric": "Active Anomalies", "Value": metrics?.active_anomalies ?? "—" },
      {},
      ...departments.map(d => ({ "Department": d.department_code, "Pass Rate (%)": d.pass_rate, "Status": d.status }))
    ];
    exportToExcel(exportData, `Executive_Report_${rep.id}`);
  };

  const handleExportPDF = (rep: ReportItem) => {
    const paragraphs = [
      rep.title,
      `Category: ${rep.category} | Generated: ${rep.generated_date} | Role: ${rawRole}`,
      `Academic Year: ${activeTerm || "2026-27"}`,
      "",
      "--- INSTITUTIONAL SUMMARY ---",
      `Students Evaluated: ${metrics?.students_evaluated ?? "—"}`,
      `Institutional Pass Rate: ${metrics?.pass_rate?.toFixed(1) ?? "—"}%`,
      `Average Marks: ${metrics?.average_marks?.toFixed(1) ?? "—"}`,
      `Active Problems: ${metrics?.active_anomalies ?? "—"}`,
      `Data Trust Score: ${metrics?.data_trust_score ?? "—"}/100`,
    ];
    const tableData = departments.length > 0 ? [
      ["Department", "Pass Rate (%)", "Status"],
      ...departments.map(d => [d.department_code, String(d.pass_rate ?? "—"), d.status ?? "—"])
    ] : null;
    exportToPDF(rep.title, paragraphs, tableData, `Executive_Report_${rep.id}`);
  };

  const handleExportWord = (rep: ReportItem) => {
    const paragraphs = [
      rep.title,
      `Category: ${rep.category} | Generated: ${rep.generated_date} | Role: ${rawRole}`,
      `Academic Year: ${activeTerm || "2026-27"}`,
      "",
      "--- INSTITUTIONAL SUMMARY ---",
      `Students Evaluated: ${metrics?.students_evaluated ?? "—"}`,
      `Institutional Pass Rate: ${metrics?.pass_rate?.toFixed(1) ?? "—"}%`,
      `Average Marks: ${metrics?.average_marks?.toFixed(1) ?? "—"}`,
      `Active Problems: ${metrics?.active_anomalies ?? "—"}`,
      `Data Trust Score: ${metrics?.data_trust_score ?? "—"}/100`,
    ];
    const tableData = departments.length > 0 ? [
      ["Department", "Pass Rate (%)", "Status"],
      ...departments.map(d => [d.department_code, String(d.pass_rate ?? "—"), d.status ?? "—"])
    ] : null;
    exportToWord(rep.title, paragraphs, tableData, `Executive_Report_${rep.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="reports-content">
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-500/20">
            <FileText size={14} /> Executive Reporting Suite ({rawRole} View)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Academic Performance Reports</h1>
          <p className="text-secondary text-sm">
            {permissions.canExportOfficialReports
              ? "Review live dashboard data and export the current scoped view. The report catalog below is a set of available report templates, not a backend-generated report list."
              : "Your current role is restricted from exporting institutional master views."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={18} className="text-emerald-500" />
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Live scoped data</div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
            <Database size={12} className="text-indigo-400" />
            <span className="text-xs text-indigo-400 font-semibold">Current API response</span>
          </div>
        </div>
      </div>

      {/* Live KPI Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Students Evaluated", value: metricsLoading ? "…" : (metrics?.students_evaluated?.toLocaleString() ?? "—"), icon: <Users size={16} />, color: "indigo" },
          { label: "Pass Rate", value: metricsLoading ? "…" : (metrics?.pass_rate != null ? `${metrics.pass_rate.toFixed(1)}%` : "—"), icon: <TrendingUp size={16} />, color: "emerald" },
          { label: "Avg Marks", value: metricsLoading ? "…" : (metrics?.average_marks?.toFixed(1) ?? "—"), icon: <BookOpen size={16} />, color: "blue" },
          { label: "Active Anomalies", value: metricsLoading ? "…" : ((metrics?.active_anomalies ?? metrics?.significant_deviations) ?? "—"), icon: <AlertTriangle size={16} />, color: "rose" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-surface rounded-2xl border border-border/60 p-4 shadow-sm`}>
            <div className={`text-xs font-bold uppercase text-secondary mb-1`}>{kpi.label}</div>
            <div className={`text-2xl font-black text-${kpi.color}-600 dark:text-${kpi.color}-400`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Department Chart */}
      {deptChartData.length > 0 && (
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" />
            Department Pass Rate Overview (Live Data)
          </h2>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc" }}
                  formatter={(val) => [`${Number(val ?? 0).toFixed(1)}%`, "Pass Rate"]}
                />
                <Bar dataKey="passRate" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {deptChartData.map((entry, index) => (
                    <Cell key={index} fill={statusColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-end">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-secondary font-medium">Normal</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-xs text-secondary font-medium">Monitoring</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-xs text-secondary font-medium">Intervention Required</span></div>
          </div>
        </div>
      )}

      {/* Report Cards */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Printer className="text-indigo-500" size={20} /> Available Report Views
          </h2>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${permissions.canExportOfficialReports ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"}`}>
            {permissions.canExportOfficialReports ? "Export Authorized" : "Restricted Access"}
          </span>
        </div>

        <div className="space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-surface-secondary rounded-2xl p-5 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-extrabold rounded-md uppercase border border-indigo-500/20">
                    {rep.type}
                  </span>
                  <span className="text-xs font-bold text-secondary">{rep.category}</span>
                  <span className="text-xs text-secondary/60 font-medium">• Export current scope on request</span>
                </div>
                <h3 className="font-bold text-primary text-base">{rep.title}</h3>
                <p className="text-xs text-secondary">{rep.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedReport(rep)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                >
                  View Template
                </button>
                {permissions.canExportOfficialReports ? (
                  <ExportMenu
                    onExportExcel={() => handleExportExcel(rep)}
                    onExportPDF={() => handleExportPDF(rep)}
                    onExportWord={() => handleExportWord(rep)}
                  />
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-surface px-4 py-2.5 rounded-xl border border-border">
                    <Lock size={14} /> Restricted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-3xl border border-border/60 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-border/60 flex justify-between items-start bg-indigo-500/5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold rounded-md uppercase border border-indigo-500/20">
                    {selectedReport.type}
                  </span>
                  <span className="text-xs font-bold text-secondary">{selectedReport.category}</span>
                </div>
                <h2 className="text-xl font-extrabold text-primary">{selectedReport.title}</h2>
                <p className="text-sm text-secondary mt-1">{selectedReport.description}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-secondary hover:text-primary transition-colors shrink-0 ml-4 p-1"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Live Data Section */}
              <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-3 flex items-center gap-2">
                  <Activity size={14} /> Live Institutional Data (Current API response)
                </h3>
                {metricsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-surface-secondary/50 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-indigo-500 uppercase mb-1">Students</div>
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{metrics?.students_evaluated?.toLocaleString() ?? "—"}</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">evaluated</div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-emerald-500 uppercase mb-1">Pass Rate</div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics?.pass_rate?.toFixed(1) ?? "—"}%</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">institution-wide</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-blue-500 uppercase mb-1">Avg Marks</div>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics?.average_marks?.toFixed(1) ?? "—"}</div>
                      <div className="text-[10px] text-blue-400 mt-0.5">out of 100</div>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-rose-500 uppercase mb-1">Anomalies</div>
                      <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics?.active_anomalies ?? metrics?.significant_deviations ?? "—"}</div>
                      <div className="text-[10px] text-rose-400 mt-0.5">flagged by Agent 10</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Department Breakdown */}
              {departments.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-3 flex items-center gap-2">
                    <BarChart3 size={14} /> Department Breakdown
                  </h3>
                  <div className="space-y-2">
                    {departments.map((d) => (
                      <div key={d.department_code} className="flex items-center gap-3">
                        <div className="w-16 text-xs font-bold text-primary shrink-0">{d.department_code}</div>
                        <div className="flex-1 h-6 bg-surface-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${d.pass_rate ?? 0}%`,
                              background: d.status === "INTERVENTION_REQUIRED" ? "#f43f5e" : d.status === "MONITORING" ? "#f59e0b" : "#10b981"
                            }}
                          />
                        </div>
                        <div className="w-14 text-xs font-bold text-primary text-right shrink-0">{d.pass_rate?.toFixed(1) ?? "—"}%</div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          d.status === "INTERVENTION_REQUIRED" ? "bg-rose-500/10 text-rose-500" :
                          d.status === "MONITORING" ? "bg-amber-500/10 text-amber-500" :
                          "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {d.status === "INTERVENTION_REQUIRED" ? "⚠ CRITICAL" : d.status === "MONITORING" ? "⚡ WATCH" : "✓ OK"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Metadata */}
              <div className="bg-surface-secondary rounded-2xl p-5 border border-border space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-2">Report Metadata</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-secondary font-medium">Generated On</div>
                  <div className="font-bold text-primary">{selectedReport.generated_date}</div>
                  <div className="text-secondary font-medium">File Format</div>
                  <div className="font-bold text-primary">{selectedReport.type}</div>
                  <div className="text-secondary font-medium">File Size</div>
                  <div className="font-bold text-primary">{selectedReport.size}</div>
                  <div className="text-secondary font-medium">Viewing As</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{rawRole}</div>
                  <div className="text-secondary font-medium">Data Source</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">Live PostgreSQL (Supabase)</div>
                  <div className="text-secondary font-medium">Trust Score</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{metrics?.data_trust_score ?? "—"}/100</div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-secondary hover:text-primary transition-colors"
                >
                  Close
                </button>
                {permissions.canExportOfficialReports && (
                  <ExportMenu
                    onExportExcel={() => handleExportExcel(selectedReport)}
                    onExportPDF={() => handleExportPDF(selectedReport)}
                    onExportWord={() => handleExportWord(selectedReport)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
