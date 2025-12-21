// Centralized component types

// DisplayAsset
export type DisplayAssetProps = {
  currencySymbol?: string;
  /**
   * When true, the investments section is in read-only mode (e.g. entered from
   * the expenditure timeline). Used to toggle what controls are shown.
   */
  readOnlyInvestments?: boolean;
  // expense calculation now handled internally
};

// Investment list
export type InvestmentListTransaction = {
  id?: string;
  name: string;
  amount: string;
  status: string;
  priority: string;
  createdAt?: string;
  description?: string;
};

// Investment details sheet
export type InvestmentDetailsTransaction = {
  id?: string;
  name: string;
  amount: string;
  status: string;
  priority: string;
  description?: string;
};


// Expenditure timeline

export type ExpenditureDoc = {
  $id: string;
  $createdAt?: string;
  totalAmount?: number;
  [key: string]: any;
};

export type TimelineItem = {
  id: string;
  date: string;
  createdAt: string;
  amount: number;
};

export type InvestmentDetailsSheetProps = {
  onClose?: () => void;
  onPaymentComplete: () => void | Promise<void>;
  transaction: InvestmentDetailsTransaction | null;
  balanceExpense?: number;
  /**
   * When true, the sheet becomes read-only and hides all action buttons.
   * Used, for example, when navigating from the expenditure timeline.
   */
  readOnly?: boolean;
};

// Notification avatar button
import type { GestureResponderEvent, TextStyle } from 'react-native';
import type { ReactNode } from 'react';

export type NotificationAvatarButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
  size?: number;
  showBadge?: boolean;
};

// Toggle
export type ToggleProps = {
  value: boolean;
  onValueChange: (next: boolean, e?: GestureResponderEvent) => void | Promise<void>;
  disabled?: boolean;
  width?: number;
  height?: number;
};

// Add investment modal
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'paid' | 'dismissed';

export type InvestmentFormState = {
  investmentName: string;
  amount: string;
  deadline: string;
  priority: Priority;
  description: string;
  status: Status;
  isRecurring?: boolean;
  recurringEveryValue?: string;
  recurringEveryUnit?: 'D' | 'M';
};

export type InvestmentFormErrors = {
  investmentName: boolean;
  amount: boolean;
  deadline: boolean;
  priority: boolean;
};

export type AddInvestmentModalProps = {
  visible: boolean;
  onClose: () => void;
};

// DropdownSelect
export type DropdownOption = {
  value: string;
  label: string;
  leftLabel?: string;
  /**
   * Optional color for the left icon/label (e.g. priority dot).
   */
  leftColor?: string;
  /**
   * Optional React node to render on the left (e.g. lucide icon).
   */
  leftIcon?: ReactNode;
};

export type DropdownSelectProps = {
  value: string;
  options: DropdownOption[];
  onChange: (next: string) => void;
  title: string;
  showSearch?: boolean;
  hasError?: boolean;
  searchPlaceholder?: string;
  maxListHeight?: number;
};

// AnimatedCurrency
export type AnimatedCurrencyProps = {
  value: number;
  currencySymbol: string;
  style?: TextStyle | TextStyle[];
  durationMs?: number;
};

// ProfileAvatarButton
export type ProfileAvatarButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
  imageUrl?: string | null;
  size?: number;
};

// AppLogo
export type AppLogoProps = {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

// toast
export type ToastPosition = 'top' | 'bottom';


// themes
export type ThemeMode = 'light' | 'dark';

export type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
  loading: boolean;
};

// currency
export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export type PreferencesContextValue = {
  currency: CurrencyOption;
  setCurrency: (next: CurrencyOption) => Promise<void>;
  recurringResetByPeriod: boolean;
  setRecurringResetByPeriod: (next: boolean) => Promise<void>;
};

export type DateFormat = 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
export type TimeFormat = '12' | '24';

export type DateFormatContextValue = {
  formatString: DateFormat;
  setFormatString: (format: DateFormat) => Promise<void>;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => Promise<void>;
  formatDate: (date: Date | string | number) => string;
  formatDateTime: (date: Date | string | number) => string;
  loading: boolean;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  user: { id: string; email: string; name?: string } | null;
};


export type ChartPoint = {
  value: number;
  label: string;
}

export type ChartComponentProps = {
  title?: string;
  data: ChartPoint[];
  height?: number;
  lineColor?: string;
  startFillColor?: string;
  endFillColor?: string;
};