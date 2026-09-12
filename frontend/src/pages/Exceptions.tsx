import { useEffect, useState } from "react";
import { useFilters } from "../contexts/FilterContext";
import { Agent10API } from "../services/api";
import type { AcademicException } from "../types/agent10";
import { AlertTriangle, ShieldAlert, FileSearch, ArrowRight, Clock, Database, CheckCircle, X, Sparkles } from "lucide-react";

export default function Exceptions() {
  const { filters } = useFilters();
  const [exceptions, setExceptions] = useState<AcademicException[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedException, setSelectedException] = useState<AcademicException | null>(null);

  useEffect(() => {
    Agent10API.getAnomalies(filters).then(data => {
      setExceptions(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <div className="p-6 text-secondary">Loading exceptions...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={28} />
          Exception Center
        </h1>
        <p className="text-sm text-secondary mt-1">
          Active academic anomalies requiring immediate administrative intervention with verified data lineage.
        </p>
      </div>

      <div className="space-y-6">
        {exceptions.map(exc => (
          <div key={exc.id} className="bg-surface rounded-xl border border-red-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="bg-red-50/50 md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-red-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={20} className="text-red-700" />
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase">
                    {exc.severity} PRIORITY
                  </span>
                </div>
                <h3 className="text-lg font-bold text-primary">{exc.title}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Course:</span>
                    <span className="font-semibold text-primary">{exc.course_code} ({exc.department})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Deviation:</span>
                    <span className="font-bold text-red-600">{exc.deviation}% drop</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Impact:</span>
                    <span className="font-medium text-primary">{exc.affected_students} students</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-secondary font-medium">
                <Clock size={14} /> Detected on {exc.detected_date}
              </div>
            </div>

            <div className="p-6 md:w-2/3 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-primary mb-1">Agent 10 Analysis</h4>
                  <p className="text-sm text-primary leading-relaxed bg-surface/40 p-3 rounded-lg border border-border/60">
                    {exc.explanation}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button 
                  onClick={() => setSelectedException(exc)}
                  className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline"
                >
                  <FileSearch size={16} /> View Evidence Trace & SQL Lineage →
                </button>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-primary rounded-lg text-sm font-medium transition-colors">
                  Take Action <ArrowRight size={16} className="inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Evidence Trace Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border/60">
            <div className="px-6 py-4 border-b border-border/60 flex justify-between items-center bg-indigo-500/10/60">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={20} />
                <h3 className="font-bold text-lg">Agent 10 Evidence Trace & Audit</h3>
              </div>
              <button onClick={() => setSelectedException(null)} className="text-secondary hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                  {selectedException.course_code} Anomaly Verification
                </span>
                <h4 className="text-xl font-bold text-primary mt-2">{selectedException.title}</h4>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Database size={14} className="text-indigo-600 dark:text-indigo-400" /> PostgreSQL & Vector Source Lineage
                </h5>
                <div className="bg-surface text-primary p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
                  <div className="text-emerald-600 dark:text-emerald-400">-- Queried from PostgreSQL materialized view</div>
                  <div>SELECT course_code, pass_rate, historical_baseline </div>
                  <div>FROM assessment.v_course_performance </div>
                  <div>WHERE course_code = '{selectedException.course_code}' AND term = '2026-T1';</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-secondary">Verified Evidence Sources</h5>
                <ul className="space-y-2">
                  {selectedException.evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm bg-surface/40 p-2.5 rounded-lg border border-border/60 text-primary">
                      <CheckCircle size={16} className="text-green-600 shrink-0" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-border/60 flex justify-end">
                <button 
                  onClick={() => setSelectedException(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-primary rounded-lg text-sm font-medium transition-colors"
                >
                  Close Trace Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
