import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';
import "./global.css"
import TabNavigator from './components/TabNavigation';
import Toast from 'react-native-toast-message';
import { RootSiblingParent } from 'react-native-root-siblings';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthNavigator from './components/AuthNavigator';
import { View, ActivityIndicator } from 'react-native';
import { DateFormatProvider } from './context/DateFormatContext';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';

function RootRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
}

function ThemedNavigation() {
  const { isDark } = useThemeMode();
  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <DateFormatProvider>
        <AuthProvider>
          <RootRouter />
        </AuthProvider>
      </DateFormatProvider>
      <Toast />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <RootSiblingParent>
      <ThemeProvider>
        <ThemedNavigation />
      </ThemeProvider>
    </RootSiblingParent>
  );
};
