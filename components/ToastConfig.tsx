import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Toast, { BaseToast } from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { useThemeMode } from '../context/ThemeContext';
import { darkTheme, lightTheme } from '../theme/restyleTheme';

type ToastVariant = 'success' | 'error' | 'info';

const CloseableToast = ({ variant, ...props }: { variant: ToastVariant; [key: string]: any }) => {
  const { isDark } = useThemeMode();
  const palette = isDark ? darkTheme : lightTheme;

  const sideColor =
    variant === 'success'
      ? palette.colors.success
      : variant === 'error'
        ? palette.colors.destructive
        : palette.colors.accent;

  const iconColor = palette.colors.mutedForeground;

  return (
    <View>
      <BaseToast
        {...props}
        style={[
          props.style,
          {
            borderLeftColor: sideColor,
            borderLeftWidth: 4,
            borderRadius: 14,
            backgroundColor: palette.colors.card,
          },
        ]}
        contentContainerStyle={[
          props.contentContainerStyle,
          { paddingRight: 40 },
        ]}
        text1Style={[
          props.text1Style,
          { color: palette.colors.foreground, fontWeight: '600' },
        ]}
        text2Style={[
          props.text2Style,
          { color: palette.colors.mutedForeground },
        ]}
      />
      <TouchableOpacity
        onPress={() => Toast.hide()}
        style={{
          position: 'absolute',
          right: 8,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 8,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={14} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
};

export const toastConfig = {
  success: (props: any) => <CloseableToast {...props} variant="success" />,
  error: (props: any) => <CloseableToast {...props} variant="error" />,
  info: (props: any) => <CloseableToast {...props} variant="info" />,
};


