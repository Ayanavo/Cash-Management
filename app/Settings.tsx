// screens/SettingsScreen.tsx
import { Picker } from '@react-native-picker/picker';
import { AlertTriangle, ChevronRight, Info, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import DropdownSelect from '../components/DropdownSelect';
import { DropdownOption } from '../interfaces/components.types';
import Toggle from '../components/Toggle';
import currencies from '../constants/currencies.json';
import languages from '../constants/languages.json';
import { useAuth } from '../context/AuthContext';
import { useDateFormat } from '../context/DateFormatContext';
import { useThemeMode } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
import { DateFormat } from '../interfaces/components.types';
import { CurrencyOption } from '../interfaces/components.types';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import {
  getProfileSettings,
  resetAccount,
  sendPasswordResetEmail,
  upsertProfileSettings,
} from '../services/appwrite/appwrite';
import { emitInvestmentsChanged } from '../services/events';
import type { Theme } from '../theme/restyleTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../components/MainNavigator';

export default function SettingsScreen() {
  const theme = useTheme<Theme>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { logout } = useAuth();
  const { formatString, setFormatString, timeFormat, setTimeFormat } =
    useDateFormat();
  const { isDark, toggle } = useThemeMode();
  const {
    currency,
    setCurrency,
    recurringResetByPeriod,
    setRecurringResetByPeriod,
  } = usePreferences();

  const ranges = ['1D', '7D', '1M', '3M', '6M', '1Y', 'Custom'] as const;
  type RangeValue = (typeof ranges)[number];
  const [selectedRange, setSelectedRange] = useState<RangeValue>('1M');
  const [localDateFormat, setLocalDateFormat] =
    useState<DateFormat>(formatString);
  const [localTimeFormat, setLocalTimeFormat] = useState<'12' | '24'>(
    timeFormat,
  );
  const [localCurrency, setLocalCurrency] = useState<CurrencyOption>(currency);
  const [localRecurringReset, setLocalRecurringReset] = useState<boolean>(
    recurringResetByPeriod,
  );
  const [localIsDark, setLocalIsDark] = useState<boolean>(isDark);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Notification preferences (local state, persisted via profile settings)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState<boolean>(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState<boolean>(true);

  // Custom range modal state
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  const [customInputError, setCustomInputError] = useState<boolean>(false);

  // Language preference (local only, persisted via profile settings)
  const [localLanguage, setLocalLanguage] = useState<string>(
    (languages as { code: string; name: string }[])[0]?.code ?? 'en-IN',
  );

  // Change password modal state
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changeEmail, setChangeEmail] = useState('');
  const [changeEmailError, setChangeEmailError] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const customLabel = useMemo(
    () => (customDays != null && customDays > 0 ? `${customDays}D` : 'Custom'),
    [customDays],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      showSuccessToast('Signed out', 'You have been logged out.');
    } catch (e: any) {
      showErrorToast('Sign out failed', e?.message ?? 'Could not sign out.');
    }
  }, [logout]);

  const saveProfilePatch = useCallback(
    async (
      patch: Record<string, any>,
      opts?: { section?: 'app' | 'notification' },
    ) => {
      try {
        setSaving(true);
        const existing = await getProfileSettings();
        const base = existing ? { ...existing, ...patch } : patch;
        const res = await upsertProfileSettings(base);
        if (opts?.section === 'app') {
          // We don't get a human-friendly message from Appwrite,
          // so we show a generic success toast on successful update.
          showSuccessToast(
            'Settings updated',
            'Your app preferences have been saved.',
          );
        }
        return res;
      } catch (e: any) {
        showErrorToast('Save failed', e?.message ?? 'Could not save settings.');
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const handleConfirmReset = useCallback(async () => {
    try {
      setResetting(true);
      await resetAccount();
      emitInvestmentsChanged();
      showSuccessToast(
        'Account reset',
        'All your account data has been deleted.',
      );
    } catch (e: any) {
      showErrorToast('Reset failed', e?.message ?? 'Could not reset account.');
    } finally {
      setResetting(false);
    }
  }, []);

  const [resetModalVisible, setResetModalVisible] = useState(false);

  const handleReset = useCallback(() => {
    setResetModalVisible(true);
  }, []);

  const handleChangePassword = useCallback(() => {
    setChangeEmail('');
    setChangeEmailError(false);
    setChangePasswordVisible(true);
  }, []);

  const handleSendPasswordReset = useCallback(async () => {
    const email = changeEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setChangeEmailError(true);
      showErrorToast(
        'Invalid email',
        'Please enter a valid registered email address.',
      );
      return;
    }
    try {
      setSendingReset(true);
      await sendPasswordResetEmail(email);
      showSuccessToast(
        'Email sent',
        'If this email is registered, a password reset link has been sent.',
      );
      setChangePasswordVisible(false);
    } catch (e: any) {
      showErrorToast(
        'Request failed',
        e?.message ?? 'Could not send password reset email.',
      );
    } finally {
      setSendingReset(false);
    }
  }, [changeEmail]);

  const currencyOptions: DropdownOption[] = useMemo(
    () =>
      (currencies as CurrencyOption[]).map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.name}`,
        leftLabel: c.symbol,
      })),
    [],
  );

  const currencyByCode: Record<string, CurrencyOption> = useMemo(
    () =>
      (currencies as CurrencyOption[]).reduce((acc, c) => {
        acc[c.code] = c;
        return acc;
      }, {} as Record<string, CurrencyOption>),
    [],
  );

  const languageOptions: DropdownOption[] = useMemo(
    () =>
      (languages as { code: string; name: string }[]).map((l) => ({
        value: l.code,
        label: `${l.code.toUpperCase()} — ${l.name}`,
      })),
    [],
  );

  const languageByCode: Record<string, { code: string; name: string }> =
    useMemo(
      () =>
        (languages as { code: string; name: string }[]).reduce((acc, l) => {
          acc[l.code] = l;
          return acc;
        }, {} as Record<string, { code: string; name: string }>),
      [],
    );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            App
          </Text>

          {/* Date Format */}
          <Text
            style={[
              styles.label,
              { marginBottom: 6, color: theme.colors.mutedForeground },
            ]}
          >
            Date Format
          </Text>
          <View
            style={[
              styles.pickerRow,
              {
                marginBottom: 16,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.muted,
              },
            ]}
          >
            <Picker
              selectedValue={localDateFormat}
              onValueChange={async (val: DateFormat) => {
                const prevLocal = localDateFormat;
                const prevCtx = formatString;
                setLocalDateFormat(val);
                try {
                  await setFormatString(val);
                  await saveProfilePatch(
                    { dateFormat: val },
                    { section: 'app' },
                  );
                } catch {
                  // Revert local and context state if persisting fails
                  setLocalDateFormat(prevLocal);
                  await setFormatString(prevCtx);
                }
              }}
              style={styles.picker}
              dropdownIconColor={theme.colors.mutedForeground}
              mode="dropdown"
            >
              <Picker.Item label="DD-MM-YYYY" value="DD-MM-YYYY" />
              <Picker.Item label="YYYY-MM-DD" value="YYYY-MM-DD" />
              <Picker.Item label="MM/DD/YYYY" value="MM/DD/YYYY" />
            </Picker>
          </View>

          {/* Time Format */}
          <Text
            style={[
              styles.label,
              { marginBottom: 6, color: theme.colors.mutedForeground },
            ]}
          >
            Time Format
          </Text>
          <View style={styles.segmentRow}>
            {(['12', '24'] as const).map((tf) => {
              const active = tf === localTimeFormat;
              return (
                <TouchableOpacity
                  key={tf}
                  style={[
                    styles.segmentBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                    active && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={async () => {
                    const prevLocal = localTimeFormat;
                    const prevCtx = timeFormat;
                    setLocalTimeFormat(tf);
                    try {
                      await setTimeFormat(tf);
                      await saveProfilePatch(
                        { timeFormat: tf },
                        { section: 'app' },
                      );
                    } catch {
                      // Revert local and context state if persisting fails
                      setLocalTimeFormat(prevLocal);
                      await setTimeFormat(prevCtx);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: theme.colors.foreground },
                      active && {
                        color: theme.colors.primaryForeground,
                      },
                    ]}
                  >
                    {tf === '12' ? '12-hour' : '24-hour'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Currency */}
          <Text
            style={[
              styles.label,
              { marginBottom: 6, color: theme.colors.mutedForeground },
            ]}
          >
            Currency
          </Text>
          <View style={{ marginBottom: 16 }}>
            <DropdownSelect
              value={localCurrency.code}
              options={currencyOptions}
              onChange={async (nextCode) => {
                const next = currencyByCode[nextCode];
                if (next) {
                  setLocalCurrency(next);
                  await setCurrency(next);
                  void saveProfilePatch(
                    { currencyCode: next.code },
                    { section: 'app' },
                  );
                }
              }}
              title="Choose currency"
              showSearch
              searchPlaceholder="Search by code, name, or symbol"
              maxListHeight={320}
            />
          </View>

          {/* Language */}
          <Text
            style={[
              styles.label,
              { marginBottom: 6, color: theme.colors.mutedForeground },
            ]}
          >
            Language
          </Text>
          <View style={{ marginBottom: 16 }}>
            <DropdownSelect
              value={localLanguage}
              options={languageOptions}
              onChange={async (nextCode) => {
                const next = languageByCode[nextCode];
                if (next) {
                  setLocalLanguage(next.code);
                  void saveProfilePatch(
                    { languageCode: next.code },
                    { section: 'app' },
                  );
                }
              }}
              title="Choose language"
              showSearch
              searchPlaceholder="Search by code or name"
              maxListHeight={320}
            />
          </View>

          {/* Recurring */}
          <View style={[styles.themeRow, { marginBottom: 12 }]}>
            <Text
              style={[styles.label, { color: theme.colors.mutedForeground }]}
            >
              Frequency of events
            </Text>
            <Toggle
              value={localRecurringReset}
              onValueChange={async (val) => {
                setLocalRecurringReset(val);
                await setRecurringResetByPeriod(val);
                void saveProfilePatch(
                  { recurringResetByPeriod: val },
                  { section: 'app' },
                );
              }}
            />
          </View>

          {/* Theme */}
          <View style={[styles.themeRow, { marginBottom: 12 }]}>
            <Text
              style={[styles.label, { color: theme.colors.mutedForeground }]}
            >
              Dark Mode
            </Text>
            <Toggle
              value={localIsDark}
              onValueChange={async () => {
                setLocalIsDark((prev) => {
                  const next = !prev;
                  void saveProfilePatch(
                    { isDarkTheme: next },
                    { section: 'app' },
                  );
                  return next;
                });
                await toggle();
              }}
            />
          </View>

          {/* Range Toggle */}
          <Text
            style={[
              styles.label,
              { marginBottom: 6, color: theme.colors.mutedForeground },
            ]}
          >
            Default Range
          </Text>
          <View style={styles.segmentRow}>
            {ranges.map((r) => {
              const active = r === selectedRange;
              const isCustom = r === 'Custom';
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.segmentBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                    active && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => {
                    if (isCustom) {
                      if (customDays == null) {
                        setCustomInput('');
                        setCustomModalVisible(true);
                      } else {
                        setSelectedRange('Custom');
                        void saveProfilePatch(
                          {
                            range:
                              customDays != null && customDays > 0
                                ? `${customDays}D`
                                : 'Custom',
                          },
                          { section: 'app' },
                        );
                      }
                    } else {
                      setSelectedRange(r);
                      void saveProfilePatch({ range: r }, { section: 'app' });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.segmentContent}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: theme.colors.foreground },
                        active && {
                          color: theme.colors.primaryForeground,
                        },
                      ]}
                    >
                      {isCustom ? customLabel : r}
                    </Text>
                    {isCustom && customDays != null && active ? (
                      <TouchableOpacity
                        onPress={(e: any) => {
                          if (e?.stopPropagation) e.stopPropagation();
                          setCustomDays(null);
                          setSelectedRange('1M');
                          void saveProfilePatch(
                            { range: '1M' },
                            { section: 'app' },
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.chipClose}>
                          <X size={12} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notification section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            Notification
          </Text>
          <View style={[styles.themeRow, { marginBottom: 8 }]}>
            <Text
              style={[styles.label, { color: theme.colors.mutedForeground }]}
            >
              Email notifications
            </Text>
            <Toggle
              value={emailNotificationsEnabled}
              onValueChange={async (val) => {
                setEmailNotificationsEnabled(val);
                void saveProfilePatch({ emailNotificationsEnabled: val });
              }}
            />
          </View>
          <View style={[styles.themeRow, { marginBottom: 4 }]}>
            <Text
              style={[styles.label, { color: theme.colors.mutedForeground }]}
            >
              Push notifications
            </Text>
            <Toggle
              value={pushNotificationsEnabled}
              onValueChange={async (val) => {
                setPushNotificationsEnabled(val);
                void saveProfilePatch({ pushNotificationsEnabled: val });
              }}
            />
          </View>
        </View>

        {/* Account section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            Account
          </Text>
          <TouchableOpacity
            style={[styles.accountRow, { borderColor: theme.colors.border }]}
            activeOpacity={0.8}
            onPress={handleChangePassword}
          >
            <Text
              style={[
                styles.accountRowText,
                { color: theme.colors.foreground },
              ]}
            >
              Change password
            </Text>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountRow, { borderColor: theme.colors.border }]}
            activeOpacity={0.8}
            onPress={handleReset}
          >
            <Text
              style={[
                styles.accountRowText,
                styles.accountRowTextDanger,
                { color: theme.colors.destructive },
              ]}
            >
              Delete account
            </Text>
            <ChevronRight size={16} color={theme.colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.accountRow,
              { borderBottomWidth: 0, borderColor: theme.colors.border },
            ]}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text
              style={[
                styles.accountRowText,
                { color: theme.colors.foreground },
              ]}
            >
              Log out
            </Text>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* About section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            About
          </Text>
          <TouchableOpacity
            style={[
              styles.accountRow,
              { borderColor: theme.colors.border, borderBottomWidth: 0 },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('About')}
          >
            <Text
              style={[
                styles.accountRowText,
                { color: theme.colors.foreground },
              ]}
            >
              About this app
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronRight size={16} color={theme.colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Change Password Modal */}
        <Modal
          visible={changePasswordVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setChangePasswordVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.modalTitle, { color: theme.colors.foreground }]}
              >
                Change password
              </Text>
              <Text
                style={[
                  styles.modalConfirmText,
                  { color: theme.colors.mutedForeground },
                ]}
              >
                Enter your registered email address and we&apos;ll send you a
                link to change your password.
              </Text>
              <TextInput
                style={[
                  styles.emailInput,
                  {
                    borderColor: changeEmailError
                      ? theme.colors.destructive
                      : theme.colors.input,
                    borderWidth: changeEmailError ? 2 : 1,
                    backgroundColor: theme.colors.muted,
                    color: theme.colors.foreground,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={changeEmail}
                onChangeText={(val) => {
                  setChangeEmail(val);
                  if (changeEmailError) setChangeEmailError(false);
                }}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setChangePasswordVisible(false)}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnSecondary,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  activeOpacity={0.85}
                  disabled={sendingReset}
                >
                  <Text
                    style={[
                      styles.modalBtnSecondaryText,
                      { color: theme.colors.foreground },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    void handleSendPasswordReset();
                  }}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  activeOpacity={0.85}
                  disabled={sendingReset}
                >
                  <Text
                    style={[
                      styles.modalBtnPrimaryText,
                      { color: theme.colors.primaryForeground },
                    ]}
                  >
                    {sendingReset ? 'Sending...' : 'Send link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Days Modal */}
        <Modal
          visible={customModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCustomModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.modalTitle, { color: theme.colors.foreground }]}
              >
                Custom Range
              </Text>
              <View style={styles.everyRow}>
                <Text
                  style={[styles.everyText, { color: theme.colors.foreground }]}
                >
                  Every
                </Text>
                <TextInput
                  style={[
                    styles.daysInput,
                    {
                      borderColor: customInputError
                        ? theme.colors.destructive
                        : theme.colors.input,
                      borderWidth: customInputError ? 2 : 1,
                      backgroundColor: theme.colors.muted,
                      color: theme.colors.foreground,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={customInput}
                  onChangeText={(val) => {
                    setCustomInput(val);
                    if (val === '') {
                      setCustomInputError(false);
                      return;
                    }
                    const n = parseInt(val || '', 10);
                    if (isNaN(n) || n < 0 || n > 365) {
                      setCustomInputError(true);
                    } else {
                      setCustomInputError(false);
                    }
                  }}
                />
                <Text
                  style={[styles.everyText, { color: theme.colors.foreground }]}
                >
                  days
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setCustomModalVisible(false)}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnSecondary,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modalBtnSecondaryText,
                      { color: theme.colors.foreground },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const n = parseInt(customInput || '', 10);
                    if (isNaN(n) || n < 0 || n > 365) {
                      setCustomInputError(true);
                      showErrorToast(
                        'Invalid value',
                        'Please enter a number between 0 and 365.',
                      );
                      return;
                    }
                    setCustomInputError(false);
                    setCustomDays(n);
                    setSelectedRange('Custom');
                    setCustomModalVisible(false);
                  }}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modalBtnPrimaryText,
                      { color: theme.colors.primaryForeground },
                    ]}
                  >
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Reset Confirmation Modal */}
        <Modal
          visible={resetModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setResetModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <AlertTriangle size={36} color="#DC2626" />
              </View>
              <Text
                style={[styles.modalTitle, { color: theme.colors.foreground }]}
              >
                Reset account?
              </Text>
              <Text
                style={[
                  styles.modalConfirmText,
                  { color: theme.colors.mutedForeground },
                ]}
              >
                This will permanently delete your investments and profile
                settings. This action cannot be undone.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setResetModalVisible(false)}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnSecondary,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={styles.buttonContent}>
                    <X size={16} color={theme.colors.mutedForeground} />
                    <Text
                      style={[
                        styles.modalBtnSecondaryText,
                        {
                          marginLeft: 6,
                          color: theme.colors.foreground,
                        },
                      ]}
                    >
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setResetModalVisible(false);
                    void handleConfirmReset();
                  }}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnDanger,
                    { backgroundColor: theme.colors.destructive },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={styles.buttonContent}>
                    <Trash2
                      size={16}
                      color={theme.colors.destructiveForeground}
                    />
                    <Text
                      style={[
                        styles.modalBtnDangerText,
                        {
                          marginLeft: 6,
                          color: theme.colors.destructiveForeground,
                        },
                      ]}
                    >
                      {resetting ? 'Resetting...' : 'Reset'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingVertical: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: '#111827',
  },
  card: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  pickerRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
  },
  value: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  segmentBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  segmentBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  chipClose: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCloseActive: {
    backgroundColor: '#FFFFFF',
  },
  chipCloseText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
  chipCloseTextActive: {
    color: '#111827',
  },
  clearCustomBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  clearCustomText: {
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
  saveButton: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  everyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  everyText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  daysInput: {
    height: 40,
    width: 80,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontSize: 16,
  },
  daysInputError: {
    borderColor: '#DC2626',
  },
  emailInput: {
    height: 44,
    width: '100%',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    marginTop: 8,
  },
  emailInputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  modalBtnSecondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalBtnPrimary: {
    backgroundColor: '#111827',
    marginLeft: 8,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalConfirmText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  modalBtnDanger: {
    backgroundColor: '#DC2626',
    marginLeft: 8,
    borderRadius: 8,
  },
  modalBtnDangerText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountRowText: {
    fontSize: 14,
    color: '#111827',
  },
  accountRowTextDanger: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
