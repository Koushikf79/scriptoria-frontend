import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AuthResponse, UserProfile } from '@/lib/types';

const TOKEN_KEY = 'scriptoria_token';
const USER_KEY = 'scriptoria_user';
const EXPIRY_KEY = 'scriptoria_token_expiry';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setUser: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function parseStoredUser(value: string | null): UserProfile | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as UserProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<UserProfile | null>(null);

  const logout = () => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  };

  const login = (data: AuthResponse) => {
    const expiryAt = Date.now() + Math.max(0, data.expiresIn) * 1000;
    const profile: UserProfile = {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName,
      createdAt: new Date().toISOString(),
      totalAnalyses: 0,
    };

    setToken(data.token);
    setUserState(profile);

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    localStorage.setItem(EXPIRY_KEY, String(expiryAt));
  };

  const setUser = (profile: UserProfile) => {
    setUserState(profile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = parseStoredUser(localStorage.getItem(USER_KEY));
    const expiryRaw = localStorage.getItem(EXPIRY_KEY);
    const expiry = Number(expiryRaw);

    if (!storedToken || !Number.isFinite(expiry) || Date.now() >= expiry) {
      logout();
      return;
    }

    setToken(storedToken);
    setUserState(storedUser);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setUser,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
