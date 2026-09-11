// Isolated Demo Data for Hackathon Fallback
export const mockDashboard = {
  as_of_date: "2026-09-11", students_evaluated: 2450, pass_rate: 82.4, average_marks: 68.2, average_gpa: 7.8, failure_rate: 17.6, significant_deviations: 3, data_trust_score: 94,
  ingestion_status: { total_records_ingested: 2450, flagged_anomalies: 2, missing_students_detected: 0, impossible_marks_flagged: 2 }
};
export const mockCourses = [
  { course_code: "CS301", course_name: "Data Structures & Algorithms", department: "CSE", semester: "2026-T1", regulation: "R-24", batch: "2024-2028", pass_rate: 61.2, failure_rate: 38.8, avg_marks: 54.1, gpa: 6.2, students_appeared: 180, trend: "DOWN" as const, priority: "CRITICAL" as const, attribution: "University Question Paper Difficulty (All Sections)", contextual_factors: { entry_ability_score: 84.5, course_difficulty_rating: "High" as const, historical_pass_rate: 82.0 } },
  { course_code: "EC202", course_name: "Digital Signal Processing", department: "ECE", semester: "2026-T1", regulation: "R-24", batch: "2024-2028", pass_rate: 73.5, failure_rate: 26.5, avg_marks: 63.0, gpa: 7.1, students_appeared: 140, trend: "DOWN" as const, priority: "HIGH" as const, attribution: "Section-specific variance (Section B lagging)", contextual_factors: { entry_ability_score: 79.0, course_difficulty_rating: "Moderate" as const, historical_pass_rate: 78.5 } }
];
export const mockDepartments = [
  { department_code: "CSE", department_name: "Computer Science", total_students: 980, faculty_count: 42, pass_rate: 81.0, avg_gpa: 7.9, active_exceptions: 2, status: "MONITORING" as const }
];
export const mockBatches = [
  { batch_year: "2024-2028", programme: "B.Tech CSE", student_count: 980, avg_gpa: 7.9, pass_rate: 82.4, backlog_percentage: 12.5, trend: "DECLINING" as const, risk_level: "MODERATE" as const }
];
export const mockStudents = [
  { group_id: "grp-01", category: "Persistent Underperformance", affected_count: 27, avg_cgpa: 5.2, primary_issue: "Failing core courses", trend: "WORSENING", recommended_support: "Peer tutoring" }
];
export const mockTrends = [
  { semester: "2024-T1", pass_rate: 84.5, avg_gpa: 8.0, average_marks: 70.1, evaluation_count: 2300 },
  { semester: "2025-T1", pass_rate: 85.0, avg_gpa: 8.1, average_marks: 71.2, evaluation_count: 2400 },
  { semester: "2026-T1", pass_rate: 82.4, avg_gpa: 7.8, average_marks: 68.2, evaluation_count: 2450 }
];
export const mockExceptions = [
  { id: "exc-01", severity: "CRITICAL" as const, title: "Significant pass rate drop in CS301", course_code: "CS301", department: "CSE", current_value: 61.2, baseline_value: 82.0, deviation: -20.8, affected_students: 84, explanation: "Pass rate decreased from 82% to 61.2% uniformly.", evidence: ["Ingestion check verified", "Attribution: University paper difficulty"], recommended_action: "Review grading calibration.", detected_date: "2026-09-11", attribution_root: "Systemic" }
];
export const mockRecommendations = [
  { id: "rec-01", problem: "CS301 pass rate declined significantly.", evidence: ["Uniform drop"], recommendation: "Organize mandatory remedial labs.", priority: "CRITICAL" as const, expected_impact: "Recover cohort pass rate by ~15%.", affected_population: 84, status: "PENDING" as const }
];
