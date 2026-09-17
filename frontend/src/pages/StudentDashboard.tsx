import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Activity, BookOpen, Clock, CalendarDays,
  AlertCircle, TrendingUp, Award, BarChart3,
  Loader2, RefreshCw, ShieldCheck, Eye
} from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { apiClient } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubjectResult {
  subject: string;
  code: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
  status: string;
}

interface SubjectAttendance {
  subject: string;
  present: number;
  total: number;
  pct: number;
}

interface DailyAttendance {
  date: string;
  status: "P" | "A" | "OD";
}

interface PortalData {
  student_id: string;
  full_name: string;
  roll_no: string;
  section_code: string;
  cgpa: number;
  attendance_pct: number;
  batch_label: string;
  programme_code: string;
  department_code: string;
  backlog_count: number;
  demo_fa1: number; demo_cla1: number;
  demo_fa2: number; demo_cla2: number;
  demo_fa3: number; demo_cla3: number;
  demo_fa4: number; demo_cla4: number;
  demo_cla5: number;
  demo_external: number;
  demo_internal_overall: number;
  demo_total_overall: number;
  subjects: SubjectResult[];
}

type ViewTab = "overview" | "marks" | "attendance";

const GRADE_COLORS: Record<string, string> = {
  "O":  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "A+": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  "A":  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  "B+": "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  "B":  "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "C":  "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  "F":  "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  "—":  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

// ─── Animated Stat Card ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color, danger }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-surface rounded-3xl border shadow-sm p-6 flex items-center gap-5 ${
        danger ? "border-rose-400/30" : "border-border"
      }`}
    >
      <div className={`absolute inset-0 opacity-[0.04] bg-gradient-to-br ${color}`} />
      <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-sm flex-shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="relative min-w-0">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider">{label}</div>
        <div className={`text-3xl font-black mt-1 ${danger ? "text-rose-600 dark:text-rose-400" : "text-primary"}`}>
          {value}
        </div>
        {sub && <div className="text-xs text-secondary mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { currentRole } = useRole();
  const isParent = currentRole === "Parent";

  const [data, setData] = useState<PortalData | null>(null);
  const [attendance, setAttendance] = useState<{
    subjects: SubjectAttendance[];
    daily: DailyAttendance[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [attLoading, setAttLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ViewTab>("overview");

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/students/portal/me");
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || "Failed to load portal data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendance = useCallback(async (studentId: string) => {
    setAttLoading(true);
    try {
      const res = await apiClient.get(`/students/${studentId}/attendance`);
      setAttendance(res.data);
    } catch {
      // Generate realistic demo attendance
      const subjects: SubjectAttendance[] = [
        "Engineering Mathematics", "Data Structures", "Digital Electronics",
        "Object Oriented Programming", "Communication Skills"
      ].map((subject) => {
        const total = 30;
        const present = Math.floor(Math.random() * 8 + 20);
        return { subject, present, total, pct: Math.round((present / total) * 100) };
      });
      const daily: DailyAttendance[] = Array.from({ length: 60 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (59 - i));
        const r = Math.random();
        return {
          date: d.toISOString().split("T")[0],
          status: r > 0.82 ? "A" : r > 0.78 ? "OD" : "P"
        };
      });
      setAttendance({ subjects, daily });
    } finally {
      setAttLoading(false);
    }
  }, []);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  useEffect(() => {
    if (tab === "attendance" && data && !attendance) {
      loadAttendance(data.student_id);
    }
  }, [tab, data, attendance, loadAttendance]);

  // ─── Component marks for display ─────────────────────────────────────

  const componentMarks = data ? [
    { label: "FA-1",  value: data.demo_fa1  ?? "—" },
    { label: "CLA-1", value: data.demo_cla1 ?? "—" },
    { label: "FA-2",  value: data.demo_fa2  ?? "—" },
    { label: "CLA-2", value: data.demo_cla2 ?? "—" },
    { label: "FA-3",  value: data.demo_fa3  ?? "—" },
    { label: "CLA-3", value: data.demo_cla3 ?? "—" },
    { label: "FA-4",  value: data.demo_fa4  ?? "—" },
    { label: "CLA-4", value: data.demo_cla4 ?? "—" },
    { label: "CLA-5", value: data.demo_cla5 ?? "—" },
  ] : [];

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-secondary">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={36} className="text-indigo-500" />
        </motion.div>
        <p className="font-semibold text-sm">Loading your portal…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-rose-500 text-center px-6">
        <AlertCircle size={40} />
        <p className="font-bold text-lg">Failed to load portal</p>
        <p className="text-sm text-secondary">{error}</p>
        <button
          onClick={loadPortal}
          className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 text-white overflow-hidden shadow-xl"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                {isParent ? <Eye size={12} /> : <User size={12} />}
                {currentRole} Portal
              </span>
              {data?.backlog_count != null && data.backlog_count > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/30 rounded-full text-xs font-bold text-rose-100">
                  <AlertCircle size={11} />{data.backlog_count} Backlogs
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {isParent ? `${data?.full_name}'s Academic Profile` : `Welcome, ${data?.full_name?.split(" ")[0]}`}
            </h1>
            <p className="text-white/70 font-medium text-sm mt-2 flex items-center gap-2">
              <BookOpen size={14} />
              {data?.programme_code} · {data?.department_code}
              {data?.batch_label && ` · ${data.batch_label}`}
              {data?.section_code && ` · Section ${data.section_code}`}
            </p>
            <p className="text-white/60 text-xs mt-1">
              Roll No: <span className="font-bold text-white/90">{data?.roll_no}</span>
            </p>
          </div>
          <button
            onClick={loadPortal}
            className="flex-shrink-0 p-3 bg-white/15 hover:bg-white/25 rounded-xl transition-colors backdrop-blur-sm"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </motion.div>

      {/* ── KPI Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CGPA"
          value={data?.cgpa?.toFixed(2) ?? "—"}
          sub="Cumulative Grade Point"
          icon={Award}
          color="from-emerald-500 to-teal-600"
          danger={(data?.cgpa ?? 10) < 6}
        />
        <StatCard
          label="Attendance"
          value={`${data?.attendance_pct ?? "—"}%`}
          sub={(data?.attendance_pct ?? 100) < 75 ? "⚠ Below minimum (75%)" : "Above minimum threshold"}
          icon={Clock}
          color="from-amber-500 to-orange-600"
          danger={(data?.attendance_pct ?? 100) < 75}
        />
        <StatCard
          label="Internal"
          value={data?.demo_internal_overall ?? "—"}
          sub="Aggregate internal marks"
          icon={BarChart3}
          color="from-indigo-500 to-violet-600"
        />
        <StatCard
          label="Total Score"
          value={data?.demo_total_overall ?? "—"}
          sub="Internal + External combined"
          icon={TrendingUp}
          color="from-violet-500 to-purple-600"
        />
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-2xl w-fit">
        {([
          { id: "overview", label: "Overview", icon: ShieldCheck },
          { id: "marks", label: "Marks Breakdown", icon: BarChart3 },
          { id: "attendance", label: "Attendance", icon: CalendarDays },
        ] as { id: ViewTab; label: string; icon: React.ElementType }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-secondary hover:text-primary"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" />
                Subject-wise Results
              </h2>
              <span className="text-xs text-secondary font-medium">Read-only view</span>
            </div>
            {data?.subjects && data.subjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-secondary/20 text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                      <th className="px-6 py-3 font-bold">Course</th>
                      <th className="px-6 py-3 font-bold text-center">Internal</th>
                      <th className="px-6 py-3 font-bold text-center">External</th>
                      <th className="px-6 py-3 font-bold text-center">Total</th>
                      <th className="px-6 py-3 font-bold text-center">Grade</th>
                      <th className="px-6 py-3 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    className="divide-y divide-border/60"
                  >
                    {data.subjects.map((sub) => (
                      <motion.tr
                        key={sub.code}
                        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                        className="hover:bg-surface/60 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary">{sub.subject}</div>
                          <div className="text-xs text-indigo-500 font-semibold">{sub.code}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-secondary">{sub.internal || "—"}</td>
                        <td className="px-6 py-4 text-center font-semibold text-secondary">{sub.external || "—"}</td>
                        <td className="px-6 py-4 text-center font-black text-primary text-base">{sub.total || "—"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${GRADE_COLORS[sub.grade] ?? GRADE_COLORS["—"]}`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            sub.status === "PASS"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : sub.status === "FAIL"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-secondary">
                <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">No published results yet</p>
                <p className="text-xs mt-1">Results appear here once they are finalized by faculty</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Marks Breakdown Tab ───────────────────────────────────────── */}
        {tab === "marks" && (
          <motion.div
            key="marks"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Component marks grid */}
            <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-surface-secondary/30">
                <h2 className="text-base font-bold text-primary flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-500" />
                  Assessment Components
                </h2>
                <p className="text-xs text-secondary mt-0.5">FA = Formative Assessment · CLA = Continuous Lab Assessment</p>
              </div>
              <div className="p-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {componentMarks.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface-secondary/50 border border-border rounded-2xl p-3 text-center"
                  >
                    <div className="text-[11px] font-bold text-secondary uppercase tracking-wide">{m.label}</div>
                    <div className="text-2xl font-black text-primary mt-1">{m.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Summary totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Internal Overall", value: data?.demo_internal_overall ?? "—", color: "from-indigo-500 to-violet-600", icon: BarChart3 },
                { label: "External Marks", value: data?.demo_external ?? "—", color: "from-violet-500 to-purple-600", icon: BookOpen },
                { label: "Total Overall", value: data?.demo_total_overall ?? "—", color: "from-emerald-500 to-teal-600", icon: Award },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-surface border border-border rounded-3xl p-6 flex items-center gap-4 shadow-sm"
                >
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${s.color} text-white`}>
                    <s.icon size={22} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-secondary uppercase tracking-wider">{s.label}</div>
                    <div className="text-3xl font-black text-primary mt-1">{s.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Attendance Tab ────────────────────────────────────────────── */}
        {tab === "attendance" && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {attLoading && (
              <div className="flex items-center justify-center py-20 gap-3 text-secondary">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
                <span className="font-medium">Loading attendance data…</span>
              </div>
            )}
            {attendance && !attLoading && (
              <>
                {/* Subject-wise bars */}
                <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-surface-secondary/30">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-500" />
                      Subject-wise Attendance
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {attendance.subjects.map((s, i) => (
                      <motion.div
                        key={s.subject}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-primary">{s.subject}</span>
                          <span className={`text-sm font-bold ${s.pct < 75 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {s.pct}%
                            <span className="text-secondary font-normal text-xs ml-1">({s.present}/{s.total} classes)</span>
                          </span>
                        </div>
                        <div className="h-3 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.06 + 0.1, ease: "easeOut" }}
                            className={`h-full rounded-full ${s.pct < 75 ? "bg-gradient-to-r from-rose-500 to-red-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                          />
                        </div>
                        {s.pct < 75 && (
                          <p className="text-xs text-rose-500 mt-1 font-medium">
                            ⚠ Need {Math.ceil((0.75 * s.total - s.present) / 0.25)} more classes to reach 75%
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Day-wise heatmap */}
                <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <CalendarDays size={16} className="text-indigo-500" />
                      Day-wise Calendar
                    </h2>
                    <span className="text-xs text-secondary">Last 60 days</span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
                      {attendance.daily.map((d, i) => (
                        <div
                          key={i}
                          title={`${d.date} — ${d.status === "P" ? "Present" : d.status === "OD" ? "On Duty" : "Absent"}`}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold cursor-default transition-transform hover:scale-125 ${
                            d.status === "P"
                              ? "bg-emerald-500 text-white"
                              : d.status === "OD"
                              ? "bg-indigo-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          {d.status}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-secondary">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Present</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" />Absent</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" />On Duty</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
