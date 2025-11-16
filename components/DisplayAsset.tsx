import { Plus } from 'lucide-react-native';
import * as React from 'react';
import { useState } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';
import { formatCurrency } from '../utils/currencyFormater';
import AddInvestmentModal from './AddInvestmentModal';

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

  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    setShowModal(true);
  };

  return (
    <View>
      <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <View className="space-y-2">
          <Text className="text-sm text-gray-600">Account balance</Text>
          <Text className="text-4xl font-bold text-center text-gray-900">{formatCurrency(balance, currencySymbol)}</Text>
          <Text className="text-xs text-gray-500">{accountNumber}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className=" rounded-2xl p-4 mb-6 shadow-sm border border-gray-200" style={{ backgroundColor: 'white', marginBottom: 20 }}>
        <TouchableHighlight
          className="flex-row items-center justify-center rounded-xl py-3"
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <View className="flex-row items-center px-4 py-2 rounded-xl " style={{ backgroundColor: '#4F46E5' , borderRadius: 12}}>
            <Plus color={'white'} size={18} />
            <Text style={{ color: 'white' }} className="font-semibold ml-2">Add investment</Text>
          </View>
        </TouchableHighlight>
      </View>

      <AddInvestmentModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}
