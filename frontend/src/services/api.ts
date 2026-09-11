/**
 * BodhSight — Agent 10 API Client
 *
 * Single authoritative API layer.
 * All calls go to the real FastAPI backend.
 * No mock fallbacks — errors are surfaced to the UI.
 *
 * Base URL: VITE_API_BASE_URL || "http://localhost:8000/api/v1"
 */
import axios from "axios";
import type {
  AcademicDashboardMetrics,
  DepartmentPerformance,
  TrendsResponse,
  AcademicException,
  BackendRecommendation,
  RecommendationItem,
  InterventionPriorityItem,
  SectionComparison,
} from "../types/agent10";
import {
  mapBackendCourse as _mapCourse,
  mapBackendRecommendation as _mapRec,
  type CoursePerformance,
} from "../types/agent10";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

// Attach role headers to every request
apiClient.interceptors.request.use((config) => {
  const role = localStorage.getItem("bodhsight_role") || "Dean";
  const name = localStorage.getItem("bodhsight_name") || "User";
  config.headers["X-User-Role"] = role;
  config.headers["X-User-Name"] = name;
  return config;
});

// ---------------------------------------------------------------------------
// Generic fetch helper with caching and request deduplication
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<any>>();
const CACHE_TTL = 30000; // 30 seconds

async function get<T>(path: string, forceFresh = false): Promise<T> {
  if (!forceFresh) {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    if (inFlight.has(path)) {
      return inFlight.get(path) as Promise<T>;
    }
  }

  const req = apiClient.get<T>(path).then((res) => {
    cache.set(path, { data: res.data, timestamp: Date.now() });
    inFlight.delete(path);
    return res.data;
  }).catch((err) => {
    inFlight.delete(path);
    throw err;
  });

  inFlight.set(path, req);
  return req;
}

// ---------------------------------------------------------------------------
// Agent 10 API methods — all backed by real database
// ---------------------------------------------------------------------------

export const Agent10API = {
  /** Dashboard KPIs — assessment + roster + student profile views */
  getDashboard(): Promise<AcademicDashboardMetrics> {
    return get<AcademicDashboardMetrics>("/agent10/dashboard");
  },

  /** Course-level performance — assessment.v_course_performance */
  async getCourses(): Promise<CoursePerformance[]> {
    const raw = await get<Record<string, unknown>[]>("/agent10/performance/courses");
    return raw.map(_mapCourse);
  },

  /** Department-level performance */
  getDepartments(): Promise<DepartmentPerformance[]> {
    return get<DepartmentPerformance[]>("/agent10/performance/departments");
  },

  /**
   * Trends — returns a SINGLE OBJECT (not an array).
   * historical_data_available is false when only 1 term in DB.
   */
  getTrends(): Promise<TrendsResponse> {
    return get<TrendsResponse>("/agent10/trends");
  },

  /** Anomalies / exceptions sorted by priority score */
  getAnomalies(): Promise<AcademicException[]> {
    return get<AcademicException[]>("/agent10/exceptions");
  },

  /** Recommendations derived from detected anomalies */
  async getRecommendations(): Promise<RecommendationItem[]> {
    const raw = await get<BackendRecommendation[]>("/agent10/recommendations");
    return raw.map(_mapRec);
  },

  /** Section-level comparison with disparity flags */
  getSections(): Promise<SectionComparison[]> {
    return get<SectionComparison[]>("/agent10/sections");
  },

  /** Ranked intervention priorities */
  getPriorities(): Promise<InterventionPriorityItem[]> {
    return get<InterventionPriorityItem[]>("/agent10/priorities");
  },

  /** Full evidence chain for one course */
  getEvidence(courseCode: string): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>(`/agent10/evidence/${courseCode}`);
  },

  /** Executive summary (uses LLM if available) */
  getSummary(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/agent10/summary");
  },

  /** Backend health check */
  getHealth(): Promise<{ status: string; service: string; environment: string; agent: string }> {
    return get("/health");
  },
};

// end of file
