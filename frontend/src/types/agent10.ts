// ============================================================
// BodhSight — Agent 10 TypeScript types
// These match the actual backend Pydantic schemas exactly.
// ============================================================

// --- Dashboard ---

export interface AcademicDashboardMetrics {
  as_of_date: string;
  students_evaluated: number;
  pass_rate: number;
  average_marks: number;
  average_gpa: number | null;
  failure_rate: number;
  significant_deviations: number;
  data_trust_score: number;
  // Extended fields from backend
  total_students?: number;
  courses_analyzed?: number;
  active_anomalies?: number;
  data_source?: string;
  // Legacy field (kept for TS compat with old mockData)
  ingestion_status?: {
    total_records_ingested: number;
    flagged_anomalies: number;
    missing_students_detected: number;
    impossible_marks_flagged: number;
  };
}

// --- Courses ---

export interface CoursePerformance {
  course_code: string;
  course_name: string;   // mapped from backend's course_title
  department: string;
  semester: string;
  regulation?: string;   // not in backend views — optional
  batch?: string;        // not in backend views — optional
  pass_rate: number;
  failure_rate: number;
  avg_marks: number;
  gpa: number | null;
  students_appeared: number;
  trend: "UP" | "DOWN" | "STABLE";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  attribution?: string;  // not in backend views — optional
  avg_internal?: number | null;
  avg_external?: number | null;
  sd_external?: number | null;
  internal_external_corr?: number | null;
  contextual_factors?: {
    entry_ability_score: number;
    course_difficulty_rating: "High" | "Moderate" | "Low";
    historical_pass_rate: number;
  };
}

// --- Departments ---

export interface DepartmentPerformance {
  department_code: string;
  department_name: string;
  total_students: number;
  faculty_count?: number | null;
  pass_rate?: number | null;
  avg_gpa?: number | null;
  active_exceptions: number;
  status: "OPTIMAL" | "MONITORING" | "INTERVENTION_REQUIRED" | "NO_DATA";
  total_offerings?: number;
}

// --- Sections ---
// Backend returns: {course_code, course_title, department, section, students_appeared, pass_rate, avg_marks, disparity_flag}

export interface SectionComparison {
  course_code: string;
  course_title: string;    // backend field name
  department: string;
  section: string;         // backend field name (not section_name)
  students_appeared: number;
  pass_rate: number | null;
  avg_marks: number | null;
  avg_internal?: number | null;
  avg_external?: number | null;
  disparity_flag: boolean;
  // Alias for UI compat
  course_name?: string;
  section_name?: string;
  instructor_name?: string;
  students_count?: number;
}

// --- Students / At-Risk ---

export interface StudentBacklogSummary {
  students_with_backlogs: number;
  students_high_backlogs: number;
  total_students: number;
}

export interface StudentAtRisk {
  student_id: string;
  roll_no: string;
  full_name: string;
  department_code: string;
  programme_code: string;
  batch_label: string;
  cgpa: number | null;
  backlog_count: number;
  status: string;
}

// Legacy type for compat
export interface StudentRiskGroup {
  group_id: string;
  category: string;
  affected_count: number;
  avg_cgpa: number;
  primary_issue: string;
  trend: string;
  recommended_support: string;
}

// --- Anomalies / Exceptions ---

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
  explanation: string;  // mapped from deviation_summary or title
  evidence: string[];   // mapped from evidence_sources
  recommended_action: string;
  detected_date: string;
  attribution_root?: string;
  // Extended fields
  anomaly_type?: string;
  priority_score?: number | null;
  course_title?: string | null;
  is_overdue?: boolean;
}

// --- Recommendations ---
// Backend shape from /agent10/recommendations

export interface BackendRecommendation {
  anomaly_id: string;
  anomaly_type: string | null;
  severity: string;
  priority_score: number;
  course_code: string | null;
  department: string | null;
  affected_students: number;
  recommended_action: string;
  evidence_sources: string[];
  generated_at: string;
}

// UI shape (mapped from BackendRecommendation)
export interface RecommendationItem {
  id: string;
  problem: string;
  evidence: string[];
  recommendation: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  expected_impact: string;
  affected_population: number;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  course_code?: string | null;
  department?: string | null;
}

