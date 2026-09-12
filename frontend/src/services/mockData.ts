// Isolated Demo Data for Hackathon Fallback
export const mockDashboard = {
  as_of_date: "2026-09-11", students_evaluated: 2450, pass_rate: 82.4, average_marks: 68.2, average_gpa: 7.8, failure_rate: 17.6, significant_deviations: 3, data_trust_score: 94,
  ingestion_status: { total_records_ingested: 2450, flagged_anomalies: 2, missing_students_detected: 0, impossible_marks_flagged: 2 }
};
export const mockCourses = [
  { course_code: "CS301", course_name: "Data Structures & Algorithms", department: "CSE", semester: "2026-T1", regulation: "R-24", batch: "2024-2028", pass_rate: 61.2, failure_rate: 38.8, avg_marks: 54.1, gpa: 6.2, students_appeared: 180, trend: "DOWN" as const, priority: "CRITICAL" as const, attribution: "University Question Paper Difficulty (All Sections)", contextual_factors: { entry_ability_score: 84.5, course_difficulty_rating: "High" as const, historical_pass_rate: 82.0 } },
  { course_code: "EC202", course_name: "Digital Signal Processing", department: "ECE", semester: "2026-T1", regulation: "R-24", batch: "2024-2028", pass_rate: 73.5, failure_rate: 26.5, avg_marks: 63.0, gpa: 7.1, students_appeared: 140, trend: "DOWN" as const, priority: "HIGH" as const, attribution: "Section-specific variance (Section B lagging)", contextual_factors: { entry_ability_score: 79.0, course_difficulty_rating: "Moderate" as const, historical_pass_rate: 78.5 } },
  { course_code: "ME401", course_name: "Thermodynamics", department: "MECH", semester: "2026-T1", regulation: "R-24", batch: "2024-2028", pass_rate: 45.0, failure_rate: 55.0, avg_marks: 42.1, gpa: 5.0, students_appeared: 95, trend: "DOWN" as const, priority: "CRITICAL" as const, attribution: "Systemic Core Subject Failure", contextual_factors: { entry_ability_score: 72.0, course_difficulty_rating: "High" as const, historical_pass_rate: 65.0 } },
  { course_code: "CE305", course_name: "Structural Analysis", department: "CIVIL", semester: "2026-T1", regulation: "R-24", batch: "2024-2028", pass_rate: 82.5, failure_rate: 17.5, avg_marks: 75.0, gpa: 8.0, students_appeared: 110, trend: "UP" as const, priority: "LOW" as const, attribution: "High Engagement Lab Component", contextual_factors: { entry_ability_score: 76.5, course_difficulty_rating: "Moderate" as const, historical_pass_rate: 75.0 } }
];
export const mockDepartments = [
  { department_code: "CSE", department_name: "Computer Science", total_students: 980, faculty_count: 42, pass_rate: 81.0, avg_gpa: 7.9, active_exceptions: 2, status: "MONITORING" as const },
  { department_code: "ECE", department_name: "Electronics", total_students: 450, faculty_count: 24, pass_rate: 88.5, avg_gpa: 8.2, active_exceptions: 0, status: "ON_TRACK" as const },
  { department_code: "MECH", department_name: "Mechanical", total_students: 320, faculty_count: 18, pass_rate: 62.4, avg_gpa: 6.1, active_exceptions: 4, status: "INTERVENTION_REQUIRED" as const },
  { department_code: "CIVIL", department_name: "Civil Engineering", total_students: 210, faculty_count: 12, pass_rate: 75.2, avg_gpa: 7.0, active_exceptions: 1, status: "MONITORING" as const }
];
export const mockBatches = [
  { batch_year: "2024-2028", programme: "B.Tech CSE", student_count: 980, avg_gpa: 7.9, pass_rate: 82.4, backlog_percentage: 12.5, trend: "DECLINING" as const, risk_level: "MODERATE" as const }
];
export const mockStudents = [
  { group_id: "grp-01", category: "Persistent Underperformance", affected_count: 27, avg_cgpa: 5.2, primary_issue: "Failing core courses", trend: "WORSENING", recommended_support: "Peer tutoring" }
];
export const mockTrends = {
  historical_data_available: true,
  current_term_summary: {
    avg_pass_rate: 82.4,
    avg_marks: 68.2,
    total_sections: 45,
    students_evaluated: 2450
  },
  courses_above_mean: [
    { course_code: "CS401", course_title: "AI", pass_pct: 95.0, delta_vs_mean: 12.6 }
  ],
  courses_below_mean: [
    { course_code: "CS301", course_title: "Data Structures", pass_pct: 61.2, delta_vs_mean: -21.2 }
  ],
  student_backlog_trend: {
    students_with_backlogs: 350,
    students_high_backlogs: 50,
    total_students: 2450
  }
};
export const mockExceptions = [
  { id: "exc-01", severity: "CRITICAL" as const, title: "Significant pass rate drop in CS301", course_code: "CS301", department: "CSE", current_value: 61.2, baseline_value: 82.0, deviation: -20.8, affected_students: 84, explanation: "Pass rate decreased from 82% to 61.2% uniformly.", evidence: ["Ingestion check verified", "Attribution: University paper difficulty"], recommended_action: "Review grading calibration.", detected_date: "2026-09-11", attribution_root: "Systemic" }
];
export const mockRecommendations = [
  { anomaly_id: "rec-01", anomaly_type: "Pass Rate Drop", severity: "CRITICAL", priority_score: 0.95, course_code: "CS301", department: "CSE", affected_students: 84, recommended_action: "Organize mandatory remedial labs.", evidence_sources: ["Uniform drop"], generated_at: "2026-09-12T10:00:00Z" }
];
export const mockSections = [
  { course_code: "CS301", course_name: "Data Structures & Algorithms", section: "A", faculty_name: "Dr. Smith", pass_rate: 65.0, avg_marks: 56.0, gpa: 6.5, disparity_flag: false, contextual_factors: {} },
  { course_code: "CS301", course_name: "Data Structures & Algorithms", section: "B", faculty_name: "Prof. Jones", pass_rate: 45.0, avg_marks: 40.0, gpa: 5.0, disparity_flag: true, contextual_factors: { historical_faculty_pass_rate: 50.0 } }
];
export const mockPriorities = [
  { rank: 1, type: "COURSE", id: "CS301", description: "Critical failure rate in CS301", score: 95, recommendations: ["remedial"], status: "PENDING" as const }
];
export const mockCondonationForecast = {
  at_risk_students_count: 185, 
  estimated_condonation_revenue: 925000, 
  breakdown_by_department: [
    { department: "CSE", count: 50, amount: 250000 },
    { department: "MECH", count: 85, amount: 425000 },
    { department: "ECE", count: 30, amount: 150000 },
    { department: "CIVIL", count: 20, amount: 100000 }
  ], 
  recommendations: ["Targeted fee collection drive for MECH department", "Early parent communication for high-risk cohorts"]
};
export const mockStudentDrilldown = [
  { student_id: "S101", roll_no: "21A91A0501", full_name: "Alice Smith", department_code: "CSE", batch_label: "2024-2028", programme_code: "B.Tech", attendance_pct: 68, cgpa: 5.4, backlog_count: 3, reason: "Failing core courses, Low Attendance", status: "AT_RISK", section_code: "A", fee_outstanding: 0 },
  { student_id: "S102", roll_no: "21A91A0502", full_name: "Bob Jones", department_code: "CSE", batch_label: "2024-2028", programme_code: "B.Tech", attendance_pct: 82, cgpa: 5.8, backlog_count: 1, reason: "Borderline performance in EC202", status: "MONITOR", section_code: "B", fee_outstanding: 0 }
];
export const mockEvidence = {
  course_code: "CS301", evidence: ["Syllabus covered late", "Tough mid-term"]
};
export const mockSummary = {
  summary: "Overall performance is stable, but CS301 requires immediate attention due to a 20% drop in pass rate. Early interventions could salvage the semester.",
  dashboard_snapshot: { as_of_date: "2026-09-12" }
};
export const mockNotifications = [
  { id: "n1", title: "Macro Intervention Approval Required", message: "Review mandatory remedial labs proposed for MECH department.", type: "ALERT", is_read: false, created_at: "2026-09-12T10:00:00Z" },
  { id: "n2", title: "New Exception Detected (CS301)", message: "CS301 pass rate dropped by 20% uniformly.", type: "WARNING", is_read: false, created_at: "2026-09-11T14:30:00Z" },
  { id: "n3", title: "Pending HOD Review", message: "Faculty feedback pending for EC202 Section B variance.", type: "INFO", is_read: false, created_at: "2026-09-11T09:15:00Z" }
];
