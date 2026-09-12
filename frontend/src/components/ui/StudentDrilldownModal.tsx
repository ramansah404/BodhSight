import { useEffect, useState } from "react";
import { X, Loader2, Users, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent10API } from "../../services/api";
import { useFilters } from "../../contexts/FilterContext";
import type { StudentProfile } from "../../types/agent10";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  courseCode?: string;
  title: string;
}

export default function StudentDrilldownModal({ isOpen, onClose, context, courseCode, title }: Props) {
  const { filters } = useFilters();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    Agent10API.getStudentDrilldown(context, { ...filters, course_code: courseCode })
      .then((data) => {
        if (!cancelled) {
          setStudents(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.response?.data?.detail || err?.message || String(err);
          setError(`Failed to load students: ${msg}`);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [isOpen, context, courseCode, filters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/50">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {students.length} record{students.length !== 1 && "s"} for current filters
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Fetching student records...</p>
                </div>
              ) : error ? (
                <div className="h-64 flex flex-col items-center justify-center text-rose-500 gap-3">
                  <AlertTriangle className="w-8 h-8" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Users className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">No students found matching this criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-surface-secondary/50 border-b border-border text-muted-foreground">
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider">Roll No</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider">Name</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider">Program</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider">Attendance</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider">CGPA</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider">Reason / Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((s) => (
                        <tr key={s.student_id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium text-foreground whitespace-nowrap">{s.roll_no}</td>
                          <td className="p-3 text-foreground whitespace-nowrap">
                            {s.full_name}
                            <div className="text-xs text-muted-foreground">{s.department_code} • {s.batch_label}</div>
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">{s.programme_code}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (s.attendance_pct ?? 0) < 75 
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {s.attendance_pct != null ? `${s.attendance_pct}%` : "N/A"}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="text-foreground font-medium">{s.cgpa != null ? s.cgpa.toFixed(2) : "N/A"}</div>
                            {s.backlog_count != null && s.backlog_count > 0 && (
                              <div className="text-xs text-rose-500 font-medium">{s.backlog_count} Backlogs</div>
                            )}
                          </td>
                          <td className="p-3 text-foreground text-sm max-w-[200px] truncate" title={s.reason}>
                            {s.reason || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
