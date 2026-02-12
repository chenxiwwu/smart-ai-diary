const API_BASE = import.meta.env.VITE_API_URL || '/api';
// 后端服务器根路径（用于拼接 /uploads/xxx 等相对路径）
export const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '') || '';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DayEntry {
  date: string;
  todos: Todo[];
  expenses: Expense[];
  insight: string;
  media: MediaFile[];
  myDaySummary?: string;
  lastSavedAt?: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Expense {
  id: string;
  item: string;
  amount: number;
}

export interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('diary_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('diary_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('diary_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, name?: string): Promise<{ token: string; user: User }> {
    const result = await this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(result.token);
    return result;
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const result = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Entries
  async getEntries(): Promise<{ entries: Record<string, DayEntry> }> {
    return this.request<{ entries: Record<string, DayEntry> }>('/entries');
  }

  async getEntry(date: string): Promise<{ entry: DayEntry | null }> {
    return this.request<{ entry: DayEntry | null }>(`/entries/${date}`);
  }

  async updateEntry(date: string, data: Partial<DayEntry>): Promise<{ entry: DayEntry }> {
    return this.request<{ entry: DayEntry }>(`/entries/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntry(date: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/entries/${date}`, {
      method: 'DELETE',
    });
  }

  // AI
  async generateSummary(entry: { todos: any[]; expenses: any[]; insight: string }): Promise<{ summary: string }> {
    return this.request<{ summary: string }>('/ai/summary', {
      method: 'POST',
      body: JSON.stringify({
        todos: entry.todos,
        expenses: entry.expenses,
        insight: entry.insight,
      }),
    });
  }

  async generateInsight(entryInsight: string, prompt: string): Promise<{ insight: string }> {
    return this.request<{ insight: string }>('/ai/insight', {
      method: 'POST',
      body: JSON.stringify({ entryInsight, prompt }),
    });
  }

  // Upload
  async uploadFile(file: File, entryDate?: string): Promise<{ media: MediaFile }> {
    const formData = new FormData();
    formData.append('file', file);
    if (entryDate) {
      formData.append('entryDate', entryDate);
    }

    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  // Link Preview
  async getLinkPreview(url: string): Promise<{ url: string; title: string; description: string; image: string; siteName: string }> {
    return this.request<{ url: string; title: string; description: string; image: string; siteName: string }>('/link-preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }
}

export const api = new ApiService();
