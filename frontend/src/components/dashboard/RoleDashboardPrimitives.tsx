import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileText, ShieldAlert, Target, TrendingUp } from "lucide-react";
import type { AcademicDashboardMetrics, AcademicException, DepartmentPerformance, InterventionPriorityItem, CoursePerformance } from "../../types/agent10";
import type { RoleConfig } from "../../utils/roleConfig";

export function RoleHeader({ config, displayName, onExport }: { config: RoleConfig; displayName: string; onExport?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border border-l-4 border-l-teal-700 bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">{config.scopeLabel}</div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{config.title}</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-secondary">{config.purpose}. {config.primaryQuestion}</p>
          <p className="mt-3 text-xs text-secondary">Authenticated as <span className="font-semibold text-primary">{displayName}</span></p>
        </div>
        {onExport && <div className="shrink-0">{onExport}</div>}
      </div>
    </section>
  );
}

export function KpiGrid({ metrics, items }: { metrics: AcademicDashboardMetrics | null; items: Array<{ label: string; value: string; detail: string; tone?: "default" | "positive" | "warning" | "critical" }> }) {
  const toneClasses = { default: "border-border", positive: "border-emerald-200 dark:border-emerald-500/20", warning: "border-amber-200 dark:border-amber-500/20", critical: "border-rose-200 dark:border-rose-500/20" };
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Role metrics">
      {items.map((item) => <div key={item.label} className={`rounded-xl border bg-surface p-5 shadow-sm ${toneClasses[item.tone ?? "default"]}`}><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">{item.label}</div><div className="mt-3 text-3xl font-bold text-primary">{item.value}</div><div className="mt-1 text-xs text-secondary">{item.detail}</div></div>)}
      {!metrics && <div className="sr-only">Metrics are loading.</div>}
    </section>
  );
}

export function SectionCard({ eyebrow, title, icon, children, action }: { eyebrow?: string; title: string; icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-xl border border-border bg-surface p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div>{eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">{eyebrow}</div>}<h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-primary">{icon}{title}</h2></div>{action}</div><div className="mt-5">{children}</div></section>;
}

export function DepartmentComparison({ departments }: { departments: DepartmentPerformance[] }) {
  return <SectionCard eyebrow="Comparative view" title="Department performance" icon={<BarChart3 size={18} className="text-teal-700 dark:text-teal-300" />}>{departments.length === 0 ? <EmptyState text="No department comparison data returned for this scope." /> : <div className="space-y-4">{departments.map((department) => { const value = department.pass_rate ?? 0; return <div key={department.department_code}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-bold text-primary">{department.department_code}</span><span className="font-semibold text-secondary">{value.toFixed(1)}%</span></div><div className="h-2 rounded-full bg-surface-secondary"><div className="h-2 rounded-full bg-teal-700 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><div className="mt-1 text-xs text-secondary">{department.status.replaceAll("_", " ")} · {department.active_exceptions} active exceptions</div></div>; })}</div>}</SectionCard>;
}

export function CoursePerformanceList({ courses }: { courses: CoursePerformance[] }) {
  return <SectionCard eyebrow="Assigned academic areas" title="Course performance" icon={<TrendingUp size={18} className="text-teal-700 dark:text-teal-300" />}><div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left"><thead><tr className="border-b border-border text-[10px] uppercase tracking-wider text-secondary"><th className="px-3 py-3">Course</th><th className="px-3 py-3">Pass rate</th><th className="px-3 py-3">Students evaluated</th><th className="px-3 py-3">Priority</th></tr></thead><tbody>{courses.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-secondary">No course performance data returned for this scope.</td></tr> : courses.slice(0, 8).map((course, index) => <tr key={`${course.course_code}-${index}`} className="border-b border-border/70 last:border-0"><td className="px-3 py-3"><div className="text-sm font-bold text-primary">{course.course_code}</div><div className="text-xs text-secondary">{course.course_name}</div></td><td className="px-3 py-3 text-sm font-bold text-primary">{course.pass_rate.toFixed(1)}%</td><td className="px-3 py-3 text-sm text-secondary">{course.students_appeared}</td><td className="px-3 py-3"><StatusBadge value={course.priority} /></td></tr>)}</tbody></table></div></SectionCard>;
}

export function PriorityWatchlist({ priorities }: { priorities: InterventionPriorityItem[] }) {
  return <SectionCard eyebrow="Departmental command center" title="Intervention priority watchlist" icon={<Target size={18} className="text-teal-700 dark:text-teal-300" />}><p className="mb-4 text-xs text-secondary">Ranked by Agent 10 severity scoring. Historical course comparison is unavailable in the current API.</p><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-border text-[10px] uppercase tracking-wider text-secondary"><th className="px-3 py-3">Course</th><th className="px-3 py-3">Pass rate</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Affected</th><th className="px-3 py-3">Recommended intervention</th></tr></thead><tbody>{priorities.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-secondary">No intervention priorities returned for this department.</td></tr> : priorities.slice(0, 8).map((item) => <tr key={`${item.rank}-${item.course_code}`} className="border-b border-border/70 last:border-0"><td className="px-3 py-3"><div className="text-sm font-bold text-primary">{item.course_code}</div><div className="text-xs text-secondary">{item.course_name}</div></td><td className="px-3 py-3 text-sm font-bold text-primary">{item.pass_rate.toFixed(1)}%</td><td className="px-3 py-3"><StatusBadge value={item.priority} /></td><td className="px-3 py-3 text-sm text-secondary">{item.affected_students}</td><td className="max-w-xs px-3 py-3 text-xs leading-5 text-secondary">{item.recommended_intervention}</td></tr>)}</tbody></table></div></SectionCard>;
}

export function RiskCenter({ anomalies, title = "Quality risks" }: { anomalies: AcademicException[]; title?: string }) {
  return <SectionCard eyebrow="Attention required" title={title} icon={<ShieldAlert size={18} className="text-amber-600" />}><div className="space-y-3">{anomalies.length === 0 ? <EmptyState text="No exception records returned for this scope." /> : anomalies.slice(0, 4).map((item) => <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4"><div><div className="text-sm font-bold text-primary">{item.title}</div><div className="mt-1 text-xs leading-5 text-secondary">{item.course_code} · {item.explanation}</div></div><StatusBadge value={item.severity} /></div>)}</div></SectionCard>;
}

export function ExecutiveSummary({ briefing }: { briefing: { summary?: string; llm_used?: boolean } | null }) {
  return <SectionCard eyebrow="Decision support" title="Executive summary" icon={<FileText size={18} className="text-teal-700 dark:text-teal-300" />}><div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-500/20 dark:bg-teal-500/5">{briefing?.summary ? <><div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">{briefing.llm_used ? "LLM explanation layer" : "Structured backend summary"}</div><p className="text-sm leading-7 text-primary">{briefing.summary}</p></> : <EmptyState text="Executive summary is unavailable for the current scope." />}</div></SectionCard>;
}

export function ActionLinks({ links }: { links: Array<{ label: string; description: string; href: string }> }) {
  return <div className="grid gap-3 sm:grid-cols-2">{links.map((link) => <Link key={link.href} to={link.href} className="group rounded-lg border border-border bg-background p-4 hover:border-teal-700/40 hover:bg-teal-50/50 dark:hover:bg-teal-500/5"><div className="text-sm font-bold text-primary">{link.label}</div><div className="mt-1 text-xs leading-5 text-secondary">{link.description}</div><div className="mt-3 flex items-center gap-1 text-xs font-bold text-teal-800 dark:text-teal-300">Open <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></div></Link>)}</div>;
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const classes = normalized === "CRITICAL" || normalized === "HIGH" || normalized === "INTERVENTION_REQUIRED" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300" : normalized === "MEDIUM" || normalized === "MONITORING" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" : "border-border bg-surface-secondary text-secondary";
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>{value.replaceAll("_", " ")}</span>;
}

export function EmptyState({ text }: { text: string }) { return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-secondary">{text}</div>; }

export function MetricItems({ metrics, activeAnomalies }: { metrics: AcademicDashboardMetrics | null; activeAnomalies?: number }) {
  return [
    { label: "Pass rate", value: metrics ? `${metrics.pass_rate.toFixed(1)}%` : "—", detail: "Current scoped performance", tone: "positive" as const },
    { label: "Students evaluated", value: metrics?.students_evaluated.toLocaleString() ?? "—", detail: metrics?.total_students ? `Across ${metrics.total_students.toLocaleString()} registered students` : "Current academic scope" },
    { label: "Average marks", value: metrics ? metrics.average_marks.toFixed(1) : "—", detail: metrics?.average_gpa != null ? `Average GPA ${metrics.average_gpa.toFixed(2)}` : "GPA unavailable in current views" },
    { label: "Open flags", value: String(activeAnomalies ?? metrics?.active_anomalies ?? metrics?.significant_deviations ?? "—"), detail: "Exceptions requiring review", tone: "warning" as const },
  ];
}
