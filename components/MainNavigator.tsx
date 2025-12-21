import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigation';
import ProfileScreen from '../app/Profile';
import NotificationsScreen from '../app/Notifications';
import AboutScreen from '../app/About';
import ProfileAvatarButton from './ProfileAvatarButton';
import NotificationAvatarButton from './NotificationAvatarButton';

export type MainStackParamList = {
    Tabs: undefined;
    Profile: undefined;
    Notifications: undefined;
    About: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
                options={({ navigation }) => ({
                    headerTitle: 'Wallet',
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <NotificationAvatarButton
                                onPress={() => navigation.navigate('Notifications')}
                            />
                            <ProfileAvatarButton onPress={() => navigation.navigate('Profile')} />
                        </View>
                    ),
                })}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerTitle: 'Your Profile' }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerTitle: 'Notifications' }}
            />
            <Stack.Screen
                name="About"
                component={AboutScreen}
                options={{ headerTitle: 'About' }}
            />
        </Stack.Navigator>
    );
}


