import { useEffect, useState } from "react";
import { fetchExceptions } from "../api/agent10";
import type { AcademicException } from "../types/agent10";
import { AlertTriangle, ShieldAlert, FileSearch, ArrowRight, Clock } from "lucide-react";

export default function Exceptions() {
  const [exceptions, setExceptions] = useState<AcademicException[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExceptions().then(data => {
      setExceptions(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading exceptions...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={28} />
          Exception Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Active academic anomalies requiring immediate administrative intervention.
        </p>
      </div>

      {/* Exceptions List */}
      <div className="space-y-6">
        {exceptions.map(exc => (
          <div key={exc.id} className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Side: Summary & Severity */}
            <div className="bg-red-50/50 md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-red-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={20} className="text-red-700" />
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase tracking-wide">
                    {exc.severity} PRIORITY
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{exc.title}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Course:</span>
                    <span className="font-semibold text-gray-900">{exc.course_code} ({exc.department})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deviation:</span>
                    <span className="font-bold text-red-600">{exc.deviation}% drop</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Impact:</span>
                    <span className="font-medium text-gray-900">{exc.affected_students} students</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Clock size={14} /> Detected on {exc.detected_date}
              </div>
            </div>

            {/* Right Side: AI Explanation & Action */}
            <div className="p-6 md:w-2/3 flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Agent 10 Analysis</h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {exc.explanation}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Primary Evidence:</h4>
                  <ul className="space-y-1.5">
                    {exc.evidence.map((ev, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <FileSearch size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="text-sm">
                  <span className="font-bold text-gray-900">Recommended Action:</span>
                  <span className="text-gray-700 ml-1">{exc.recommended_action}</span>
                </div>
                <button className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Take Action <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>
        ))}

        {exceptions.length === 0 && (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">No active exceptions</h3>
            <p className="text-gray-500 mt-1">All academic metrics are operating within expected baselines.</p>
          </div>
        )}
      </div>
    </div>
  );
}
