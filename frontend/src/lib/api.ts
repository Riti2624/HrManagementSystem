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
  }
};
