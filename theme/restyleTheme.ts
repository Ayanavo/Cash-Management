import { createTheme } from '@shopify/restyle';

const palette = {
  white: '#FFFFFF',
  black: '#000000',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#020617',

  primary50: '#e3e8ff',
  primary100: '#c7d2ff',
  primary200: '#a5b4fc',
  primary300: '#818cf8',
  primary400: '#6366f1',
  primary500: '#4f46e5',
  primary600: '#4338ca',
  primary700: '#3730a3',
  primary800: '#312e81',
  primary900: '#1e1b4b',

  red100: '#fee2e2',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  teal100: '#ccfbf1',
  teal500: '#14b8a6',
  teal600: '#0d9488',

  yellow100: '#fef9c3',
  yellow500: '#eab308',
} as const;

const baseTheme = {
  spacing: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
  } as const,
  borderRadii: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    full: 999,
  } as const,
  textVariants: {
    defaults: {
      fontFamily: 'RobotoMono_400Regular',
      fontSize: 14,
      color: 'foreground',
    },
    body: {
      fontFamily: 'RobotoMono_400Regular',
      fontSize: 14,
      lineHeight: 20,
      color: 'foreground',
    },
    muted: {
      fontFamily: 'RobotoMono_400Regular',
      fontSize: 14,
      lineHeight: 20,
      color: 'mutedForeground',
    },
    heading: {
      fontFamily: 'RobotoMono_600SemiBold',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      color: 'foreground',
    },
    subheading: {
      fontFamily: 'RobotoMono_500Medium',
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      color: 'foreground',
    },
    button: {
      fontFamily: 'RobotoMono_500Medium',
      fontSize: 14,
      fontWeight: '500',
      color: 'primaryForeground',
    },
    caption: {
      fontFamily: 'RobotoMono_400Regular',
      fontSize: 12,
      lineHeight: 16,
      color: 'mutedForeground',
    },
  } as const,
  cardVariants: {
    defaults: {
      borderRadius: 'md',
      padding: '4',
      borderWidth: 1,
      borderColor: 'border',
      backgroundColor: 'card',
    },
    elevated: {
      borderRadius: 'md',
      padding: '4',
      backgroundColor: 'card',
    },
  } as const,
  buttonVariants: {
    defaults: {
      borderRadius: 'md',
      paddingHorizontal: '4',
      paddingVertical: '2.5',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: '2',
    },
    primary: {
      backgroundColor: 'primary',
    },
    outline: {
      backgroundColor: 'background',
      borderWidth: 1,
      borderColor: 'border',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    destructive: {
      backgroundColor: 'destructive',
    },
    secondary: {
      backgroundColor: 'secondary',
    },
  } as const,
};

export const lightTheme = createTheme({
  ...baseTheme,
  colors: {
    background: palette.white,
    foreground: palette.slate900,
    card: palette.white,
    cardForeground: palette.slate900,
    popover: palette.white,
    popoverForeground: palette.slate900,
    primary: palette.slate900,
    primaryForeground: palette.white,
    secondary: palette.slate100,
    secondaryForeground: palette.slate900,
    muted: palette.slate100,
    mutedForeground: palette.slate500,
    accent: palette.slate100,
    accentForeground: palette.slate900,
    destructive: palette.red600,
    destructiveForeground: palette.white,
    border: palette.slate200,
    input: palette.slate200,
    ring: palette.slate900,
    success: palette.teal600,
    successSoft: palette.teal100,
    warning: palette.yellow500,
    warningSoft: palette.yellow100,
    ...palette,
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  colors: {
    background: palette.slate900,
    foreground: palette.slate50,
    card: palette.slate900,
    cardForeground: palette.slate50,
    popover: palette.slate900,
    popoverForeground: palette.slate50,
    primary: palette.slate200,
    primaryForeground: palette.black,
    secondary: palette.slate800,
    secondaryForeground: palette.slate50,
    muted: palette.slate800,
    mutedForeground: palette.slate400,
    accent: palette.slate800,
    accentForeground: palette.slate50,
    destructive: palette.red500,
    destructiveForeground: palette.slate50,
    border: palette.slate800,
    input: palette.slate800,
    ring: palette.slate200,
    success: palette.teal500,
    successSoft: palette.teal100,
    warning: palette.yellow500,
    warningSoft: palette.yellow100,
    ...palette,
  },
});

export type Theme = typeof lightTheme;


