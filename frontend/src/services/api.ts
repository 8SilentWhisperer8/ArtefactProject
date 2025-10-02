import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface FormOutputData {
  id: number;
  session_id: string;
  created_at: string;
  time_spent_sec: number;
  steps_planned: number;
  steps_taken: number;
  backtracks: number;
  error_counts: number;
  extra_clicks: number;
  effectiveness: number;
  efficiency: number;
  satisfaction: number;
  usability_index: number;
  completion_status: 'success' | 'partial' | 'failure';
  fields_completed: number;
  fields_required: number;
}

export interface SessionAnalytics {
  session_id: string;
  current_step: number;
  task_time: string;
  steps: number;
  backtracks: number;
  errors: number;
  effectiveness: number;
  efficiency: number;
  satisfaction: number;
  usability_index: number;
}

export interface DashboardSummary {
  total_sessions: number;
  successful_sessions: number;
  partial_sessions: number;
  failed_sessions: number;
  success_rate: number;
  avg_effectiveness: number;
  avg_efficiency: number;
  avg_satisfaction: number;
  avg_usability_index: number;
  avg_time_spent: number;
  avg_steps: number;
  avg_backtracks: number;
  avg_errors: number;
}

export interface CreateSessionResponse {
  session_id: string;
  message: string;
  data: FormOutputData;
}

// API Service Functions
export const apiService = {
  // Session Management
  createSession: async (): Promise<CreateSessionResponse> => {
    const response = await apiClient.post('/sessions/create/');
    return response.data;
  },

  getSession: async (sessionId: string): Promise<FormOutputData> => {
    const response = await apiClient.get(`/sessions/${sessionId}/`);
    return response.data;
  },

  updateSessionMetrics: async (sessionId: string, metrics: Partial<FormOutputData>): Promise<SessionAnalytics> => {
    const response = await apiClient.post(`/sessions/${sessionId}/update/`, metrics);
    return response.data;
  },

  completeSession: async (sessionId: string, completionData: {
    completion_status: 'success' | 'partial' | 'failure';
    user_group_data?: any;
  }): Promise<{ message: string; data: FormOutputData }> => {
    const response = await apiClient.post(`/sessions/${sessionId}/complete/`, completionData);
    return response.data;
  },

  getSessionAnalytics: async (sessionId: string): Promise<SessionAnalytics> => {
    const response = await apiClient.get(`/sessions/${sessionId}/analytics/`);
    return response.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/dashboard/summary/');
    return response.data;
  },

  getRecentSessions: async (limit: string | number = 10): Promise<FormOutputData[]> => {
    const response = await apiClient.get(`/dashboard/recent/?limit=${limit}`);
    return response.data;
  },

  getAllSessions: async (): Promise<FormOutputData[]> => {
    const response = await apiClient.get('/dashboard/recent/?limit=all');
    return response.data;
  },
};

export default apiService;
