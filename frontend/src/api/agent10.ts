import type { 
  AcademicDashboardMetrics, 
  CoursePerformance, 
  DepartmentPerformance, 
  SectionComparison, 
  TrendData, 
  ReportItem, 
  AcademicException, 
  InterventionPriorityItem,
  SlicedDemographics
} from "../types/agent10";

// API_BASE_URL removed as it was unused

const mockDashboard: AcademicDashboardMetrics = {
  as_of_date: "2026-09-11",
  students_evaluated: 2450,
  pass_rate: 82.4,
  average_marks: 68.2,
  average_gpa: 7.8,
  failure_rate: 17.6,
  significant_deviations: 3,
  data_trust_score: 94,
  ingestion_status: {
    total_records_ingested: 2450,
    flagged_anomalies: 2,
    missing_students_detected: 0,
    impossible_marks_flagged: 2
  }
};

const mockCourses: CoursePerformance[] = [
  { 
    course_code: "CS301", 
    course_name: "Data Structures & Algorithms", 
    department: "CSE", 
    semester: "2026-T1", 
    regulation: "R-24", 
    batch: "2024-2028",
    pass_rate: 61.2, 
    failure_rate: 38.8, 
    avg_marks: 54.1, 
    gpa: 6.2, 
    students_appeared: 180, 
    trend: "DOWN", 
    priority: "CRITICAL",
    attribution: "University Question Paper Difficulty (Consistent drop across all 3 sections)",
    contextual_factors: {
      entry_ability_score: 84.5,
      course_difficulty_rating: "High",
      historical_pass_rate: 82.0
    }
  },
  { 
    course_code: "EC202", 
    course_name: "Digital Signal Processing", 
    department: "ECE", 
    semester: "2026-T1", 
    regulation: "R-24", 
    batch: "2024-2028",
    pass_rate: 73.5, 
    failure_rate: 26.5, 
    avg_marks: 63.0, 
    gpa: 7.1, 
    students_appeared: 140, 
    trend: "DOWN", 
    priority: "HIGH",
    attribution: "Section-specific variance (Section B lagging behind Section A by 22%)",
    contextual_factors: {
      entry_ability_score: 79.0,
      course_difficulty_rating: "Moderate",
      historical_pass_rate: 78.5
    }
  },
];

const mockDemographics: SlicedDemographics[] = [
  { dimension_type: "gender", category_name: "Female Students", students_count: 1120, pass_rate: 86.2, avg_gpa: 8.1 },
  { dimension_type: "gender", category_name: "Male Students", students_count: 1330, pass_rate: 79.1, avg_gpa: 7.6 },
  { dimension_type: "admission_category", category_name: "Regular / Convenor Quota", students_count: 1700, pass_rate: 85.0, avg_gpa: 8.0 },
  { dimension_type: "admission_category", category_name: "Management Quota", students_count: 750, pass_rate: 76.5, avg_gpa: 7.2 },
  { dimension_type: "entry_qualification", category_name: "Regular Entry (10+2)", students_count: 2100, pass_rate: 83.1, avg_gpa: 7.9 },
  { dimension_type: "entry_qualification", category_name: "Lateral Entry (Diploma)", students_count: 350, pass_rate: 78.0, avg_gpa: 7.4 }
];

const mockDepartments: DepartmentPerformance[] = [
  { department_code: "CSE", department_name: "Computer Science & Engineering", total_students: 980, faculty_count: 42, pass_rate: 81.0, avg_gpa: 7.9, active_exceptions: 2, status: "MONITORING" },
  { department_code: "ECE", department_name: "Electronics & Communication", total_students: 750, faculty_count: 35, pass_rate: 79.2, avg_gpa: 7.5, active_exceptions: 1, status: "MONITORING" },
  { department_code: "MECH", department_name: "Mechanical Engineering", total_students: 420, faculty_count: 28, pass_rate: 88.5, avg_gpa: 8.2, active_exceptions: 0, status: "OPTIMAL" },
  { department_code: "CIVIL", department_name: "Civil Engineering", total_students: 300, faculty_count: 20, pass_rate: 84.1, avg_gpa: 7.8, active_exceptions: 0, status: "OPTIMAL" }
];

const mockSections: SectionComparison[] = [
  { course_code: "EC202", course_name: "Digital Signal Processing", section_name: "Section A", instructor_name: "Dr. Ramesh Kumar", students_count: 70, pass_rate: 84.0, avg_marks: 71.5, disparity_flag: false },
  { course_code: "EC202", course_name: "Digital Signal Processing", section_name: "Section B", instructor_name: "Prof. Anil Verma", students_count: 70, pass_rate: 62.0, avg_marks: 54.5, disparity_flag: true },
];

const mockTrends: TrendData[] = [
  { semester: "2024-T1", pass_rate: 84.5, avg_gpa: 8.0, average_marks: 70.1, evaluation_count: 2300 },
  { semester: "2025-T1", pass_rate: 85.0, avg_gpa: 8.1, average_marks: 71.2, evaluation_count: 2400 },
  { semester: "2026-T1", pass_rate: 82.4, avg_gpa: 7.8, average_marks: 68.2, evaluation_count: 2450 },
];

const mockReports: ReportItem[] = [
  { id: "rep-01", title: "Principal & Management Executive Academic Summary", type: "PDF", generated_date: "2026-09-11", category: "Management", size: "2.4 MB" },
  { id: "rep-02", title: "IQAC Accreditation Compliance Report", type: "PDF", generated_date: "2026-09-10", category: "Quality Assurance", size: "3.1 MB" },
  { id: "rep-03", title: "Agent 10 Exception & Ingestion Anomaly Audit Log", type: "CSV", generated_date: "2026-09-10", category: "Exceptions", size: "840 KB" }
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
    explanation: "CS301 pass rate decreased from 82% to 61.2% uniformly across all sections.",
    evidence: ["assessment.v_course_performance", "Ingestion check: 0 missing students", "Attribution: University question paper difficulty"],
    recommended_action: "Schedule faculty-HOD review meeting & review grading calibration.",
    detected_date: "2026-09-10",
    attribution_root: "University Question Paper Rigor"
  }
];

const mockPriorities: InterventionPriorityItem[] = [
  { rank: 1, course_code: "CS301", course_name: "Data Structures", department: "CSE", priority: "CRITICAL", severity_score: 0.92, pass_rate: 61.2, failure_rate: 38.8, affected_students: 84, recommended_intervention: "Mandatory remedial labs & syllabus pacing review" }
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function fetchDashboardMetrics(): Promise<AcademicDashboardMetrics> {
  try {
    const res = await fetch(`${API_BASE_URL}/agent10/dashboard`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Dashboard metrics fetch failed", e);
  }
  return mockDashboard;
}

export async function fetchCourses(): Promise<CoursePerformance[]> { return mockCourses; }
export async function fetchDemographics(): Promise<SlicedDemographics[]> { return mockDemographics; }
export async function fetchDepartments(): Promise<DepartmentPerformance[]> { return mockDepartments; }
export async function fetchSections(): Promise<SectionComparison[]> { return mockSections; }
export async function fetchTrends(): Promise<TrendData[]> { return mockTrends; }
export async function fetchReports(): Promise<ReportItem[]> { return mockReports; }

export async function fetchExceptions(): Promise<AcademicException[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/agent10/exceptions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Exceptions fetch failed", e);
  }
  return mockExceptions;
}

export async function fetchInterventionPriorities(): Promise<InterventionPriorityItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/agent10/priorities`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Priorities fetch failed", e);
  }
  return mockPriorities;
}
