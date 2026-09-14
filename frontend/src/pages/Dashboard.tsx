import { useEffect, useState, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users, AlertTriangle, ShieldCheck, Sparkles,
  BookOpen, ChevronRight, Activity, Building2, Award, Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useFilters } from "../contexts/FilterContext";
import { Agent10API } from "../services/api";
import type { AcademicDashboardMetrics, DepartmentPerformance, CoursePerformance } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";
import CondonationWidget from "../components/dashboard/CondonationWidget";
import StudentDrilldownModal from "../components/ui/StudentDrilldownModal";

export default function Dashboard() {
  const { filters } = useFilters();
  const { currentRole } = useOutletContext<{ currentRole: string }>();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [courses, setCourses] = useState<CoursePerformance[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState("");
  
  // Drill-down state
  const [drilldown, setDrilldown] = useState<{ isOpen: boolean; context: string; title: string }>({
    isOpen: false,
    context: "",
    title: "",
  });

  const displayRole = localStorage.getItem("bodhsight_display_role") || currentRole;
  const displayName = localStorage.getItem("bodhsight_name") || `${currentRole} User`;
  const prevFilterKey = useRef(`${filters.department}-${filters.semester}-${filters.programme}`);

  useEffect(() => {
    let cancelled = false;
    const currentFilterKey = `${filters.department}-${filters.semester}-${filters.programme}`;
    const isUserChange = currentFilterKey !== prevFilterKey.current;
    prevFilterKey.current = currentFilterKey;
    
    const fetchDashboardData = async (showLoading = false) => {
      if (showLoading) {
        setMetricsLoading(true);
        setMetricsError("");
      }

      try {
        const [metricsResult, deptsResult, coursesResult] = await Promise.allSettled([
          Agent10API.getDashboard(filters),
          Agent10API.getDepartments(filters),
          Agent10API.getCourses(filters),
        ]);

        if (cancelled) return;

        if (metricsResult.status === "fulfilled") {
          setMetrics(metricsResult.value);
        } else if (showLoading) {
          const err = metricsResult.reason;
          const msg = err?.response?.data?.detail || err?.message || String(err);
          setMetricsError(`Failed to load dashboard metrics from backend: ${msg}`);
        }

        if (deptsResult.status === "fulfilled" && deptsResult.value.length > 0) {
          setDepartments(deptsResult.value);
        }

        if (coursesResult.status === "fulfilled" && coursesResult.value.length > 0) {
          setCourses(coursesResult.value.slice(0, 12)); // top 12 for chart
        }
      } finally {
        if (!cancelled && showLoading) {
          setMetricsLoading(false);
        }
      }
    };

    fetchDashboardData(isUserChange || !metrics);
    
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 60000); // 60s silent polling

    return () => { 
      cancelled = true; 
      clearInterval(interval);
    };
  }, [filters]);

  // Dynamic chart data based on Role
  // Top level roles see Departments. HOD/Faculty see Courses because they only have 1 department.
  const isDepartmentLevel = currentRole === "Chairman" || currentRole === "Principal" || currentRole === "IQAC" || currentRole === "Dean";
  
  const chartData = isDepartmentLevel 
    ? departments.map((d) => ({
        name: d.department_code,
        passRate: d.pass_rate ?? 0,
        status: d.status
      }))
    : courses.map((c) => ({
        name: c.course_code,
        passRate: c.pass_pct ?? 0,
        status: "MONITORING"
      }));

  const handleExportExcel = () => {
    // Generate institutional summary data
    const summaryData = [
      { Metric: "Total Students", Value: metrics?.total_students || 0 },
      { Metric: "Students Evaluated", Value: metrics?.students_evaluated || 0 },
      { Metric: "Pass Rate (%)", Value: metrics?.pass_rate || 0 },
      { Metric: "Average Marks", Value: metrics?.average_marks || 0 },
      { Metric: "Average GPA", Value: metrics?.average_gpa || 0 },
      { Metric: "Failure Rate (%)", Value: metrics?.failure_rate || 0 },
      { Metric: "Data Trust Score", Value: metrics?.data_trust_score || 0 }
    ];

    const anomalies = (metrics as any)?.anomalies || [];
    const anomalyData = anomalies.map((a: any) => ({
      "Course": a.course_code,
      "Severity": a.severity,
      "Description": a.description,
      "Metric": a.metric,
      "Expected": a.expected_value,
      "Actual": a.actual_value,
    }));

    const deptData = departments.map(d => ({
      "Department": d.department_code,
      "Pass Rate (%)": d.pass_rate,
      "Status": d.status
    }));

    const courseData = courses.map(c => ({
      "Course Code": c.course_code,
      "Course Name": c.course_name,
      "Pass Rate (%)": c.pass_pct,
      "Trend": c.trend
    }));

    exportToExcel({
      "Summary": summaryData,
      "Anomalies": anomalyData,
      "Departments": deptData,
      "Courses": courseData
    }, "Institutional_Overview_Dashboard");
  };

  const handleExportPDF = () => {
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

    exportToPDF(`BodhSight Executive Overview - ${currentRole}`, paragraphs, tableData, "Institutional_Overview_Report");
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

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="dashboard-content">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-surface p-6 rounded-3xl border border-border/60 shadow-lg relative z-[100]">
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
            {currentRole === "Chairman" || currentRole === "Principal"
              ? "Executive Board Overview"
              : currentRole === "Dean"
              ? "Institutional Macro Governance"
              : currentRole === "HOD"
              ? "Departmental Command Center"
              : "Course Instructor Telemetry"}
          </h1>
          <p className="text-secondary font-medium mt-1">
            {currentRole === "Chairman" || currentRole === "Principal"
              ? "High-level strategic forecasting, condonation analytics, and campus-wide academic metrics."
              : currentRole === "Dean"
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
      {/* Key Metrics */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metricsLoading ? (
          [...Array(4)].map((_, i) => (
            <motion.div key={i} variants={itemVariants} className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm animate-pulse">
              <div className="h-3 bg-surface-secondary rounded w-3/4 mb-4" />
              <div className="h-8 bg-surface-secondary rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-secondary/50 rounded w-2/3" />
            </motion.div>
          ))
        ) : metricsError ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-600 dark:text-rose-400 font-medium text-sm">
            ⚠ {metricsError} — Check backend connection at{" "}
            {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}
          </div>
        ) : metrics ? (
          <>
            <motion.div 
              variants={itemVariants}
              onClick={() => setDrilldown({ isOpen: true, context: "evaluated", title: "Students Evaluated" })}
              className="bg-surface hover:bg-surface/80 transition-all p-6 rounded-3xl border border-border/60 shadow-sm hover:shadow-md cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-secondary group-hover:text-primary transition-colors mt-1">Students Evaluated</div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                  <Users size={16} className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mt-3">
                {metrics.students_evaluated.toLocaleString()}
              </div>
              <div className="text-xs text-secondary font-medium mt-1 group-hover:text-foreground transition-colors">
                {metrics.total_students
                  ? `of ${metrics.total_students.toLocaleString()} registered`
                  : "Institutional active scope"}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-surface hover:bg-surface/80 transition-all p-6 rounded-3xl border border-border/60 shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-secondary mt-1">Pass Rate</div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                  <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mt-3">{metrics.pass_rate.toFixed(1)}%</div>
              <div className="text-xs text-secondary font-medium mt-1">
                Failure rate: {metrics.failure_rate.toFixed(1)}%
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-surface hover:bg-surface/80 transition-all p-6 rounded-3xl border border-border/60 shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-secondary mt-1">Average Marks</div>
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mt-3">
                {metrics.average_marks.toFixed(1)}
              </div>
              <div className="text-xs text-secondary font-medium mt-1">
                {metrics.average_gpa != null
                  ? `CGPA: ${metrics.average_gpa.toFixed(2)}`
                  : "CGPA: not available in views"}
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              onClick={() => setDrilldown({ isOpen: true, context: "problems", title: "Active Problems" })}
              className="bg-surface hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all p-6 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-md relative overflow-hidden cursor-pointer group"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mt-1">Active Problems</div>
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                  <AlertTriangle size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mt-3 relative z-10">
                {metrics.active_anomalies ?? metrics.significant_deviations}
              </div>
              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 relative z-10 group-hover:text-rose-500 transition-colors">
                Requires administrative attention
              </div>
            </motion.div>
          </>
        ) : null}
      </motion.div>
      <StudentDrilldownModal
        isOpen={drilldown.isOpen}
        onClose={() => setDrilldown({ ...drilldown, isOpen: false })}
        context={drilldown.context}
        title={drilldown.title}
      />

      {/* Condonation Forecaster (Chairman & Principal Only) */}
      {(currentRole === "Chairman" || currentRole === "Principal") && (
        <div className="mt-4 h-32">
          <CondonationWidget />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pass rate chart — dept for senior roles, courses for Faculty/HOD */}
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-border/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-6">
            {isDepartmentLevel ? "Department Pass Rate Comparison" : "Course Pass Rate Overview"}
          </h2>
          {chartData.length > 0 ? (
            <div style={{ width: "100%", height: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorPassRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontWeight: "600", fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="passRate"
                    stroke="url(#lineColor)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorPassRate)"
                    dot={{ fill: "#0f172a", stroke: "#8b5cf6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#ec4899", strokeWidth: 0 }}
                    name="Pass Rate %"
                    isAnimationActive={true}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : metricsLoading ? (
            <div className="h-72 flex items-center justify-center gap-2 text-secondary">
              <Loader2 size={18} className="animate-spin" /> Loading data…
            </div>
          ) : courses.length > 0 ? (
            <div style={{ width: "100%", height: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={courses.map(c => ({ name: c.course_code, passRate: c.pass_rate ?? 0, status: c.status }))} 
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorPassRateCourse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="lineColorCourse" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontWeight: "600", fontSize: 12 }} 
                    dy={10}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc" }} 
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, "Pass Rate"]} 
                  />
                  <Area
                    type="monotone"
                    dataKey="passRate"
                    stroke="url(#lineColorCourse)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorPassRateCourse)"
                    dot={{ fill: "#0f172a", stroke: "#8b5cf6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#ec4899", strokeWidth: 0 }}
                    name="Pass Rate %"
                    isAnimationActive={true}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-secondary font-medium">
              No data available for current scope.
            </div>
          )}
        </div>

        {/* Courses analyzed sidebar */}
        <div className="bg-surface rounded-3xl border border-border/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-4">
            {currentRole === "Chairman" || currentRole === "Principal" ? "Campus Overview" : currentRole === "Faculty" ? "My Sections Summary" : currentRole === "HOD" ? "Department Summary" : "College Overview"}
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
      <div className="bg-indigo-50/30 dark:bg-indigo-950/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
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
