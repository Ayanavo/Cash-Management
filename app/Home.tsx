import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DisplayAsset from '../components/DisplayAsset';
import InvestmentList from '../components/InvestementList';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 overflow-y-auto px-4">
      <View className="flex-1">
        <DisplayAsset />
        <InvestmentList />
      </View>
    </SafeAreaView>
  );
}
