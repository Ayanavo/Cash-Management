import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useFocusEffect } from '@react-navigation/native';
import type { Theme } from '../theme/restyleTheme';
import ExpenditureTimeline from '../components/ExpenditureTimeline';
import { useCallback, useState } from 'react';

export default function HistoryScreen() {
  const theme = useTheme<Theme>();
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ExpenditureTimeline refreshKey={refreshKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
