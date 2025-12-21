import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { ProfileAvatarButtonProps } from '../interfaces/components.types';

export default function ProfileAvatarButton({ onPress, imageUrl = null, size = 32 }: ProfileAvatarButtonProps) {
    const { user } = useAuth();

    const initials = useMemo(() => {
        const source = user?.name?.trim() || user?.email || '';
        if (!source) return '?';
        const parts = source.split(/\s+/);
        if (parts.length >= 2 && user?.name) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        // fallback to first two chars of name/email
        const raw = source.replace(/[^a-zA-Z]/g, '');
        return raw.slice(0, 2).toUpperCase() || '?';
    }, [user]);

    const diameter = size;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ paddingHorizontal: 4 }}>
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }} />
            ) : (
                <View style={[styles.fallback, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}>
                    <Text style={[styles.initials, { fontSize: Math.max(12, Math.floor(diameter * 0.45)) }]}>{initials}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fallback: {
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: '#fff',
        fontWeight: '700',
    },
});


