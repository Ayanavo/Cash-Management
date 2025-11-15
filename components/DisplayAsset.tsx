import { Copy, Eye, EyeOff } from 'lucide-react-native';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatCurrency } from '../utils/currencyFormater';

type DisplayAssetProps = {
  balance?: number;
  currencySymbol?: string;
  accountNumber?: string;
};

export default function DisplayAsset({
  balance = 34567.9,
  currencySymbol = '$',
  accountNumber = '1289440585',
}: DisplayAssetProps) {
  const [hidden, setHidden] = useState(false);

  const formatted = formatCurrency(balance, currencySymbol);
  const hiddenText = `${currencySymbol}•••••••`;

  return (
    <>
      {/* <Pressable
                onPress={() => setHidden(v => !v)}
                className="absolute right-4 top-4 rounded-full bg-gray-100 p-2"
                hitSlop={8}
            >
                {hidden ? <EyeOff size={18} color="#111827" /> : <Eye size={18} color="#111827" />}
            </Pressable> */}
      <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <View className="space-y-2">
          <Text className="text-lg text-gray-600">Account balance</Text>
          <Text className="text-4xl font-bold text-gray-900">$34,567.90</Text>
          <Text className="text-xs text-gray-500">128944058</Text>
        </View>
      </View>
      {/* <Text className="text-center text-gray-500">Account balance</Text>

            <Text className="mt-2 text-center text-4xl font-extrabold text-black">
                {hidden ? hiddenText : formatted}
            </Text>

            <View className="mt-3 flex-row items-center justify-center gap-2">
                <Copy size={16} color="#6b7280" />
                <Text className="text-gray-500">{accountNumber}</Text>
            </View> */}
    </>
  );
}
