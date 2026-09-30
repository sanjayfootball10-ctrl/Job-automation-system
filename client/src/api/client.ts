import type {
  User, Application, ApplicationHistory, Resume, CoverLetter, Interview,
  AppNotification, AutomationRule, JobListing, AnalyticsSummary, AdminDashboardData
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

function getAuthToken(): string | null {
  return localStorage.getItem('job_tracker_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred during request execution');
  }

  return data as T;
}

export const api = {
  // Auth
  signup: (body: any) => request<{ token: string; user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<{ user: User }>('/auth/me'),
  updateProfile: (body: any) => request<{ message: string; user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  forgotPassword: (email: string) => request<{ message: string; resetToken?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // Applications
  getApplications: (params?: { search?: string; status?: string; job_type?: string; source?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.job_type) query.append('job_type', params.job_type);
    if (params?.source) query.append('source', params.source);
    if (params?.sort) query.append('sort', params.sort);
    const qs = query.toString();
    return request<{ applications: Application[] }>(`/applications${qs ? `?${qs}` : ''}`);
  },
  getApplicationDetails: (id: number) => request<{ application: Application; history: ApplicationHistory[]; interviews: Interview[] }>(`/applications/${id}`),
  createApplication: (body: Partial<Application>) => request<{ message: string; application: Application }>('/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateApplication: (id: number, body: Partial<Application>) => request<{ message: string; application: Application }>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateApplicationStatus: (id: number, status: string, kanban_order?: number) => request<{ message: string; id: string; newStatus: string }>(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, kanban_order }) }),
  deleteApplication: (id: number) => request<{ message: string }>(`/applications/${id}`, { method: 'DELETE' }),

  // Resumes
  getResumes: () => request<{ resumes: Resume[] }>('/resumes'),
  uploadResume: (formData: FormData | { name: string; content?: string; is_default?: boolean }) => {
    if (formData instanceof FormData) {
      return request<{ message: string; resume: Resume }>('/resumes/upload', { method: 'POST', body: formData });
    }
    return request<{ message: string; resume: Resume }>('/resumes/upload', { method: 'POST', body: JSON.stringify(formData) });
  },
  setDefaultResume: (id: number) => request<{ message: string }>(`/resumes/${id}/default`, { method: 'PATCH' }),
  deleteResume: (id: number) => request<{ message: string }>(`/resumes/${id}`, { method: 'DELETE' }),

  // Cover Letters
  getCoverLetters: () => request<{ coverLetters: CoverLetter[] }>('/cover-letters'),
  getCoverLetter: (id: number) => request<{ coverLetter: CoverLetter }>(`/cover-letters/${id}`),
  createCoverLetter: (body: { title: string; content: string }) => request<{ message: string; coverLetter: CoverLetter }>('/cover-letters', { method: 'POST', body: JSON.stringify(body) }),
  updateCoverLetter: (id: number, body: { title?: string; content?: string }) => request<{ message: string; coverLetter: CoverLetter }>(`/cover-letters/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoverLetter: (id: number) => request<{ message: string }>(`/cover-letters/${id}`, { method: 'DELETE' }),
  generateAICoverLetter: (body: { job_title: string; company: string; job_description?: string; tone?: string }) => request<{ title: string; content: string; disclaimer: string }>('/cover-letters/generate-ai', { method: 'POST', body: JSON.stringify(body) }),

  // Interviews
  getInterviews: () => request<{ interviews: Interview[] }>('/interviews'),
  createInterview: (body: any) => request<{ message: string; interview: Interview }>('/interviews', { method: 'POST', body: JSON.stringify(body) }),
  updateInterview: (id: number, body: any) => request<{ message: string; interview: Interview }>(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInterview: (id: number) => request<{ message: string }>(`/interviews/${id}`, { method: 'DELETE' }),

  // Jobs Search
  getJobs: (params?: { search?: string; location?: string; job_type?: string; experience?: string; source?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.location) query.append('location', params.location);
    if (params?.job_type) query.append('job_type', params.job_type);
    if (params?.experience) query.append('experience', params.experience);
    if (params?.source) query.append('source', params.source);
    const qs = query.toString();
    return request<{ jobs: JobListing[] }>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  saveJobAsApplication: (jobId: number, status: 'Saved' | 'Applied' = 'Saved', job?: any) => request<{ message: string; applicationId: number }>(`/jobs/${jobId}/save-application`, { method: 'POST', body: JSON.stringify({ status, job }) }),
  createCustomJob: (body: any) => request<{ message: string; job: JobListing }>('/jobs/custom', { method: 'POST', body: JSON.stringify(body) }),

  // Automations
  getAutomationRules: () => request<{ rules: AutomationRule[] }>('/automations/rules'),
  updateAutomationRule: (id: number, body: { enabled?: boolean; days_threshold?: number; configuration?: string }) => request<{ message: string; rule: AutomationRule }>(`/automations/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  runAutomationScan: () => request<{ message: string; results: any[] }>('/automations/run', { method: 'POST' }),

  // Notifications
  getNotifications: () => request<{ notifications: AppNotification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: number) => request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id: number) => request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: () => request<AnalyticsSummary>('/analytics'),

  // Admin
  getAdminDashboard: () => request<AdminDashboardData>('/admin/dashboard')
};
