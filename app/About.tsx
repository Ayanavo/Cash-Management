import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { useTheme } from '@shopify/restyle';
import type { Theme } from '../theme/restyleTheme';

export default function AboutScreen() {
  const theme = useTheme<Theme>();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.watermark}>
            <Info
              size={80}
              color={theme.colors.mutedForeground}
            />
          </View>
          <Text
            style={[styles.title, { color: theme.colors.foreground }]}
          >
            About Wallet
          </Text>
          <Text
            style={[styles.body, { color: theme.colors.mutedForeground }]}
          >
            Wallet helps you track your investments, monitor spending, and
            stay on top of upcoming payments with a clean, minimal interface.
          </Text>
          <View style={{ height: 16 }} />
          <Text
            style={[styles.metaLabel, { color: theme.colors.mutedForeground }]}
          >
            Version
          </Text>
          <Text
            style={[styles.metaValue, { color: theme.colors.foreground }]}
          >
            1.0.0
          </Text>
          <View style={{ height: 12 }} />
          <Text
            style={[styles.metaLabel, { color: theme.colors.mutedForeground }]}
          >
            Built with
          </Text>
          <View style={styles.list}>
            {[
              'React Native',
              'TypeScript',
              'Appwrite',
              '@shopify/restyle',
              '@gorhom/bottom-sheet',
              'react-native-gesture-handler',
              'react-native-reanimated',
              'react-native-toast-message',
              'lucide-react-native',
            ].map((lib) => (
              <Text
                key={lib}
                style={[styles.metaValue, { color: theme.colors.foreground }]}
              >
                • {lib}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  watermark: {
    position: 'absolute',
    right: 8,
    top: 8,
    opacity: 0.06,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    marginTop: 4,
    gap: 2,
  },
});


