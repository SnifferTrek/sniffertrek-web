"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthUser, getCurrentUser, onAuthStateChange, signOut } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { mergeCloudAndLocal } from "@/lib/cloudSync";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  configured: false,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        mergeCloudAndLocal(u.id);
      }
    });

    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
      if (u) {
        mergeCloudAndLocal(u.id);
      }
    });

    return unsubscribe;
  }, [configured]);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
