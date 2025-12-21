import { useRoute } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DisplayAsset from '../components/DisplayAsset';
import InvestmentList from '../components/InvestementList';
import { usePreferences } from '../context/PreferencesContext';
import type { Theme } from '../theme/restyleTheme';

export default function HomeScreen() {
  const theme = useTheme<Theme>();
  const { currency } = usePreferences();
  const route = useRoute<any>();
  const readOnlyInvestments = !!route.params?.readOnlyInvestments;  

  return (
    <SafeAreaView
      className="flex-1 overflow-y-auto px-4"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View className="flex-1">
        <DisplayAsset
          currencySymbol={currency.symbol}
          readOnlyInvestments={readOnlyInvestments}
        />
        <InvestmentList readOnlyInvestments={readOnlyInvestments} />
      </View>
    </SafeAreaView>
  );
}
