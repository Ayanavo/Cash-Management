import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import HistoryScreen from '../app/History';
import HomeScreen from '../app/Home';
import SettingsScreen from '../app/Settings';
// import { Home } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
        </Tab.Navigator>
    );
}