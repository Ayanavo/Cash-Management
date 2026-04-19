import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../app/Login';
import RegisterScreen from '../app/Register';
import OtpVerifyScreen from '../app/OtpVerify';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { phone: string; countryDial: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
