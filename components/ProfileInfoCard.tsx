import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileInfoCard() {
    const { user } = useAuth();

    if (!user) return null;

    return (
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
    );
}

const styles = StyleSheet.create({
    card: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 24,
        alignSelf: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
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
});


