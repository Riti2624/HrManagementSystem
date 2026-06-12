import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!api.hasStoredToken()) {
        api.logout();
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const result = await api.getCurrentUser();
        if (mounted) {
          setUser(result.user);
        }
      } catch {
        api.logout();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    function handleUnauthorized() {
      api.logout();
      setUser(null);
      setLoading(false);
    }

    restoreSession();
    window.addEventListener('hrms:unauthorized', handleUnauthorized);

    return () => {
      mounted = false;
      window.removeEventListener('hrms:unauthorized', handleUnauthorized);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        setLoading(true);
        try {
          const result = await api.login(email, password);
          setUser(result.user);
        } finally {
          setLoading(false);
        }
      },
      signup: async (payload: { name: string; email: string; password: string; role?: string }) => {
        setLoading(true);
        try {
          const result = await api.signup(payload);
          setUser(result.user);
        } finally {
          setLoading(false);
        }
      },
      logout: () => {
        api.logout();
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
