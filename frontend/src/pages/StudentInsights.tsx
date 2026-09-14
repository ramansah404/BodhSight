import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Agent10API } from "../services/api";
import { useFilters } from "../contexts/FilterContext";
import type { StudentProfile } from "../types/agent10";
import { exportToExcel } from "../utils/exportUtils";

type Condition = "evaluated" | "at_risk" | "high_risk" | "attendance_risk" | "outstanding_fees" | "problems";

const CONDITIONS: Record<Condition, string> = {
  evaluated: "Students Evaluated",
  at_risk: "Students With Backlogs",
  high_risk: "High Backlog Students",
  attendance_risk: "Attendance Risk",
  outstanding_fees: "Outstanding Fees",
  problems: "Students With Open Problems",
};

const isCondition = (value: string | null): value is Condition => value != null && value in CONDITIONS;

const displayValue = (value: string | number | null | undefined) => value == null || value === "" ? "Unavailable" : String(value);

export default function StudentInsights() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters } = useFilters();
  const requestedCondition = searchParams.get("condition");
  const [condition, setCondition] = useState<Condition>(isCondition(requestedCondition) ? requestedCondition : "evaluated");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isCondition(requestedCondition)) setCondition(requestedCondition);
  }, [requestedCondition]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setError("");
    setSelected(null);
    Agent10API.getStudentDrilldown(condition, filters)
      .then((data) => {
        if (cancelled) return;
        setStudents(data);
        setState("success");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError?.response?.data?.detail || requestError?.message || "Unable to load student records.");
        setStudents([]);
        setState("error");
      });
    return () => { cancelled = true; };
  }, [condition, filters]);

  const exportRows = useMemo(() => students.map((student) => ({
    "Roll No": student.roll_no,
    Name: student.full_name,
    Department: student.department_code,
    Programme: student.programme_code,
    Section: student.section_code,
    Attendance: student.attendance_pct ?? "Unavailable",
    CGPA: student.cgpa ?? "Unavailable",
    "Backlogs": student.backlog_count ?? "Unavailable",
    "Outstanding Fees": student.fee_outstanding ?? "Unavailable",
    Reason: student.reason ?? "Unavailable",
  })), [students]);

  const changeCondition = (value: Condition) => {
    setCondition(value);
    setSearchParams({ condition: value });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
            <Users size={14} /> Student Insights
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{CONDITIONS[condition]}</h1>
          <p className="mt-1 text-sm text-secondary">Live student records for the selected Agent 10 condition.</p>
        </div>
        <button
          type="button"
          onClick={() => exportToExcel(exportRows, `${condition}-students`)}
          disabled={students.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-primary transition hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} /> Download
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <label htmlFor="student-condition" className="text-sm font-bold text-primary">Condition</label>
        <select
          id="student-condition"
          value={condition}
          onChange={(event) => changeCondition(event.target.value as Condition)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"
        >
          {Object.entries(CONDITIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span className="text-sm text-secondary">{state === "success" ? `${students.length} records` : ""}</span>
      </div>

      {state === "loading" && <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-border bg-surface text-secondary"><Loader2 className="animate-spin" size={20} /> Loading student records</div>}
      {state === "error" && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
      {state === "success" && students.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-secondary">No students match this condition and current scope.</div>}

      {state === "success" && students.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wider text-secondary">
              <tr><th className="p-4">Roll No</th><th className="p-4">Name</th><th className="p-4">Dept</th><th className="p-4">Attendance</th><th className="p-4">CGPA</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => (
                <tr key={student.student_id} className="hover:bg-surface-secondary/60">
                  <td className="p-4 font-semibold text-primary">{displayValue(student.roll_no)}</td>
                  <td className="p-4 text-primary">{displayValue(student.full_name)}</td>
                  <td className="p-4 text-secondary">{displayValue(student.department_code)}</td>
                  <td className="p-4 text-secondary">{student.attendance_pct == null ? "Unavailable" : `${student.attendance_pct}%`}</td>
                  <td className="p-4 text-secondary">{displayValue(student.cgpa)}</td>
                  <td className="p-4"><button type="button" onClick={() => setSelected(student)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-teal-700 hover:border-teal-500 dark:text-teal-300"><Eye size={15} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <section className="rounded-2xl border border-border bg-surface p-6" aria-label="Student profile">
          <h2 className="text-xl font-bold text-primary">Student Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[["Roll No", selected.roll_no], ["Name", selected.full_name], ["Department", selected.department_code], ["Programme", selected.programme_code], ["Section", selected.section_code], ["Batch", selected.batch_label], ["Attendance", selected.attendance_pct == null ? null : `${selected.attendance_pct}%`], ["CGPA", selected.cgpa], ["Backlogs", selected.backlog_count], ["Outstanding Fees", selected.fee_outstanding], ["Reason", selected.reason]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-background p-4"><div className="text-xs font-bold uppercase tracking-wider text-secondary">{label}</div><div className="mt-1 font-semibold text-primary">{displayValue(value as string | number | null)}</div></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
