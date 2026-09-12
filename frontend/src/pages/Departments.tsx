import { useEffect, useState, useMemo } from "react";
import { useFilters } from "../contexts/FilterContext";
import { Agent10API } from "../services/api";
import type { DepartmentPerformance } from "../types/agent10";
import { Building2, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";

export default function Departments() {
  const { filters } = useFilters();
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    Agent10API.getDepartments(filters).then(data => {
      if (cancelled) return;
      setDepartments(data || []);
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setErrorMsg(err?.message || "Failed to load departments.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [filters]);

  const insight = useMemo(() => {
    if (departments.length === 0) return null;
    const sorted = [...departments].sort((a, b) => (b.pass_rate || 0) - (a.pass_rate || 0));
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    
    return {
      highest,
      lowest,
      text: `${highest.department_name} (${highest.department_code}) currently leads with a ${highest.pass_rate}% pass rate. ${lowest.department_name} (${lowest.department_code}) requires administrative attention due to its lower ${lowest.pass_rate}% pass rate and ${lowest.active_exceptions} active exceptions.`
    };
  }, [departments]);

  const handleExportExcel = () => {
    const data = departments.map(d => ({
      "Department Code": d.department_code,
      "Department Name": d.department_name,
      "Total Students": d.total_students,
      "Pass Rate (%)": d.pass_rate,
      "Average GPA": d.avg_gpa,
      "Active Exceptions": d.active_exceptions,
      "Status": d.status
    }));
    exportToExcel(data, "Department_Academic_Health");
  };

  const handleExportPDF = () => {
    exportToPDF("departments-content", "Department_Academic_Health_Report", "Department Academic Health");
  };

  const handleExportWord = () => {
    const paragraphs = [
      `Department Academic Health Report`,
      insight ? `Key Insight: ${insight.text}` : `No insights available.`
    ];
    
    const tableData = [
      ["Dept Code", "Department Name", "Students", "Pass Rate (%)", "Avg GPA", "Exceptions", "Status"],
      ...departments.map(d => [
        d.department_code, d.department_name, String(d.total_students), String(d.pass_rate), String(d.avg_gpa), String(d.active_exceptions), d.status
      ])
    ];

    exportToWord(`Department Academic Health`, paragraphs, tableData, "Department_Academic_Health_Report");
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-border p-6 flex flex-col justify-between h-48 animate-pulse">
          <div className="h-6 w-1/3 bg-surface-secondary rounded mb-4"></div>
          <div className="h-4 w-1/2 bg-surface-secondary rounded mb-2"></div>
          <div className="h-20 w-full bg-surface-secondary rounded-2xl"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="departments-content">
      
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 size={14} /> Institutional Structure
          </div>
          <h1 className="text-3xl font-bold text-primary">Department Academic Health</h1>
          <p className="text-secondary text-sm mt-1 max-w-2xl">Aggregated performance indicators and anomaly tracking per academic department.</p>
        </div>
        
        <ExportMenu 
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
          disabled={departments.length === 0}
        />
      </div>

      {errorMsg && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-rose-600 px-6">
          <AlertCircle size={40} className="text-rose-600 dark:text-rose-400" />
          <div className="text-center">
            <p className="font-bold text-lg text-primary">Failed to load departments</p>
            <p className="text-sm text-secondary mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {!loading && !errorMsg && departments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-secondary px-6">
          <AlertCircle size={36} />
          <p className="font-semibold text-secondary">No department data found.</p>
          <p className="text-sm">Adjust filters or ensure data is ingested.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !errorMsg && departments.length > 0 && (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-surface rounded-3xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-primary mb-6">Department Comparison (Pass Rate vs GPA)</h2>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="department_code" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 12, fontWeight: 600 }} />
                  <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: "var(--color-surface-hover)" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
                  />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="pass_rate" name="Pass Rate (%)" radius={[4, 4, 0, 0]} maxBarSize={50} isAnimationActive={true} animationDuration={1500}>
                    {departments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.status === 'INTERVENTION_REQUIRED' ? '#ef4444' : entry.status === 'MONITORING' ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="avg_gpa" name="Avg GPA" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insight */}
          {insight && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="bg-indigo-500/20 p-2 rounded-xl shrink-0 mt-1">
                <Lightbulb size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Key Insight</h3>
                <p className="text-secondary text-sm leading-relaxed">{insight.text}</p>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-secondary">
              <h2 className="text-lg font-bold text-primary">Department Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface text-secondary text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Department</th>
                    <th className="px-6 py-4 font-bold">Students</th>
                    <th className="px-6 py-4 font-bold">Pass Rate</th>
                    <th className="px-6 py-4 font-bold">Avg GPA</th>
                    <th className="px-6 py-4 font-bold">Exceptions</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.map((dept) => (
                    <tr key={dept.department_code} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{dept.department_code}</span>
                          <span className="text-xs text-secondary">{dept.department_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">{dept.total_students.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-extrabold ${dept.pass_rate && dept.pass_rate < 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {dept.pass_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">{dept.avg_gpa}</td>
                      <td className="px-6 py-4">
                        {dept.active_exceptions > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <AlertCircle size={12} /> {dept.active_exceptions}
                          </span>
                        ) : (
                          <span className="text-secondary text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                          dept.status === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          dept.status === 'MONITORING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {dept.status === 'OPTIMAL' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
