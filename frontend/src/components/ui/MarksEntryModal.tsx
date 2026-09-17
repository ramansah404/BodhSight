import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, RefreshCw } from "lucide-react";
import { Agent10API } from "../../services/api";
import { StudentProfile } from "../../types/agent10";

interface MarksEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile | null;
  onSaved: () => void;
}

export default function MarksEntryModal({ isOpen, onClose, student, onSaved }: MarksEntryModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setFormData({
        demo_fa1: student.demo_fa1 ?? "",
        demo_cla1: student.demo_cla1 ?? "",
        demo_fa2: student.demo_fa2 ?? "",
        demo_cla2: student.demo_cla2 ?? "",
        demo_fa3: student.demo_fa3 ?? "",
        demo_cla3: student.demo_cla3 ?? "",
        demo_fa4: student.demo_fa4 ?? "",
        demo_cla4: student.demo_cla4 ?? "",
        demo_cla5: student.demo_cla5 ?? "",
        demo_external: student.demo_external ?? "",
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Auto-calculate overalls
  const internalSum = 
    (Number(formData.demo_fa1) || 0) + (Number(formData.demo_cla1) || 0) +
    (Number(formData.demo_fa2) || 0) + (Number(formData.demo_cla2) || 0) +
    (Number(formData.demo_fa3) || 0) + (Number(formData.demo_cla3) || 0) +
    (Number(formData.demo_fa4) || 0) + (Number(formData.demo_cla4) || 0) +
    (Number(formData.demo_cla5) || 0);

  const totalOverall = internalSum + (Number(formData.demo_external) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {};
      for (const key of Object.keys(formData)) {
        if (formData[key] !== "") {
          payload[key] = Number(formData[key]);
        } else {
            payload[key] = null;
        }
      }
      
      // Compute the overall scores based on the values in DB
      payload.demo_internal_overall = internalSum;
      payload.demo_external_overall = formData.demo_external !== "" ? Number(formData.demo_external) : null;
      payload.demo_total_overall = totalOverall;

      await Agent10API.updateStudentMarks(student.student_id, payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to update marks");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateTotal = () => {
    // just triggers re-render 
    setFormData({ ...formData });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border animate-in zoom-in-95">
        <div className="px-6 py-4 bg-surface-secondary/50 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-primary">Granular Marks Entry</h3>
            <span className="text-xs text-secondary">{student.full_name} ({student.roll_no})</span>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-rose-500/10 text-rose-600 p-4 rounded-xl border border-rose-500/20 text-sm flex gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* FA/CLA fields */}
            {["fa1", "cla1", "fa2", "cla2", "fa3", "cla3", "fa4", "cla4", "cla5"].map(f => (
              <div key={f}>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                  {f.toUpperCase()}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="40"
                  value={formData[`demo_${f}`] || ""}
                  onChange={e => setFormData({ ...formData, [`demo_${f}`]: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-primary focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-bold text-primary mb-4">External Evaluation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                  External Score (Max 60)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="60"
                  value={formData.demo_external || ""}
                  onChange={e => setFormData({ ...formData, demo_external: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-primary focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Calculated Totals */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-wrap gap-6 items-center">
            <button type="button" onClick={handleCalculateTotal} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold">
              <RefreshCw size={14} /> Calculate
            </button>
            <div className="text-sm font-medium text-secondary">
              Internal: <span className="font-bold text-primary">{internalSum.toFixed(2)}</span>
            </div>
            <div className="text-sm font-medium text-secondary">
              Total Overall: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalOverall.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-secondary hover:bg-surface-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> {loading ? "Saving..." : "Save Marks"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
