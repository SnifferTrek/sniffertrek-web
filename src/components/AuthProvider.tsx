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
import { loadTripsFromCloud, syncTripsToCloud, verifySyncBeforeLogout } from "@/lib/cloudSync";
import { getAllTrips, saveTrip, clearAllTrips } from "@/lib/tripStorage";

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

    async function handleUserLogin(u: AuthUser) {
      const localTrips = getAllTrips();
      const cloudTrips = await loadTripsFromCloud(u.id);

      if (cloudTrips.length > 0) {
        clearAllTrips();
        for (const trip of cloudTrips) {
          saveTrip(trip);
        }
        if (localTrips.length > 0 && localTrips.some((lt) => !cloudTrips.find((ct) => ct.id === lt.id))) {
          const orphanTrips = localTrips.filter((lt) => !cloudTrips.find((ct) => ct.id === lt.id));
          for (const trip of orphanTrips) {
            saveTrip(trip);
          }
          await syncTripsToCloud(u.id);
        }
      } else if (localTrips.length > 0) {
        await syncTripsToCloud(u.id);
      }
    }

    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        handleUserLogin(u);
      }
    });

    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
      if (u) {
        handleUserLogin(u);
      }
    });

    return unsubscribe;
  }, [configured]);

  const logout = async () => {
    if (user) {
      const { syncSuccess } = await verifySyncBeforeLogout(user.id);
      if (syncSuccess) {
        clearAllTrips();
      }
    }
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
