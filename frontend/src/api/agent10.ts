import type { AcademicDashboardMetrics, CoursePerformance, DepartmentPerformance, SectionComparison, AcademicException, InterventionPriorityItem } from "../types/agent10";

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
  { course_code: "EC202", course_name: "Digital Signal Processing", section_name: "Section A", instructor_name: "Dr. Ramesh Kumar", students_count: 70, pass_rate: 84.0, avg_marks: 71.5, disparity_flag: false },
  { course_code: "EC202", course_name: "Digital Signal Processing", section_name: "Section B", instructor_name: "Prof. Anil Verma", students_count: 70, pass_rate: 62.0, avg_marks: 54.5, disparity_flag: true },
  { course_code: "CS301", course_name: "Data Structures & Algorithms", section_name: "Section A", instructor_name: "Dr. Sunita Rao", students_count: 60, pass_rate: 62.0, avg_marks: 55.0, disparity_flag: false },
  { course_code: "CS301", course_name: "Data Structures & Algorithms", section_name: "Section B", instructor_name: "Dr. Vikram Patel", students_count: 60, pass_rate: 59.0, avg_marks: 52.0, disparity_flag: false },
  { course_code: "CS301", course_name: "Data Structures & Algorithms", section_name: "Section C", instructor_name: "Dr. Sunita Rao", students_count: 60, pass_rate: 63.0, avg_marks: 55.3, disparity_flag: false }
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
export async function fetchExceptions(): Promise<AcademicException[]> { return mockExceptions; }
export async function fetchInterventionPriorities(): Promise<InterventionPriorityItem[]> { return mockPriorities; }
