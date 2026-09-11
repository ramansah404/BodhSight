import type { AcademicDashboardMetrics, CoursePerformance, AcademicException, InterventionPriorityItem } from "../types/agent10";

// Change this when connecting to teammate's FastAPI backend
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
    explanation: "CS301 pass rate decreased from 82% to 61.2%. The decline is observed across all three sections (A, B, C), suggesting a course-wide factor (such as question paper difficulty or foundational gap) rather than an isolated faculty issue.",
    evidence: ["assessment.v_course_performance", "Historical baseline 2025-T1: 82.0%", "Section A: 62%, Section B: 59%, Section C: 63%"],
    recommended_action: "Schedule faculty-HOD review meeting and initiate peer-assisted remedial sessions.",
    detected_date: "2026-09-10"
  }
];

const mockPriorities: InterventionPriorityItem[] = [
  { rank: 1, course_code: "CS301", course_name: "Data Structures", department: "CSE", priority: "CRITICAL", severity_score: 0.92, pass_rate: 61.2, failure_rate: 38.8, affected_students: 84, recommended_intervention: "Mandatory remedial labs" }
];

export async function fetchDashboardMetrics(): Promise<AcademicDashboardMetrics> {
  return mockDashboard;
}
export async function fetchCourses(): Promise<CoursePerformance[]> {
  return mockCourses;
}
export async function fetchExceptions(): Promise<AcademicException[]> {
  return mockExceptions;
}
export async function fetchInterventionPriorities(): Promise<InterventionPriorityItem[]> {
  return mockPriorities;
}
