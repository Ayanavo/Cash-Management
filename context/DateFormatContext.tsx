import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import type {
  DateFormat,
  DateFormatContextValue,
  TimeFormat,
} from '../interfaces/components.types';

const DATE_STORAGE_KEY = 'app_date_format';
const TIME_STORAGE_KEY = 'app_time_format';

const DateFormatContext = createContext<DateFormatContextValue | undefined>(
  undefined,
);

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [formatString, setFormatStringState] =
    useState<DateFormat>('DD-MM-YYYY');
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedDate, storedTime] = await Promise.all([
          AsyncStorage.getItem(DATE_STORAGE_KEY),
          AsyncStorage.getItem(TIME_STORAGE_KEY),
        ]);
        if (
          storedDate === 'DD-MM-YYYY' ||
          storedDate === 'YYYY-MM-DD' ||
          storedDate === 'MM/DD/YYYY'
        ) {
          setFormatStringState(storedDate);
        }
        if (storedTime === '12' || storedTime === '24') {
          setTimeFormatState(storedTime as TimeFormat);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const setFormatString = useCallback(async (format: DateFormat) => {
    setFormatStringState(format);
    await AsyncStorage.setItem(DATE_STORAGE_KEY, format);
  }, []);

  const setTimeFormat = useCallback(async (format: TimeFormat) => {
    setTimeFormatState(format);
    await AsyncStorage.setItem(TIME_STORAGE_KEY, format);
  }, []);

  const formatDate = useCallback(
    (date: Date | string | number) => moment(date).format(formatString),
    [formatString],
  );

  const formatDateTime = useCallback(
    (date: Date | string | number) => {
      const base = moment(date).format(formatString);
      const timePart =
        timeFormat === '24'
          ? moment(date).format('HH:mm')
          : moment(date).format('hh:mm A');
      return `${base} ${timePart}`;
    },
    [formatString, timeFormat],
  );

  const value = useMemo(
    () => ({
      formatString,
      setFormatString,
      timeFormat,
      setTimeFormat,
      formatDate,
      formatDateTime,
      loading,
    }),
    [formatString, setFormatString, timeFormat, setTimeFormat, formatDate, formatDateTime, loading],
  );

  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
}

export function useDateFormat(): DateFormatContextValue {
  const ctx = useContext(DateFormatContext);
  if (!ctx) throw new Error('useDateFormat must be used within DateFormatProvider');
  return ctx;
}

