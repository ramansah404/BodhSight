import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Users, TrendingDown, AlertTriangle, ShieldCheck, Sparkles, BookOpen, ChevronRight, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Agent10API } from "../services/api";
import type { AcademicDashboardMetrics } from "../types/agent10";

export default function Dashboard() {
  const { currentRole } = useOutletContext<{ currentRole: string }>();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for charts to make the demo look incredible
  const trendData = [
    { name: "2024-T1", performance: 78, passRate: 84 },
    { name: "2024-T2", performance: 80, passRate: 85 },
    { name: "2025-T1", performance: 79, passRate: 84 },
    { name: "2025-T2", performance: 82, passRate: 87 },
    { name: "2026-T1", performance: 68, passRate: 82.4 }, // The Agent 10 Drop
  ];

  const deptData = [
    { name: "CSE", passRate: 81 },
    { name: "ECE", passRate: 79 },
    { name: "MECH", passRate: 88 },
    { name: "CIVIL", passRate: 84 },
  ];

  useEffect(() => {
    Agent10API.getPerformance().then(data => {
      setMetrics(data);
      setLoading(false);
    });
  }, [currentRole]);

  if (loading) return <div className="p-12 text-center text-indigo-600 font-bold animate-pulse">Loading BodhSight Command Center...</div>;
  if (!metrics) return <div className="text-rose-600 p-6">Failed to load telemetry.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 10-Second Executive Summary Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Health Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time consolidated telemetry for {currentRole} view.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <ShieldCheck className="text-emerald-600" size={20} />
          <div className="text-sm font-bold text-emerald-800">
            Ingestion Verified <span className="text-emerald-600 font-normal ml-1">• Trust Score: {metrics.data_trust_score}/100</span>
          </div>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Students</div>
            <Users size={16} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{metrics.students_evaluated.toLocaleString()}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Evaluated this semester</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Overall Pass Rate</div>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{metrics.pass_rate}%</div>
          <div className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1"><TrendingDown size={12}/> 2.1% from last term</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Avg Performance</div>
            <BookOpen size={16} className="text-blue-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{metrics.average_gpa} <span className="text-lg text-gray-400">CGPA</span></div>
          <div className="text-xs text-gray-500 font-medium mt-1">Institutional baseline</div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-3xl border border-rose-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Active Anomalies</div>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2 relative z-10">{metrics.significant_deviations}</div>
          <div className="text-xs text-rose-600 font-bold mt-1 relative z-10">Requires immediate attention</div>
        </div>
      </div>

      {/* Main Visual Area - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Overall Academic Performance Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="performance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" name="Avg Marks" />
                <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="Pass Rate %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Comparison Chart */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Department Pass Rates</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontWeight: 'bold', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="passRate" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI / Agent 10 Insights Bottom Panel */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-100">
          <Sparkles className="text-indigo-400" size={20} />
          Agent 10 Synthesized Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={() => navigate('/anomalies')} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all group">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-rose-200 transition-colors">Course performance declined significantly</p>
                <p className="text-xs text-indigo-200/70 mt-1">CS301 dropped 20% below historical baseline.</p>
              </div>
            </div>
          </div>
          <div onClick={() => navigate('/recommendations')} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all group">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors">Department MECH improved consistently</p>
                <p className="text-xs text-indigo-200/70 mt-1">Pass rates stabilized at 88.5% across batches.</p>
              </div>
            </div>
          </div>
          <div onClick={() => navigate('/courses')} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all group flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Activity className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">Section disparities detected</p>
                <p className="text-xs text-indigo-200/70 mt-1">EC202 Sec-B lagging by 22%.</p>
              </div>
            </div>
            <ChevronRight className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20}/>
          </div>
        </div>
      </div>

    </div>
  );
}
