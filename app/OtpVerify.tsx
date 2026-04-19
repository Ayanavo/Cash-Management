import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { verifyAuthCode } from '../services/phoneAuthApi';
import type { AuthStackParamList } from '../components/AuthNavigator';
import type { Theme } from '../theme/restyleTheme';

type OtpVerifyScreenProps = {
  phone?: string;
  countryDial?: string;
  onClose?: () => void;
  onResendOtp?: () => void;
  completePhoneLogin?: (data: {
    phone: string;
    countryDial?: string;
  }) => Promise<{ ok: boolean; message: string }>;
};

type OtpRoute = RouteProp<AuthStackParamList, 'OtpVerify'>;
const OTP_LENGTH = 6;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const OtpVerifyScreen = forwardRef<
  { resetTimer: () => void },
  OtpVerifyScreenProps
>((props, ref) => {
  const {
    phone,
    countryDial,
    onClose,
    onResendOtp,
    completePhoneLogin: completePhoneLoginProp,
  } = props;
  const theme = useTheme<Theme>();
  const authContext = useAuth();
  const completePhoneLogin =
    completePhoneLoginProp ?? authContext.completePhoneLogin;

  let navigation: any = null;
  let route: any = null;
  try {
    navigation = useNavigation();
  } catch {
    // Not in navigation context
  }
  try {
    route = useRoute();
  } catch {
    // Not in navigation context
  }

  const routeParams =
    route?.name === 'OtpVerify'
      ? (route.params as OtpRoute['params'])
      : undefined;
  const resolvedPhone = phone ?? routeParams?.phone;
  const resolvedCountryDial = countryDial ?? routeParams?.countryDial;
  const closeSheet = onClose ?? (() => navigation?.goBack());

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);

  useImperativeHandle(ref, () => ({
    resetTimer: () => {
      setTimeLeft(600);
      setCanResend(false);
    },
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const code = digits.join('');

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const updateDigit = (value: string, index: number) => {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
  };

  const handleTextChange = (value: string, index: number) => {
    const cleaned = digitsOnly(value);
    if (!cleaned) {
      updateDigit('', index);
      return;
    }

    if (cleaned.length > 1) {
      const next = [...digits];
      for (let i = 0; i < cleaned.length && index + i < OTP_LENGTH; i += 1) {
        next[index + i] = cleaned[i];
      }
      setDigits(next);
      const nextIndex = Math.min(index + cleaned.length, OTP_LENGTH - 1);
      focusInput(nextIndex);
      return;
    }

    updateDigit(cleaned, index);
    if (cleaned && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const onVerify = async () => {
    if (code.length !== OTP_LENGTH) {
      showErrorToast('Invalid code', `Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    if (!resolvedPhone || !resolvedCountryDial) {
      showErrorToast('Verification failed', 'Missing phone or country code.');
      return;
    }

    setSubmitting(true);
    const res = await verifyAuthCode({
      phone: resolvedPhone,
      countryDial: resolvedCountryDial,
      code,
    });
    if (!res.ok) {
      showErrorToast('Verification failed', res.message);
      setSubmitting(false);
      return;
    }

    const loginRes = await completePhoneLogin({
      phone: resolvedPhone,
      countryDial: resolvedCountryDial,
    });
    if (loginRes.ok) {
      showSuccessToast('Signed in', loginRes.message);
      onClose?.();
    } else {
      showErrorToast('Could not finish sign-in', loginRes.message);
    }
    setSubmitting(false);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.foreground }]}>
        Enter OTP
      </Text>
      <Text style={[styles.sub, { color: theme.colors.mutedForeground }]}>
        We sent a code to +{resolvedCountryDial} {resolvedPhone}
      </Text>
      <View style={styles.otpRow}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <TextInput
            key={`otp-${index}`}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpDigit,
              {
                borderColor: theme.colors.input,
                backgroundColor: theme.colors.muted,
                color: theme.colors.foreground,
              },
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digits[index]}
            onChangeText={(value) => handleTextChange(value, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            textAlign="center"
            placeholder="0"
            placeholderTextColor={theme.colors.mutedForeground}
            editable={!submitting}
            selectTextOnFocus
            textContentType="oneTimeCode"
          />
        ))}
      </View>
      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: theme.colors.primary },
          submitting && { opacity: 0.6 },
        ]}
        onPress={onVerify}
        disabled={submitting}
      >
        <Text
          style={[
            styles.primaryButtonText,
            { color: theme.colors.primaryForeground },
          ]}
        >
          Verify
        </Text>
      </TouchableOpacity>
      {canResend ? (
        <TouchableOpacity onPress={onResendOtp} disabled={submitting}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            Resend code
          </Text>
        </TouchableOpacity>
      ) : (
        <Text
          style={[styles.timerText, { color: theme.colors.mutedForeground }]}
        >
          Resend in {formatTime(timeLeft)}
        </Text>
      )}
      <TouchableOpacity onPress={closeSheet} disabled={submitting}>
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          Change phone number
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpDigit: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontWeight: '600', fontSize: 16 },
  linkText: { textAlign: 'center', marginTop: 20 },
  timerText: { textAlign: 'center', marginTop: 12, fontSize: 14 },
});

export default OtpVerifyScreen;
