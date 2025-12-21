import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { ToggleProps } from '../interfaces/components.types';

export default function Toggle({
    value,
    onValueChange,
    disabled = false,
    width = 50,
    height = 28,
}: ToggleProps) {
    const padding = 3;
    const handleSize = Math.max(16, Math.min(22, height - padding * 2));
    const translateMax = width - padding * 2 - handleSize;

    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: value ? 1 : 0,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [value, anim]);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, translateMax],
    });

    const trackStyle = useMemo(
        () => [
            styles.track,
            {
                width,
                height,
                borderRadius: height / 2,
                backgroundColor: value ? '#111827' : '#E5E7EB', // on: black, off: neutral gray
                borderColor: value ? '#111827' : '#E5E7EB',
                opacity: disabled ? 0.6 : 1,
            },
        ],
        [value, width, height, disabled],
    );

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            disabled={disabled}
            onPress={(e) => onValueChange(!value, e)}
            style={trackStyle}
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled }}
        >
            <Animated.View
                style={[
                    styles.handle,
                    {
                        width: handleSize,
                        height: handleSize,
                        borderRadius: handleSize / 2,
                        transform: [{ translateX }],
                    },
                ]}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    track: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 3,
        justifyContent: 'center',
    },
    handle: {
        backgroundColor: '#FFFFFF', // white handle
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
});


