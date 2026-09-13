import { useState, useEffect } from "react";
import { CrudDataAPI, type StudentDataResponse } from "../services/api";
import { Save, AlertCircle } from "lucide-react";

export default function ManualEntry() {
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [students, setStudents] = useState<StudentDataResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Track edited values for each student ID
  const [editedData, setEditedData] = useState<Record<string, { attendance_pct: string, cgpa: string }>>({});
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

  const handleInputChange = (studentId: string, field: 'attendance_pct' | 'cgpa', value: string) => {
    setEditedData(prev => {
      const student = students.find(s => s.student_id === studentId);
      if (!student) return prev;
      
      const currentEdits = prev[studentId] || { 
        attendance_pct: student.attendance_pct.toString(), 
        cgpa: student.cgpa.toString() 
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

  const handleSaveAll = async () => {
    const idsToUpdate = Object.keys(editedData);
    if (idsToUpdate.length === 0) return;

    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      // Bulk update (sequentially for now, ideally an API batch endpoint)
      for (const id of idsToUpdate) {
        await CrudDataAPI.updateStudentData(id, {
          attendance_pct: parseFloat(editedData[id].attendance_pct),
          cgpa: parseFloat(editedData[id].cgpa)
        });
      }
      
      // Update local state
      setStudents(prev => prev.map(s => {
        if (editedData[s.student_id]) {
          return {
            ...s,
            attendance_pct: parseFloat(editedData[s.student_id].attendance_pct),
            cgpa: parseFloat(editedData[s.student_id].cgpa)
          };
        }
        return s;
      }));
      setEditedData({});
      setSuccessMsg(`Successfully updated ${idsToUpdate.length} student record(s).`);
    } catch (err: any) {
      setError(err.message || "Failed to update some records.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">Manual Data Entry & Override</h2>
        <div className="flex items-center gap-4">
          <select 
            className="bg-surface border border-border rounded-xl px-4 py-2 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="" disabled>Select Section...</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <button 
            onClick={handleSaveAll}
            disabled={Object.keys(editedData).length === 0 || isSaving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Save size={16} /> 
            {isSaving ? "Saving..." : `Save Changes (${Object.keys(editedData).length})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <Save size={18} /> {successMsg}
        </div>
      )}

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover text-secondary text-xs uppercase tracking-wider border-b border-border">
                <th className="py-4 px-6 font-bold">Roll No</th>
                <th className="py-4 px-6 font-bold">Name</th>
                <th className="py-4 px-6 font-bold w-48">Attendance %</th>
                <th className="py-4 px-6 font-bold w-48">CGPA / Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-secondary animate-pulse">Loading students...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-secondary">No students found in this section.</td>
                </tr>
              ) : (
                students.map((s) => {
                  const currentAtt = editedData[s.student_id]?.attendance_pct ?? s.attendance_pct.toString();
                  const currentCgpa = editedData[s.student_id]?.cgpa ?? s.cgpa.toString();
                  const isEdited = !!editedData[s.student_id];
                  
                  return (
                    <tr key={s.student_id} className={`hover:bg-surface-hover/50 transition-colors ${isEdited ? 'bg-indigo-500/5' : ''}`}>
                      <td className="py-4 px-6 font-bold text-primary">{s.roll_no}</td>
                      <td className="py-4 px-6 text-sm text-secondary">{s.full_name}</td>
                      <td className="py-4 px-6">
                        <input 
                          type="number" 
                          className={`w-full bg-background border ${isEdited ? 'border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'border-border'} rounded px-3 py-1.5 text-sm font-bold text-primary focus:outline-none`}
                          value={currentAtt} 
                          onChange={e => handleInputChange(s.student_id, 'attendance_pct', e.target.value)}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <input 
                          type="number" step="0.1"
                          className={`w-full bg-background border ${isEdited ? 'border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'border-border'} rounded px-3 py-1.5 text-sm font-bold text-primary focus:outline-none`}
                          value={currentCgpa} 
                          onChange={e => handleInputChange(s.student_id, 'cgpa', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
