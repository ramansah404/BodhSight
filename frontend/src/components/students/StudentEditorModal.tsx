import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";

export interface StudentFormData {
  student_id?: string;
  full_name: string;
  roll_no: string;
  section_code: string;
  email: string;
  cgpa: number;
  attendance_pct: number;
}

interface StudentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StudentFormData) => Promise<void>;
  initialData?: StudentFormData | null;
}

export default function StudentEditorModal({ isOpen, onClose, onSave, initialData }: StudentEditorModalProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    full_name: "",
    roll_no: "",
    section_code: "",
    email: "",
    cgpa: 0,
    attendance_pct: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        full_name: "",
        roll_no: "",
        section_code: "",
        email: "",
        cgpa: 0,
        attendance_pct: 0,
      });
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to save student data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-primary mb-6">
          {initialData ? "Edit Student" : "Add New Student"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400 leading-tight">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1">Full Name</label>
            <input 
              required 
              type="text" 
              value={formData.full_name} 
              onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">Roll No</label>
              <input 
                required 
                type="text" 
                value={formData.roll_no} 
                onChange={(e) => setFormData(p => ({ ...p, roll_no: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-primary focus:border-indigo-500 outline-none"
                placeholder="e.g. CS2024001"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">Section</label>
              <input 
                required 
                type="text" 
                value={formData.section_code} 
                onChange={(e) => setFormData(p => ({ ...p, section_code: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-primary focus:border-indigo-500 outline-none"
                placeholder="e.g. SEC-A"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1">Email</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-primary focus:border-indigo-500 outline-none"
              placeholder="e.g. john@university.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">CGPA</label>
              <input 
                required 
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cgpa} 
                onChange={(e) => setFormData(p => ({ ...p, cgpa: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-primary focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">Attendance (%)</label>
              <input 
                required 
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.attendance_pct} 
                onChange={(e) => setFormData(p => ({ ...p, attendance_pct: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-primary focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Save size={18} />
            {loading ? "Saving..." : (initialData ? "Update Student" : "Add Student")}
          </button>
        </form>
      </div>
    </div>
  );
}
