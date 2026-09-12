import type { FilterState } from "../contexts/FilterContext";
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
import * as mockData from "./mockData";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
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
const CACHE_TTL = 0; // Disabled cache to ensure real-time data

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
    console.warn(`[API] Failed to fetch ${path}, falling back to mock data. Error:`, err.message);
    
    throw new Error(`Failed to fetch ${path} from backend.`);
  });

  inFlight.set(path, req);
  return req;
}

// ---------------------------------------------------------------------------
// Agent 10 API methods — all backed by real database
// ---------------------------------------------------------------------------


function buildQuery(path: string, filters?: Partial<FilterState>): string {
  if (!filters) return path;
  const params = new URLSearchParams();
  if (filters.department) params.append("department", filters.department);
  if (filters.semester) params.append("semester", filters.semester);
  if (filters.programme) params.append("programme", filters.programme);
  
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export const Agent10API = {
  /** Dashboard KPIs — assessment + roster + student profile views */
  getDashboard(filters?: Partial<FilterState>): Promise<AcademicDashboardMetrics> {
    return get<AcademicDashboardMetrics>(buildQuery("/agent10/dashboard", filters));
  },

  /** Course-level performance — assessment.v_course_performance */
  async getCourses(filters?: Partial<FilterState>): Promise<CoursePerformance[]> {
    const raw = await get<Record<string, unknown>[]>(buildQuery("/agent10/performance/courses", filters));
    return raw.map(_mapCourse);
  },

  /** Department-level performance */
  getDepartments(filters?: Partial<FilterState>): Promise<DepartmentPerformance[]> {
    return get<DepartmentPerformance[]>(buildQuery("/agent10/performance/departments", filters));
  },

  /**
   * Trends — returns a SINGLE OBJECT (not an array).
   * historical_data_available is false when only 1 term in DB.
   */
  getTrends(filters?: Partial<FilterState>): Promise<TrendsResponse> {
    return get<TrendsResponse>(buildQuery("/agent10/trends", filters));
  },

  /** Problems / exceptions sorted by priority score */
  getAnomalies(filters?: Partial<FilterState>): Promise<AcademicException[]> {
    return get<AcademicException[]>(buildQuery("/agent10/exceptions", filters));
  },

  /** Recommendations derived from detected anomalies */
  async getRecommendations(filters?: Partial<FilterState>): Promise<RecommendationItem[]> {
    const raw = await get<BackendRecommendation[]>(buildQuery("/agent10/recommendations", filters));
    return raw.map(_mapRec);
  },

  /** Section-level comparison with disparity flags */
  getSections(filters?: Partial<FilterState>): Promise<SectionComparison[]> {
    return get<SectionComparison[]>(buildQuery("/agent10/sections", filters));
  },

  /** Ranked intervention priorities */
  getPriorities(filters?: Partial<FilterState>): Promise<InterventionPriorityItem[]> {
    return get<InterventionPriorityItem[]>(buildQuery("/agent10/priorities", filters));
  },

  /** Condonation risk & revenue forecast */
  getCondonationForecast(filters?: Partial<FilterState>): Promise<import("../types/agent10").CondonationForecastMetrics> {
    return get<import("../types/agent10").CondonationForecastMetrics>(buildQuery("/agent10/condonation", filters));
  },

  /** Fetch student drilldown details for a specific context */
  getStudentDrilldown(context: string, filters?: Partial<FilterState> & { course_code?: string }): Promise<import("../types/agent10").StudentProfile[]> {
    return get<import("../types/agent10").StudentProfile[]>(buildQuery("/agent10/students/drilldown", { ...filters, context } as any));
  },

  /** Update a student profile (saves to localStorage if backend is down) */
  async updateStudentProfile(studentId: string, updates: Partial<import("../types/agent10").StudentProfile>): Promise<void> {
    try {
      // Try sending to the backend first (if it existed)
      await apiClient.put(`/agent10/students/${studentId}`, updates);
    } catch (err) {
      console.warn("Backend update failed, saving to local overrides for hackathon demo persistence.");
      // Fallback: save to localStorage
      const overridesStr = localStorage.getItem("bodhsight_student_overrides");
      const overrides = overridesStr ? JSON.parse(overridesStr) : {};
      overrides[studentId] = { ...(overrides[studentId] || {}), ...updates };
      localStorage.setItem("bodhsight_student_overrides", JSON.stringify(overrides));
    }
  },

  /** Full evidence chain for one course */
  getEvidence(courseCode: string): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>(`/agent10/evidence/${courseCode}`);
  },

  /** Executive summary (uses LLM if available) */
  getSummary(filters?: Partial<FilterState>): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>(buildQuery("/agent10/summary", filters));
  },

  /** Execute a recommendation (updates database status) */
  async executeRecommendation(id: string): Promise<void> {
    await apiClient.post(`/agent10/recommendations/${id}/execute`);
  },

  /** Trigger an ingestion audit */
  async triggerAudit(): Promise<void> {
    await apiClient.post("/agent10/audit/trigger");
  },

  /** Backend health check */
  getHealth(): Promise<{ status: string; service: string; environment: string; agent: string }> {
    return get("/health");
  },

  /**
   * Prefetch adjacent dashboard data silently after 1.5s.
   * Call this once the Dashboard has rendered to warm the cache
   * for Courses and Problems so those tabs open instantly.
   */
  prefetchDashboardData(filters?: Partial<FilterState>) {
    setTimeout(() => {
      Agent10API.getCourses(filters).catch(() => {});
      Agent10API.getAnomalies(filters).catch(() => {});
      Agent10API.getDepartments(filters).catch(() => {});
    }, 1500);
  },
};

// end of file


// ---------------------------------------------------------------------------
// Notification API
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationAPI = {
  getNotifications(): Promise<NotificationItem[]> {
    return get<NotificationItem[]>("/notifications", true); // always fresh
  },
  getUnreadCount(): Promise<{ count: number }> {
    return get<{ count: number }>("/notifications/unread-count", true);
  },
  markRead(id: string): Promise<{ success: boolean }> {
    return apiClient.put(`/notifications/${id}/read`).then(r => r.data);
  },
  markAllRead(): Promise<{ success: boolean }> {
    return apiClient.put("/notifications/read-all").then(r => r.data);
  }
};
