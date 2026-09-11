export interface AcademicDashboardMetrics {
  as_of_date: string;
  students_evaluated: number;
  pass_rate: number;
  average_marks: number;
  average_gpa: number;
  failure_rate: number;
  significant_deviations: number;
  data_trust_score: number;
}

export interface CoursePerformance {
  course_code: string;
  course_name: string;
  department: string;
  semester: string;
  pass_rate: number;
  failure_rate: number;
  avg_marks: number;
  gpa: number;
  students_appeared: number;
  trend: "UP" | "DOWN" | "STABLE";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface DepartmentPerformance {
  department_code: string;
  department_name: string;
  total_students: number;
  faculty_count: number;
  pass_rate: number;
  avg_gpa: number;
  active_exceptions: number;
  status: "OPTIMAL" | "MONITORING" | "INTERVENTION_REQUIRED";
}

export interface SectionComparison {
  course_code: string;
  course_name: string;
  section_name: string;
  instructor_name: string;
  students_count: number;
  pass_rate: number;
  avg_marks: number;
  disparity_flag: boolean;
}

export interface TrendData {
  semester: string;
  pass_rate: number;
  avg_gpa: number;
  average_marks: number;
  evaluation_count: number;
}

export interface ReportItem {
  id: string;
  title: string;
  type: "PDF" | "CSV" | "JSON";
  generated_date: string;
  category: string;
  size: string;
}

export interface AcademicException {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  course_code: string;
  department: string;
  current_value: number;
  baseline_value: number;
  deviation: number;
  affected_students: number;
  explanation: string;
  evidence: string[];
  recommended_action: string;
  detected_date: string;
}

export interface InterventionPriorityItem {
  rank: number;
  course_code: string;
  course_name: string;
  department: string;
  priority: string;
  severity_score: number;
  pass_rate: number;
  failure_rate: number;
  affected_students: number;
  recommended_intervention: string;
}
