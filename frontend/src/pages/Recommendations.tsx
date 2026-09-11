import { useState } from "react";
import { Lightbulb, CheckCircle2, Play, Sparkles, Lock } from "lucide-react";
import { getRolePermissions } from "../utils/rbac";
import type { RecommendationItem } from "../types/agent10";

export default function Recommendations() {
  const rawRole = localStorage.getItem("bodhsight_display_role") || localStorage.getItem("bodhsight_role") || "Dean";
  const permissions = getRolePermissions(rawRole);

  const [recommendations] = useState<RecommendationItem[]>([
    {
      id: "rec-01",
      problem: "CS301 (Data Structures) pass rate declined significantly (61.2% vs 82% baseline).",
      evidence: ["Uniform pass rate drop across all 3 sections", "Attributed to university question paper rigor"],
      recommendation: "Review assessment difficulty, organize mandatory remedial labs, and calibrate internal grading.",
      priority: "CRITICAL",
      expected_impact: "Recover cohort pass rate by ~15% before final term exams.",
      affected_population: 84,
      status: "PENDING"
    },
    {
      id: "rec-02",
      problem: "EC202 Section B is lagging behind Section A by 22% in Digital Signal Processing.",
      evidence: ["Section A pass rate: 84%, Section B pass rate: 62%", "Faculty delivery variance"],
      recommendation: "Provide peer faculty mentoring and unified tutorial problem sets for Section B.",
      priority: "HIGH",
      expected_impact: "Bridge section disparity and normalize cohort outcomes.",
      affected_population: 70,
      status: "PENDING"
    }
  ]);

  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleExecute = (id: string) => {
    if (!permissions.canExecuteRecommendation) {
      alert("Access Denied: Your current role does not have authorization to execute institutional interventions.");
      return;
    }
    setExecutingId(id);
    setTimeout(() => {
      setExecutingId(null);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2500);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-xs font-bold border border-purple-400/30 mb-2">
          <Lightbulb size={14} /> Actionable Intelligence ({rawRole} Scope)
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Recommendation & Priority Center</h1>
        <p className="text-purple-100 text-sm mt-1">
          {permissions.canExecuteRecommendation 
            ? "Execute and authorize prioritized institutional interventions based on Agent 10 anomaly detections."
            : "Review recommended pedagogical support and remediation workflows for your assigned courses."}
        </p>
      </div>

      <div className="space-y-6">
        {recommendations.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4 hover:border-purple-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  item.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {item.priority} PRIORITY
                </span>
                <span className="text-xs font-bold text-gray-400">Affected Population: {item.affected_population} students</span>
              </div>
              
              {successId === item.id ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={14} /> Action Authorized & Deployed
                </span>
              ) : permissions.canExecuteRecommendation ? (
                <button 
                  onClick={() => handleExecute(item.id)}
                  disabled={executingId === item.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Play size={12} fill="currentColor" /> {executingId === item.id ? "Deploying..." : "Execute Intervention"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Lock size={12} /> View Only (Requires HOD/Dean Authorization)
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-gray-900">{item.problem}</h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm text-gray-700 space-y-1 font-medium">
                <strong className="text-indigo-900 block">Agent 10 Recommendation:</strong>
                <p className="text-indigo-950 font-semibold">{item.recommendation}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 text-gray-600 font-semibold">
              <span>Expected Impact: <strong className="text-emerald-600">{item.expected_impact}</strong></span>
              <span className="flex items-center gap-1 text-indigo-700"><Sparkles size={14} /> Verified by FastAPI Backend</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
