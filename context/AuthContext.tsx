import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initAppwrite } from '../services/appwrite';
import { ID } from 'appwrite';

type AuthContextValue = {
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
	register: (name: string, email: string, password: string) => Promise<{ ok: boolean; message: string }>;
	logout: () => Promise<void>;
	user: { id: string; email: string; name?: string } | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);

	useEffect(() => {
		const bootstrap = async () => {
			try {
				const raw = await AsyncStorage.getItem(AUTH_KEY);
				if (raw) {
					setIsAuthenticated(true);
					try {
						const parsed = JSON.parse(raw);
						if (parsed?.id && parsed?.email) {
							setUser({ id: String(parsed.id), email: String(parsed.email), name: parsed.name });
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

	const login = useCallback(async (email: string, password: string) => {
		if (!email || !password) {
			return { ok: false, message: 'Email and password required' };
		}
		const { account } = initAppwrite();
		try {
			await account.createEmailPasswordSession({ email, password });
			const me = await account.get();
			const minimal = { id: me.$id, email: me.email, name: (me as any).name as string | undefined };
			await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(minimal));
			setIsAuthenticated(true);
			setUser(minimal);
			return { ok: true, message: 'You are now signed in.' };
		} catch (err: any) {
			// Block login if user does not exist or credentials invalid
			const code = err?.code ?? err?.status ?? 0;
			if (code === 401 || code === 404) {
				return { ok: false, message: 'No account found for these credentials. Please register first.' };
			}
			return { ok: false, message: err?.message ?? 'Login failed' };
		}
	}, []);

	const register = useCallback(async (name: string, email: string, password: string) => {
		if (!name || !email || !password) {
		 return { ok: false, message: 'All fields are required' };
		}
		const { account } = initAppwrite();
		try {
			// Create user and session
			await account.create({ userId: ID.unique(), email, password, name });
			await account.createEmailPasswordSession({ email, password });
			const me = await account.get();
			const minimal = { id: me.$id, email: me.email, name: (me as any).name as string | undefined };
			await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(minimal));
			setIsAuthenticated(true);
			setUser(minimal);
			return { ok: true, message: 'Account created. You are now signed in.' };
		} catch (err: any) {
			return { ok: false, message: err?.message ?? 'Registration failed' };
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			const { account } = initAppwrite();
			await account.deleteSession({ sessionId: 'current' });
		} catch {
			// ignore if no active session
		} finally {
			await AsyncStorage.removeItem(AUTH_KEY);
			setIsAuthenticated(false);
			setUser(null);
		}
	}, []);

	const value = useMemo(
		() => ({ isAuthenticated, isLoading, login, register, logout, user }),
		[isAuthenticated, isLoading, login, register, logout, user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}


