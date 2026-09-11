import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  agent: str;
}

export const checkHealth = async (): Promise<HealthResponse> => {
  // Using root endpoint since /health is on the root router in FastAPI main.py
  const response = await axios.get('http://localhost:8000/health');
  return response.data;
};
