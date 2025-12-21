import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { formatCurrency } from '../utils/currencyFormater';
import type { AnimatedCurrencyProps } from '../interfaces/components.types';

export default function AnimatedCurrency({
    value,
    currencySymbol,
    style,
    durationMs = 450,
}: AnimatedCurrencyProps) {
    const animated = useRef(new Animated.Value(value)).current;
    const [displayValue, setDisplayValue] = useState<number>(value);

    useEffect(() => {
        // keep internal value in sync on mount
        animated.setValue(value);
        setDisplayValue(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const sub = animated.addListener(({ value: v }) => {
            setDisplayValue(v);
        });
        return () => {
            animated.removeListener(sub);
        };
    }, [animated]);

    useEffect(() => {
        Animated.timing(animated, {
            toValue: value,
            duration: durationMs,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();
    }, [value, durationMs, animated]);

    return <Text style={style}>{formatCurrency(displayValue, currencySymbol)}</Text>;
}


