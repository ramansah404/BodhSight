import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import { Agent10API } from "../services/api";
import type { AcademicDashboardMetrics, AcademicException, CoursePerformance, DepartmentPerformance, InterventionPriorityItem } from "../types/agent10";
import { getRoleConfig } from "../utils/roleConfig";
import { RoleHeader, KpiGrid, SectionCard, DepartmentComparison, CoursePerformanceList, PriorityWatchlist, RiskCenter, ExecutiveSummary, ActionLinks, MetricItems } from "../components/dashboard/RoleDashboardPrimitives";
import ExportMenu from "../components/ui/ExportMenu";
import CondonationWidget from "../components/dashboard/CondonationWidget";
import StudentDrilldownModal from "../components/ui/StudentDrilldownModal";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";
import { useFilters } from "../contexts/FilterContext";

interface DashboardData {
  metrics: AcademicDashboardMetrics | null;
  departments: DepartmentPerformance[];
  courses: CoursePerformance[];
  anomalies: AcademicException[];
  priorities: InterventionPriorityItem[];
  briefing: { summary?: string; llm_used?: boolean } | null;
  metricsError: string;
  loading: boolean;
}

function OperatingModel() {
  const steps = ["Raw data", "AI extraction", "Staging", "Validation", "Commit", "Analytics", "Detection", "Intervention"];
  return <SectionCard eyebrow="Architecture" title="From academic data to timely action"><div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">{steps.map((step, index) => <div key={step} className="rounded-lg border border-border bg-surface-secondary px-3 py-2"><div className="text-[10px] font-bold text-teal-700 dark:text-teal-300">0{index + 1}</div><div className="mt-1 truncate text-xs font-semibold text-primary">{step}</div></div>)}</div><p className="mt-4 text-xs leading-5 text-secondary">After operational commit, Agent 10 reads the updated academic data and recomputes or exposes analytics. Downstream agent consumption is not exposed by the current frontend API.</p></SectionCard>;
}

function DashboardLoading() { return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border border-border bg-surface-secondary" />)}</div>; }

function ExportActions({ metrics, departments, currentRole }: { metrics: AcademicDashboardMetrics | null; departments: DepartmentPerformance[]; currentRole: string }) {
  const exportExcel = () => exportToExcel([{ Metric: "Students Evaluated", Value: metrics?.students_evaluated ?? "—" }, { Metric: "Pass Rate (%)", Value: metrics?.pass_rate ?? "—" }, { Metric: "Average Marks", Value: metrics?.average_marks ?? "—" }, { Metric: "Open Flags", Value: metrics?.active_anomalies ?? metrics?.significant_deviations ?? "—" }, ...departments.map((department) => ({ Department: department.department_code, "Pass Rate (%)": department.pass_rate ?? "—", Status: department.status }))], `BodhSight_${currentRole}_Overview`);
  const paragraphs = [`BodhSight ${currentRole} overview`, `Students evaluated: ${metrics?.students_evaluated ?? "—"}`, `Pass rate: ${metrics?.pass_rate?.toFixed(1) ?? "—"}%`, `Open flags: ${metrics?.active_anomalies ?? metrics?.significant_deviations ?? "—"}`];
  const table = [["Department", "Pass Rate (%)", "Status"], ...departments.map((department) => [department.department_code, String(department.pass_rate ?? "—"), department.status])];
  return <ExportMenu onExportExcel={exportExcel} onExportPDF={() => exportToPDF(`BodhSight ${currentRole} Overview`, paragraphs, table, `BodhSight_${currentRole}_Overview`)} onExportWord={() => exportToWord(`BodhSight ${currentRole} Overview`, paragraphs, table, `BodhSight_${currentRole}_Overview`)} disabled={!metrics} />;
}

function FacultyDashboard({ data, setDrilldown }: { data: DashboardData; setDrilldown: (context: string, title: string) => void }) {
  return <div className="space-y-6"><KpiGrid metrics={data.metrics} items={MetricItems({ metrics: data.metrics })} /><div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]"><CoursePerformanceList courses={data.courses} /><RiskCenter anomalies={data.anomalies} title="My scoped problems" /></div><SectionCard eyebrow="Course instructor actions" title="Move from telemetry to action" icon={<Target size={18} className="text-teal-700 dark:text-teal-300" />}><ActionLinks links={[{ label: "Ingestion workspace", description: "Upload a supported document using the current backend queue contract.", href: "/data-hub" }, { label: "Recommendations", description: "Review scoped intervention recommendations from Agent 10.", href: "/recommendations" }, { label: "Inspect students", description: "Open the permitted student drilldown for the current scope.", href: "/students" }, { label: "Course audit", description: "Review the complete course performance table.", href: "/courses" }]} /><button onClick={() => setDrilldown("evaluated", "Students Evaluated")} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-300">Open student drilldown <ArrowRight size={15} /></button></SectionCard></div>;
}

