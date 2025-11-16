import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChartBar, History, Home, Settings } from 'lucide-react-native';
import * as React from 'react';
import HistoryScreen from '../app/History';
import HomeScreen from '../app/Home';
import AnalyticsScreen from '../app/Analytics';
import SettingsScreen from '../app/Settings';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: ({ focused }) => <History size={22} color={focused ? "#000" : "#7d7d7d"} /> }} />
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <Home size={22} color={focused ? "#000" : "#7d7d7d"} /> }} />
            <Tab.Screen name="analytics" component={AnalyticsScreen} options={{ tabBarIcon: ({ focused }) => <ChartBar size={22} color={focused ? "#000" : "#7d7d7d"} /> }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ focused }) => <Settings size={22} color={focused ? "#000" : "#7d7d7d"} /> }} />
        </Tab.Navigator>
    );
}