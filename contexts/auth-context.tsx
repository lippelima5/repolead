"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { SanitizedUser } from "@/types";

interface AuthContextData {
  user: SanitizedUser | null;
  token: string | null;
  validate: () => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SanitizedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const validate = async () => {
    try {
      const { data } = await api.get("/profile");

      if (data.success) {
        setUser(data.data);
        setToken("session");
        return;
      }

      setUser(null);
      setToken(null);
    } catch {
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    validate();
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      window.location.href = new URL("/", window.location.origin).href;
    }
  };

  return <AuthContext.Provider value={{ user, token, validate, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