function HodDashboard({ data }: { data: DashboardData }) {
  return <div className="space-y-6"><PriorityWatchlist priorities={data.priorities} /><KpiGrid metrics={data.metrics} items={MetricItems({ metrics: data.metrics })} /><div className="grid gap-6 lg:grid-cols-2"><DepartmentComparison departments={data.departments} /><RiskCenter anomalies={data.anomalies} title="Department exceptions" /></div><SectionCard eyebrow="Department action" title="Recommendations and follow-up"><ActionLinks links={[{ label: "Recommendations", description: "Move priority courses toward an intervention action.", href: "/recommendations" }, { label: "Sections", description: "Inspect section-level disparity signals.", href: "/sections" }, { label: "Trends", description: "Compare current performance against the institutional mean.", href: "/trends" }, { label: "Ingestion workspace", description: "Use the existing department-scoped upload capability.", href: "/data-hub" }]} /></SectionCard></div>;
}

function DeanDashboard({ data }: { data: DashboardData }) {
  return <div className="space-y-6"><DepartmentComparison departments={data.departments} /><div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><ExecutiveSummary briefing={data.briefing} /><RiskCenter anomalies={data.anomalies} title="Institutional risks" /></div><KpiGrid metrics={data.metrics} items={MetricItems({ metrics: data.metrics })} /><SectionCard eyebrow="Academic management" title="Governance actions"><ActionLinks links={[{ label: "Trends", description: "Review current-term performance signals.", href: "/trends" }, { label: "Recommendations", description: "Review intervention priorities across the institution.", href: "/recommendations" }, { label: "Reports", description: "Export the current live dashboard view.", href: "/reports" }, { label: "Problems", description: "Inspect evidence-backed exceptions.", href: "/anomalies" }]} /></SectionCard></div>;
}

function PrincipalDashboard({ data }: { data: DashboardData }) {
  return <div className="space-y-6"><KpiGrid metrics={data.metrics} items={MetricItems({ metrics: data.metrics })} /><div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><RiskCenter anomalies={data.anomalies} title="Institutional risk overview" /><ExecutiveSummary briefing={data.briefing} /></div><DepartmentComparison departments={data.departments} /><CondonationWidget /><SectionCard eyebrow="Institutional action" title="Leadership follow-up"><ActionLinks links={[{ label: "Trends", description: "Review major movement in current academic performance.", href: "/trends" }, { label: "Recommendations", description: "Review prioritized interventions.", href: "/recommendations" }, { label: "Reports", description: "Prepare a verified institutional report.", href: "/reports" }]} /></SectionCard></div>;
}

function ChairmanDashboard({ data }: { data: DashboardData }) {
  return <div className="space-y-6"><KpiGrid metrics={data.metrics} items={[MetricItems({ metrics: data.metrics })[0], MetricItems({ metrics: data.metrics })[3], { label: "Departments in view", value: data.departments.length ? String(data.departments.length) : "—", detail: "Current institutional comparison" }, { label: "Data trust", value: data.metrics ? `${data.metrics.data_trust_score}%` : "—", detail: "Backend-reported trust score", tone: "positive" }]} /><div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"><RiskCenter anomalies={data.anomalies} title="Strategic academic risks" /><ExecutiveSummary briefing={data.briefing} /></div><SectionCard eyebrow="Macro signal" title="Institutional performance direction" icon={<TrendingUp size={18} className="text-teal-700 dark:text-teal-300" />}><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-background p-4"><div className="text-xs text-secondary">Pass rate</div><div className="mt-2 text-2xl font-bold text-primary">{data.metrics ? `${data.metrics.pass_rate.toFixed(1)}%` : "—"}</div></div><div className="rounded-lg border border-border bg-background p-4"><div className="text-xs text-secondary">Open flags</div><div className="mt-2 text-2xl font-bold text-primary">{data.metrics?.active_anomalies ?? "—"}</div></div><div className="rounded-lg border border-border bg-background p-4"><div className="text-xs text-secondary">Current data source</div><div className="mt-2 text-sm font-bold text-primary">{data.metrics?.data_source === "database" ? "Live database" : data.metrics?.data_source ?? "—"}</div></div></div></SectionCard><CondonationWidget /><SectionCard eyebrow="Strategic follow-up" title="Leadership views"><ActionLinks links={[{ label: "Trends", description: "Review macro movement without operational detail.", href: "/trends" }, { label: "Exceptions", description: "Review high-level exception records.", href: "/exceptions" }, { label: "Reports", description: "Export the current strategic overview.", href: "/reports" }]} /></SectionCard></div>;
}

