import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenCheck, Save, AlertCircle, ChevronDown, ChevronUp,
  Loader2, RefreshCw, MinusCircle, Settings2, CheckCircle2, X, Upload
} from "lucide-react";
import { apiClient, CrudDataAPI } from "../services/api";
import { useRole } from "../contexts/RoleContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentMarksRow {
  student_id: string;
  full_name: string;
  roll_no: string;
  section_code: string;
  marks: {
    demo_fa1: number; demo_cla1: number;
    demo_fa2: number; demo_cla2: number;
    demo_fa3: number; demo_cla3: number;
    demo_fa4: number; demo_cla4: number;
    demo_cla5: number; demo_penalty: number;
    demo_external: number;
    demo_internal_overall: number;
    demo_external_overall: number;
    demo_total_overall: number;
    demo_marks_config: Record<string, number>; // component -> max_limit
  };
  dirty: boolean;
  saving: boolean;
  error: string;
}

// Default max limits that Faculty can customise
const COMPONENTS = [
  { key: "demo_fa1",  label: "FA-1",  defaultMax: 20 },
  { key: "demo_cla1", label: "CLA-1", defaultMax: 20 },
  { key: "demo_fa2",  label: "FA-2",  defaultMax: 20 },
  { key: "demo_cla2", label: "CLA-2", defaultMax: 20 },
  { key: "demo_fa3",  label: "FA-3",  defaultMax: 20 },
  { key: "demo_cla3", label: "CLA-3", defaultMax: 20 },
  { key: "demo_fa4",  label: "FA-4",  defaultMax: 20 },
  { key: "demo_cla4", label: "CLA-4", defaultMax: 20 },
  { key: "demo_cla5", label: "CLA-5", defaultMax: 20 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManageMarks() {
  const { currentRole } = useRole();
  const canEdit = ["Faculty", "HOD", "Admin"].includes(currentRole ?? "");

  const [students, setStudents] = useState<StudentMarksRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [maxLimits, setMaxLimits] = useState<Record<string, number>>(
    Object.fromEntries(COMPONENTS.map(c => [c.key, c.defaultMax]))
  );
  const [showLimitsEditor, setShowLimitsEditor] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load students list ─────────────────────────────────────────────────

  const loadStudents = useCallback(async (sectionCode: string) => {
    if (!sectionCode) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/students/with-marks", { params: { section: sectionCode } });
      const rows: StudentMarksRow[] = (res.data as any[]).map((s: any) => {
        const marks = {
          demo_fa1: s.demo_fa1 || 0,
          demo_cla1: s.demo_cla1 || 0,
          demo_fa2: s.demo_fa2 || 0,
          demo_cla2: s.demo_cla2 || 0,
          demo_fa3: s.demo_fa3 || 0,
          demo_cla3: s.demo_cla3 || 0,
          demo_fa4: s.demo_fa4 || 0,
          demo_cla4: s.demo_cla4 || 0,
          demo_cla5: s.demo_cla5 || 0,
          demo_penalty: s.demo_penalty || 0,
          demo_external: s.demo_external || 0,
          demo_internal_overall: s.demo_internal_overall || 0,
          demo_external_overall: s.demo_external_overall || 0,
          demo_total_overall: s.demo_total_overall || 0,
          demo_marks_config: s.demo_marks_config || {}
        };
        return {
          student_id: s.student_id,
          full_name: s.full_name,
          roll_no: s.roll_no,
          section_code: s.section_code,
          marks,
          dirty: false,
          saving: false,
          error: ""
        };
      });
      setStudents(rows);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    CrudDataAPI.getSections()
      .then(data => {
        setSections(data);
        if (data.length > 0) {
          setSelectedSection(data[0]);
          loadStudents(data[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [loadStudents]);

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSection(val);
    loadStudents(val);
  };

  // ─── Per-cell change handler ────────────────────────────────────────────

  const handleMarkChange = (studentId: string, field: string, rawValue: string) => {
    const num = parseFloat(rawValue);
    const value = isNaN(num) ? 0 : num;
    const limit = maxLimits[field];

    setStudents(prev =>
      prev.map(s => {
        if (s.student_id !== studentId) return s;
        const newMarks = { ...s.marks, [field]: Math.min(value, limit ?? 999) };
        return { ...s, marks: newMarks, dirty: true, error: "" };
      })
    );
  };

  const handlePenaltyChange = (studentId: string, rawValue: string) => {
    const num = parseFloat(rawValue);
    const value = isNaN(num) ? 0 : Math.max(0, num);
    setStudents(prev =>
      prev.map(s => {
        if (s.student_id !== studentId) return s;
        return { ...s, marks: { ...s.marks, demo_penalty: value }, dirty: true, error: "" };
      })
    );
  };

  const handleExternalChange = (studentId: string, rawValue: string) => {
    const num = parseFloat(rawValue);
    const value = isNaN(num) ? 0 : Math.min(num, maxLimits["demo_external"] ?? 100);
    setStudents(prev =>
      prev.map(s => {
        if (s.student_id !== studentId) return s;
        return { ...s, marks: { ...s.marks, demo_external: value }, dirty: true };
      })
    );
  };

  // ─── Save single student ────────────────────────────────────────────────

  const saveStudent = async (studentId: string) => {
    const s = students.find(x => x.student_id === studentId);
    if (!s) return;

    setStudents(prev => prev.map(x => x.student_id === studentId ? { ...x, saving: true, error: "" } : x));
    try {
      await apiClient.put(`/students/${studentId}/marks`, {
        ...s.marks,
        demo_marks_config: maxLimits
      });
      setStudents(prev => prev.map(x => x.student_id === studentId ? { ...x, saving: false, dirty: false } : x));
      showToast(`Marks saved for ${s.full_name}`, "success");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "Save failed";
      setStudents(prev => prev.map(x => x.student_id === studentId ? { ...x, saving: false, error: msg } : x));
      showToast(msg, "error");
    }
  };

  // ─── Save all dirty rows ────────────────────────────────────────────────

  const saveAll = async () => {
    const dirty = students.filter(s => s.dirty);
    if (!dirty.length) return;
    setGlobalSaving(true);
    await Promise.all(dirty.map(s => saveStudent(s.student_id)));
    setGlobalSaving(false);
    showToast("All changes saved!", "success");
  };

  // ─── Bulk Upload CSV ────────────────────────────────────────────────────

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient.post("/students/bulk-upload-marks", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showToast(res.data.message || "Bulk upload successful", "success");
      if (selectedSection) loadStudents(selectedSection);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Bulk upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ─── Calculate totals locally for instant preview ──────────────────────

  const calcPreview = (marks: StudentMarksRow["marks"]) => {
    const internal = COMPONENTS.reduce((sum, c) => sum + (marks[c.key as keyof typeof marks] as number || 0), 0)
      - (marks.demo_penalty || 0);
    return {
      internal: Math.max(0, internal),
      total: Math.max(0, internal) + (marks.demo_external || 0)
    };
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle size={40} className="text-amber-500" />
        <h2 className="text-xl font-bold text-primary">Access Restricted</h2>
        <p className="text-secondary text-sm">Only Faculty, HOD, and Admin can manage marks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpenCheck className="text-indigo-500" size={24} />
            Manage Marks
          </h1>
          <p className="text-sm text-secondary mt-1">
            Edit FA/CLA marks per student. Penalty deductions and external marks are factored into overall totals automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLimitsEditor(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-semibold text-secondary hover:text-primary hover:border-indigo-500/50 transition-all"
          >
            <Settings2 size={15} />
            Set Max Limits
            {showLimitsEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          <select 
            value={selectedSection}
            onChange={handleSectionChange}
            className="px-4 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-primary focus:outline-none focus:border-indigo-500"
          >
            {sections.length === 0 && <option value="">No sections found</option>}
            {sections.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const newSection = prompt("Enter new section name (e.g. 9 or 10):");
              if (newSection && newSection.trim()) {
                const code = newSection.trim();
                CrudDataAPI.addSection(code).then(res => {
                  setSections(prev => {
                    const next = [...prev, res].sort();
                    return Array.from(new Set(next));
                  });
                  setSelectedSection(res);
                  loadStudents(res);
                  showToast(`Section ${res} created successfully!`, "success");
                }).catch(err => {
                  showToast(err?.response?.data?.detail || err.message || "Failed to create section", "error");
                });
              }
            }}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-semibold transition-all"
          >
            + Add Section
          </button>

          <button
            onClick={() => loadStudents(selectedSection)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-semibold text-secondary hover:text-primary transition-all"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleBulkUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-all"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Bulk Upload CSV
          </button>
          <button
            onClick={saveAll}
            disabled={globalSaving || !students.some(s => s.dirty)}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            {globalSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save All Changes
          </button>
        </div>
      </div>

      {/* Max Limits Editor */}
      <AnimatePresence>
        {showLimitsEditor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface border border-indigo-500/20 rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-bold text-primary text-sm mb-4 flex items-center gap-2">
              <Settings2 size={15} className="text-indigo-500" />
              Configure Max Marks per Component
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {COMPONENTS.map(c => (
                <div key={c.key}>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">{c.label} Max</label>
                  <input
                    type="number"
                    min={0}
                    value={maxLimits[c.key] ?? c.defaultMax}
                    onChange={e => setMaxLimits(prev => ({ ...prev, [c.key]: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold text-primary focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">External Max</label>
                <input
                  type="number"
                  min={0}
                  value={maxLimits["demo_external"] ?? 100}
                  onChange={e => setMaxLimits(prev => ({ ...prev, demo_external: Number(e.target.value) }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold text-primary focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-secondary mt-3">
              ⚠ These limits apply to all students. Marks entered above the limit are automatically capped.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-secondary">
          <Loader2 size={24} className="animate-spin" />
          <span className="font-medium">Loading student marks...</span>
        </div>
      )}

      {/* Marks Table */}
      {!loading && students.length > 0 && (
        <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-secondary/50 text-secondary uppercase tracking-wider border-b border-border/60">
                  <th className="py-3 px-4 font-bold sticky left-0 bg-surface-secondary/50 z-10">Student</th>
                  {COMPONENTS.map(c => (
                    <th key={c.key} className="py-3 px-3 font-bold text-center">
                      {c.label}
                      <span className="block text-[10px] text-indigo-400 font-normal">/{maxLimits[c.key] ?? c.defaultMax}</span>
                    </th>
                  ))}
                  <th className="py-3 px-3 font-bold text-center text-rose-500">
                    <MinusCircle size={12} className="inline mr-1" />Penalty
                  </th>
                  <th className="py-3 px-3 font-bold text-center">
                    External
                    <span className="block text-[10px] text-indigo-400 font-normal">/{maxLimits["demo_external"] ?? 100}</span>
                  </th>
                  <th className="py-3 px-3 font-bold text-center text-indigo-500">Internal</th>
                  <th className="py-3 px-3 font-bold text-center text-emerald-500">Total</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
                className="divide-y divide-border/60"
              >
                {students.map(s => {
                  const preview = calcPreview(s.marks);
                  return (
                    <motion.tr
                      key={s.student_id}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      className={`transition-colors ${s.dirty ? "bg-indigo-500/5" : "hover:bg-surface/80"}`}
                    >
                      {/* Student info */}
                      <td className="py-2.5 px-4 sticky left-0 bg-surface z-10 border-r border-border/40">
                        <div className="font-bold text-primary text-xs">{s.full_name}</div>
                        <div className="text-[10px] text-secondary">{s.roll_no} · {s.section_code}</div>
                        {s.error && <div className="text-[10px] text-rose-500 mt-0.5">{s.error}</div>}
                      </td>

                      {/* FA / CLA inputs */}
                      {COMPONENTS.map(c => (
                        <td key={c.key} className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            max={maxLimits[c.key] ?? c.defaultMax}
                            step={0.5}
                            value={s.marks[c.key as keyof typeof s.marks] as number}
                            onChange={e => handleMarkChange(s.student_id, c.key, e.target.value)}
                            disabled={!canEdit}
                            className={`w-14 text-center bg-background border rounded-lg py-1 px-1 text-sm font-semibold text-primary focus:outline-none focus:ring-1 transition-colors ${
                              (s.marks[c.key as keyof typeof s.marks] as number) === 0
                                ? "border-rose-400/40 focus:border-rose-500 focus:ring-rose-500/30"
                                : "border-border focus:border-indigo-500 focus:ring-indigo-500/30"
                            }`}
                          />
                        </td>
                      ))}

                      {/* Penalty */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={s.marks.demo_penalty}
                          onChange={e => handlePenaltyChange(s.student_id, e.target.value)}
                          disabled={!canEdit}
                          className="w-14 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-400/40 rounded-lg py-1 px-1 text-sm font-semibold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500 transition-colors"
                        />
                      </td>

                      {/* External */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min={0}
                          max={maxLimits["demo_external"] ?? 100}
                          step={0.5}
                          value={s.marks.demo_external}
                          onChange={e => handleExternalChange(s.student_id, e.target.value)}
                          disabled={!canEdit}
                          className="w-16 text-center bg-background border border-border rounded-lg py-1 px-1 text-sm font-semibold text-primary focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500/30 transition-colors"
                        />
                      </td>

                      {/* Calculated Internal */}
                      <td className="py-2 px-3 text-center">
                        <span className={`font-extrabold text-sm ${preview.internal < 40 ? "text-rose-500" : "text-indigo-600 dark:text-indigo-400"}`}>
                          {preview.internal.toFixed(1)}
                        </span>
                      </td>

                      {/* Calculated Total */}
                      <td className="py-2 px-3 text-center">
                        <span className={`font-extrabold text-sm ${preview.total < 50 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {preview.total.toFixed(1)}
                        </span>
                      </td>

                      {/* Save button */}
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => saveStudent(s.student_id)}
                          disabled={!s.dirty || s.saving || !canEdit}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          {s.saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          {s.saving ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border/60 bg-surface-secondary/30 text-xs text-secondary flex items-center gap-2">
            <BookOpenCheck size={12} className="text-indigo-500" />
            Internal = Σ(FA + CLA) − Penalty. Total = Internal + External. Values are capped at the configured maximum limits.
          </div>
        </div>
      )}

      {!loading && students.length === 0 && !error && (
        <div className="py-20 text-center text-secondary font-medium">No students found for your department.</div>
      )}
    </div>
  );
}
