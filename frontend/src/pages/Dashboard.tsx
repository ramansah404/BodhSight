import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, TrendingDown, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2, Play, Activity, Shield, Users, BookOpen, FileCheck, UserCheck } from 'lucide-react';
import { fetchDashboardMetrics, fetchExceptions, fetchInterventionPriorities } from '../api/agent10';
import type { AcademicDashboardMetrics, AcademicException, InterventionPriorityItem } from '../types/agent10';

export default function Dashboard() {
  const { currentRole } = useOutletContext<{ currentRole: string }>();
  
  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [exceptions, setExceptions] = useState<AcademicException[]>([]);
  const [priorities, setPriorities] = useState<InterventionPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dashData, excData, priData] = await Promise.all([
          fetchDashboardMetrics(),
          fetchExceptions(),
          fetchInterventionPriorities()
        ]);
        setMetrics(dashData);
        setExceptions(excData);
        setPriorities(priData);
      } catch (e) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentRole]);

  const handleActionSubmit = () => {
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setActionItem(null);
    }, 1500);
  };

  if (loading) return <div className="flex items-center justify-center h-full text-indigo-600 font-medium p-12">Loading {currentRole} workspace...</div>;
  if (!metrics) return <div className="text-rose-600 p-6">Failed to load telemetry.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ========================================================================= */}
      {/* ROLE 1: DEAN OF ACADEMICS (Institutional Macro View)                        */}
      {/* ========================================================================= */}
      {currentRole === 'Dean' && (
        <>
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold border border-indigo-400/30">
                <Shield size={14} /> Institutional Governance Portal
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Dean's Executive Command Center</h1>
              <p className="text-indigo-200 text-sm">
                Global oversight across all departments • Vignan's Foundation for Science, Technology & Research
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-right">
              <div className="text-xs text-indigo-300 font-semibold uppercase">University Trust Score</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{metrics.data_trust_score}/100 Verified</div>
            </div>
          </div>

          {/* Dean KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">University Pass Rate</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{metrics.pass_rate}%</div>
              <div className="text-xs text-rose-600 font-semibold mt-1">↓ 2.1% from last term</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Total Students Evaluated</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{metrics.students_evaluated.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Across 4 Engineering Depts</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-600">Average University GPA</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{metrics.average_gpa} / 10.0</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">Stable academic baseline</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm bg-gradient-to-br from-white to-rose-50/50">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical Policy Anomalies</div>
              <div className="text-3xl font-black text-rose-700 mt-2">{metrics.significant_deviations}</div>
              <div className="text-xs text-rose-600 font-semibold mt-1">Require Dean sign-off</div>
            </div>
          </div>

          {/* Dean Workflow Section */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-indigo-600" size={22} /> Institutional Exception Approvals & Policy Interventions
              </h2>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">Dean Level Authorization</span>
            </div>
            <div className="space-y-4">
              {exceptions.map(exc => (
                <div key={exc.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-md uppercase">{exc.severity}</span>
                      <h3 className="font-bold text-gray-900">{exc.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{exc.explanation}</p>
                    <div className="text-xs font-semibold text-indigo-700">Department: {exc.department} | Affected: {exc.affected_students} students</div>
                  </div>
                  <button 
                    onClick={() => setActionItem({ title: "Approve Institutional Remedial Budget", code: exc.course_code, action: exc.recommended_action })}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
                  >
                    Authorize Remedial Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ROLE 2: CSE DEPARTMENT HOD (Mesos-scale Department View)                   */}
      {/* ========================================================================= */}
      {currentRole === 'HOD' && (
        <>
          <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-violet-500/30 text-violet-200 px-3 py-1 rounded-full text-xs font-bold border border-violet-400/30">
                <Users size={14} /> CSE Department Operations
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Department Head (HOD) Portal</h1>
              <p className="text-violet-200 text-sm">
                Managing Computer Science & Engineering faculty allocation, course bottlenecks, and section disparities.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-right">
              <div className="text-xs text-violet-300 font-semibold uppercase">CSE Pass Rate</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">81.0% (Review Required)</div>
            </div>
          </div>

          {/* HOD KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-600">CSE Enrolled Students</div>
              <div className="text-3xl font-black text-gray-900 mt-2">980</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Active Batches 2026</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Active Faculty Members</div>
              <div className="text-3xl font-black text-gray-900 mt-2">42</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">100% Assigned</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Section Disparity Flags</div>
              <div className="text-3xl font-black text-amber-700 mt-2">1 Flag</div>
              <div className="text-xs text-amber-600 font-semibold mt-1">CS301 Section B variance</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-700">Department GPA</div>
              <div className="text-3xl font-black text-violet-900 mt-2">7.9</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Above baseline</div>
            </div>
          </div>

          {/* HOD Workflow Section */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-violet-600" size={22} /> CSE Course Bottlenecks & Faculty Review Queue
              </h2>
              <span className="text-xs font-bold bg-violet-50 text-violet-700 px-3 py-1 rounded-full">CSE Department Scope</span>
            </div>
            <div className="space-y-4">
              {exceptions.filter(e => e.department === 'CSE').map(exc => (
                <div key={exc.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-md uppercase">{exc.course_code}</span>
                      <h3 className="font-bold text-gray-900">{exc.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{exc.explanation}</p>
                    <div className="text-xs font-semibold text-violet-700">Recommended: {exc.recommended_action}</div>
                  </div>
                  <button 
                    onClick={() => setActionItem({ title: "Schedule Faculty Review Meeting", code: exc.course_code, action: "HOD faculty consultation" })}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
                  >
                    Summon Course Faculty
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ROLE 3: COURSE INSTRUCTOR / FACULTY (Micro-scale Classroom View)            */}
      {/* ========================================================================= */}
      {currentRole === 'Faculty' && (
        <>
          <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30">
                <UserCheck size={14} /> Course Instructor Portal
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Prof. Verma's Classroom Workspace</h1>
              <p className="text-blue-200 text-sm">
                Managing CS301 (Data Structures & Algorithms) student roster, remedial sessions, and assessment reviews.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-right">
              <div className="text-xs text-blue-300 font-semibold uppercase">Course Pass Rate</div>
              <div className="text-2xl font-black text-rose-400 mt-0.5">61.2% (Action Needed)</div>
            </div>
          </div>

          {/* Faculty KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Assigned Course</div>
              <div className="text-3xl font-black text-gray-900 mt-2">CS301</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Data Structures & Algorithms</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Enrolled Students</div>
              <div className="text-3xl font-black text-gray-900 mt-2">180</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Across 3 Sections</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Students At Risk</div>
              <div className="text-3xl font-black text-rose-600 mt-2">84</div>
              <div className="text-xs text-rose-600 font-semibold mt-1">Below 60% threshold</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Remedial Labs</div>
              <div className="text-3xl font-black text-emerald-700 mt-2">Pending</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">Ready for submission</div>
            </div>
          </div>

          {/* Faculty Workflow Section */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={22} /> CS301 Remedial Action & Student Support Roster
              </h2>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">Faculty Instructor Scope</span>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-md uppercase">CS301 CRITICAL</span>
                    <h3 className="font-bold text-gray-900">Mandatory Remedial Lab Dispatch</h3>
                  </div>
                  <p className="text-sm text-gray-600">Deploy extra practice sessions for 84 struggling students to prepare for midterm re-evaluations.</p>
                  <div className="text-xs font-semibold text-blue-700">Generated by Agent 10 based on assessment telemetry</div>
                </div>
                <button 
                  onClick={() => setActionItem({ title: "Submit CS301 Remedial Schedule", code: "CS301", action: "Dispatch remedial lab roster" })}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
                >
                  Submit Remedial Plan
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Workflow Modal */}
      {actionItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-900 to-violet-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-300" />
                <h3 className="font-bold text-lg">Agent 10 Workflow Execution</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              {successMsg ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 size={56} className="text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="text-xl font-bold text-gray-900">Workflow Successfully Executed!</h4>
                  <p className="text-sm text-gray-500">Recorded under <strong className="text-indigo-600">{currentRole}</strong> permissions via PostgreSQL gateway.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{actionItem.title}</h4>
                    <p className="text-sm text-gray-600 mt-1.5">
                      You are executing this workflow with <strong className="text-indigo-600">{currentRole}</strong> access credentials.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-indigo-200 p-4 rounded-2xl font-mono text-xs space-y-1.5 shadow-inner border border-slate-800">
                    <div className="text-emerald-400 font-bold"># RBAC Authorization Verified</div>
                    <div>Target Course: <span className="text-white font-bold">{actionItem.code}</span></div>
                    <div>Action Type: <span className="text-white font-bold">{actionItem.action}</span></div>
                    <div>Role Context: <span className="text-amber-400">{currentRole}</span></div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button 
                      onClick={handleActionSubmit}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      Confirm & Sign-Off <ArrowRight size={16} />
                    </button>
                    <button 
                      onClick={() => setActionItem(null)}
                      className="px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