function IqacDashboard({ data }: { data: DashboardData }) {
  return <div className="space-y-6"><KpiGrid metrics={data.metrics} items={[MetricItems({ metrics: data.metrics })[0], MetricItems({ metrics: data.metrics })[3], { label: "Evidence source", value: data.metrics?.data_source === "database" ? "Live" : "—", detail: "Current backend source", tone: "positive" }, { label: "Quality scope", value: data.departments.length ? String(data.departments.length) : "—", detail: "Departments returned" }]} /><div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"><RiskCenter anomalies={data.anomalies} title="Quality risks" /><SectionCard eyebrow="Quality signal" title="Trend and assurance views" icon={<TrendingUp size={18} className="text-teal-700 dark:text-teal-300" />}><p className="text-sm leading-6 text-secondary">Current trend data is available through the Agent 10 trends view. Dedicated accreditation, CO, and PO metrics are not exposed by the current backend.</p><div className="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-xs leading-5 text-secondary">Integration pending: NBA/NAAC exports, CO attainment, PO attainment, and dedicated evidence APIs.</div><div className="mt-4"><ActionLinks links={[{ label: "Open trends", description: "Review available current-term trend signals.", href: "/trends" }, { label: "Open reports", description: "Export existing live dashboard/report views.", href: "/reports" }]} /></div></SectionCard></div><ExecutiveSummary briefing={data.briefing} /><SectionCard eyebrow="Quality follow-up" title="Action and evidence"><ActionLinks links={[{ label: "Problems", description: "Review quality-relevant exception records.", href: "/anomalies" }, { label: "Recommendations", description: "Track available follow-up actions.", href: "/recommendations" }, { label: "Settings", description: "Review current role and backend health.", href: "/settings" }]} /></SectionCard></div>;
}

export default function Dashboard() {
  const { filters } = useFilters();
  const { currentRole } = useOutletContext<{ currentRole: string }>();
  const config = getRoleConfig(currentRole);
  const displayName = localStorage.getItem("bodhsight_name") || `${currentRole} User`;
  const [data, setData] = useState<DashboardData>({ metrics: null, departments: [], courses: [], anomalies: [], priorities: [], briefing: null, metricsError: "", loading: true });
  const [drilldown, setDrilldown] = useState<{ isOpen: boolean; context: string; title: string }>({ isOpen: false, context: "", title: "" });

  useEffect(() => {
    let cancelled = false;
    setData((previous) => ({ ...previous, loading: true, metricsError: "" }));
    const leadership = ["Dean", "Principal", "Chairman", "IQAC"].includes(currentRole);
    Promise.allSettled([Agent10API.getDashboard(filters), Agent10API.getDepartments(filters), Agent10API.getCourses(filters), Agent10API.getAnomalies(filters), currentRole === "HOD" ? Agent10API.getPriorities(filters) : Promise.resolve([]), leadership ? Agent10API.getSummary(filters) : Promise.resolve(null)]).then(([metricsResult, departmentsResult, coursesResult, anomaliesResult, prioritiesResult, summaryResult]) => {
      if (cancelled) return;
      const metrics = metricsResult.status === "fulfilled" ? metricsResult.value : null;
      setData({
        metrics,
        departments: departmentsResult.status === "fulfilled" ? departmentsResult.value : [],
        courses: coursesResult.status === "fulfilled" ? coursesResult.value : [],
        anomalies: anomaliesResult.status === "fulfilled" ? anomaliesResult.value : [],
        priorities: prioritiesResult.status === "fulfilled" ? prioritiesResult.value as InterventionPriorityItem[] : [],
        briefing: summaryResult.status === "fulfilled" && summaryResult.value ? { summary: typeof summaryResult.value.summary === "string" ? summaryResult.value.summary : undefined, llm_used: summaryResult.value.llm_used === true } : null,
        metricsError: metricsResult.status === "rejected" ? "Dashboard metrics could not be loaded from the backend." : "",
        loading: false,
      });
    });
    return () => { cancelled = true; };
  }, [filters, currentRole]);

  const exportActions = <ExportActions metrics={data.metrics} departments={data.departments} currentRole={currentRole} />;
  const composition = config.composition === "faculty" ? <FacultyDashboard data={data} setDrilldown={(context, title) => setDrilldown({ isOpen: true, context, title })} /> : config.composition === "hod" ? <HodDashboard data={data} /> : config.composition === "dean" ? <DeanDashboard data={data} /> : config.composition === "principal" ? <PrincipalDashboard data={data} /> : config.composition === "chairman" ? <ChairmanDashboard data={data} /> : <IqacDashboard data={data} />;

  return <div className="mx-auto max-w-7xl space-y-6" id="dashboard-content"><RoleHeader config={config} displayName={displayName} onExport={exportActions} />{data.metricsError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{data.metricsError}</div>}{data.loading ? <DashboardLoading /> : composition}<div className="mt-2"><OperatingModel /></div><StudentDrilldownModal isOpen={drilldown.isOpen} onClose={() => setDrilldown({ ...drilldown, isOpen: false })} context={drilldown.context} title={drilldown.title} /></div>;
}
