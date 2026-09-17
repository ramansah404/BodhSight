import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Users, AlertTriangle, AlertCircle, Info, BookOpen, PieChart as PieChartIcon, Search, Plus, Edit } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Agent10API } from "../services/api";
import { useFilters } from "../contexts/FilterContext";
import type { TrendsResponse } from "../types/agent10";
import ExportMenu from "../components/ui/ExportMenu";
import { exportToExcel, exportToPDF, exportToWord } from "../utils/exportUtils";
import StudentDrilldownModal from "../components/ui/StudentDrilldownModal";
import StudentEditorModal, { StudentFormData } from "../components/students/StudentEditorModal";
import { useRole } from "../contexts/RoleContext";

type LoadState = "loading" | "success" | "error" | "empty";
type TabType = "analytics" | "directory";

export default function Students() {
  const { currentRole } = useRole();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  
  // Analytics state
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Directory state
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [dirState, setDirState] = useState<LoadState>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<StudentFormData | null>(null);

  const canDrilldown = true;
  const canEdit = ["Admin", "Chairman", "HOD", "Dean", "Faculty"].includes(currentRole || "");

  // Drilldown state
  const [drilldown, setDrilldown] = useState<{ isOpen: boolean; context: string; title: string }>({
    isOpen: false,
    context: "",
    title: "",
  });

  const loadDirectory = () => {
    setDirState("loading");
    Agent10API.getAllStudents()
      .then((data) => {
        setStudentsList(data);
        setDirState(data.length ? "success" : "empty");
      })
      .catch(() => setDirState("error"));
  };

  useEffect(() => {
    if (activeTab === "directory") {
      loadDirectory();
    }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    Agent10API.getTrends(filters)
      .then((data) => {
        if (cancelled) return;
        if (!data) setState("empty");
        else { setTrendsData(data); setState("success"); }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Failed to load student data.");
        setState("error");
      });
    return () => { cancelled = true; };
  }, [filters]);

  const backlog = trendsData?.student_backlog_trend;

  const pieData = useMemo(() => {
    if (!backlog) return [];
    return [
      { name: "Critical Risk (≥3 backlogs)", value: backlog.students_high_backlogs, color: "#e11d48" },
      { name: "Moderate Risk (1-2 backlogs)", value: backlog.students_with_backlogs - backlog.students_high_backlogs, color: "#d97706" }
    ];
  }, [backlog]);

  const handleExportExcel = () => {
    if (!backlog) return;
    const data = pieData.map(d => ({
      "Risk Level": d.name.split(" ")[0],
      "Description": d.name,
      "Number of Students": d.value,
      "Percentage of Cohort (%)": ((d.value / backlog.total_students) * 100).toFixed(1)
    }));
    exportToExcel(data, "At_Risk_Student_Report");
  };

  const handleExportPDF = () => {
    if (!backlog) return;
    const paragraphs = [
      `At-Risk Student Cohort Management Report`,
      `Total Students Active: ${backlog.total_students}`,
      `Students with Backlogs: ${backlog.students_with_backlogs} (${((backlog.students_with_backlogs / backlog.total_students) * 100).toFixed(1)}%)`,
      `Critical High Backlog Students (>=3): ${backlog.students_high_backlogs}`,
      ``,
      `Recommended Interventions:`,
      `- Critical Risk: Mandatory academic counselling. Assign peer mentor. HOD review.`,
      `- Moderate Risk: Supplemental tutorial sessions. Faculty advisory.`
    ];
    
    const tableData = [
      ["Risk Level", "Description", "Number of Students"],
      ...pieData.map(d => [d.name.split(" ")[0], d.name, String(d.value)])
    ];

    exportToPDF(`At-Risk Student Cohort Management`, paragraphs, tableData, "At_Risk_Intervention_Report");
  };

  const handleExportWord = () => {
    if (!backlog) return;
    const paragraphs = [
      `At-Risk Student Cohort Management Report`,
      `Total Students Active: ${backlog.total_students}`,
      `Students with Backlogs: ${backlog.students_with_backlogs} (${((backlog.students_with_backlogs / backlog.total_students) * 100).toFixed(1)}%)`,
      `Critical High Backlog Students (>=3): ${backlog.students_high_backlogs}`,
      ``,
      `Recommended Interventions:`,
      `- Critical Risk: Mandatory academic counselling. Assign peer mentor. HOD review.`,
      `- Moderate Risk: Supplemental tutorial sessions. Faculty advisory.`
    ];
    
    const tableData = [
      ["Risk Level", "Description", "Number of Students"],
      ...pieData.map(d => [d.name.split(" ")[0], d.name, String(d.value)])
    ];

    exportToWord(`At-Risk Student Cohort Management`, paragraphs, tableData, "At_Risk_Intervention_Report");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="students-content">
      <div className="bg-rose-50/50 dark:bg-rose-950/20 backdrop-blur-sm border border-rose-100 dark:border-rose-900/50 rounded-3xl p-8 text-primary shadow-sm flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-500/20 mb-2">
            <ShieldAlert size={14} /> At-Risk Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-rose-950 dark:text-rose-100">At-Risk Student Cohort Management</h1>
          <p className="text-rose-800/80 dark:text-rose-200/70 text-sm mt-1 max-w-2xl">
            Identifying persistent underperformance via backlog analysis and deploying targeted support actions.
          </p>
        </div>
        
        <ExportMenu 
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
          disabled={state !== "success"}
        />
      </div>

      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-6 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "analytics"
              ? "border-rose-500 text-rose-600 dark:text-rose-400"
              : "border-transparent text-secondary hover:text-primary"
          }`}
        >
          Risk Analytics
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 px-6 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "directory"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-secondary hover:text-primary"
          }`}
        >
          Student Directory
        </button>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === "analytics" && (
        <>

      {state === "loading" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-3xl border border-border animate-pulse">
              <div className="h-4 bg-surface-secondary rounded w-1/2 mb-4" />
              <div className="h-8 bg-surface-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-secondary/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="bg-surface rounded-3xl border border-rose-500/20 shadow-sm flex flex-col items-center justify-center py-16 gap-4 px-6">
          <AlertCircle size={40} className="text-rose-600 dark:text-rose-400" />
          <div className="text-center">
            <p className="font-bold text-lg text-primary">Failed to load student data</p>
            <p className="text-sm text-secondary mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {state === "empty" && (
        <div className="bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center py-16 gap-3 px-6">
          <Info size={36} className="text-secondary" />
          <p className="font-semibold text-secondary">No student backlog data found.</p>
        </div>
      )}

      {state === "success" && backlog && (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              className="bg-surface p-6 rounded-3xl border border-border shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-secondary">Total Students</div>
                <Users size={16} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-primary mt-2">
                {backlog.total_students.toLocaleString()}
              </div>
              <div className="text-xs text-secondary font-medium mt-1">Active in institution</div>
            </motion.div>

            <div 
              onClick={() => canDrilldown && setDrilldown({ isOpen: true, context: "at_risk", title: "Students With Backlogs" })}
              className={`bg-surface p-6 rounded-3xl border border-amber-500/20 shadow-sm transition-colors group ${canDrilldown ? 'cursor-pointer hover:bg-surface/80' : 'opacity-90'}`}
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-500 group-hover:text-amber-600 transition-colors">With Backlogs</div>
                <AlertTriangle size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-amber-500 mt-2">
                {backlog.students_with_backlogs.toLocaleString()}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">
                {backlog.total_students > 0
                  ? `${((backlog.students_with_backlogs / backlog.total_students) * 100).toFixed(1)}% of cohort`
                  : "—"}
              </div>
            </div>

            <div 
              onClick={() => canDrilldown && setDrilldown({ isOpen: true, context: "high_risk", title: "High Risk Students" })}
              className={`bg-surface p-6 rounded-3xl border border-rose-500/20 shadow-sm transition-colors group ${canDrilldown ? 'cursor-pointer hover:bg-surface/80' : 'opacity-90'}`}
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-500 group-hover:text-rose-600 transition-colors">High Backlogs (≥3)</div>
                <ShieldAlert size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-rose-500 mt-2">
                {backlog.students_high_backlogs.toLocaleString()}
              </div>
              <div className="text-xs text-rose-600 dark:text-rose-500 font-medium mt-1">Critical intervention needed</div>
            </div>

            <div 
              onClick={() => canDrilldown && setDrilldown({ isOpen: true, context: "low_risk", title: "Low Risk Students" })}
              className={`bg-surface p-6 rounded-3xl border border-amber-500/20 shadow-sm transition-colors group ${canDrilldown ? 'cursor-pointer hover:bg-surface/80' : 'opacity-90'}`}
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-500 group-hover:text-amber-600 transition-colors">Low Backlogs (1-2)</div>
                <AlertCircle size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-amber-500 mt-2">
                {(backlog.students_with_backlogs - backlog.students_high_backlogs).toLocaleString()}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">Early intervention recommended</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 flex flex-col justify-center min-h-[350px] relative">
              <h2 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                <PieChartIcon className="text-indigo-500" size={20} />
                Risk Composition
              </h2>
              
              <div className="absolute top-6 right-6 text-right">
                <div className="text-2xl font-black text-amber-500">{backlog.students_with_backlogs}</div>
                <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">Total At-Risk</div>
              </div>

              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={1500}
                      label={({ value }) => value}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
                      itemStyle={{ color: "var(--color-text-primary)" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <ShieldAlert className="text-rose-500" size={20} />
                Backlog Risk Classification & Intervention
              </h2>

              <div className="space-y-3">
                {/* High risk */}
                <div className="bg-surface border border-rose-200 dark:border-rose-900/50 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-rose-50 dark:bg-rose-950/30 p-5 flex items-start justify-between gap-4 border-b border-rose-100 dark:border-rose-900/50">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                          Critical Risk
                        </span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">≥3 active backlogs</span>
                      </div>
                      <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">Persistent High-Backlog Cohort</h3>
                      <p className="text-sm text-rose-800/80 dark:text-rose-200/70 mt-1">
                        Flagged for persistent underperformance with 3 or more active backlogs across terms.
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-4xl font-black text-rose-600 dark:text-rose-500 leading-none">
                        {backlog.students_high_backlogs}
                      </div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Students</div>
                    </div>
                  </div>
                  <div className="p-5 bg-surface">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Recommended Intervention Action</p>
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 p-1.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg">
                        <ShieldAlert size={16} />
                      </div>
                      <p className="text-sm text-primary font-medium leading-relaxed">
                        Mandatory academic counselling session. Assign peer mentor. HOD review of progress within 2 weeks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Moderate risk */}
                {(backlog.students_with_backlogs - backlog.students_high_backlogs) > 0 && (
                  <div className="bg-surface border border-amber-200 dark:border-amber-900/50 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-5 flex items-start justify-between gap-4 border-b border-amber-100 dark:border-amber-900/50">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                            Moderate Risk
                          </span>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">1–2 active backlogs</span>
                        </div>
                        <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">At-Risk Cohort (Early Stage)</h3>
                        <p className="text-sm text-amber-800/80 dark:text-amber-200/70 mt-1">
                          Accumulating early backlogs. Early intervention recommended to prevent transition to critical risk.
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-4xl font-black text-amber-500 leading-none">
                          {backlog.students_with_backlogs - backlog.students_high_backlogs}
                        </div>
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Students</div>
                      </div>
                    </div>
                    <div className="p-5 bg-surface">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Recommended Intervention Action</p>
                      <div className="flex gap-3 items-start">
                        <div className="mt-0.5 p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg">
                          <AlertTriangle size={16} />
                        </div>
                        <p className="text-sm text-primary font-medium leading-relaxed">
                          Enrol in supplemental tutorial sessions. Faculty advisory meeting within 1 month.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary font-medium px-2">
            <BookOpen size={14} />
            Data sourced from <code className="bg-surface-secondary px-1 py-0.5 rounded text-primary border border-border">people.v_student_profile</code> via Agent 10 analytics engine.
          </div>
        </motion.div>
      )}
        </>
      )}

      {/* Directory Tab Content */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
              <input
                type="text"
                placeholder="Search by name, roll no, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-primary"
              />
            </div>
            {canEdit && (
              <button
                onClick={() => { setEditorData(null); setIsEditorOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              >
                <Plus size={16} /> Add Student
              </button>
            )}
          </div>

          {dirState === "loading" && (
            <div className="p-8 text-center text-secondary">Loading directory...</div>
          )}

          {dirState === "success" && (
            <div className="bg-surface rounded-2xl border border-border overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/50 border-b border-border text-xs uppercase tracking-wider text-secondary">
                    <th className="p-4 font-bold">Roll No</th>
                    <th className="p-4 font-bold">Name</th>
                    <th className="p-4 font-bold">Section</th>
                    <th className="p-4 font-bold text-right">CGPA</th>
                    <th className="p-4 font-bold text-right">Attendance</th>
                    {canEdit && <th className="p-4 font-bold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {studentsList
                    .filter(s => 
                      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.section_code.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(student => (
                      <tr key={student.student_id} className="border-b border-border/50 hover:bg-surface-secondary/20 transition-colors">
                        <td className="p-4 font-mono text-sm text-primary">{student.roll_no}</td>
                        <td className="p-4 font-bold text-sm text-primary">{student.full_name}</td>
                        <td className="p-4 text-sm text-secondary">{student.section_code}</td>
                        <td className="p-4 text-sm font-medium text-right text-indigo-600 dark:text-indigo-400">
                          {student.cgpa.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm font-medium text-right text-emerald-600 dark:text-emerald-400">
                          {student.attendance_pct.toFixed(1)}%
                        </td>
                        {canEdit && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => { setEditorData(student); setIsEditorOpen(true); }}
                              className="p-1.5 text-secondary hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Edit Student"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <StudentDrilldownModal
        isOpen={drilldown.isOpen}
        onClose={() => setDrilldown({ ...drilldown, isOpen: false })}
        context={drilldown.context}
        title={drilldown.title}
      />
      
      <StudentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialData={editorData}
        onSave={async (data) => {
          if (data.student_id) {
            await Agent10API.updateStudent(data.student_id, data);
          } else {
            await Agent10API.createStudent(data);
          }
          loadDirectory();
        }}
      />
    </div>
  );
}
