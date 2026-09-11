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
