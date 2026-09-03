import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';

const API_BASE = '/api/v1';

interface AuthContextType {
  role: UserRole;
  username: string;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: 'admin',
  username: 'admin',
  token: null,
  login: async () => {},
  switchRole: async () => {},
  isLoggingIn: false,
});

const DEMO_CREDENTIALS: Record<UserRole, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'admin123' },
  officer: { username: 'officer', password: 'officer123' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('current_role') as UserRole) || 'admin');
  const [username, setUsername] = useState<string>(() => (localStorage.getItem('current_role') === 'officer' ? 'officer' : 'admin'));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const loginWithCredentials = useCallback(async (user: string, password: string): Promise<string> => {
    const formData = new FormData();
    formData.append('username', user);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    return data.access_token as string;
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const jwt = await loginWithCredentials(user, password);
      setToken(jwt);
      setUsername(user);
      const newRole: UserRole = user === 'admin' ? 'admin' : 'officer';
      setRole(newRole);
      localStorage.setItem('access_token', jwt);
      localStorage.setItem('current_role', newRole);
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginWithCredentials]);

  const switchRole = useCallback(async (newRole: UserRole) => {
    const creds = DEMO_CREDENTIALS[newRole];
    setIsLoggingIn(true);
    try {
      const jwt = await loginWithCredentials(creds.username, creds.password);
      setToken(jwt);
      setRole(newRole);
      setUsername(creds.username);
      localStorage.setItem('access_token', jwt);
      localStorage.setItem('current_role', newRole);
    } catch (err) {
      console.warn('[Auth] Role switch login failed, staying in current role:', err);
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginWithCredentials]);

  // If no token exists on mount, auto-authenticate with default role
  useEffect(() => {
    if (!token) {
      switchRole(role);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ role, username, token, login, switchRole, isLoggingIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
