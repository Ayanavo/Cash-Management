import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode, ThemeContextValue } from '../interfaces/components.types';

const STORAGE_KEY = 'app_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>('light');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const stored = await AsyncStorage.getItem(STORAGE_KEY);
				if (stored === 'light' || stored === 'dark') {
					setModeState(stored);
				}
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	const setMode = useCallback(async (m: ThemeMode) => {
		setModeState(m);
		await AsyncStorage.setItem(STORAGE_KEY, m);
	}, []);

	const toggle = useCallback(async () => {
		const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
		await setMode(next);
	}, [mode, setMode]);

	const value = useMemo(
		() => ({ mode, isDark: mode === 'dark', setMode, toggle, loading }),
		[mode, setMode, toggle, loading],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
	return ctx;
}


