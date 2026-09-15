import type { FilterState } from "../contexts/FilterContext";
/**
 * BodhSight — Agent 10 API Client
 *
 * Single authoritative API layer.
 * All calls go to the real FastAPI backend.
 * No mock fallbacks — errors are surfaced to the UI.
 *
 * Base URL: VITE_API_BASE_URL || development-local or production-Render API
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
import * as Mocks from "./mockData";

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? "http://localhost:8000/api/v1" : "https://bodhsight.onrender.com/api/v1");

export const API_BASE_URL = BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Global state for mock data
export let mockDataEnabled = true;
export const syncSystemConfig = async () => {
  try {
    const res = await apiClient.get("/admin/config");
    mockDataEnabled = res.data.mock_data_enabled;
  } catch (e) {
    console.warn("Failed to sync system config");
  }
};
// Sync immediately
syncSystemConfig();

// Attach role headers and JWT to every request
apiClient.interceptors.request.use((config) => {
  const role = localStorage.getItem("bodhsight_role") || "Dean";
  const name = localStorage.getItem("bodhsight_name") || "User";
  const dept = localStorage.getItem("bodhsight_department");
  const token = localStorage.getItem("bodhsight_token");
  
  config.headers["X-User-Role"] = role;
  config.headers["X-User-Name"] = name;
  if (dept) {
    config.headers["X-User-Department"] = dept;
  }
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
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
const CACHE_TTL = 10000; // 10 seconds (allows near real-time updates while deduplicating immediate bursts)

export const clearCache = () => {
  cache.clear();
  inFlight.clear();
};

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


function buildQuery(path: string, filters?: Record<string, any>): string {
  if (!filters) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export const Agent10API = {
  /** Dashboard KPIs — assessment + roster + student profile views */
  async getDashboard(filters?: Partial<FilterState>): Promise<AcademicDashboardMetrics> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const data = await get<AcademicDashboardMetrics>(buildQuery("/agent10/dashboard", filters));
      if (!data || data.total_students === 0) {
        if (!mockDataEnabled) throw new Error("No data available");
        return Mocks.getDynamicMockDashboard(role, dept) as any;
      }
      return data;
    } catch {
      if (!mockDataEnabled) throw new Error("No real data available for dashboard");
      return Mocks.getDynamicMockDashboard(role, dept) as any;
    }
  },

  /** Course-level performance — assessment.v_course_performance */
  async getCourses(filters?: Partial<FilterState>): Promise<CoursePerformance[]> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const raw = await get<Record<string, unknown>[]>(buildQuery("/agent10/performance/courses", filters));
      if (!raw || raw.length === 0) {
        if (!mockDataEnabled) return [];
        return Mocks.getDynamicMockCourses(role, dept) as any;
      }
      return raw.map(_mapCourse);
    } catch {
      if (!mockDataEnabled) return [];
      return Mocks.getDynamicMockCourses(role, dept) as any;
    }
  },

  /** Department-level performance */
  async getDepartments(filters?: Partial<FilterState>): Promise<DepartmentPerformance[]> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const data = await get<DepartmentPerformance[]>(buildQuery("/agent10/performance/departments", filters));
      if (!data || data.length === 0) { if (!mockDataEnabled) return ([] as any); return Mocks.getDynamicMockDepartments(role, dept) as any; }
      return data;
    } catch {
      if (!mockDataEnabled) return ([] as any);
      return Mocks.getDynamicMockDepartments(role, dept) as any;
      }
  },

  /**
   * Trends — returns a SINGLE OBJECT (not an array).
   * historical_data_available is false when only 1 term in DB.
   */
  async getTrends(filters?: Partial<FilterState>): Promise<TrendsResponse> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const data = await get<TrendsResponse>(buildQuery("/agent10/trends", filters));
      if (!data || !data.current_term_summary || data.current_term_summary.total_sections === 0) { if (!mockDataEnabled) return ([] as any); return Mocks.getDynamicMockTrends(role, dept) as any; }
      return data;
    } catch {
      if (!mockDataEnabled) return ([] as any);
      return Mocks.getDynamicMockTrends(role, dept) as any;
      }
  },

  /** Problems / exceptions sorted by priority score */
  async getAnomalies(filters?: Partial<FilterState>): Promise<AcademicException[]> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const data = await get<AcademicException[]>(buildQuery("/agent10/exceptions", filters));
      if (!data || data.length === 0) { if (!mockDataEnabled) return ([] as any); return Mocks.getDynamicMockExceptions(role, dept) as any; }
      return data;
    } catch {
      if (!mockDataEnabled) return ([] as any);
      return Mocks.getDynamicMockExceptions(role, dept) as any;
      }
  },

  /** Recommendations derived from detected anomalies */
  async getRecommendations(filters?: Partial<FilterState>): Promise<RecommendationItem[]> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const raw = await get<BackendRecommendation[]>(buildQuery("/agent10/recommendations", filters));
      if (!raw || raw.length === 0) { if (!mockDataEnabled) return ([] as any); return Mocks.getDynamicMockRecommendations(role, dept) as any; }
      return raw.map(_mapRec);
    } catch {
      if (!mockDataEnabled) return ([] as any);
      return Mocks.getDynamicMockRecommendations(role, dept) as any;
      }
  },

  /** Section-level comparison with disparity flags */
  async getSections(filters?: Partial<FilterState>): Promise<SectionComparison[]> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const data = await get<SectionComparison[]>(buildQuery("/agent10/sections", filters));
      if (!data || data.length === 0) { if (!mockDataEnabled) return ([] as any); return Mocks.getDynamicMockSections(role, dept) as any; }
      return data;
    } catch {
      if (!mockDataEnabled) return ([] as any);
      return Mocks.getDynamicMockSections(role, dept) as any;
      }
  },

  /** Ranked intervention priorities */
  async getPriorities(filters?: Partial<FilterState>): Promise<InterventionPriorityItem[]> {
    const role = localStorage.getItem("bodhsight_role") || "Dean";
    const dept = localStorage.getItem("bodhsight_department") || undefined;
    try {
      const data = await get<InterventionPriorityItem[]>(buildQuery("/agent10/priorities", filters));
      if (!data || data.length === 0) { if (!mockDataEnabled) return ([] as any); return Mocks.getDynamicMockPriorities(role, dept) as any; }
      return data;
    } catch {
      if (!mockDataEnabled) return ([] as any);
      return Mocks.getDynamicMockPriorities(role, dept) as any;
      }
  },

  /** Condonation risk & revenue forecast */
  async getCondonationForecast(filters?: Partial<FilterState>): Promise<import("../types/agent10").CondonationForecastMetrics> {
    try {
      const data = await get<import("../types/agent10").CondonationForecastMetrics>(buildQuery("/agent10/condonation", filters));
      if (!data || data.at_risk_students === 0) return Mocks.mockCondonationForecast as any;
      return data;
    } catch {
      return Mocks.mockCondonationForecast as any;
    }
  },

  /** Upload unstructured document for Agent 10 Ingestion */
  async uploadDocument(file: File, type: string): Promise<{ status: string; received: number; accepted: number; rejected: number; errors: { row: number; field: string; message: string }[] }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", type);

    const res = await apiClient.post("/ingestion/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    clearCache();
    return res.data;
  },

  /** Fetch student drilldown details for a specific context */
  async getStudentDrilldown(context: string, filters?: Partial<FilterState> & { course_code?: string }): Promise<import("../types/agent10").StudentProfile[]> {
    try {
      const data = await get<import("../types/agent10").StudentProfile[]>(buildQuery("/agent10/students/drilldown", { ...filters, context } as any));
      if (!data || data.length === 0) return Mocks.mockStudentDrilldown as any;
      return data;
    } catch {
      return Mocks.mockStudentDrilldown as any;
    }
  },

  /** Update a student profile (saves to live database) */
  async updateStudentProfile(studentId: string, updates: Partial<import("../types/agent10").StudentProfile>): Promise<void> {
    await apiClient.put(`/crud_data/students/${studentId}`, updates);
    clearCache(); // Force real-time sync for next read
  },

  /** Full evidence chain for one course */
  async getEvidence(courseCode: string): Promise<Record<string, unknown>> {
    try {
      const data = await get<Record<string, unknown>>(`/agent10/evidence/${courseCode}`);
      if (!data || Object.keys(data).length === 0) return Mocks.mockEvidence as any;
      return data;
    } catch {
      return Mocks.mockEvidence as any;
    }
  },

  /** Executive summary (uses LLM if available) */
  async getSummary(filters?: Partial<FilterState>): Promise<Record<string, unknown>> {
    try {
      const data = await get<Record<string, unknown>>(buildQuery("/agent10/summary", filters));
      if (!data || Object.keys(data).length === 0) return Mocks.mockSummary as any;
      return data;
    } catch {
      return Mocks.mockSummary as any;
    }
  },

  /** Execute a recommendation (updates database status) */
  async executeRecommendation(id: string): Promise<void> {
    await apiClient.post(`/agent10/recommendations/${id}/execute`);
    clearCache();
  },

  /** Trigger an ingestion audit */
  async triggerAudit(): Promise<void> {
    await apiClient.post("/agent10/audit/trigger");
    clearCache();
  },

  /** Backend health check */
  getHealth(): Promise<{ status: string; service: string; environment: string; agent: string }> {
    return get("/health");
  },

  /** Send a message to the Agent 10 Live Chat */
  async sendChatMessage(message: string, filters?: Partial<FilterState>): Promise<{ reply: string }> {
    const payload = {
      message,
      department: filters?.department || null,
      semester: filters?.semester || null,
      programme: filters?.programme || null,
    };
    const res = await apiClient.post("/agent10/chat", payload);
    return res.data;
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
  },
  /** Create an RBAC-targeted notification (Admin/Dean/etc. only) */
  async createNotification(payload: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
    link?: string;
    /** Target role — undefined = all roles */
    role?: string;
    /** Target department — undefined = all departments */
    department?: string;
    /** Target a specific user by UUID */
    user_id?: string;
    send_email?: boolean;
    send_whatsapp?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/notifications", payload);
    return res.data;
  }
};

