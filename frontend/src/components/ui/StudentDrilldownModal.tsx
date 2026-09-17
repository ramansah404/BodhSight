import { useEffect, useState } from "react";
import { X, Loader2, Users, AlertTriangle, Edit2, Save, XCircle, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent10API } from "../../services/api";
import { useFilters } from "../../contexts/FilterContext";
import type { StudentProfile } from "../../types/agent10";
import StudentEditorModal, { StudentFormData } from "../students/StudentEditorModal";

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

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<StudentFormData | null>(null);

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

  const handleSaveInline = async (studentId: string) => {
    try {
      await Agent10API.updateStudent(studentId, editForm);
      setEditingId(null);
      loadStudents(); // Reload to see updated persistence
    } catch (e: any) {
      alert("Failed to save updates: " + (e?.response?.data?.detail || e.message));
    }
  };

  const handleSaveModal = async (data: StudentFormData) => {
    if (data.student_id) {
      await Agent10API.updateStudent(data.student_id, data);
    } else {
      await Agent10API.createStudent(data);
    }
    loadStudents();
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this student?")) return;
    try {
      await Agent10API.deleteStudent(studentId);
      loadStudents();
    } catch (e: any) {
      alert("Failed to delete student: " + (e?.response?.data?.detail || e.message));
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
            className="fixed inset-0 z-[9999] glass-overlay"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-5xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85dvh] pointer-events-auto min-w-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border glass-surface-strong">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {students.length} record{students.length !== 1 && "s"} for current filters
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setEditorData(null); setIsEditorOpen(true); }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> Add Student
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
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
                <div className="max-w-full overflow-x-auto border border-border rounded-xl">
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
                                  <button onClick={() => handleSaveInline(s.student_id)} className="p-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-md transition-colors" title="Save"><Save size={16}/></button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-md transition-colors" title="Cancel"><XCircle size={16}/></button>
                               </div>
                             ) : (
                               <div className="flex items-center justify-end gap-1">
                                 <button onClick={() => { setEditorData({
                                   student_id: s.student_id,
                                   full_name: s.full_name,
                                   roll_no: s.roll_no,
                                   section_code: s.section_code || "",
                                   email: "",
                                   cgpa: s.cgpa || 0,
                                   attendance_pct: s.attendance_pct || 0
                                 }); setIsEditorOpen(true); }} className="p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors" title="Full Edit">
                                   <Edit2 size={16}/>
                                 </button>
                                 <button onClick={() => handleDelete(s.student_id)} className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors" title="Delete Student">
                                   <Trash2 size={16}/>
                                 </button>
                               </div>
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
