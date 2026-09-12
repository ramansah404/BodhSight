import { useEffect, useState } from "react";
import { X, Loader2, Users, AlertTriangle, Edit2, Save, XCircle } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StudentProfile>>({});

  const loadStudents = () => {
    setLoading(true);
    setError("");
    Agent10API.getStudentDrilldown(context, { ...filters, course_code: courseCode })
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || String(err);
        setError(`Failed to load students: ${msg}`);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      return;
    }
    loadStudents();
  }, [isOpen, context, courseCode, filters]);

  const handleSave = async (studentId: string) => {
    try {
      await Agent10API.updateStudentProfile(studentId, editForm);
      setEditingId(null);
      loadStudents(); // Reload to see updated persistence
    } catch (e) {
      console.error(e);
      alert("Failed to save updates.");
    }
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
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto min-w-0"
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
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((s) => {
                        const isEditing = editingId === s.student_id;
                        return (
                        <tr key={s.student_id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium text-foreground whitespace-nowrap">{s.roll_no}</td>
                          <td className="p-3 text-foreground whitespace-nowrap">
                            {s.full_name}
                            <div className="text-xs text-muted-foreground">{s.department_code} • {s.batch_label}</div>
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">{s.programme_code}</td>
                          <td className="p-3 whitespace-nowrap">
                            {isEditing ? (
                               <input type="number" className="w-20 bg-surface border border-border rounded px-2 py-1 text-xs" value={editForm.attendance_pct ?? s.attendance_pct ?? 0} onChange={(e) => setEditForm({...editForm, attendance_pct: Number(e.target.value)})} />
                            ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (s.attendance_pct ?? 0) < 75 
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {s.attendance_pct != null ? `${s.attendance_pct}%` : "N/A"}
                            </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isEditing ? (
                               <input type="number" step="0.01" className="w-20 bg-surface border border-border rounded px-2 py-1 text-xs mb-1" value={editForm.cgpa ?? s.cgpa ?? 0} onChange={(e) => setEditForm({...editForm, cgpa: Number(e.target.value)})} />
                            ) : (
                               <div className="text-foreground font-medium">{s.cgpa != null ? s.cgpa.toFixed(2) : "N/A"}</div>
                            )}
                            
                            {isEditing ? (
                               <input type="number" placeholder="Backlogs" className="w-20 bg-surface border border-border rounded px-2 py-1 text-xs" value={editForm.backlog_count ?? s.backlog_count ?? 0} onChange={(e) => setEditForm({...editForm, backlog_count: Number(e.target.value)})} />
                            ) : (
                              s.backlog_count != null && s.backlog_count > 0 && (
                                <div className="text-xs text-rose-500 font-medium">{s.backlog_count} Backlogs</div>
                              )
                            )}
                          </td>
                          <td className="p-3 text-foreground text-sm max-w-[200px] truncate" title={s.reason}>
                            {isEditing ? (
                               <input type="text" className="w-full bg-surface border border-border rounded px-2 py-1 text-xs" value={editForm.reason ?? s.reason ?? ""} onChange={(e) => setEditForm({...editForm, reason: e.target.value})} />
                            ) : (
                              s.reason || "N/A"
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-right">
                             {isEditing ? (
                               <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleSave(s.student_id)} className="p-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-md transition-colors"><Save size={16}/></button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-md transition-colors"><XCircle size={16}/></button>
                               </div>
                             ) : (
                               <button onClick={() => { setEditingId(s.student_id); setEditForm(s); }} className="p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors" title="Modify Details">
                                 <Edit2 size={16}/>
                               </button>
                             )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
