"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ADMIN_EMAIL, getAuthClient } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function checkAdmin(user: User | null) {
  return (
    !!user &&
    !!ADMIN_EMAIL &&
    user.emailVerified &&
    user.email?.toLowerCase() === ADMIN_EMAIL
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthClient();
    return onAuthStateChanged(auth, (next) => {
      if (next && !checkAdmin(next)) {
        setError("Esta cuenta de Google no tiene permiso para acceder a la administración.");
        void signOut(auth);
        setUser(null);
      } else {
        setUser(next);
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(getAuthClient(), new GoogleAuthProvider());
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user") {
        setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      }
    }
  }, []);

  const logout = useCallback(() => signOut(getAuthClient()), []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: checkAdmin(user), error, login, logout }),
    [user, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
