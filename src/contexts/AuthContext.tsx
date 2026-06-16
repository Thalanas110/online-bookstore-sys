import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { api, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const currentUser = await api.getCurrentUser();
        if (isActive) {
          setUser(currentUser);
        }
      } catch {
        if (isActive) {
          setUser(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const loggedInUser = await api.login(email, password);
    setUser(loggedInUser);
  }

  async function register(email: string, password: string, name: string) {
    const createdUser = await api.register(email, password, name);
    setUser(createdUser);
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }

  async function updateUser(data: Partial<User>) {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const updated = await api.updateProfile(data);
    setUser(updated);
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