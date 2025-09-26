import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Cookie, 
  WebsitePermission, 
  CookieBundle, 
  UserStats, 
  AuthResponse,
  LoginHistory,
  CookieInsertion,
  SessionInfo
} from '../types';
import { config } from '../config/env';

const API_URL = config.apiUrl;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: config.apiTimeout
});

// Request interceptor to add auth token and check session
api.interceptors.request.use((config) => {
  // Skip session check for login/register endpoints
  if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
    return config;
  }
  
  // Skip auto-logout on inactivity/expiry
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    updateActivity();
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearSession();
      // Let the component handle navigation
    }
    return Promise.reject(error);
  }
);

// Session management utilities
const SESSION_KEY = 'chatgpt_session';
const ACTIVITY_KEY = 'last_activity';

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  localStorage.removeItem('token');
};

const updateActivity = () => {
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
};

const checkSessionExpiry = (): boolean => {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return false;
  
  try {
    const session = JSON.parse(sessionData);
    if (!session.user) {
      clearSession();
      return false;
    }
    // Do not auto-logout based on expiry or inactivity
    
    updateActivity();
    return true;
  } catch {
    clearSession();
    return false;
  }
};

// Auth API endpoints
export const authAPI = {
  login: async (username: string, password: string): Promise<AxiosResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', { username, password });
    
    // Store session data
    if (response.data.token) {
      const sessionData = {
        token: response.data.token,
        expiresAt: response.data.expiresAt,
        user: response.data.user
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem('token', response.data.token);
      updateActivity();
    }
    
    return response;
  },
  
  register: async (username: string, password: string): Promise<AxiosResponse<{ message: string; user: any }>> =>
    api.post('/auth/register', { username, password }),
    
  getCurrentUser: async (): Promise<AxiosResponse<User>> => 
    api.get('/auth/me'),
    
  logout: () => {
    clearSession();
    // Navigation will be handled by the component
  },
  
  refreshToken: async (): Promise<AxiosResponse<AuthResponse>> => {
    const response = await api.post('/auth/refresh');
    
    if (response.data.token) {
      const sessionData = {
        token: response.data.token,
        expiresAt: response.data.expiresAt,
        user: response.data.user
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem('token', response.data.token);
      updateActivity();
    }
    
    return response;
  }
};

// Cookies API endpoints
export const cookiesAPI = {
  uploadBundle: async (cookies: Cookie[]): Promise<AxiosResponse<{ message: string; bundleId: string }>> =>
    api.post('/cookies/upload', { cookies }),
    
  getActiveCookies: async (website?: string): Promise<AxiosResponse<{ success: boolean; cookies: Cookie[]; message: string }>> => {
    const url = website ? `/cookies/get?website=${encodeURIComponent(website)}` : '/cookies/get';
    return api.get(url);
  },
    
  listBundles: async (): Promise<AxiosResponse<CookieBundle[]>> => 
    api.get('/cookies'),
    
  getBundle: async (id: string): Promise<AxiosResponse<CookieBundle>> =>
    api.get(`/cookies/${id}`),
    
  insertCookies: async (website: string, cookies: Cookie[]): Promise<AxiosResponse<{ message: string }>> => {
    // Check website access first
    const accessCheck = await userAPI.checkWebsiteAccess(website);
    if (!accessCheck.data.hasAccess) {
      throw new Error(accessCheck.data.message || 'Access denied to this website');
    }
    return api.post('/cookies/insert', { website, cookies });
  },
    
  trackInsertion: async (website: string, success: boolean): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/cookies/track', { website, success })
};

// User API endpoints
export const userAPI = {
  getUserStats: async (): Promise<AxiosResponse<UserStats>> => 
    api.get('/users/stats'),
  
  updatePermissions: async (permissions: WebsitePermission[]): Promise<AxiosResponse<{ message: string }>> =>
    api.put('/users/permissions', { permissions }),
    
  getLoginHistory: async (): Promise<AxiosResponse<LoginHistory[]>> => 
    api.get('/users/login-history'),
    
  getCookieInsertions: async (): Promise<AxiosResponse<CookieInsertion[]>> =>
    api.get('/users/cookie-insertions'),
    
  getWebsitePermissions: async (): Promise<AxiosResponse<WebsitePermission[]>> =>
    api.get('/users/website-permissions'),
    
  checkWebsiteAccess: async (website: string): Promise<AxiosResponse<{ hasAccess: boolean; message?: string }>> =>
    api.get(`/users/check-access/${encodeURIComponent(website)}`),
    
  requestWebsiteAccess: async (website: string, reason?: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/users/request-access', { website, reason }),
    
  updateSessionTimeout: async (timeout: number): Promise<AxiosResponse<{ message: string }>> =>
    api.put('/users/session-timeout', { timeout }),
    
  // Admin endpoints
  getAccessRequests: async (): Promise<AxiosResponse<any[]>> =>
    api.get('/users/access-requests'),
    
  reviewAccessRequest: async (requestId: string, approved: boolean, note?: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/access-requests/${requestId}`, { approved, note }),
    
  getAdminUsers: async (): Promise<AxiosResponse<any[]>> =>
    api.get('/users/admin/users'),
    
  updateUserStatus: async (userId: string, isActive: boolean): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/admin/users/${userId}/status`, { isActive }),
    
  changeUserPassword: async (userId: string, password: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/admin/users/${userId}/password`, { password }),
    
  setUserExpiry: async (userId: string, expiryDate: string | null): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/admin/users/${userId}/expiry`, { expiryDate }),
    
  updateUserWebsitePermissions: async (userId: string, permissions: any[]): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/admin/users/${userId}/websites`, { permissions }),
  
  updateUserPhone: async (userId: string, phoneCountryCode: string, phoneNumber: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/admin/users/${userId}/phone`, { phoneCountryCode, phoneNumber }),
    
  // Website management
  addWebsitePermission: async (website: string, cookies?: Cookie[]): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/users/website-permission', { website, cookies }),
    
  removeWebsitePermission: async (website: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/users/website-permission/${encodeURIComponent(website)}`),
    
  uploadWebsiteCookies: async (website: string, cookies: Cookie[]): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/cookies/website-upload', { website, cookies })
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return checkSessionExpiry();
};

// Get session info
export const getSessionInfo = (): SessionInfo | null => {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData || !checkSessionExpiry()) return null;
  
  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
};

// Check if session will expire soon (within 5 minutes)
export const isSessionExpiringSoon = (): boolean => false;

// Utility function to get current user info
export const getCurrentUserInfo = (): { username: string; isAdmin: boolean } | null => {
  const session = getSessionInfo();
  return session ? {
    username: session.user.username,
    isAdmin: session.user.isAdmin
  } : null;
};

// Check if current user is admin
export const isCurrentUserAdmin = (): boolean => {
  const userInfo = getCurrentUserInfo();
  return userInfo?.isAdmin || false;
};

// Export session management functions
export { 
  clearSession, 
  updateActivity, 
  checkSessionExpiry, 
  SESSION_KEY, 
  ACTIVITY_KEY 
};
