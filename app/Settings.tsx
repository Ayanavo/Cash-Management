// screens/SettingsScreen.tsx
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { showSuccessToast } from '../utils/toast';
import { Picker } from '@react-native-picker/picker';
import { DateFormat, useDateFormat } from '../context/DateFormatContext';
import { useThemeMode } from '../context/ThemeContext';

export default function SettingsScreen() {
    const { logout, user } = useAuth();
    const { formatString, setFormatString } = useDateFormat();
    const { isDark, toggle } = useThemeMode();

    const handleLogout = useCallback(async () => {
        await logout();
        showSuccessToast('Signed out', 'You have been logged out.');
    }, [logout]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            {user ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Account</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{user.name || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{user.email}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>User ID</Text>
                        <Text style={styles.value}>{user.id}</Text>
                    </View>
                </View>
            ) : null}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Date Format</Text>
                <View style={styles.pickerRow}>
                    <Picker
                        selectedValue={formatString}
                        onValueChange={async (val: DateFormat) => {
                            await setFormatString(val);
                            showSuccessToast('Date format updated', `Now using ${val}`);
                        }}
                        style={styles.picker}
                        dropdownIconColor="#4B5563"
                        mode="dropdown"
                    >
                        <Picker.Item label="DD-MM-YYYY" value="DD-MM-YYYY" />
                        <Picker.Item label="YYYY-MM-DD" value="YYYY-MM-DD" />
                        <Picker.Item label="MM/DD/YYYY" value="MM/DD/YYYY" />
                    </Picker>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Theme</Text>
                <View style={styles.themeRow}>
                    <Text style={styles.label}>Dark Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={async () => {
                            await toggle();
                            showSuccessToast('Theme updated', `Now using ${!isDark ? 'Dark' : 'Light'} mode`);
                        }}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 24,
        color: '#111827',
    },
    card: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    pickerRow: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        overflow: 'hidden',
    },
    picker: {
        height: 44,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    label: {
        color: '#6B7280',
        fontSize: 13,
    },
    value: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600',
    },
    themeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    logoutButton: {
        height: 44,
        borderRadius: 999,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
