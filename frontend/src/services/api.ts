import axios from "axios";
import type { 
  AcademicDashboardMetrics, CoursePerformance, DepartmentPerformance, 
  TrendData, AcademicException, RecommendationItem, BatchPerformance, StudentRiskGroup 
} from "../types/agent10";
import { mockDashboard, mockCourses, mockDepartments, mockTrends, mockExceptions, mockRecommendations, mockBatches, mockStudents } from "./mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5 second timeout for the hackathon
});

// Helper to handle API calls with a silent fallback to mock data
async function fetchWithFallback<T>(endpoint: string, mockFallback: T): Promise<T> {
  try {
    const response = await apiClient.get<T>(endpoint);
    return response.data;
  } catch (error) {
    console.warn(`[Agent 10 Network Fallback] Backend unreachable for ${endpoint}. Using isolated demo data.`);
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
