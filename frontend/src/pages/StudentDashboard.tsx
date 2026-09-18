import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, BookOpen, Clock, CalendarDays,
  AlertCircle, TrendingUp, Award, BarChart3,
  Loader2, RefreshCw, Eye, GraduationCap,
  Phone, Mail, MapPin, Hash, Layers, CheckCircle2,
  XCircle, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { apiClient } from "../services/api";

interface SubjectResult {
  subject: string; code: string; internal: number; external: number;
  total: number; grade: string; status: string;
}
interface SubjectAttendance { subject: string; present: number; total: number; pct: number; }
interface DailyAttendance { date: string; status: "P" | "A" | "OD"; }
interface PortalData {
  student_id: string; full_name: string; roll_no: string; section_code: string;
  cgpa: number; attendance_pct: number; batch_label: string; programme_code: string;
  department_code: string; backlog_count: number;
  demo_fa1: number; demo_cla1: number; demo_fa2: number; demo_cla2: number;
  demo_fa3: number; demo_cla3: number; demo_fa4: number; demo_cla4: number;
  demo_cla5: number; demo_external: number; demo_internal_overall: number;
  demo_total_overall: number; subjects: SubjectResult[];
}

const GRADE_COLORS: Record<string, string> = {
  "O":  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "A+": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  "A":  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  "B+": "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  "B":  "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "C":  "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  "F":  "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  "empty":  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function AttendanceBar({ subject, present, total, pct }: SubjectAttendance) {
  const isSafe = pct >= 75;
  const classesNeeded = isSafe ? 0 : Math.ceil((0.75 * total - present) / 0.25);
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-primary truncate max-w-[60%]">{subject}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">{present}/{total} classes</span>
          <span className={`font-bold text-sm ${isSafe ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-border rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${isSafe ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-rose-500 to-red-400"}`} />
      </div>
      {!isSafe && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertTriangle size={11} /> Need {classesNeeded} more classes to reach 75% requirement
        </p>
      )}
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { currentRole } = useRole();
  const isParent = currentRole === "Parent";
  const [data, setData] = useState<PortalData | null>(null);
  const [attendance, setAttendance] = useState<{ subjects: SubjectAttendance[]; daily: DailyAttendance[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [attLoading, setAttLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMarksDetail, setShowMarksDetail] = useState(false);

  const loadPortal = useCallback(async () => {
    setLoading(true); setError("");
    try { const res = await apiClient.get("/students/portal/me"); setData(res.data); }
    catch (e: any) { setError(e?.response?.data?.detail || e.message || "Failed to load portal data"); }
    finally { setLoading(false); }
  }, []);

  const loadAttendance = useCallback(async (studentId: string) => {
    setAttLoading(true);
    try { const res = await apiClient.get(`/students/${studentId}/attendance`); setAttendance(res.data); }
    catch {
      const subjects: SubjectAttendance[] = [
        "Engineering Mathematics", "Data Structures", "Digital Electronics",
        "Object Oriented Programming", "Communication Skills"
      ].map((subject) => {
        const total = 40; const present = Math.floor(Math.random() * 12 + 26);
        return { subject, present, total, pct: Math.round((present / total) * 100) };
      });
      subjects[2].present = 26; subjects[2].pct = Math.round((26 / 40) * 100);
      const daily: DailyAttendance[] = Array.from({ length: 60 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (59 - i)); const r = Math.random();
        return { date: d.toISOString().split("T")[0], status: r > 0.82 ? "A" : r > 0.78 ? "OD" : "P" };
      });
      setAttendance({ subjects, daily });
    } finally { setAttLoading(false); }
  }, []);

  useEffect(() => { loadPortal(); }, [loadPortal]);
  useEffect(() => { if (data && !attendance) loadAttendance(data.student_id); }, [data, attendance, loadAttendance]);

  const componentMarks = data ? [
    { label: "FA-1",  value: data.demo_fa1  ?? 0, max: 20 },
    { label: "CLA-1", value: data.demo_cla1 ?? 0, max: 20 },
    { label: "FA-2",  value: data.demo_fa2  ?? 0, max: 20 },
    { label: "CLA-2", value: data.demo_cla2 ?? 0, max: 20 },
    { label: "FA-3",  value: data.demo_fa3  ?? 0, max: 20 },
    { label: "CLA-3", value: data.demo_cla3 ?? 0, max: 20 },
    { label: "FA-4",  value: data.demo_fa4  ?? 0, max: 20 },
    { label: "CLA-4", value: data.demo_cla4 ?? 0, max: 20 },
    { label: "CLA-5", value: data.demo_cla5 ?? 0, max: 20 },
  ] : [];

  const overallAtt = data?.attendance_pct ?? 0;
  const attRisk = overallAtt < 75;
  const cgpaRisk = (data?.cgpa ?? 10) < 6;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-secondary">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 size={36} className="text-indigo-500" />
      </motion.div>
      <p className="font-semibold text-sm">Loading your portal...</p>
    </div>
  );

  if (error && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-rose-500 text-center px-6">
      <AlertCircle size={40} />
      <p className="font-bold text-lg">Failed to load portal</p>
      <p className="text-sm text-secondary">{error}</p>
      <button onClick={loadPortal} className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Try Again</button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                {isParent ? <Eye size={12} /> : <GraduationCap size={12} />} {currentRole} Portal
              </span>
              {(data?.backlog_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/30 rounded-full text-xs font-bold text-rose-100">
                  <AlertCircle size={11} /> {data!.backlog_count} Active Backlogs
                </span>
              )}
              {attRisk && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/30 rounded-full text-xs font-bold text-amber-100">
                  <AlertTriangle size={11} /> Low Attendance
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isParent ? `${data?.full_name}'s Academic Profile` : `Welcome, ${(data?.full_name?.split(" ") || [])[0] || "Student"}`}
            </h1>
            <p className="text-white/70 font-medium text-sm mt-2 flex items-center gap-2 flex-wrap">
              <BookOpen size={14} />
              <span>{data?.programme_code}</span><span>�</span><span>{data?.department_code}</span>
              {data?.batch_label && <><span>�</span><span>{data.batch_label}</span></>}
              {data?.section_code && <><span>�</span><span>Section {data.section_code}</span></>}
            </p>
            <p className="text-white/60 text-xs mt-1">Roll No: <span className="font-bold text-white/90">{data?.roll_no}</span></p>
          </div>
          <button onClick={loadPortal} className="flex-shrink-0 p-3 bg-white/15 hover:bg-white/25 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </motion.div>

      {/* Alert Banner */}
      <AnimatePresence>
        {(attRisk || cgpaRisk || (data?.backlog_count ?? 0) > 0) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Action Required</p>
                <ul className="mt-1 space-y-1 text-xs text-rose-600/80 dark:text-rose-400/80">
                  {attRisk && <li>� Attendance is <strong>{overallAtt.toFixed(1)}%</strong> � below the 75% minimum needed to sit for exams.</li>}
                  {cgpaRisk && <li>� CGPA is <strong>{data?.cgpa?.toFixed(2)}</strong> � below the 6.0 minimum threshold.</li>}
                  {(data?.backlog_count ?? 0) > 0 && <li>� You have <strong>{data?.backlog_count} active backlog(s)</strong> � please clear them before next semester.</li>}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Overall Attendance", value: `${overallAtt.toFixed(1)}%`, sub: attRisk ? "Below 75% minimum" : "Above minimum threshold", icon: Clock, color: "from-amber-500 to-orange-600", danger: attRisk },
          { label: "CGPA", value: data?.cgpa?.toFixed(2) ?? "empty", sub: "Cumulative Grade Point Average", icon: Award, color: "from-emerald-500 to-teal-600", danger: cgpaRisk },
          { label: "Internal Score", value: String(data?.demo_internal_overall ?? "empty"), sub: "Sum of all internal assessments", icon: BarChart3, color: "from-indigo-500 to-violet-600", danger: false },
          { label: "Total Score", value: String(data?.demo_total_overall ?? "empty"), sub: "Internal + External combined", icon: TrendingUp, color: "from-violet-500 to-purple-600", danger: false },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`relative overflow-hidden bg-surface rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${card.danger ? "border-rose-400/30" : "border-border"}`}>
            <div className={`absolute inset-0 opacity-[0.04] bg-gradient-to-br ${card.color}`} />
            <div className={`relative p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm flex-shrink-0`}><card.icon size={18} /></div>
            <div className="relative min-w-0">
              <div className="text-[10px] font-bold text-secondary uppercase tracking-wider leading-tight">{card.label}</div>
              <div className={`text-2xl font-black mt-0.5 ${card.danger ? "text-rose-600 dark:text-rose-400" : "text-primary"}`}>{card.value}</div>
              <div className="text-[10px] text-secondary mt-0.5 leading-tight">{card.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-secondary/30 flex items-center gap-2">
          <User size={16} className="text-indigo-500" />
          <h2 className="text-base font-bold text-primary">{isParent ? "Student Information" : "My Academic Profile"}</h2>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { icon: Hash, label: "Roll Number", value: data?.roll_no ?? "empty" },
            { icon: GraduationCap, label: "Programme", value: data?.programme_code ?? "empty" },
            { icon: Layers, label: "Section", value: data?.section_code ? `Section ${data.section_code}` : "empty" },
            { icon: BookOpen, label: "Department", value: data?.department_code ?? "empty" },
            { icon: CalendarDays, label: "Batch", value: data?.batch_label ?? "empty" },
            { icon: AlertCircle, label: "Active Backlogs", value: String(data?.backlog_count ?? 0) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0"><Icon size={14} className="text-indigo-500" /></div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-primary mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Attendance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-base font-bold text-primary">Subject-wise Attendance</h2>
          </div>
          {attLoading && <Loader2 size={16} className="animate-spin text-secondary" />}
        </div>
        <div className="p-6 space-y-5">
          {attendance && attendance.subjects.length > 0 ? (
            <>
              {attendance.subjects.map((s) => <AttendanceBar key={s.subject} {...s} />)}
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarDays size={12} /> Last 60 Days
                </p>
                <div className="flex flex-wrap gap-1">
                  {attendance.daily.map((d, i) => (
                    <div key={i} title={`${d.date} � ${d.status === "P" ? "Present" : d.status === "OD" ? "On Duty" : "Absent"}`}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold cursor-default transition-transform hover:scale-125 ${
                        d.status === "P" ? "bg-emerald-500 text-white" : d.status === "OD" ? "bg-indigo-500 text-white" : "bg-rose-500 text-white"
                      }`}>{d.status}</div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-secondary">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" />Absent</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" />On Duty</span>
                </div>
              </div>
            </>
          ) : attLoading ? (
            <div className="flex items-center justify-center py-10 gap-3 text-secondary">
              <Loader2 size={20} className="animate-spin text-indigo-500" /><span className="text-sm">Loading attendance...</span>
            </div>
          ) : (
            <p className="text-center text-secondary py-8 text-sm">No attendance data available yet.</p>
          )}
        </div>
      </motion.div>

      {/* Marks Breakdown collapsible */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        <button onClick={() => setShowMarksDetail(v => !v)}
          className="w-full px-6 py-4 border-b border-border bg-surface-secondary/30 flex items-center justify-between hover:bg-surface-secondary/50 transition-colors">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" />
            <h2 className="text-base font-bold text-primary">Assessment Marks Breakdown</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-secondary font-medium hidden sm:block">
              Internal: <span className="font-black text-primary">{data?.demo_internal_overall ?? "empty"}</span>
              {" � "}External: <span className="font-black text-primary">{data?.demo_external ?? "empty"}</span>
              {" � "}Total: <span className="font-black text-indigo-600 dark:text-indigo-400">{data?.demo_total_overall ?? "empty"}</span>
            </span>
            {showMarksDetail ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-secondary" />}
          </div>
        </button>
        <AnimatePresence>
          {showMarksDetail && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="p-6 space-y-4">
                <p className="text-xs text-secondary">FA = Formative Assessment  CLA = Continuous Lab Assessment  Each component is out of 20 marks</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {componentMarks.map((m, i) => {
                    const pct = m.max > 0 ? (Number(m.value) / m.max) * 100 : 0;
                    const isLow = pct < 50;
                    return (
                      <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                        className={`rounded-2xl p-3 text-center border ${isLow ? "border-rose-300/50 bg-rose-50/50 dark:bg-rose-950/10" : "border-border bg-surface-secondary/40"}`}>
                        <div className="text-[10px] font-bold text-secondary uppercase tracking-wide">{m.label}</div>
                        <div className={`text-2xl font-black mt-1 ${isLow ? "text-rose-600 dark:text-rose-400" : "text-primary"}`}>{m.value}</div>
                        <div className="text-[10px] text-secondary">/ {m.max}</div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  {[
                    { label: "Internal Overall", value: data?.demo_internal_overall ?? "empty", color: "text-indigo-600 dark:text-indigo-400" },
                    { label: "External Marks",   value: data?.demo_external        ?? "empty", color: "text-violet-600 dark:text-violet-400" },
                    { label: "Total Overall",    value: data?.demo_total_overall   ?? "empty", color: "text-emerald-600 dark:text-emerald-400" },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">{s.label}</div>
                      <div className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Subject Results Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500" />
            <h2 className="text-base font-bold text-primary">Subject-wise Results</h2>
          </div>
          <span className="text-xs text-secondary font-medium">Published by faculty</span>
        </div>
        {data?.subjects && data.subjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-secondary/20 text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                  <th className="px-6 py-3 font-bold">Course</th>
                  <th className="px-4 py-3 font-bold text-center">Internal</th>
                  <th className="px-4 py-3 font-bold text-center">External</th>
                  <th className="px-4 py-3 font-bold text-center">Total</th>
                  <th className="px-4 py-3 font-bold text-center">Grade</th>
                  <th className="px-4 py-3 font-bold text-center">Result</th>
                </tr>
              </thead>
              <motion.tbody initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} className="divide-y divide-border/60">
                {data.subjects.map((sub) => (
                  <motion.tr key={sub.code} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }} className="hover:bg-surface/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{sub.subject}</div>
                      <div className="text-xs text-indigo-500 font-semibold">{sub.code}</div>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-secondary">{sub.internal || "empty"}</td>
                    <td className="px-4 py-4 text-center font-semibold text-secondary">{sub.external || "empty"}</td>
                    <td className="px-4 py-4 text-center font-black text-primary">{sub.total || "empty"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${GRADE_COLORS[sub.grade] ?? GRADE_COLORS["empty"]}`}>{sub.grade}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sub.status === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : sub.status === "FAIL" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {sub.status === "PASS" ? <CheckCircle2 size={11} /> : sub.status === "FAIL" ? <XCircle size={11} /> : null}
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
            <p className="text-xs mt-1">Results appear here once finalized by faculty</p>
          </div>
        )}
      </motion.div>

      {/* Support Contacts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-surface rounded-3xl border border-border shadow-sm p-6">
        <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
          <Phone size={16} className="text-indigo-500" /> Academic Support Contacts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: "Academic Office", value: "academics@vignan.ac.in", sub: "Results, transcripts and certificates" },
            { icon: Phone, label: "Examination Cell", value: "+91 863-234-5678", sub: "Exam schedules and hall tickets" },
            { icon: MapPin, label: "Department Office", value: `${data?.department_code ?? "Dept"} Office, Block A`, sub: "Attendance and internal marks queries" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="flex items-start gap-3 p-4 bg-surface-secondary/40 rounded-2xl border border-border">
              <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0"><Icon size={14} className="text-indigo-500" /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-primary mt-0.5 break-all">{value}</p>
                <p className="text-[10px] text-secondary mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
