import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '@/lib/constants';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('wms_auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add selected warehouse/company headers
        const warehouseId = localStorage.getItem('wms_selected_warehouse');
        const companyId = localStorage.getItem('wms_selected_company');

        if (warehouseId) {
          config.headers['X-Warehouse-ID'] = warehouseId;
        }
        if (companyId) {
          config.headers['X-Company-ID'] = companyId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        // Handle errors globally
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('wms_auth_token');
          window.location.href = '/auth/login';
        }

        if (error.response?.status === 403) {
          // Forbidden
          console.error('Access denied');
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const apiService = new ApiService();
export default apiService;
