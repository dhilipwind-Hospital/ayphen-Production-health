import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Extend the AxiosRequestConfig to include the _retry flag
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance with base URL
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

declare global {
  interface Window {
    ENV: {
      REACT_APP_API_URL?: string;
    };
  }
}

// Helpers for token storage (Remember Me support)
const getStorageType = (): 'local' | 'session' => {
  try {
    const s = sessionStorage.getItem('auth_storage');
    if (s === 'session') return 'session';
  } catch {}
  try {
    const l = localStorage.getItem('auth_storage');
    if (l === 'local') return 'local';
  } catch {}
  // Fallback: if session has token, use session; else local
  try { if (sessionStorage.getItem('token')) return 'session'; } catch {}
  return 'local';
};

export const readToken = (): string | null => {
  const t = getStorageType();
  try {
    return t === 'session' ? sessionStorage.getItem('token') : localStorage.getItem('token');
  } catch { return null; }
};

export const readRefreshToken = (): string | null => {
  const t = getStorageType();
  try {
    return t === 'session' ? sessionStorage.getItem('refreshToken') : localStorage.getItem('refreshToken');
  } catch { return null; }
};

export const setAuthStorage = (type: 'local' | 'session') => {
  try {
    if (type === 'session') {
      sessionStorage.setItem('auth_storage', 'session');
      localStorage.removeItem('auth_storage');
    } else {
      localStorage.setItem('auth_storage', 'local');
      sessionStorage.removeItem('auth_storage');
    }
  } catch {}
};

export const writeTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  const t = getStorageType();
  try {
    const store = t === 'session' ? sessionStorage : localStorage;
    if (accessToken) store.setItem('token', accessToken);
    if (refreshToken) store.setItem('refreshToken', refreshToken);
  } catch {}
};

export const clearAllTokens = () => {
  try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('auth_storage'); } catch {}
  try { sessionStorage.removeItem('token'); sessionStorage.removeItem('refreshToken'); sessionStorage.removeItem('auth_storage'); } catch {}
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = readToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const cfg = (error.config || {}) as CustomAxiosRequestConfig;
    const suppress = (cfg as any).suppressErrorToast || (cfg as any).silent;
    const status = error.response?.status;

    // Attempt a one-time silent refresh on 401
    if (status === 401 && !cfg._retry) {
      try {
        const refreshToken = readRefreshToken();
        if (refreshToken) {
          cfg._retry = true;
          const base = (window?.ENV?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || '/api') as string;
          const r = await axios.post(`${base}/auth/refresh-token`, { refreshToken });
          const newAccess = (r.data as any)?.accessToken;
          const newRefresh = (r.data as any)?.refreshToken;
          if (newAccess) {
            writeTokens(newAccess, newRefresh);
            cfg.headers = cfg.headers || {};
            (cfg.headers as any).Authorization = `Bearer ${newAccess}`;
            return api(cfg as any);
          }
        }
      } catch (_e) {
        // fall through to logout below
      }
      clearAllTokens();
      // Only redirect to login if we're on an authenticated area. For public pages, fail silently.
      try {
        const path = window.location?.pathname || '/';
        const isPublic = /^\/(home|about|doctors|services|departments|announcements|request-callback|health-packages|emergency|first-aid|insurance|login|landing)?$/.test(path)
          || path === '/'
          || /^\/doctors\//.test(path)
          || /^\/insurance(\/.*)?$/.test(path);
        if (!isPublic) window.location.href = '/login';
      } catch {}
      return Promise.reject(error);
    }

    // Helper to safely show toasts via a global message bridge if present
    const toast = (type: 'error' | 'warning' | 'info', text: string) => {
      const api = (window as any)?.__message;
      try { api?.[type]?.(text); } catch {}
    };

    if (error.response) {
      const data = error.response.data as { message?: string };
      switch (status) {
        case 403:
          if (!suppress) toast('error', 'You do not have permission to perform this action');
          break;
        case 404:
          if (!suppress) toast('error', 'The requested resource was not found');
          break;
        case 500:
          if (!suppress) toast('error', 'An internal server error occurred');
          break;
        default:
          if (!suppress) toast('error', data?.message || 'An error occurred');
      }
    } else if (error.request) {
      if (!suppress) toast('error', 'No response from server. Please check your connection.');
    } else {
      if (!suppress) toast('error', 'Request error: ' + error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
