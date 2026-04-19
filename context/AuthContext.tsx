import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthContextValue } from '../interfaces/components.types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) {
          setIsAuthenticated(true);
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.id && parsed?.email) {
              setUser({
                id: String(parsed.id),
                email: String(parsed.email),
                name: parsed.name,
              });
            }
          } catch {
            // ignore parse errors
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void bootstrap();
  }, []);

  const completePhoneLogin = useCallback(
    async (minimal: { phone: string; countryDial?: string }) => {
      const id = `phone_${minimal.countryDial ?? ''}_${minimal.phone}`;
      const email = `+${minimal.countryDial ?? ''}${minimal.phone}@phone.signin`;
      const userPayload = {
        id,
        email,
        name: undefined,
      };

      try {
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userPayload));
        setIsAuthenticated(true);
        setUser(userPayload);
        return { ok: true, message: 'You are now signed in.' };
      } catch (err: any) {
        return { ok: false, message: err?.message ?? 'Could not save session' };
      }
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      if (!name || !email || !password) {
        return { ok: false, message: 'All fields are required' };
      }

      try {
        const minimal = {
          id: `local_${email}`,
          email,
          name,
        };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(minimal));
        setIsAuthenticated(true);
        setUser(minimal);
        return { ok: true, message: 'Account created. You are now signed in.' };
      } catch (err: any) {
        return { ok: false, message: err?.message ?? 'Registration failed' };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      register,
      completePhoneLogin,
      logout,
      user,
    }),
    [isAuthenticated, isLoading, register, completePhoneLogin, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
