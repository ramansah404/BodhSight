import { useEffect, useState, useCallback } from "react";
import {
  X, Loader2, Users, AlertTriangle, Edit2, Save, XCircle,
  Plus, Trash2, CalendarDays, BookOpen, ShieldAlert,
  CheckCircle2, Clock, AlertCircle, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent10API } from "../../services/api";
import { useFilters } from "../../contexts/FilterContext";
import { useRole } from "../../contexts/RoleContext";
import type { StudentProfile } from "../../types/agent10";
import StudentEditorModal, { type StudentFormData } from "../students/StudentEditorModal";
import MarksEntryModal from "./MarksEntryModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  courseCode?: string;
  title: string;
  initialStudent?: StudentProfile;
}

type TabId = "summary" | "attendance" | "marks";

const INTERVENTION_STATUSES = [
  { value: "MONITORING",   label: "Monitoring",            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  { value: "COUNSELLED",   label: "Counselled",            color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  { value: "PEER_MENTOR",  label: "Peer Mentor Assigned",  color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
  { value: "CRITICAL",     label: "Critical — Escalated",  color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
  { value: "RESOLVED",     label: "Resolved",              color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
];

// ─── Student Row Detail Panel ─────────────────────────────────────────────────

function StudentDetailPanel({ student, onClose, onRefresh, canEdit }: {
  student: StudentProfile;
  onClose: () => void;
  onRefresh: () => void;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<TabId>("summary");
  const [attendance, setAttendance] = useState<{
    subjects: { subject: string; present: number; total: number; pct: number }[];
    daily: { date: string; status: "P" | "A" | "OD" }[];
  } | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Intervention state
  const [interventionStatus, setInterventionStatus] = useState(
    student.reason?.match(/^\[(.+?)\]/)?.[1] ?? "MONITORING"
  );
  const [interventionNote, setInterventionNote] = useState(
    student.reason?.replace(/^\[.+?\]\s*/, "") ?? ""
  );
  const [savingIntervention, setSavingIntervention] = useState(false);
  const [interventionSaved, setInterventionSaved] = useState(false);

  // Marks state
  const [marksOpen, setMarksOpen] = useState(false);

  useEffect(() => {
    if (tab === "attendance" && !attendance) {
      setAttendanceLoading(true);
      Agent10API.getStudentAttendance(student.student_id)
        .then(d => { setAttendance(d); setAttendanceLoading(false); })
        .catch(() => setAttendanceLoading(false));
    }
  }, [tab, student.student_id, attendance]);

  const saveIntervention = async () => {
    setSavingIntervention(true);
    try {
      await Agent10API.updateInterventionStatus(student.student_id, interventionStatus, interventionNote);
      setInterventionSaved(true);
      setTimeout(() => setInterventionSaved(false), 2500);
      onRefresh();
    } catch {}
    setSavingIntervention(false);
  };

  const statusInfo = INTERVENTION_STATUSES.find(s => s.value === interventionStatus) ?? INTERVENTION_STATUSES[0];

  return (
    <div className="flex flex-col h-full">
      {/* Student header */}
      <div className="flex items-start justify-between gap-4 p-5 border-b border-border/60 bg-surface-secondary/30">
        <div className="min-w-0">
          <div className="font-bold text-primary text-base truncate">{student.full_name}</div>
          <div className="text-xs text-secondary mt-0.5">
            {student.roll_no} · {student.department_code} · {student.programme_code}
            {student.batch_label && ` · ${student.batch_label}`}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              (student.attendance_pct ?? 0) < 75
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}>
              {student.attendance_pct != null ? `${student.attendance_pct}% Attendance` : "Attendance N/A"}
            </span>
            {student.backlog_count != null && student.backlog_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {student.backlog_count} Backlogs
              </span>
            )}
            {student.cgpa != null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                CGPA {student.cgpa.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-secondary hover:text-primary hover:bg-border rounded-full transition-colors flex-shrink-0"
        >
          <XCircle size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 px-4 bg-surface-secondary/20">
        {([
          { id: "summary", label: "Summary", icon: ShieldAlert },
          { id: "attendance", label: "Attendance", icon: CalendarDays },
          { id: "marks", label: "Marks", icon: BookOpen },
        ] as { id: TabId; label: string; icon: React.ElementType }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              tab === t.id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Summary Tab */}
        {tab === "summary" && (
          <div className="space-y-4">
            {/* Intervention status */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} className="text-amber-500" />
                Intervention Status
              </h4>
              <div className="relative">
                <select
                  value={interventionStatus}
                  onChange={e => { setInterventionStatus(e.target.value); setInterventionSaved(false); }}
                  disabled={!canEdit}
                  className={`w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-sm font-semibold border border-border focus:outline-none focus:border-indigo-500 transition-colors ${statusInfo.color}`}
                >
                  {INTERVENTION_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
              </div>
              <textarea
                value={interventionNote}
                onChange={e => { setInterventionNote(e.target.value); setInterventionSaved(false); }}
                disabled={!canEdit}
                rows={2}
                placeholder="Add intervention notes (optional)..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-secondary focus:outline-none focus:border-indigo-500 resize-none transition-colors"
              />
              {canEdit && (
                <button
                  onClick={saveIntervention}
                  disabled={savingIntervention}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    interventionSaved
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {savingIntervention ? <Loader2 size={13} className="animate-spin" /> : interventionSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
                  {savingIntervention ? "Saving..." : interventionSaved ? "Saved!" : "Save Status"}
                </button>
              )}
            </div>

            {/* Reason */}
            {student.reason && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Flagged Reason</div>
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">{student.reason}</p>
              </div>
            )}

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Attendance", value: `${student.attendance_pct ?? "—"}%`, bad: (student.attendance_pct ?? 100) < 75 },
                { label: "CGPA", value: student.cgpa?.toFixed(2) ?? "—", bad: (student.cgpa ?? 10) < 6 },
                { label: "Backlogs", value: student.backlog_count ?? 0, bad: (student.backlog_count ?? 0) > 0 },
                { label: "Section", value: student.section_code ?? "—", bad: false },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl p-3 border ${stat.bad ? "border-rose-400/30 bg-rose-50 dark:bg-rose-950/20" : "border-border bg-surface"}`}>
                  <div className="text-xs text-secondary font-semibold uppercase tracking-wider">{stat.label}</div>
                  <div className={`text-xl font-black mt-1 ${stat.bad ? "text-rose-600 dark:text-rose-400" : "text-primary"}`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {tab === "attendance" && (
          <div className="space-y-4">
            {attendanceLoading && (
              <div className="flex items-center justify-center py-12 gap-3 text-secondary">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Loading attendance data...</span>
              </div>
            )}
            {attendance && !attendanceLoading && (
              <>
                {/* Subject-wise */}
                <div>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen size={12} />Subject-wise Attendance
                  </h4>
                  <div className="space-y-2">
                    {attendance.subjects.map(s => (
                      <div key={s.subject} className="bg-surface border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-primary">{s.subject}</span>
                          <span className={`text-xs font-bold ${s.pct < 75 ? "text-rose-600" : "text-emerald-600"}`}>
                            {s.pct}% ({s.present}/{s.total})
                          </span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.pct}%` }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className={`h-full rounded-full ${s.pct < 75 ? "bg-rose-500" : "bg-emerald-500"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day-wise heatmap */}
                <div>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CalendarDays size={12} />Day-wise Calendar (Last 30 days)
                  </h4>
                  <div className="grid grid-cols-10 gap-1">
                    {attendance.daily.map((d, i) => (
                      <div
                        key={i}
                        title={`${d.date}: ${d.status === "P" ? "Present" : d.status === "OD" ? "On Duty" : "Absent"}`}
                        className={`aspect-square rounded-md text-center flex items-center justify-center text-[9px] font-bold cursor-default transition-all hover:scale-110 ${
                          d.status === "P"
                            ? "bg-emerald-500/80 text-white"
                            : d.status === "OD"
                            ? "bg-indigo-500/80 text-white"
                            : "bg-rose-500/80 text-white"
                        }`}
                      >
                        {d.status}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-secondary">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Present</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block" />Absent</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" />On Duty</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Marks Tab */}
        {tab === "marks" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["FA-1", student.demo_fa1], ["CLA-1", student.demo_cla1],
                ["FA-2", student.demo_fa2], ["CLA-2", student.demo_cla2],
                ["FA-3", student.demo_fa3], ["CLA-3", student.demo_cla3],
                ["FA-4", student.demo_fa4], ["CLA-4", student.demo_cla4],
                ["CLA-5", student.demo_cla5],
              ].map(([label, val]) => (
                <div key={String(label)} className="bg-surface border border-border rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</div>
                  <div className="text-lg font-black text-primary mt-0.5">{val ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Internal</div>
                <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{student.demo_internal_overall ?? "—"}</div>
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">External</div>
                <div className="text-lg font-black text-violet-700 dark:text-violet-300 mt-0.5">{student.demo_external ?? "—"}</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total</div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{student.demo_total_overall ?? "—"}</div>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setMarksOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <Edit2 size={14} />Update Marks
              </button>
            )}
          </div>
        )}
      </div>

      {/* Marks Modal */}
      <MarksEntryModal
        isOpen={marksOpen}
        onClose={() => setMarksOpen(false)}
        student={student}
        onSaved={() => { setMarksOpen(false); onRefresh(); }}
      />
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function StudentDrilldownModal({ isOpen, onClose, context, courseCode, title, initialStudent }: Props) {
  const { filters } = useFilters();
  const { role } = useRole();
  const canEdit = ["Faculty", "HOD", "Admin", "Dean", "Principal", "Chairman"].includes(role ?? "");

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<StudentFormData | null>(null);

  const loadStudents = useCallback(() => {
    if (initialStudent) {
      setStudents([initialStudent]);
      setSelectedStudent(initialStudent);
      return;
    }
    setLoading(true);
    setError("");
    Agent10API.getStudentDrilldown(context, { ...filters, course_code: courseCode })
      .then((data) => { setStudents(data); setLoading(false); })
      .catch((err) => {
        setError(err?.response?.data?.detail || err?.message || String(err));
        setLoading(false);
      });
  }, [context, courseCode, filters, initialStudent]);

  useEffect(() => {
    if (!isOpen) { 
      setSelectedStudent(null); 
      setStudents([]);
      return; 
    }
    loadStudents();
  }, [isOpen, loadStudents]);

  const handleSaveModal = async (data: StudentFormData) => {
    if (data.student_id) await Agent10API.updateStudent(data.student_id, data);
    else await Agent10API.createStudent(data);
    loadStudents();
  };

  const handleDelete = async (studentId: string, name: string) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return;
    try { await Agent10API.deleteStudent(studentId); loadStudents(); }
    catch (e: any) { alert("Delete failed: " + (e?.response?.data?.detail || e.message)); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedStudent(null); onClose(); }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal shell */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-surface border border-border shadow-2xl rounded-2xl w-full pointer-events-auto flex flex-col overflow-hidden"
              style={{ maxWidth: selectedStudent ? 1100 : 820, maxHeight: "88dvh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/30 flex-shrink-0">
                <div>
                  <h2 className="text-base font-bold text-primary flex items-center gap-2">
                    <Users className="text-indigo-500" size={18} />
                    {title}
                  </h2>
                  <p className="text-xs text-secondary mt-0.5">
                    {students.length} student{students.length !== 1 ? "s" : ""} matched
                    {selectedStudent ? " · Click a row to change selection" : " · Click a row to view details"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      onClick={() => { setEditorData(null); setIsEditorOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <Plus size={13} />Add Student
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedStudent(null); onClose(); }}
                    className="p-2 hover:bg-border rounded-full transition-colors text-secondary hover:text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body: two-pane if student selected */}
              <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Student list */}
                <div className={`flex flex-col ${selectedStudent ? "w-72 min-w-[260px] border-r border-border/60" : "flex-1"} overflow-hidden`}>
                  <div className="flex-1 overflow-y-auto">
                    {loading && (
                      <div className="h-48 flex items-center justify-center gap-3 text-secondary">
                        <Loader2 size={22} className="animate-spin" />
                        <span className="text-sm font-medium">Loading students…</span>
                      </div>
                    )}
                    {error && (
                      <div className="h-48 flex flex-col items-center justify-center gap-2 text-rose-500 px-6 text-center">
                        <AlertTriangle size={24} />
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    )}
                    {!loading && !error && students.length === 0 && (
                      <div className="h-48 flex flex-col items-center justify-center gap-2 text-secondary">
                        <Users size={28} className="opacity-20" />
                        <p className="text-sm font-medium">No students found for these filters.</p>
                      </div>
                    )}
                    {!loading && !error && students.length > 0 && (
                      selectedStudent ? (
                        /* Compact list when detail pane is open */
                        <div className="divide-y divide-border/50">
                          {students.map(s => (
                            <button
                              key={s.student_id}
                              onClick={() => setSelectedStudent(s)}
                              className={`w-full text-left px-4 py-3 transition-colors ${
                                selectedStudent?.student_id === s.student_id
                                  ? "bg-indigo-50 dark:bg-indigo-950/30"
                                  : "hover:bg-surface-secondary/40"
                              }`}
                            >
                              <div className="font-semibold text-primary text-xs truncate">{s.full_name}</div>
                              <div className="text-[10px] text-secondary mt-0.5">{s.roll_no} · {s.attendance_pct ?? "—"}% att.</div>
                              {s.backlog_count != null && s.backlog_count > 0 && (
                                <div className="text-[10px] text-rose-500 font-semibold">{s.backlog_count} backlogs</div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        /* Full table when no detail pane */
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead className="border-b border-border bg-surface-secondary/30">
                              <tr className="text-secondary text-xs uppercase tracking-wider">
                                <th className="px-4 py-3 font-bold">Student</th>
                                <th className="px-4 py-3 font-bold">Section</th>
                                <th className="px-4 py-3 font-bold">Attendance</th>
                                <th className="px-4 py-3 font-bold">CGPA</th>
                                <th className="px-4 py-3 font-bold">Backlogs</th>
                                <th className="px-4 py-3 font-bold">Status</th>
                                <th className="px-4 py-3 font-bold text-right">Actions</th>
                              </tr>
                            </thead>
                            <motion.tbody
                              initial="hidden" animate="show"
                              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
                              className="divide-y divide-border/60"
                            >
                              {students.map(s => (
                                <motion.tr
                                  key={s.student_id}
                                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                                  onClick={() => setSelectedStudent(s)}
                                  className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-primary">{s.full_name}</div>
                                    <div className="text-xs text-secondary">{s.roll_no} · {s.department_code}</div>
                                  </td>
                                  <td className="px-4 py-3 text-secondary text-sm">{s.section_code ?? "—"}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      (s.attendance_pct ?? 100) < 75
                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                    }`}>
                                      {s.attendance_pct != null ? `${s.attendance_pct}%` : "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-primary">{s.cgpa?.toFixed(2) ?? "—"}</td>
                                  <td className="px-4 py-3">
                                    {(s.backlog_count ?? 0) > 0
                                      ? <span className="text-rose-600 dark:text-rose-400 font-bold">{s.backlog_count}</span>
                                      : <span className="text-secondary">—</span>
                                    }
                                  </td>
                                  <td className="px-4 py-3">
                                    {s.reason ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                        {s.reason.match(/^\[(.+?)\]/)?.[1] ?? "Flagged"}
                                      </span>
                                    ) : (
                                      <span className="text-secondary text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                      <button
                                        onClick={() => setSelectedStudent(s)}
                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                        title="View Details"
                                      >
                                        <Clock size={15} />
                                      </button>
                                      {canEdit && (
                                        <button
                                          onClick={() => handleDelete(s.student_id, s.full_name)}
                                          className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </motion.tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Detail panel */}
                <AnimatePresence>
                  {selectedStudent && (
                    <motion.div
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="flex-1 min-w-0 flex flex-col overflow-hidden"
                    >
                      <StudentDetailPanel
                        student={selectedStudent}
                        onClose={() => setSelectedStudent(null)}
                        onRefresh={loadStudents}
                        canEdit={canEdit}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Add/Edit student modal */}
          <StudentEditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSave={handleSaveModal}
            initialData={editorData}
          />
        </>
      )}
    </AnimatePresence>
  );
}
