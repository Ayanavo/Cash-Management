import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChartComponent from '../components/ChartComponent';
import { ChartPoint } from '../interfaces/components.types';

export default function AnalyticsScreen() {
    const data: ChartPoint[] = [
        { value: 120, label: 'Jan' },
        { value: 180, label: 'Feb' },
        { value: 140, label: 'Mar' },
        { value: 220, label: 'Apr' },
        { value: 260, label: 'May' },
        { value: 210, label: 'Jun' },
        { value: 300, label: 'Jul' },
        { value: 280, label: 'Aug' },
        { value: 320, label: 'Sep' },
        { value: 360, label: 'Oct' },
        { value: 340, label: 'Nov' },
        { value: 400, label: 'Dec' },
    ];

    return (
        <SafeAreaView className="flex-1 overflow-y-auto px-4">
            <View className="flex-1">
                <ChartComponent title="Yearly Investments" data={data} />
            </View>
        </SafeAreaView>
    );
}
