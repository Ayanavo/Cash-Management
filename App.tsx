import {
  RobotoMono_400Regular,
  RobotoMono_500Medium,
  RobotoMono_600SemiBold,
} from '@expo-google-fonts/roboto-mono';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { ThemeProvider as RestyleThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootSiblingParent } from 'react-native-root-siblings';
import Toast from 'react-native-toast-message';
import AuthNavigator from './components/AuthNavigator';
import LandingScreen from './components/LandingScreen';
import MainNavigator from './components/MainNavigator';
import { toastConfig } from './components/ToastConfig';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DateFormatProvider } from './context/DateFormatContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';
import './global.css';
import { darkTheme, lightTheme } from './theme/restyleTheme';

function RootRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const main = isAuthenticated ? <MainNavigator /> : <AuthNavigator />;

  return (
    <View style={{ flex: 1 }}>
      {main}
      {showLanding && (
        <LandingScreen
          onFinished={() => {
            setShowLanding(false);
          }}
        />
      )}
    </View>
  );
}

function ThemedNavigation() {
  const { isDark } = useThemeMode();
  const [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
    RobotoMono_500Medium,
    RobotoMono_600SemiBold,
  });

  const navigationBaseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...navigationBaseTheme,
    colors: {
      ...navigationBaseTheme.colors,
      primary: isDark ? darkTheme.colors.primary : lightTheme.colors.primary,
      background: isDark
        ? darkTheme.colors.background
        : lightTheme.colors.background,
      card: isDark ? darkTheme.colors.card : lightTheme.colors.card,
      text: isDark ? darkTheme.colors.foreground : lightTheme.colors.foreground,
      border: isDark ? darkTheme.colors.border : lightTheme.colors.border,
      notification: isDark
        ? darkTheme.colors.destructive
        : lightTheme.colors.destructive,
    },
  };

  if (!fontsLoaded) {
    const theme = isDark ? darkTheme : lightTheme;
    return (
      <RestyleThemeProvider theme={theme}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
          }}
        >
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </RestyleThemeProvider>
    );
  }

  return (
    <RestyleThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <AuthProvider>
        <BottomSheetModalProvider>
          <NavigationContainer theme={navigationTheme}>
            <DateFormatProvider>
              <PreferencesProvider>
                <RootRouter />
              </PreferencesProvider>
            </DateFormatProvider>
          </NavigationContainer>
        </BottomSheetModalProvider>
      </AuthProvider>
    </RestyleThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootSiblingParent>
        <ThemeProvider>
          <ThemedNavigation />
          <Toast config={toastConfig} />
        </ThemeProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  );
}
