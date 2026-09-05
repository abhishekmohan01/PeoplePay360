import { useAuthStore } from '../stores/auth.store';

// We'll point this to our backend eventually.
const getApiBase = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.BUN_PUBLIC_API_URL) {
      return process.env.BUN_PUBLIC_API_URL;
    }
  } catch {}
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.BUN_PUBLIC_API_URL) {
      return (import.meta as any).env.BUN_PUBLIC_API_URL;
    }
  } catch {}
  return 'http://localhost:4000/api';
};

const API_BASE = getApiBase();

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = useAuthStore.getState().token;
    
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let url = `${API_BASE}${endpoint}`;
    
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Force logout on unauthorized
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      throw new ApiError(response.status, errorData?.message || response.statusText, errorData);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  get<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  put<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
};
