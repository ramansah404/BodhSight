import { useEffect, useState } from "react";
import { TrendingUp, CalendarDays, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Agent10API } from "../services/api";
import type { TrendData } from "../types/agent10";

export default function Trends() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Agent10API.getTrends().then(data => {
      setTrends(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center text-amber-600 font-medium">Loading Historical Trends...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30 mb-2">
          <TrendingUp size={14} /> Historical Timeline
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Institutional Trend Analysis</h1>
        <p className="text-amber-100/80 text-sm mt-1 max-w-2xl">
          Visualizing academic progression across semesters and batches to answer: "What is changing over time?"
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LineChartIcon className="text-amber-600" size={20} />
            Semester-over-Semester Performance
          </h2>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600">
            <CalendarDays size={14} /> All Active Regulations
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="semester" tick={{fill: '#6b7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="left" domain={[60, 100]} tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} dx={-10} />
              <YAxis yAxisId="right" orientation="right" domain={[5, 10]} tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} dx={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Line yAxisId="left" type="monotone" dataKey="pass_rate" stroke="#10b981" strokeWidth={4} name="Pass Rate (%)" dot={{r: 6, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8}} />
              <Line yAxisId="left" type="monotone" dataKey="average_marks" stroke="#6366f1" strokeWidth={4} name="Avg Marks" dot={{r: 6, strokeWidth: 2, fill: '#fff'}} />
              <Line yAxisId="right" type="monotone" dataKey="avg_gpa" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" name="CGPA" dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-gray-500 uppercase">Long-term Trajectory</div>
            <div className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
              Volatile <TrendingDown size={16} className="text-rose-500"/>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-gray-500 uppercase">Latest Evaluation</div>
            <div className="text-lg font-bold text-gray-900 mt-1">2026-T1 (2,450 records)</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <div className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1"><AlertTriangle size={12}/> Alert Triggered</div>
            <div className="text-sm font-semibold text-amber-900 mt-1">
              Sharp period-over-period change detected in 2026-T1.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
