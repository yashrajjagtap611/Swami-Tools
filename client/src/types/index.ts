export interface LoginHistory {
  timestamp: Date;
  ipAddress: string;
  browser: string;
}

export interface WebsitePermission {
  website: string;
  hasAccess: boolean;
  lastAccessed: Date;
}

export interface CookieInsertion {
  website: string;
  timestamp: Date;
  success: boolean;
}

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  loginCount: number;
  lastLogin: Date;
  loginHistory: LoginHistory[];
  websitePermissions: WebsitePermission[];
  cookieInsertions: CookieInsertion[];
  tokenExpiry?: Date;
  isActive: boolean;
  sessionTimeout: number; // in minutes
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  expirationDate: number;
}

export interface CookieBundle {
  id: string;
  cookies: Cookie[];
  uploadedBy: string;
  uploadedAt: Date;
}

export interface UserStats {
  loginCount: number;
  lastLogin: Date;
  totalCookieInsertions: number;
  successfulInsertions: number;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: {
    username: string;
    isAdmin: boolean;
    sessionTimeout: number;
  };
}

export interface SessionInfo {
  token: string;
  expiresAt: Date;
  user: {
    username: string;
    isAdmin: boolean;
    sessionTimeout: number;
  };
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}
