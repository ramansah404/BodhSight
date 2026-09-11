export interface AcademicDashboardMetrics {
  as_of_date: string;
  students_evaluated: number;
  pass_rate: number;
  average_marks: number;
  average_gpa: number;
  failure_rate: number;
  significant_deviations: number;
  data_trust_score: number;
  ingestion_status: {
    total_records_ingested: number;
    flagged_anomalies: number;
    missing_students_detected: number;
    impossible_marks_flagged: number;
  };
}

export interface CoursePerformance {
  course_code: string;
  course_name: string;
  department: string;
  semester: string;
  regulation: string;
  batch: string;
  pass_rate: number;
  failure_rate: number;
  avg_marks: number;
  gpa: number;
  students_appeared: number;
  trend: "UP" | "DOWN" | "STABLE";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  attribution: string;
  contextual_factors: {
    entry_ability_score: number;
    course_difficulty_rating: "High" | "Moderate" | "Low";
    historical_pass_rate: number;
  };
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

export interface BatchPerformance {
  batch_year: string;
  programme: string;
  student_count: number;
  avg_gpa: number;
  pass_rate: number;
  backlog_percentage: number;
  trend: "IMPROVING" | "DECLINING" | "STABLE";
  risk_level: "LOW" | "MODERATE" | "HIGH";
}

export interface StudentRiskGroup {
  group_id: string;
  category: string;
  affected_count: number;
  avg_cgpa: number;
  primary_issue: string;
  trend: string;
  recommended_support: string;
}

export interface AnomalyItem {
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
  attribution_root: string;
}

export interface RecommendationItem {
  id: string;
  problem: string;
  evidence: string[];
  recommendation: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  expected_impact: string;
  affected_population: number;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
}

export interface ReportItem {
  id: string;
  title: string;
  type: "PDF" | "CSV" | "JSON";
  generated_date: string;
  category: string;
  size: string;
}
