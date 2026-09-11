import { useEffect, useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';
import { fetchDashboardMetrics, fetchExceptions, fetchInterventionPriorities } from '../api/agent10';
import type { AcademicDashboardMetrics, AcademicException, InterventionPriorityItem } from '../types/agent10';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [exceptions, setExceptions] = useState<AcademicException[]>([]);
  const [priorities, setPriorities] = useState<InterventionPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <button className="ml-auto text-indigo-600 font-medium hover:underline">View Evidence Trace ?</button>
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
                <li key={item.course_code} className="flex gap-3 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {item.rank}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{item.course_code}</div>
                    <div className="text-xs text-gray-500 truncate w-48">{item.course_name}</div>
                    <div className="mt-1 text-xs font-medium text-red-600">
                      Pass Rate: {item.pass_rate}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full mt-4 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 rounded-lg transition-colors border border-gray-200">
              View Full Ranking
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

