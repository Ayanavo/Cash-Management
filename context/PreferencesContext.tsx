import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyOption, PreferencesContextValue } from '../interfaces/components.types';

const DEFAULT_CURRENCY: CurrencyOption = { code: 'INR', symbol: '₹', name: 'Indian Rupee' };
const CURRENCY_KEY = 'pref_currency';
const RECURRING_RESET_KEY = 'pref_recurring_reset';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyOption>(DEFAULT_CURRENCY);
    const [recurringResetByPeriod, setRecurringResetByPeriodState] = useState<boolean>(false);

    useEffect(() => {
        const load = async () => {
            try {
                const curRaw = await AsyncStorage.getItem(CURRENCY_KEY);
                if (curRaw) {
                    const parsed = JSON.parse(curRaw);
                    if (parsed?.code && parsed?.symbol) {
                        setCurrencyState(parsed);
                    }
                }
            } catch { /* ignore */ }
            try {
                const flagRaw = await AsyncStorage.getItem(RECURRING_RESET_KEY);
                if (flagRaw != null) {
                    setRecurringResetByPeriodState(flagRaw === 'true');
                }
            } catch { /* ignore */ }
        };
        void load();
    }, []);

    const setCurrency = useCallback(async (next: CurrencyOption) => {
        setCurrencyState(next);
        try {
            await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(next));
        } catch { /* ignore */ }
    }, []);

    const setRecurringResetByPeriod = useCallback(async (next: boolean) => {
        setRecurringResetByPeriodState(next);
        try {
            await AsyncStorage.setItem(RECURRING_RESET_KEY, next ? 'true' : 'false');
        } catch { /* ignore */ }
    }, []);

    const value = useMemo(
        () => ({ currency, setCurrency, recurringResetByPeriod, setRecurringResetByPeriod }),
        [currency, setCurrency, recurringResetByPeriod, setRecurringResetByPeriod],
    );

    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
    const ctx = useContext(PreferencesContext);
    if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
    return ctx;
}


