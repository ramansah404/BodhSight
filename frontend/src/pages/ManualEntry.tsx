import { useState, useEffect } from "react";
import { CrudDataAPI, type StudentDataResponse } from "../services/api";
import { Save, AlertCircle, CheckCircle2, Edit3, RotateCcw, Users, Percent, BookOpen, Hash } from "lucide-react";

export default function ManualEntry() {
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [students, setStudents] = useState<StudentDataResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Track edited values for each student ID
  const [editedData, setEditedData] = useState<Record<string, { attendance_pct: string; cgpa: string; backlog_count: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    CrudDataAPI.getSections()
      .then(data => {
        setSections(data);
        if (data.length > 0) setSelectedSection(data[0]);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    setLoading(true);
    setEditedData({});
    setSuccessMsg("");
    setError("");
    CrudDataAPI.getStudentsBySection(selectedSection)
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedSection]);

  const handleInputChange = (studentId: string, field: 'attendance_pct' | 'cgpa' | 'backlog_count', value: string) => {
    setEditedData(prev => {
      const student = students.find(s => s.student_id === studentId);
      if (!student) return prev;
      
      const currentEdits = prev[studentId] || { 
        attendance_pct: student.attendance_pct.toString(), 
        cgpa: student.cgpa.toString(),
        backlog_count: "0"
      };
      
      return {
        ...prev,
        [studentId]: {
          ...currentEdits,
          [field]: value
        }
      };
    });
  };

  const handleResetRow = (studentId: string) => {
    setEditedData(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleSaveAll = async () => {
    const idsToUpdate = Object.keys(editedData);
    if (idsToUpdate.length === 0) return;

    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      for (const id of idsToUpdate) {
        const payload: Record<string, number> = {};
        const att = parseFloat(editedData[id].attendance_pct);
        const cgpa = parseFloat(editedData[id].cgpa);
        const bl = parseInt(editedData[id].backlog_count ?? "0");
        if (!isNaN(att)) payload.attendance_pct = Math.min(100, Math.max(0, att));
        if (!isNaN(cgpa)) payload.cgpa = Math.min(10, Math.max(0, cgpa));
        if (!isNaN(bl)) payload.backlog_count = Math.max(0, bl);
        await CrudDataAPI.updateStudentData(id, payload);
      }
      // Re-fetch live data from backend to ensure 100% accuracy in real-time
      const freshData = await CrudDataAPI.getStudentsBySection(selectedSection);
      setStudents(freshData);
      
      setEditedData({});
      setSuccessMsg(`Successfully saved ${idsToUpdate.length} student record(s) to the database. Dashboard charts will reflect changes immediately.`);
    } catch (err: any) {
      setError(err.message || "Failed to update some records. Check backend connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const editCount = Object.keys(editedData).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface/80 rounded-2xl border border-border/60 p-5">
        <div>
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Edit3 size={20} className="text-indigo-500" />
            Manual Data Entry & Override
          </h2>
          <p className="text-sm text-secondary mt-0.5">Edit student attendance, CGPA, and backlog counts. All changes save directly to the live database.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 transition-colors"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="" disabled>Select Section...</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          {editCount > 0 && (
            <button
              onClick={() => setEditedData({})}
              className="inline-flex items-center gap-1.5 text-secondary hover:text-primary px-3 py-2.5 rounded-xl border border-border text-sm font-semibold transition-colors"
            >
              <RotateCcw size={14} /> Reset All
            </button>
          )}
          <button 
            onClick={handleSaveAll}
            disabled={editCount === 0 || isSaving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-500/20"
          >
            <Save size={16} /> 
            {isSaving ? "Saving to DB…" : `Save ${editCount > 0 ? `(${editCount})` : "Changes"}`}
          </button>
        </div>
      </div>

      {/* Stat bar */}
      {students.length > 0 && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Users size={15} className="text-indigo-500" /></div>
            <div>
              <div className="text-xs text-secondary font-medium">Students</div>
              <div className="text-lg font-black text-primary">{students.length}</div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Percent size={15} className="text-emerald-500" /></div>
            <div>
              <div className="text-xs text-secondary font-medium">Avg Attendance</div>
              <div className="text-lg font-black text-primary">
                {(students.reduce((a, s) => a + (s.attendance_pct || 0), 0) / students.length).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><BookOpen size={15} className="text-blue-500" /></div>
            <div>
              <div className="text-xs text-secondary font-medium">Avg CGPA</div>
              <div className="text-lg font-black text-primary">
                {(students.reduce((a, s) => a + (s.cgpa || 0), 0) / students.length).toFixed(2)}
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg"><Hash size={15} className="text-amber-500" /></div>
            <div>
              <div className="text-xs text-secondary font-medium">Pending Edits</div>
              <div className={`text-lg font-black ${editCount > 0 ? "text-indigo-500" : "text-primary"}`}>{editCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}
      
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> {successMsg}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover/60 text-secondary text-xs uppercase tracking-wider border-b border-border">
                <th className="py-4 px-5 font-bold">Roll No</th>
                <th className="py-4 px-5 font-bold">Student Name</th>
                <th className="py-4 px-5 font-bold w-36">
                  <span className="flex items-center gap-1"><Percent size={12} /> Attendance %</span>
                </th>
                <th className="py-4 px-5 font-bold w-36">
                  <span className="flex items-center gap-1"><BookOpen size={12} /> CGPA (0–10)</span>
                </th>
                <th className="py-4 px-5 font-bold w-32">
                  <span className="flex items-center gap-1"><Hash size={12} /> Backlogs</span>
                </th>
                <th className="py-4 px-5 font-bold w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-5">
                      <div className="h-5 bg-surface-secondary/50 rounded-lg animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-secondary">
                    {selectedSection ? "No students found in this section." : "Select a section to begin editing."}
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const isEdited = !!editedData[s.student_id];
                  const currentAtt = editedData[s.student_id]?.attendance_pct ?? s.attendance_pct.toString();
                  const currentCgpa = editedData[s.student_id]?.cgpa ?? s.cgpa.toString();
                  const currentBl = editedData[s.student_id]?.backlog_count ?? "0";
                  
                  return (
                    <tr key={s.student_id} className={`hover:bg-surface-hover/40 transition-colors ${isEdited ? 'bg-indigo-500/5 border-l-2 border-l-indigo-500' : ''}`}>
                      <td className="py-3.5 px-5 font-bold text-primary text-sm">{s.roll_no}</td>
                      <td className="py-3.5 px-5 text-sm text-secondary font-medium">{s.full_name}</td>
                      <td className="py-3.5 px-5">
                        <input 
                          type="number" min="0" max="100" step="1"
                          className={`w-full bg-background border ${isEdited ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-border'} rounded-lg px-3 py-1.5 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 transition-colors`}
                          value={currentAtt}
                          onChange={e => handleInputChange(s.student_id, 'attendance_pct', e.target.value)}
                        />
                      </td>
                      <td className="py-3.5 px-5">
                        <input 
                          type="number" min="0" max="10" step="0.1"
                          className={`w-full bg-background border ${isEdited ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-border'} rounded-lg px-3 py-1.5 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 transition-colors`}
                          value={currentCgpa}
                          onChange={e => handleInputChange(s.student_id, 'cgpa', e.target.value)}
                        />
                      </td>
                      <td className="py-3.5 px-5">
                        <input 
                          type="number" min="0" step="1"
                          className={`w-full bg-background border ${isEdited ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-border'} rounded-lg px-3 py-1.5 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 transition-colors`}
                          value={currentBl}
                          onChange={e => handleInputChange(s.student_id, 'backlog_count', e.target.value)}
                        />
                      </td>
                      <td className="py-3.5 px-5">
                        {isEdited ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-black rounded-full border border-indigo-500/20">MODIFIED</span>
                            <button onClick={() => handleResetRow(s.student_id)} className="text-secondary hover:text-rose-400 transition-colors" title="Reset this row">
                              <RotateCcw size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-surface-secondary text-secondary text-[10px] font-bold rounded-full border border-border">Saved</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {editCount > 0 && (
          <div className="border-t border-border px-5 py-3 bg-indigo-500/5 flex items-center justify-between">
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
              {editCount} record{editCount !== 1 ? "s" : ""} modified — changes not yet saved to database
            </span>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              <Save size={14} />
              {isSaving ? "Saving…" : "Save All Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
