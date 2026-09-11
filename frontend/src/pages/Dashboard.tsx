import { useEffect, useState } from 'react';
import { Sparkles, TrendingDown, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2, Play, Activity } from 'lucide-react';
import { fetchDashboardMetrics, fetchExceptions, fetchInterventionPriorities } from '../api/agent10';
import type { AcademicDashboardMetrics, AcademicException, InterventionPriorityItem } from '../types/agent10';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [exceptions, setExceptions] = useState<AcademicException[]>([]);
  const [priorities, setPriorities] = useState<InterventionPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployingItem, setDeployingItem] = useState<InterventionPriorityItem | null>(null);
  const [deploySuccess, setDeploySuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
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
  }, []);

  const handleExecuteWorkflow = () => {
    setDeploySuccess(true);
    setTimeout(() => {
      setDeploySuccess(false);
      setDeployingItem(null);
    }, 1500);
  };

  if (loading) return <div className="flex items-center justify-center h-full text-indigo-600 font-medium p-12">Loading Agent 10 Analytics Engine...</div>;
  if (!metrics) return <div className="text-rose-600 p-6">Failed to load institutional telemetry.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity size={14} /> Higher Education Analytics Suite
          </div>
          <h1 className="text-2xl font-extxl font-bold">Institutional Academic Overview</h1>
          <p className="text-indigo-200 text-sm mt-0.5">Vignan's Foundation for Science, Technology & Research • Telemetry as of {metrics.as_of_date}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md text-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-400/30">
          <ShieldCheck size={18} className="text-emerald-400" />
          Data Trust Score: {metrics.data_trust_score}/100
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Overall Pass Rate</div>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-3xl font-extrabold text-gray-900">{metrics.pass_rate}%</span>
            <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 mb-1">
              <TrendingDown size={14} className="mr-0.5" /> 2.1%
            </span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Average Marks</div>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-3xl font-extrabold text-gray-900">{metrics.average_marks}</span>
            <span className="text-xs font-bold text-gray-500 mb-1">/ 100</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1">Students Evaluated</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">{metrics.students_evaluated.toLocaleString()}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-gradient-to-br from-white to-rose-50/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1 flex items-center gap-1">
            <AlertCircle size={14} /> Critical Deviations
          </div>
          <div className="text-3xl font-extrabold text-rose-700 mt-2">{metrics.significant_deviations}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Exceptions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" /> AI-Detected Academic Anomalies
          </h2>
          {exceptions.map(exc => (
            <div key={exc.id} className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden hover:border-indigo-300 transition-all">
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-3.5 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-bold text-indigo-950">{exc.title}</span>
                </div>
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
                  {exc.severity} PRIORITY
                </span>
              </div>
              <div className="p-6">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{exc.explanation}</p>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-gray-700 border border-slate-200/60 font-medium">
                  <strong className="text-indigo-900">Recommended Action:</strong> {exc.recommended_action}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-xs font-semibold text-gray-500">
                  <span>Deviation: <strong className="text-rose-600">{exc.deviation}%</strong></span>
                  <span>Affected Cohort: <strong className="text-gray-900">{exc.affected_students} students</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Intervention Priorities */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Intervention Workflows</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <ul className="space-y-4">
              {priorities.map((item, idx) => (
                <li key={item.course_code} className="flex flex-col pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-xl text-xs font-extrabold ${idx === 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                        {item.rank}
                      </div>
                      <span className="font-extrabold text-gray-900 text-sm">{item.course_code}</span>
                    </div>
                    <button 
                      onClick={() => setDeployingItem(item)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Play size={10} fill="currentColor" /> Deploy Action
                    </button>
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-1 pl-9">{item.course_name}</div>
                  <div className="mt-2.5 ml-9 text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    {item.recommended_intervention}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Workflow Modal */}
      {deployingItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-900 to-violet-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-300" />
                <h3 className="font-bold text-lg">Agent 10 Autonomous Workflow</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              {deploySuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 size={56} className="text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="text-xl font-bold text-gray-900">Intervention Deployed Successfully!</h4>
                  <p className="text-sm text-gray-500">Remedial schedules and faculty alerts have been dispatched through PostgreSQL gateway.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{deployingItem.course_code}: {deployingItem.course_name}</h4>
                    <p className="text-sm text-gray-600 mt-1.5">
                      You are triggering Agent 10 to automatically establish remedial lab sections and notify <strong className="text-indigo-600">{deployingItem.affected_students} students</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-indigo-200 p-4 rounded-2xl font-mono text-xs space-y-1.5 shadow-inner border border-slate-800">
                    <div className="text-emerald-400 font-bold"># Agent 10 Execution Payload</div>
                    <div>Target Course: <span className="text-white font-bold">{deployingItem.course_code}</span></div>
                    <div>Workflow Action: <span className="text-white font-bold">{deployingItem.recommended_intervention}</span></div>
                    <div>Orchestration Status: <span className="text-amber-400">Ready for Dispatch</span></div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button 
                      onClick={handleExecuteWorkflow}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      Confirm & Dispatch <ArrowRight size={16} />
                    </button>
                    <button 
                      onClick={() => setDeployingItem(null)}
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
