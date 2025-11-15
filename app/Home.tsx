import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DisplayAsset from '../components/DisplayAsset';
import InvestmentList from '../components/InvestementList';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 overflow-y-auto pb-24 px-4 py-6">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
      >
        <View className="px-4 py-6">
          <DisplayAsset />
          <InvestmentList />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
