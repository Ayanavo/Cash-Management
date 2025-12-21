import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import type { Theme } from '../theme/restyleTheme';
import AppLogo from './AppLogo';

type LandingScreenProps = {
  onFinished?: () => void;
};

export default function LandingScreen({ onFinished }: LandingScreenProps) {
  const theme = useTheme<Theme>();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1.02)).current;

  useEffect(() => {
    const holdTimeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && onFinished) {
          onFinished();
        }
      });
    }, 700);

    return () => {
      clearTimeout(holdTimeout);
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [opacity, scale, onFinished]);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: theme.colors.background,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.content}>
        <AppLogo
          width={96}
          height={96}
          color={theme.colors.primary}
          strokeWidth={1.8}
        />
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.foreground,
            },
          ]}
        >
        Wallet
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.mutedForeground,
            },
          ]}
        >
          Manage your money with confidence
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'RobotoMono_600SemiBold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});