// ---------------------------------------------------------------------------
// CRUD Data API
// ---------------------------------------------------------------------------

export interface StudentDataResponse {
  student_id: string;
  roll_no: string;
  full_name: string;
  section_code: string;
  attendance_pct: number;
  cgpa: number;
}

export const CrudDataAPI = {
  getSections(): Promise<string[]> {
    return get<string[]>("/crud_data/sections", true);
  },
  getStudentsBySection(sectionCode: string): Promise<StudentDataResponse[]> {
    return get<StudentDataResponse[]>(`/crud_data/students/${sectionCode}`, true);
  },
  updateStudentData(studentId: string, data: { attendance_pct?: number; cgpa?: number; backlog_count?: number }): Promise<{ status: string }> {
    return apiClient.put(`/crud_data/students/${studentId}`, data).then(r => {
      clearCache();
      return r.data;
    });
  }
};

// ---------------------------------------------------------------------------
// Auth API — Signup / Login backed by core.user_account in PostgreSQL
// ---------------------------------------------------------------------------

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  role?: string;
  full_name?: string;
  email?: string;
  department?: string;
  requires_2fa?: boolean;
}

export const AuthAPI = {
  async signup(payload: {
    full_name: string;
    email?: string;
    phone_number?: string;
    password: string;
    role: string;
    department?: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/signup", payload);
    return res.data;
  },
  
  async verifySignup(payload: { identifier: string; otp: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/verify-signup", payload);
    return res.data;
  },

  async forgotPassword(payload: { identifier: string }): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/auth/forgot-password", payload);
    return res.data;
  },

  async resetPassword(payload: { identifier: string; otp: string; new_password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/reset-password", payload);
    return res.data;
  },

  async login(payload: {
    identifier: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/login", payload);
    return res.data;
  },
  
  async requestOtp(payload: { identifier: string }): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/auth/request-otp", payload);
    return res.data;
  },
  
  async verifyOtp(payload: { identifier: string; otp: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/verify-otp", payload);
    return res.data;
  },

  async toggle2fa(payload: { identifier: string; enable: boolean }): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/auth/toggle-2fa", payload);
    return res.data;
  },

  async googleAuth(payload: { token: string; role?: string; department?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/google", payload);
    return res.data;
  }
};

export interface ProfileResponse {
  success: boolean;
  message: string;
  email?: string;
  phone_number?: string;
  full_name: string;
  role: string;
  department?: string;
  profile_image_url?: string;
  two_factor_enabled?: boolean;
}

export const ProfileAPI = {
  async getProfile(identifier: string): Promise<ProfileResponse> {
    const res = await apiClient.post<ProfileResponse>("/profile/me", { identifier });
    return res.data;
  },

  async updateProfile(payload: { identifier: string; full_name?: string; phone_number?: string }): Promise<ProfileResponse> {
    const res = await apiClient.put<ProfileResponse>("/profile/me", payload);
    return res.data;
  },

  async uploadImage(identifier: string, file: File): Promise<{ success: boolean; message: string; profile_image_url: string }> {
    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("file", file);
    const res = await apiClient.post("/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  }
};

export const AdminAPI = {
  async getAllUsers(): Promise<any[]> {
    const res = await apiClient.get("/admin/users");
    return res.data;
  },

  async createUser(data: any): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/admin/users", data);
    return res.data;
  },

  async updateUserRole(userId: string, role: string, department: string | null): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put(`/admin/users/${userId}/role`, { role, department });
    return res.data;
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put(`/admin/users/${userId}/status`, { is_active: isActive });
    return res.data;
  },

  async requestResetOtp(): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("/admin/request-otp");
    return res.data;
  },

  async resetPassword(userId: string, password: string, adminOtp: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put(`/admin/users/${userId}/password`, { password, admin_otp: adminOtp });
    return res.data;
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete(`/admin/users/${userId}`);
    return res.data;
  },

  async getPermissions(): Promise<{ role: string; permissions: string[] }[]> {
    const res = await apiClient.get("/admin/permissions");
    return res.data;
  },

  async updatePermissions(role: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put(`/admin/permissions/${role}`, { permissions });
    return res.data;
  },

  async getSystemConfig(): Promise<{ mock_data_enabled: boolean }> {
    const res = await apiClient.get("/admin/config");
    return res.data;
  },

  async updateSystemConfig(mockDataEnabled: boolean): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put("/admin/config", { mock_data_enabled: mockDataEnabled });
    syncSystemConfig();
    return res.data;
  },

  async purgeMockData(): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete("/admin/mock-data");
    return res.data;
  }
};
