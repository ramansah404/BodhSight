import { useState } from "react";
import { Users, ShieldAlert, ArrowRight } from "lucide-react";
import type { StudentRiskGroup } from "../types/agent10";

export default function Students() {
  const [groups] = useState<StudentRiskGroup[]>([
    { group_id: "grp-01", category: "Persistent Underperformance (Multiple Backlogs)", affected_count: 27, avg_cgpa: 5.2, primary_issue: "Failing core courses in consecutive semesters", trend: "WORSENING", recommended_support: "Mandatory faculty mentoring & peer tutoring" },
    { group_id: "grp-02", category: "Lateral Entry Transition Gap", affected_count: 34, avg_cgpa: 6.1, primary_issue: "Mathematics and Data Structure bridge course deficit", trend: "STABLE", recommended_support: "Specialized foundational bridge labs" },
    { group_id: "grp-03", category: "Mid-Term Assessment Slump", affected_count: 58, avg_cgpa: 6.4, primary_issue: "Sudden drop in formative internal evaluations", trend: "IMPROVING", recommended_support: "Formative assignment feedback review" }
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/30 mb-2">
          <Users size={14} /> Protected Aggregated Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">At-Risk Student Intelligence</h1>
        <p className="text-emerald-100 text-sm mt-1">
          Identifying academic risk patterns across cohorts while strictly protecting individual privacy (aggregated views only).
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((grp) => (
          <div key={grp.group_id} className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-extrabold rounded-full flex items-center gap-1 border border-rose-200">
                  <ShieldAlert size={12} /> {grp.affected_count} Students Affected
                </span>
                <span className="text-xs font-bold text-gray-400">Avg CGPA: {grp.avg_cgpa}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{grp.category}</h3>
              <p className="text-sm text-gray-600">{grp.primary_issue}</p>
              <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 inline-block">
                Support Action: {grp.recommended_support}
              </div>
            </div>
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5">
              Deploy Support Plan <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
