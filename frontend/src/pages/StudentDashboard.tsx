import { useEffect, useState } from "react";
import { useRole } from "../contexts/RoleContext";
import { User, Activity, BookOpen, Clock, AlertCircle } from "lucide-react";
import { Agent10API } from "../services/api";

export default function StudentDashboard() {
  const { currentRole } = useRole();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We will build the backend endpoint for this later. 
    // For now, load a mock or basic structure.
    setTimeout(() => {
      setData({
        name: "Anil Kumar",
        program: "B.Tech CSE (2024-2028)",
        attendance: 84.5,
        cgpa: 8.2,
        subjects: [
          { code: "CS101", title: "Intro to Programming", internal: 38, external: 55, total: 93, attendance: 90 },
          { code: "MA101", title: "Engineering Math I", internal: 25, external: 40, total: 65, attendance: 75 },
          { code: "PH101", title: "Engineering Physics", internal: 30, external: 60, total: 90, attendance: 85 }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="p-8 text-secondary">Loading your portal...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface p-8 rounded-3xl border border-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
            <User size={14} /> {currentRole} Portal
          </div>
          <h1 className="text-4xl font-black tracking-tight text-primary">Welcome, {data?.name}</h1>
          <p className="text-secondary font-medium flex items-center gap-2">
            <BookOpen size={16} /> {data?.program}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Activity size={32} />
          </div>
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Cumulative GPA</div>
            <div className="text-3xl font-black text-primary">{data?.cgpa}</div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Clock size={32} />
          </div>
          <div>
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Overall Attendance</div>
            <div className="text-3xl font-black text-primary">{data?.attendance}%</div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface-secondary/50">
          <h2 className="text-lg font-bold text-primary">Subject-wise Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface/40 text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                <th className="py-4 px-6 font-bold">Course</th>
                <th className="py-4 px-6 font-bold">Internal (Max 40)</th>
                <th className="py-4 px-6 font-bold">External (Max 60)</th>
                <th className="py-4 px-6 font-bold">Total</th>
                <th className="py-4 px-6 font-bold">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.subjects.map((sub: any) => (
                <tr key={sub.code} className="hover:bg-surface/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-primary">{sub.title}</div>
                    <div className="text-xs text-indigo-500 font-semibold">{sub.code}</div>
                  </td>
                  <td className="py-4 px-6 font-medium text-secondary">{sub.internal}</td>
                  <td className="py-4 px-6 font-medium text-secondary">{sub.external}</td>
                  <td className="py-4 px-6 font-bold text-primary">{sub.total}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      sub.attendance < 75 
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {sub.attendance}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
