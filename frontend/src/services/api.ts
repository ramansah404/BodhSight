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
  getPerformance: () => fetchWithCache<AcademicDashboardMetrics>("/agent10/dashboard", mockDashboard),
  getCourses: () => fetchWithCache<CoursePerformance[]>("/agent10/performance/courses", mockCourses),
  getDepartments: () => fetchWithCache<DepartmentPerformance[]>("/agent10/performance/departments", mockDepartments),
  getBatches: () => fetchWithCache<BatchPerformance[]>("/batches", mockBatches), // Fallback to mock/default as backend doesn't have /batches
  getStudents: () => fetchWithCache<StudentRiskGroup[]>("/students", mockStudents), // Fallback to mock/default as backend doesn't have /students
  getTrends: () => fetchWithCache<TrendData[]>("/agent10/trends", mockTrends),
  getAnomalies: () => fetchWithCache<AcademicException[]>("/agent10/exceptions", mockExceptions),
  getRecommendations: () => fetchWithCache<RecommendationItem[]>("/agent10/recommendations", mockRecommendations),
};
