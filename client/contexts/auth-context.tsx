"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import {
  AUTH_EXPIRED_EVENT,
  api,
  clearStoredAuth,
  getStoredToken,
  getTokenExpiresAt,
  setStoredToken,
} from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (name: string, email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const expiryTimerRef = useRef<number | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      window.clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const scheduleTokenExpiry = useCallback(
    (token: string) => {
      clearExpiryTimer();

      const expiresAt = getTokenExpiresAt(token);
      if (!expiresAt) {
        clearStoredAuth("expired");
        setUser(null);
        return;
      }

      const timeoutMs = expiresAt - Date.now();
      if (timeoutMs <= 0) {
        clearStoredAuth("expired");
        setUser(null);
        return;
      }

      expiryTimerRef.current = window.setTimeout(() => {
        clearStoredAuth("expired");
        setUser(null);
      }, timeoutMs);
    },
    [clearExpiryTimer]
  );

  const checkAuth = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (token) {
        scheduleTokenExpiry(token);
        const response = await api.getMe();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          clearStoredAuth("unauthorized");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearStoredAuth("unauthorized");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [scheduleTokenExpiry]);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearExpiryTimer();
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      clearExpiryTimer();
    };
  }, [clearExpiryTimer]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.token && response.user) {
        setStoredToken(response.token);
        scheduleTokenExpiry(response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      clearExpiryTimer();
      clearStoredAuth("unauthorized", false);
    }
  };

  const updateUser = async (name: string, email: string) => {
    try {
      const response = await api.updateDetails(name, email);
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Update failed";
      throw new Error(errorMessage);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.updatePassword(currentPassword, newPassword);
      if (response.success && response.token) {
        setStoredToken(response.token);
        scheduleTokenExpiry(response.token);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Password update failed";
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During Next.js SSR / static prerendering the provider tree isn't
    // established yet – return safe defaults so the build doesn't fail.
    return {
      user: null,
      loading: true,
      login: async () => {},
      logout: async () => {},
      updateUser: async () => {},
      updatePassword: async () => {},
    };
  }
  return context;
}
