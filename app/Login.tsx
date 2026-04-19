import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';
import AppLogo from '../components/AppLogo';
import type { AuthStackParamList } from '../components/AuthNavigator';
import { useAuth } from '../context/AuthContext';
import { sendAuthCode } from '../services/phoneAuthApi';
import type { Theme } from '../theme/restyleTheme';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import OtpVerifyScreen from './OtpVerify';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const digitsOnly = (s: string) => s.replace(/\D/g, '');

const schema = z.object({
  countryDial: z
    .string()
    .transform((s) => digitsOnly(s) || '91')
    .pipe(z.string().min(1).max(4)),
  phone: z
    .string()
    .min(1, 'Enter your phone number')
    .refine((v) => digitsOnly(v).length >= 6, 'Enter a valid phone number'),
});

type FormValues = z.input<typeof schema>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { completePhoneLogin } = useAuth();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const otpRef = useRef<{ resetTimer: () => void }>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { countryDial: '91', phone: '' },
    resolver: zodResolver(schema),
  });

  const inputStyle = useMemo(
    () => ({
      borderColor: theme.colors.input,
      backgroundColor: theme.colors.muted,
      color: theme.colors.foreground,
    }),
    [theme.colors.input, theme.colors.muted, theme.colors.foreground],
  );

  const [otpArgs, setOtpArgs] = useState<{
    phone: string;
    countryDial: string;
  } | null>(null);
  const snapPoints = useMemo(() => ['55%'], []);

  const closeOtpSheet = () => {
    bottomSheetModalRef.current?.dismiss();
    setOtpArgs(null);
  };

  const renderBackdrop = useCallback(
    (backdropProps: any) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  useEffect(() => {
    if (otpArgs) {
      bottomSheetModalRef.current?.present();
    }
  }, [otpArgs]);

  const onResendOtp = async () => {
    if (!otpArgs) return;
    const res = await sendAuthCode({
      phone: otpArgs.phone,
      countryDial: otpArgs.countryDial,
    });
    if (res.ok) {
      showSuccessToast('Code resent', res.message);
      otpRef.current?.resetTimer();
    } else {
      showErrorToast('Could not resend', res.message);
    }
  };

  const submit = handleSubmit(
    async (values) => {
      const phoneDigits = digitsOnly(values.phone);
      const dial = values.countryDial;
      const res = await sendAuthCode({ phone: phoneDigits, countryDial: dial });
      if (res.status !== 200) {
        showErrorToast('Could not send code', res.message);
        return;
      }
      showSuccessToast('Code sent', res.message);
      Keyboard.dismiss();
      setOtpArgs({ phone: phoneDigits, countryDial: dial });
    },
    (err) => {
      const msg =
        err.phone?.message ?? err.countryDial?.message ?? 'Check your fields';
      showErrorToast('Invalid', String(msg));
    },
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.logoWrap}>
        <AppLogo width={72} height={72} />
      </View>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>
        Sign In
      </Text>

      <View style={styles.phoneRow}>
        <Controller
          control={control}
          name="countryDial"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.dialInput, inputStyle]}
              placeholder="91"
              placeholderTextColor={theme.colors.mutedForeground}
              keyboardType="phone-pad"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              maxLength={4}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.phoneInput, inputStyle]}
              placeholder="Phone number"
              placeholderTextColor={theme.colors.mutedForeground}
              keyboardType="phone-pad"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: theme.colors.primary },
          isSubmitting && { opacity: 0.6 },
        ]}
        onPress={() => void submit()}
        disabled={isSubmitting}
      >
        <Text
          style={[
            styles.primaryButtonText,
            { color: theme.colors.primaryForeground },
          ]}
        >
          Send code
        </Text>
      </TouchableOpacity>

      <View style={{ height: 12 }} />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={closeOtpSheet}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16 + insets.bottom,
            backgroundColor: theme.colors.background,
          }}
        >
          {otpArgs ? (
            <OtpVerifyScreen
              ref={otpRef}
              phone={otpArgs.phone}
              countryDial={otpArgs.countryDial}
              onClose={closeOtpSheet}
              onResendOtp={onResendOtp}
              completePhoneLogin={completePhoneLogin}
            />
          ) : null}
        </BottomSheetView>
      </BottomSheetModal>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 8 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dialInput: {
    width: 64,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  primaryButton: {
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkText: { textAlign: 'center', marginTop: 16, color: '#1E40AF' },
});
