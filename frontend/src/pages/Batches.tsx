import { useEffect, useState } from "react";
import { GraduationCap, Users, Award, TrendingUp, AlertCircle } from "lucide-react";
import type { BatchPerformance } from "../types/agent10";

export default function Batches() {
  const [batches] = useState<BatchPerformance[]>([
    { batch_year: "2024-2028", programme: "B.Tech Computer Science", student_count: 980, avg_gpa: 7.9, pass_rate: 82.4, backlog_percentage: 12.5, trend: "DECLINING", risk_level: "MODERATE" },
    { batch_year: "2023-2027", programme: "B.Tech Electronics", student_count: 750, avg_gpa: 7.6, pass_rate: 79.1, backlog_percentage: 16.2, trend: "STABLE", risk_level: "MODERATE" },
    { batch_year: "2022-2026", programme: "B.Tech Mechanical", student_count: 420, avg_gpa: 8.2, pass_rate: 88.5, backlog_percentage: 8.0, trend: "IMPROVING", risk_level: "LOW" },
    { batch_year: "2021-2025", programme: "B.Tech Civil", student_count: 300, avg_gpa: 7.8, pass_rate: 84.0, backlog_percentage: 11.0, trend: "STABLE", risk_level: "LOW" }
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-teal-900 via-indigo-900 to-violet-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-200 px-3 py-1 rounded-full text-xs font-bold border border-teal-400/30 mb-2">
          <GraduationCap size={14} /> Cohort Progression Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Batch & Cohort Analysis</h1>
        <p className="text-teal-100 text-sm mt-1">
          Tracking academic progression, CGPA distributions, and backlog indicators across active batches (2021–2024).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((batch, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4 hover:border-teal-300 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100">
                  Batch {batch.batch_year}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{batch.programme}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                batch.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                <AlertCircle size={12} /> {batch.risk_level} RISK
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center">
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center justify-center gap-1"><Users size={12} className="text-teal-600" /> Students</div>
                <div className="text-lg font-extrabold text-gray-900 mt-1">{batch.student_count}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase">Pass Rate</div>
                <div className="text-lg font-extrabold text-emerald-600 mt-1">{batch.pass_rate}%</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center justify-center gap-1"><Award size={12} className="text-amber-500" /> Avg CGPA</div>
                <div className="text-lg font-extrabold text-indigo-900 mt-1">{batch.avg_gpa}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 text-gray-600 font-medium">
              <span>Backlog Indicator: <strong className="text-rose-600">{batch.backlog_percentage}%</strong></span>
              <span className="flex items-center gap-1 text-indigo-700 font-bold"><TrendingUp size={14} /> Trend: {batch.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
