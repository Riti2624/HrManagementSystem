import { mockAttendance, mockCopilotMessages, mockDashboard, mockEmployees, mockLeaves, mockPayroll, mockRecruitment } from '../data/mock';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || API_BASE;
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export type CopilotMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  detail: string;
  read?: boolean;
  createdAt?: string;
};

export type SearchResultSet = {
  employees: Array<Record<string, unknown>>;
  leaves: Array<Record<string, unknown>>;
  payrolls: Array<Record<string, unknown>>;
  recruitment: {
    jobs: Array<Record<string, unknown>>;
    applications: Array<Record<string, unknown>>;
  };
  notifications: Array<Record<string, unknown>>;
  contractors: Array<Record<string, unknown>>;
};

function getToken() {
  return localStorage.getItem('hrms_token') || '';
}

function clearStoredSession() {
  localStorage.removeItem('hrms_token');
  localStorage.removeItem('hrms_user');
}

async function request<T>(path: string, options: RequestInit = {}, fallback?: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      }
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const error = new Error(body?.message || `Request failed: ${response.status}`);

      if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
        clearStoredSession();
        window.dispatchEvent(new Event('hrms:unauthorized'));
      }

      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (_error) {
    if (fallback !== undefined && USE_MOCK_FALLBACK) {
      return fallback;
    }
    throw _error;
  }
}

