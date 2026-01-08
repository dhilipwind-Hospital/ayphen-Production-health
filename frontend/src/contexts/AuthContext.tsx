import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api, { setAuthStorage, writeTokens, clearAllTokens, readToken, readRefreshToken } from '../services/api';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const refreshTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const refreshMe = async () => {
    try {
      setLoading(true);
      const token = readToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/users/me', { suppressErrorToast: true } as any);
      if (res?.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // On initial load, if a token exists, fetch the current user
    const bootstrap = async () => {
      setLoading(true);
      const token = readToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/users/me', { suppressErrorToast: true } as any);
        if (res?.data) {
          setUser(res.data);
          // Attempt to refresh soon after load to obtain expiresIn and schedule
          try {
            const rt = readRefreshToken();
            if (!rt) throw new Error('no refresh token');
            const r = await api.post('/auth/refresh-token', { refreshToken: rt } as any);
            const accessToken = (r.data as any)?.accessToken;
            const refreshToken = (r.data as any)?.refreshToken;
            const expiresIn = Number((r.data as any)?.expiresIn) || 3600;
            if (accessToken) {
              writeTokens(accessToken, refreshToken);
              scheduleRefresh(expiresIn);
            }
          } catch {
            // ignore silent refresh error during bootstrap
          }
        } else {
          clearAllTokens();
        }
      } catch (_e) {
        clearAllTokens();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const scheduleRefresh = (expiresInSeconds: number) => {
    clearRefreshTimer();
    // refresh 60 seconds before expiry, clamp to minimum 30s
    const delayMs = Math.max((expiresInSeconds - 60) * 1000, 30000);
    refreshTimer.current = window.setTimeout(async () => {
      try {
        const rt = readRefreshToken();
        if (!rt) throw new Error('no refresh token');
        const r = await api.post('/auth/refresh-token', { refreshToken: rt } as any);
        const accessToken = (r.data as any)?.accessToken;
        const refreshToken = (r.data as any)?.refreshToken;
        const newExpiresIn = Number((r.data as any)?.expiresIn) || 3600;
        if (accessToken) {
          writeTokens(accessToken, refreshToken);
          scheduleRefresh(newExpiresIn);
        }
      } catch (e) {
        // On failure, logout gracefully
        clearAllTokens();
        setUser(null);
        navigate('/login');
      }
    }, delayMs) as any;
  };

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await api.post('/auth/login', { email: String(email).trim().toLowerCase(), password }, { suppressErrorToast: true } as any);
      const data: any = response.data || {};
      const accessToken = data?.accessToken;
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      // Respect Remember Me setting
      setAuthStorage(rememberMe ? 'local' : 'session');
      writeTokens(accessToken, data?.refreshToken);
      const expiresIn = Number(data?.expiresIn) || 3600;
      scheduleRefresh(expiresIn);
      // Always fetch current profile to ensure role and context are accurate
      try {
        const me = await api.get('/users/me', { suppressErrorToast: true } as any);
        if (me?.data) {
          setUser(me.data);
          const role = String(me.data?.role || '').toLowerCase();
          if (role === 'admin' || role === 'super_admin') navigate('/admin/appointments');
          else if (role === 'doctor') navigate('/queue/doctor');
          else if (role === 'nurse') navigate('/queue/triage');
          else if (role === 'receptionist') navigate('/queue/reception');
          else if (role === 'pharmacist') navigate('/pharmacy');
          else if (role === 'lab_technician') navigate('/laboratory/dashboard');
          else if (role === 'accountant') navigate('/billing/management');
          else if (role === 'patient') navigate('/portal');
          else navigate('/');
        } else {
          navigate('/home');
        }
      } catch {
        // If fetching profile failed, still send user to home
        navigate('/home');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await api.post('/auth/register', userData, { suppressErrorToast: true } as any);
      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const rt = readRefreshToken();
      if (rt) {
        await api.post('/auth/logout', { refreshToken: rt } as any, { suppressErrorToast: true } as any);
      } else {
        await api.post('/auth/logout', {}, { suppressErrorToast: true } as any);
      }
    } catch {}
    clearAllTokens();
    setUser(null);
    clearRefreshTimer();
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
