/**
 * API Client for WMS Backend
 * Provides typed API calls with authentication handling
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Try to get token from zustand persisted store
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null as T, error: error.error || error.message || 'Request failed' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null as T, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async post<T = unknown>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null as T, error: error.error || error.message || 'Request failed' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null as T, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async put<T = unknown>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null as T, error: error.error || error.message || 'Request failed' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null as T, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null as T, error: error.error || error.message || 'Request failed' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null as T, error: error instanceof Error ? error.message : 'Network error' };
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
