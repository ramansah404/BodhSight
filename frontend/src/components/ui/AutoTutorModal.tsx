import { useEffect, useState } from "react";
import { X, Bot, BookOpen, Target, BrainCircuit, Activity, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent10API } from "../../services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

export default function AutoTutorModal({ isOpen, onClose, studentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !studentId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    Agent10API.generateAutoTutor(studentId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || err?.message || String(err));
        setLoading(false);
      });
  }, [isOpen, studentId]);

  const handleCopy = () => {
    if (!data) return;
    const text = `Auto-Tutor Intervention
Student: ${data.student_id}
Weakest Topic: ${data.unit_title} | ${data.co_title}
Question: ${data.question_text} (${data.marks_obtained}/${data.max_marks} marks)

Diagnosis:
${data.ai_diagnosis}

Explanation:
${data.targeted_explanation}

Practice Plan:
${data.practice_plan}

Resources:
${data.resources.join(", ")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] glass-overlay"
          />

          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-3xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90dvh] pointer-events-auto bg-surface"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-indigo-50/50 dark:bg-indigo-900/10">
                <div>
                  <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                    <Bot className="w-6 h-6 text-indigo-500" />
                    Agent 10 Auto-Tutor
                  </h2>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-0.5">
                    Targeted AI intervention based on real assessment data
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                      <Bot className="w-12 h-12 text-indigo-500 animate-pulse relative z-10" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-foreground">Analyzing student performance...</p>
                      <p className="text-xs">Generating targeted intervention strategy</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-64 flex flex-col items-center justify-center text-rose-500 gap-3">
                    <Activity className="w-10 h-10" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                ) : data ? (
                  <div className="space-y-6">
                    {/* Context Header */}
                    <div className="bg-surface-secondary/50 rounded-xl p-4 border border-border">
                      <div className="flex flex-wrap gap-4 items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Target className="w-4 h-4 text-indigo-500" /> Weakest Assessment Area
                        </div>
                        <div className="px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md text-xs font-bold border border-rose-500/20">
                          {data.marks_obtained} / {data.max_marks} Marks
                        </div>
                      </div>
                      <p className="text-foreground font-medium mb-3">Q: {data.question_text}</p>
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-secondary">
                        <span className="bg-surface px-2 py-1 border border-border rounded">{data.unit_title}</span>
                        <span className="bg-surface px-2 py-1 border border-border rounded">{data.co_title}</span>
                      </div>
                    </div>

                    {/* AI Diagnosis */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" /> AI Diagnosis
                      </h3>
                      <p className="text-sm text-secondary leading-relaxed bg-surface border border-border p-4 rounded-xl">
                        {data.ai_diagnosis}
                      </p>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-indigo-500" /> Targeted Explanation
                      </h3>
                      <p className="text-sm text-secondary leading-relaxed bg-surface border border-border p-4 rounded-xl">
                        {data.targeted_explanation}
                      </p>
                    </div>

                    {/* Practice Plan */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" /> Practice Plan
                      </h3>
                      <p className="text-sm text-secondary leading-relaxed bg-surface border border-border p-4 rounded-xl">
                        {data.practice_plan}
                      </p>
                    </div>

                    {/* Resources */}
                    {data.resources && data.resources.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-500" /> Suggested Resources
                        </h3>
                        <ul className="text-sm text-secondary list-disc list-inside bg-surface border border-border p-4 rounded-xl">
                          {data.resources.map((res: string, idx: number) => (
                            <li key={idx}>{res}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-surface-secondary/30 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Close
                </button>
                {data && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm shadow-indigo-500/20"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Intervention"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
