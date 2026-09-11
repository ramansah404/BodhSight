<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { checkHealth, type HealthResponse } from '../services/api';

export default function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Academic Performance Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Backend Connection Status</h2>
        {error ? (
          <div className="text-red-600">Error connecting to backend: {error}</div>
        ) : health ? (
          <div className="text-green-600">
            Connected to {health.service} ({health.environment})
          </div>
        ) : (
          <div className="text-gray-500">Checking connection...</div>
        )}
      </div>
=======
﻿import { useEffect, useState } from 'react';
import { Sparkles, TrendingDown, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2, Play } from 'lucide-react';
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

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Loading Agent 10 Analytics...</div>;
  if (!metrics) return <div className="text-red-500">Failed to load data.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Performance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Institution-wide analytics • As of {metrics.as_of_date}</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
          <ShieldCheck size={16} />
          Data Trust Score: {metrics.data_trust_score}/100
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Overall Pass Rate</div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">{metrics.pass_rate}%</span>
            <span className="flex items-center text-sm font-medium text-red-600 mb-1">
              <TrendingDown size={16} className="mr-1" /> 2.1%
            </span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Average Marks</div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">{metrics.average_marks}</span>
            <span className="text-sm text-gray-500 mb-1">/ 100</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Students Evaluated</div>
          <div className="text-3xl font-bold text-gray-900">{metrics.students_evaluated.toLocaleString()}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm bg-red-50/30">
          <div className="text-sm font-medium text-red-600 mb-1 flex items-center gap-1">
            <AlertCircle size={16} /> Significant Deviations
          </div>
          <div className="text-3xl font-bold text-red-700">{metrics.significant_deviations}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Exceptions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">AI-Detected Exceptions</h2>
          {exceptions.map(exc => (
            <div key={exc.id} className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <span className="font-semibold text-indigo-900">{exc.title}</span>
                </div>
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {exc.severity}
                </span>
              </div>
              <div className="p-5">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{exc.explanation}</p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100">
                  <span className="font-semibold text-gray-900">Recommended Action:</span> {exc.recommended_action}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <span>Deviation: <strong className="text-red-600">{exc.deviation}%</strong></span>
                  <span>Affected: {exc.affected_students} students</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Intervention Priorities */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Intervention Priorities</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <ul className="space-y-4">
              {priorities.map((item, idx) => (
                <li key={item.course_code} className="flex flex-col pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {item.rank}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{item.course_code}</span>
                    </div>
                    <button 
                      onClick={() => setDeployingItem(item)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Play size={10} /> Deploy Action
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{item.course_name}</div>
                  <div className="mt-2 text-xs font-medium text-red-600 bg-red-50 p-2 rounded border border-red-100">
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/60">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles size={20} />
                <h3 className="font-bold text-lg">Agent 10 Automated Workflow</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {deploySuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 size={48} className="text-green-600 mx-auto animate-bounce" />
                  <h4 className="text-lg font-bold text-gray-900">Intervention Workflow Deployed!</h4>
                  <p className="text-sm text-gray-500">Remedial assignments and notifications dispatched to department faculty.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{deployingItem.course_code}: {deployingItem.course_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      You are about to trigger Agent 10 to automatically schedule remedial labs and notify {deployingItem.affected_students} affected students.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1">
                    <div className="text-emerald-400"># Action Payload</div>
                    <div>Target Course: {deployingItem.course_code}</div>
                    <div>Action: {deployingItem.recommended_intervention}</div>
                    <div>Dispatcher: Agent 10 Orchestrator</div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button 
                      onClick={handleExecuteWorkflow}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Confirm & Dispatch <ArrowRight size={16} />
                    </button>
                    <button 
                      onClick={() => setDeployingItem(null)}
                      className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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

>>>>>>> fdaa9ac071934d47fc97884694f45bdb8beab2b8
    </div>
  );
}
