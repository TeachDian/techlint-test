import { startTransition, createContext, useContext, useEffect, useState } from "react";
import type { LoginPayload, RegisterPayload, User } from "@shared/api";
import { api } from "@client/lib/api";
import { useToast } from "@client/contexts/ToastContext";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    try {
      const session = await api.getSession();
      startTransition(() => {
        setUser(session.user);
      });
    } catch (_error) {
      addToast({
        title: "Session check failed",
        description: "Please refresh the page and try again.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  async function login(payload: LoginPayload) {
    const result = await api.login(payload);
    startTransition(() => {
      setUser(result.user);
    });
    return result.user;
  }

  async function register(payload: RegisterPayload) {
    const result = await api.register(payload);
    startTransition(() => {
      setUser(result.user);
    });
    return result.user;
  }

  async function logout() {
    await api.logout();
    startTransition(() => {
      setUser(null);
    });
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
