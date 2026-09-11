import type { AcademicDashboardMetrics, CoursePerformance, DepartmentPerformance, SectionComparison, TrendData, ReportItem, AcademicException, InterventionPriorityItem } from "../types/agent10";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const mockDashboard: AcademicDashboardMetrics = {
  as_of_date: "2026-09-11",
  students_evaluated: 2450,
  pass_rate: 82.4,
  average_marks: 68.2,
  average_gpa: 7.8,
  failure_rate: 17.6,
  significant_deviations: 3,
  data_trust_score: 94
};

const mockCourses: CoursePerformance[] = [
  { course_code: "CS301", course_name: "Data Structures & Algorithms", department: "CSE", semester: "2026-T1", pass_rate: 61.2, failure_rate: 38.8, avg_marks: 54.1, gpa: 6.2, students_appeared: 180, trend: "DOWN", priority: "CRITICAL" },
  { course_code: "EC202", course_name: "Digital Signal Processing", department: "ECE", semester: "2026-T1", pass_rate: 73.5, failure_rate: 26.5, avg_marks: 63.0, gpa: 7.1, students_appeared: 140, trend: "DOWN", priority: "HIGH" },
];

const mockDepartments: DepartmentPerformance[] = [
  { department_code: "CSE", department_name: "Computer Science & Engineering", total_students: 980, faculty_count: 42, pass_rate: 81.0, avg_gpa: 7.9, active_exceptions: 2, status: "MONITORING" },
  { department_code: "ECE", department_name: "Electronics & Communication", total_students: 750, faculty_count: 35, pass_rate: 79.2, avg_gpa: 7.5, active_exceptions: 1, status: "MONITORING" },
];

const mockSections: SectionComparison[] = [
  { course_code: "EC202", course_name: "Digital Signal Processing", section_name: "Section A", instructor_name: "Dr. Ramesh Kumar", students_count: 70, pass_rate: 84.0, avg_marks: 71.5, disparity_flag: false }
];

const mockTrends: TrendData[] = [
  { semester: "2026-T1", pass_rate: 82.4, avg_gpa: 7.8, average_marks: 68.2, evaluation_count: 2450 }
];

const mockReports: ReportItem[] = [
  { id: "rep-01", title: "Dean's Executive Academic Summary (2026-T1)", type: "PDF", generated_date: "2026-09-11", category: "Institutional", size: "2.4 MB" },
  { id: "rep-02", title: "Agent 10 Exception & Anomaly Audit Log", type: "CSV", generated_date: "2026-09-10", category: "Exceptions", size: "840 KB" },
  { id: "rep-03", title: "Departmental Performance Breakdown Report", type: "PDF", generated_date: "2026-09-08", category: "Departments", size: "4.1 MB" },
  { id: "rep-04", title: "Intervention Priority Action Plan", type: "JSON", generated_date: "2026-09-07", category: "Remedial", size: "120 KB" }
];

const mockExceptions: AcademicException[] = [
  {
    id: "exc-01",
    severity: "CRITICAL",
    title: "Significant pass rate drop in CS301",
    course_code: "CS301",
    department: "CSE",
    current_value: 61.2,
    baseline_value: 82.0,
    deviation: -20.8,
    affected_students: 84,
    explanation: "CS301 pass rate decreased from 82% to 61.2% across all sections.",
    evidence: ["assessment.v_course_performance", "Historical baseline: 82%"],
    recommended_action: "Schedule faculty-HOD review meeting.",
    detected_date: "2026-09-10"
  }
];

const mockPriorities: InterventionPriorityItem[] = [
  { rank: 1, course_code: "CS301", course_name: "Data Structures", department: "CSE", priority: "CRITICAL", severity_score: 0.92, pass_rate: 61.2, failure_rate: 38.8, affected_students: 84, recommended_intervention: "Mandatory remedial labs" }
];

export async function fetchDashboardMetrics(): Promise<AcademicDashboardMetrics> { return mockDashboard; }
export async function fetchCourses(): Promise<CoursePerformance[]> { return mockCourses; }
export async function fetchDepartments(): Promise<DepartmentPerformance[]> { return mockDepartments; }
export async function fetchSections(): Promise<SectionComparison[]> { return mockSections; }
export async function fetchTrends(): Promise<TrendData[]> { return mockTrends; }
export async function fetchReports(): Promise<ReportItem[]> { return mockReports; }
export async function fetchExceptions(): Promise<AcademicException[]> { return mockExceptions; }
export async function fetchInterventionPriorities(): Promise<InterventionPriorityItem[]> { return mockPriorities; }
