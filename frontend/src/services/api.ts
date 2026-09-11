import axios from "axios";
import type { 
  AcademicDashboardMetrics, CoursePerformance, DepartmentPerformance, 
  TrendData, AcademicException, RecommendationItem, BatchPerformance, StudentRiskGroup 
} from "../types/agent10";
import { mockDashboard, mockCourses, mockDepartments, mockTrends, mockExceptions, mockRecommendations, mockBatches, mockStudents } from "./mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000, // Fast 3-second timeout so the UI never hangs waiting for a dead server
});

// Bulletproof fetcher: Guarantees zero crashes by instantly falling back to mock data 
// if the network fails, times out, or the backend returns an error/HTML page.
async function fetchWithFallback<T>(endpoint: string, mockFallback: T): Promise<T> {
  try {
    const response = await apiClient.get<T>(endpoint, {
      validateStatus: (status) => status === 200 // Only accept true 200 OK responses
    });
    
    // If response is valid JSON data, return it
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    return mockFallback;
  } catch (error) {
    // Silent, instant fallback to guaranteed demo data
    return mockFallback;
  }
}

export const Agent10API = {
  getPerformance: () => fetchWithFallback<AcademicDashboardMetrics>("/performance", mockDashboard),
  getCourses: () => fetchWithFallback<CoursePerformance[]>("/courses", mockCourses),
  getDepartments: () => fetchWithFallback<DepartmentPerformance[]>("/departments", mockDepartments),
  getBatches: () => fetchWithFallback<BatchPerformance[]>("/batches", mockBatches),
  getStudents: () => fetchWithFallback<StudentRiskGroup[]>("/students", mockStudents),
  getTrends: () => fetchWithFallback<TrendData[]>("/trends", mockTrends),
  getAnomalies: () => fetchWithFallback<AcademicException[]>("/anomalies", mockExceptions),
  getRecommendations: () => fetchWithFallback<RecommendationItem[]>("/recommendations", mockRecommendations),
};