export const api = {
  async login(email: string, password: string) {
    const result = await request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    localStorage.setItem('hrms_token', result.token);
    localStorage.setItem('hrms_user', JSON.stringify(result.user));
    return result;
  },
  async signup(payload: { name: string; email: string; password: string; role?: string }) {
    const result = await request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    localStorage.setItem('hrms_token', result.token);
    localStorage.setItem('hrms_user', JSON.stringify(result.user));
    return result;
  },
  logout() {
    clearStoredSession();
  },
  hasStoredToken() {
    return Boolean(getToken());
  },
  getStoredUser() {
    const raw = localStorage.getItem('hrms_user');
    if (!raw || !getToken()) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      clearStoredSession();
      return null;
    }
  },
  async getCurrentUser() {
    return request<{ user: { id: string; name: string; email: string; role: string } }>('/auth/me');
  },
  async getDashboard() {
    return request('/dashboard', {}, mockDashboard);
  },
  async getEmployees() {
    return request('/employees', {}, mockEmployees);
  },
  async createEmployee(payload: Record<string, unknown>) {
    return request('/employees', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateEmployee(id: string, payload: Record<string, unknown>) {
    return request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteEmployee(id: string) {
    return request(`/employees/${id}`, { method: 'DELETE' });
  },
  async getAttendance() {
    return request('/attendance', {}, mockAttendance);
  },
  async updateAttendance(id: string, payload: Record<string, unknown>) {
    return request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteAttendance(id: string) {
    return request(`/attendance/${id}`, { method: 'DELETE' });
  },
  async getLeaves() {
    return request('/leave', {}, mockLeaves);
  },
  async createLeave(payload: Record<string, unknown>) {
    return request('/leave', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateLeave(id: string, payload: Record<string, unknown>) {
    return request(`/leave/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteLeave(id: string) {
    return request(`/leave/${id}`, { method: 'DELETE' });
  },
  async getPayroll() {
    return request('/payroll', {}, mockPayroll);
  },
  async getRecruitment() {
    return request('/recruitment', {}, mockRecruitment);
  },
  async createJob(payload: Record<string, unknown>) {
    return request('/recruitment/jobs', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateJob(id: string, payload: Record<string, unknown>) {
    return request(`/recruitment/jobs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteJob(id: string) {
    return request(`/recruitment/jobs/${id}`, { method: 'DELETE' });
  },
  async createApplication(payload: Record<string, unknown>) {
    return request('/recruitment/applications', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateApplication(id: string, payload: Record<string, unknown>) {
    return request(`/recruitment/applications/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteApplication(id: string) {
    return request(`/recruitment/applications/${id}`, { method: 'DELETE' });
  },
  async getNotifications() {
    return request('/notifications', {}, mockDashboard.notifications);
  },
  async markNotificationRead(id: string) {
    return request(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  async markAllNotificationsRead() {
    return request('/notifications/read-all', { method: 'PATCH' });
  },
  async search(query: string) {
    return request<SearchResultSet>(`/search?q=${encodeURIComponent(query)}`, {}, {
      employees: [],
      leaves: [],
      payrolls: [],
      recruitment: { jobs: [], applications: [] },
      notifications: [],
      contractors: []
    });
  },
  async getDailySummary() {
    return request('/ai/daily-summary', {}, { summary: 'Daily summary unavailable.', bullets: [], recommendations: [], source: 'fallback' });
  },
  async downloadHrReport() {
    const response = await fetch(`${API_BASE}/reports/hr-summary/pdf`, {
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      }
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.blob();
  },
  async copilot(prompt: string) {
    try {
      return await request<{ answer: string; bullets: string[]; recommendations: string[]; source?: string }>(
        '/ai/copilot',
        { method: 'POST', body: JSON.stringify({ prompt }) },
        {
          answer: mockCopilotMessages[0].text,
          bullets: [mockCopilotMessages[0].text, mockCopilotMessages[1].text],
          recommendations: ['Review workload', 'Adjust compensation', 'Follow up with managers']
        }
      );
    } catch {
      return {
        answer: mockCopilotMessages[0].text,
        bullets: [mockCopilotMessages[0].text, mockCopilotMessages[1].text],
        recommendations: ['Review workload', 'Adjust compensation', 'Follow up with managers']
      };
    }
  },
  async getCandidateProfile() {
    return request<{ id: string; name: string; email: string; role: string; phone: string; skills: string[]; resumeUrl: string }>('/candidate/profile');
  },
  async updateCandidateProfile(payload: { name: string; phone: string; skills: string[] | string }) {
    return request<{ id: string; name: string; email: string; role: string; phone: string; skills: string[]; resumeUrl: string }>(
      '/candidate/profile',
      { method: 'PUT', body: JSON.stringify(payload) }
    );
  },
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await fetch(`${API_BASE}/candidate/upload-resume`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || 'Failed to upload resume');
    }
    return response.json() as Promise<{ resumeUrl: string }>;
  },
  async getCandidateJobs() {
    return request<Array<{ id: string; jobCode: string; title: string; department: string; status: string; applicants: number; priority: string }>>('/candidate/jobs');
  },
  async getCandidateJobDetails(id: string) {
    return request<{ id: string; jobCode: string; title: string; department: string; status: string; applicants: number; priority: string }>(`/candidate/jobs/${id}`);
  },
  async applyForJob(payload: { jobCode: string; resumeUrl?: string; coverLetter?: string }) {
    return request<{ id: string; applicationCode: string; jobCode: string; name: string; score: number; stage: string; candidateId: string }>(
      '/candidate/apply',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },
  async getCandidateApplications() {
    return request<Array<{ id: string; applicationCode: string; jobCode: string; name: string; score: number; stage: string; candidateId: string; createdAt: string; aiScore: number; aiSummary: string; job: { title: string; department: string; status: string; priority: string } }>>('/candidate/applications');
  },
  async getCandidateInterviews() {
    return request<Array<{ id: string; interviewCode: string; applicationId: string; roundType: string; scheduledAt: string; interviewers: string[]; location: string; status: string; notes: string; job: { title: string; department: string } | null }>>('/candidate/interviews', {}, []);
  },
  // ATS
  async getInterviews() {
    return request<Array<Record<string, unknown>>>('/recruitment/interviews', {}, []);
  },
  async createInterview(payload: Record<string, unknown>) {
    return request('/recruitment/interviews', { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateInterview(id: string, payload: Record<string, unknown>) {
    return request(`/recruitment/interviews/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async deleteInterview(id: string) {
    return request(`/recruitment/interviews/${id}`, { method: 'DELETE' });
  },
  async getInterviewFeedback(interviewId: string) {
    return request<Array<Record<string, unknown>>>(`/recruitment/interviews/${interviewId}/feedback`, {}, []);
  },
  async submitFeedback(interviewId: string, payload: Record<string, unknown>) {
    return request(`/recruitment/interviews/${interviewId}/feedback`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async screenApplication(id: string) {
    return request<{ aiScore: number; aiSummary: string; strengths: string[]; gaps: string[]; source: string; application: Record<string, unknown> }>(
      `/recruitment/applications/${id}/screen`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  },
  async convertToEmployee(id: string, payload: Record<string, unknown>) {
    return request(`/recruitment/applications/${id}/convert`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async getRankedCandidates(jobCode?: string) {
    const qs = jobCode ? `?jobCode=${encodeURIComponent(jobCode)}` : '';
    return request<Array<Record<string, unknown>>>(`/recruitment/ranked${qs}`, {}, []);
  },
  async getFunnelAnalytics(jobCode?: string) {
    const qs = jobCode ? `?jobCode=${encodeURIComponent(jobCode)}` : '';
    return request<{
      funnelData: Array<{ stage: string; count: number; percentage: number }>;
      conversionRates: Array<{ from: string; to: string; rate: number }>;
      stageCounts: Record<string, number>;
      total: number;
      openJobs: number;
      closedJobs: number;
      avgAiScore: number;
      overallConversion: number;
      hiredCount: number;
      rejectedCount: number;
    }>(`/recruitment/funnel${qs}`, {}, {
      funnelData: [], conversionRates: [], stageCounts: {}, total: 0,
      openJobs: 0, closedJobs: 0, avgAiScore: 0, overallConversion: 0,
      hiredCount: 0, rejectedCount: 0
    });
  }
};
