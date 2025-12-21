import { MessageSquareDot } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import type { Theme } from '../theme/restyleTheme';

export default function NotificationsScreen() {
  const theme = useTheme<Theme>();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.emptyState}>
        <View style={styles.watermark}>
          <MessageSquareDot
            size={64}
            color={theme.colors.mutedForeground}
          />
        </View>
        <Text
          style={[styles.emptyTitle, { color: theme.colors.foreground }]}
        >
          No notifications
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: theme.colors.mutedForeground },
          ]}
        >
          We'll notify you here when there are will be something to notify you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  watermark: {
    marginBottom: 16,
    opacity: 0.15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});


