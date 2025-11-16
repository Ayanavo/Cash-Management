import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

export type DateFormat = 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

type DateFormatContextValue = {
	formatString: DateFormat;
	setFormatString: (format: DateFormat) => Promise<void>;
	formatDate: (date: Date | string | number) => string;
	loading: boolean;
};

const STORAGE_KEY = 'app_date_format';

const DateFormatContext = createContext<DateFormatContextValue | undefined>(undefined);

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
	const [formatString, setFormatStringState] = useState<DateFormat>('DD-MM-YYYY');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const stored = await AsyncStorage.getItem(STORAGE_KEY);
				if (stored === 'DD-MM-YYYY' || stored === 'YYYY-MM-DD' || stored === 'MM/DD/YYYY') {
					setFormatStringState(stored);
				}
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	const setFormatString = useCallback(async (format: DateFormat) => {
		setFormatStringState(format);
		await AsyncStorage.setItem(STORAGE_KEY, format);
	}, []);

	const formatDate = useCallback(
		(date: Date | string | number) => moment(date).format(formatString),
		[formatString],
	);

	const value = useMemo(
		() => ({ formatString, setFormatString, formatDate, loading }),
		[formatString, setFormatString, formatDate, loading],
	);

	return <DateFormatContext.Provider value={value}>{children}</DateFormatContext.Provider>;
}

export function useDateFormat(): DateFormatContextValue {
	const ctx = useContext(DateFormatContext);
	if (!ctx) throw new Error('useDateFormat must be used within DateFormatProvider');
	return ctx;
}


