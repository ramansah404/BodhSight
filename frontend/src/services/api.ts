import axios from "axios";
import type { 
  AcademicDashboardMetrics, CoursePerformance, DepartmentPerformance, 
  TrendData, AcademicException, RecommendationItem, BatchPerformance, StudentRiskGroup 
} from "../types/agent10";
import { mockDashboard, mockCourses, mockDepartments, mockTrends, mockExceptions, mockRecommendations, mockBatches, mockStudents } from "./mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 2000, // Ultra-fast 2-second timeout so UI never hangs
});

// In-memory cache store to eliminate redundant network fetches and loading spinners
const memoryCache: Record<string, any> = {};

apiClient.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem("bodhsight_role") || "Dean";
  const displayName = localStorage.getItem("bodhsight_name") || "User";
  
  config.headers["X-User-Role"] = currentRole;
  config.headers["X-User-Name"] = displayName;
  return config;
}, (error) => Promise.reject(error));

async function fetchWithCache<T>(endpoint: string, mockFallback: T): Promise<T> {
  // Return cached data instantly if available
  if (memoryCache[endpoint]) {
    return memoryCache[endpoint];
  }

  try {
    const response = await apiClient.get<T>(endpoint, {
      validateStatus: (status) => status === 200
    });
    
    if (response.data && typeof response.data === 'object') {
      memoryCache[endpoint] = response.data; // Cache response
      return response.data;
    }
    memoryCache[endpoint] = mockFallback;
    return mockFallback;
  } catch (error) {
    // Instant fallback to mock data on network error or timeout
    memoryCache[endpoint] = mockFallback;
    return mockFallback;
  }
}

export const Agent10API = {
  getPerformance: () => fetchWithCache<AcademicDashboardMetrics>("/performance", mockDashboard),
  getCourses: () => fetchWithCache<CoursePerformance[]>("/courses", mockCourses),
  getDepartments: () => fetchWithCache<DepartmentPerformance[]>("/departments", mockDepartments),
  getBatches: () => fetchWithCache<BatchPerformance[]>("/batches", mockBatches),
  getStudents: () => fetchWithCache<StudentRiskGroup[]>("/students", mockStudents),
  getTrends: () => fetchWithCache<TrendData[]>("/trends", mockTrends),
  getAnomalies: () => fetchWithCache<AcademicException[]>("/anomalies", mockExceptions),
  getRecommendations: () => fetchWithCache<RecommendationItem[]>("/recommendations", mockRecommendations),
};
