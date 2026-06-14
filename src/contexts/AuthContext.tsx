import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/api';
import { clearSessionKey } from '../lib/encryption';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User & { password: string }> = {
  'demo@pageturn.com': {
    $id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@pageturn.com',
    role: 'user',
    phone: '555-0100',
    address: '123 Main St, New York, NY 10001',
    password: 'password123',
  },
  'admin@pageturn.com': {
    $id: 'demo-admin-1',
    name: 'Admin User',
    email: 'admin@pageturn.com',
    role: 'admin',
    phone: '555-0200',
    password: 'admin123',
  },
};

const SESSION_KEY = 'pageturn_session';

function getSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: User) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const saved = getSessionUser();
    setUser(saved);
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const demo = DEMO_USERS[email.toLowerCase()];
    if (demo && demo.password === password) {
      const { password: _, ...userWithoutPw } = demo;
      saveSession(userWithoutPw);
      setUser(userWithoutPw);
      return;
    }

    // Try real Appwrite auth as fallback
    try {
      const { api } = await import('../lib/api');
      const loggedInUser = await api.login(email, password);
      saveSession(loggedInUser);
      setUser(loggedInUser);
    } catch {
      throw new Error('Invalid email or password');
    }
  }

  async function register(email: string, password: string, name: string) {
    // Create a demo user session for any registration in demo mode
    const newUser: User = {
      $id: `user-${Date.now()}`,
      name,
      email,
      role: 'user',
    };
    // Also try real Appwrite
    try {
      const { api } = await import('../lib/api');
      const created = await api.register(email, password, name);
      saveSession(created);
      setUser(created);
      return;
    } catch {
      // Fall back to demo mode
    }
    saveSession(newUser);
    setUser(newUser);
  }

  async function logout() {
    try {
      const { api } = await import('../lib/api');
      await api.logout();
    } catch {
      // Ignore logout errors from Appwrite when in demo mode
    }
    clearSessionKey();
    clearSession();
    setUser(null);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) throw new Error('Not authenticated');

    try {
      const { api } = await import('../lib/api');
      const updated = await api.updateProfile(data);
      saveSession(updated);
      setUser(updated);
    } catch {
      // Demo mode: just update local state
      const updated = { ...user, ...data };
      saveSession(updated);
      setUser(updated);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