// --- Trends ---
// Backend returns a SINGLE OBJECT (not an array) because only one term exists

export interface TrendCurrentTerm {
  avg_pass_rate: number | null;
  avg_marks: number | null;
  total_sections: number;
  students_evaluated: number;
}

export interface TrendCourseEntry {
  course_code: string;
  course_title: string;
  pass_pct: number;
  delta_vs_mean: number;
}

export interface TrendsResponse {
  historical_data_available: boolean;
  insufficient_history_note?: string | null;
  current_term_summary?: TrendCurrentTerm | null;
  courses_above_mean: TrendCourseEntry[];
  courses_below_mean: TrendCourseEntry[];
  student_backlog_trend?: StudentBacklogSummary | null;
}

// Legacy type kept for any remaining compat
export interface TrendData {
  semester: string;
  pass_rate: number;
  avg_gpa: number;
  average_marks: number;
  evaluation_count: number;
}

// --- Reports ---

export interface ReportItem {
  id: string;
  title: string;
  type: "PDF" | "CSV" | "JSON";
  generated_date: string;
  category: string;
  size: string;
}

// --- Intervention Priorities ---

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
  anomaly_type?: string | null;
}

// --- Demographics (legacy, not wired to real endpoint) ---

export interface SlicedDemographics {
  dimension_type: "gender" | "admission_category" | "entry_qualification";
  category_name: string;
  students_count: number;
  pass_rate: number;
  avg_gpa: number;
}

// --- Batch (legacy, not wired to real endpoint) ---

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

// --- Utility: map BackendRecommendation → RecommendationItem ---

export function mapBackendRecommendation(r: BackendRecommendation): RecommendationItem {
  const priorityMap: Record<string, "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"> = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  };
  const priority = priorityMap[r.severity?.toUpperCase()] ?? "MEDIUM";

  const anomalyLabel = (r.anomaly_type ?? "UNKNOWN")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: r.anomaly_id,
    problem: r.course_code
      ? `${anomalyLabel} detected in course ${r.course_code}${r.department ? ` (${r.department})` : ""}.`
      : `${anomalyLabel} detected${r.department ? ` in ${r.department}` : ""}.`,
    evidence: r.evidence_sources,
    recommendation: r.recommended_action,
    priority,
    expected_impact: `Affects ${r.affected_students} student${r.affected_students !== 1 ? "s" : ""}. Priority score: ${(r.priority_score * 100).toFixed(0)}/100.`,
    affected_population: r.affected_students,
    status: "PENDING",
    course_code: r.course_code,
    department: r.department,
  };
}

// --- Utility: map backend course performance → CoursePerformance ---

export function mapBackendCourse(c: Record<string, unknown>): CoursePerformance {
  const priorityMap: Record<string, "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"> = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  };
  const trendMap: Record<string, "UP" | "DOWN" | "STABLE"> = {
    UP: "UP",
    DOWN: "DOWN",
    STABLE: "STABLE",
  };
  return {
    course_code: String(c.course_code ?? ""),
    course_name: String(c.course_name ?? c.course_title ?? ""),
    department: String(c.department ?? "—"),
    semester: String(c.semester ?? "—"),
    pass_rate: Number(c.pass_rate ?? 0),
    failure_rate: Number(c.failure_rate ?? 0),
    avg_marks: Number(c.avg_marks ?? 0),
    gpa: c.gpa != null ? Number(c.gpa) : null,
    students_appeared: Number(c.students_appeared ?? 0),
    trend: trendMap[String(c.trend).toUpperCase()] ?? "STABLE",
    priority: priorityMap[String(c.priority).toUpperCase()] ?? "LOW",
    avg_internal: c.avg_internal != null ? Number(c.avg_internal) : null,
    avg_external: c.avg_external != null ? Number(c.avg_external) : null,
    sd_external: c.sd_external != null ? Number(c.sd_external) : null,
    internal_external_corr:
      c.internal_external_corr != null ? Number(c.internal_external_corr) : null,
  };
}
