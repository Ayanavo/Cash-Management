import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChartBar, History, List, Settings } from 'lucide-react-native';
import * as React from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from '@shopify/restyle';
import HistoryScreen from '../app/History';
import HomeScreen from '../app/Home';
import AnalyticsScreen from '../app/Analytics';
import SettingsScreen from '../app/Settings';
import type { Theme } from '../theme/restyleTheme';

const Tab = createBottomTabNavigator();

function TabBarIcon({ focused, IconComponent }: { focused: boolean; IconComponent: any }) {
    const theme = useTheme<Theme>();
    const scale = React.useRef(new Animated.Value(focused ? 1.05 : 1)).current;
    const translateY = React.useRef(new Animated.Value(focused ? -4 : 0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(scale, {
                toValue: focused ? 1.05 : 1,
                duration: 160,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: focused ? -4 : 0,
                duration: 160,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused, scale, translateY]);

    const iconColor = focused ? theme.colors.primary : theme.colors.mutedForeground;

    return (
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }, { translateY }] }}>
            <View>
                <IconComponent size={20} color={iconColor} />
            </View>
        </Animated.View>
    );
}

export default function TabNavigator() {
    const theme = useTheme<Theme>();

    return (
        <Tab.Navigator
            initialRouteName="Investments"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.mutedForeground,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: 'RobotoMono_500Medium',
                },
                tabBarStyle: {
                    height: 110,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                    backgroundColor: theme.colors.card,
                },
                tabBarIcon: ({ focused }) => {
                    const IconComponent =
                        route.name === 'History'
                            ? History
                            : route.name === 'Investments'
                            ? List
                            : route.name === 'Analytics'
                            ? ChartBar
                        : Settings;

                    return <TabBarIcon focused={focused} IconComponent={IconComponent} />;
                },
            })}
        >
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen
                name="Investments"
                component={HomeScreen}
                listeners={({ navigation }) => ({
                    tabPress: () => navigation.setParams?.({ readOnlyInvestments: false })
                })}
            />
            <Tab.Screen name="Analytics" component={AnalyticsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}