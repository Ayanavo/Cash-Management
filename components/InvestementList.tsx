import { FlatList, Text, View } from "react-native";

type Transaction = {
    name: string;
    amount: string;
    status: string;
};

export default function InvestmentList() {
    const transactions: Transaction[] = [
        { name: 'Ada Femi', amount: '$1,923', status: 'Pending' },
        { name: 'Musa Adebayor', amount: '$1,532', status: 'Pending' },
        { name: 'Nneka Malik', amount: '$950', status: 'Paid' },
        { name: 'John Doe', amount: '$2,450', status: 'Paid' },
        { name: 'Jane Smith', amount: '$3,100', status: 'Pending' },
        { name: 'Samuel Kofi', amount: '$780', status: 'Paid' },
        { name: 'Aisha Bello', amount: '$4,200', status: 'Pending' },
        { name: 'Carlos Mendez', amount: '$610', status: 'Paid' },
        { name: 'Priya Patel', amount: '$1,150', status: 'Pending' },
        { name: 'Liam O\'Connor', amount: '$2,800', status: 'Paid' },
        { name: 'Zara Khan', amount: '$540', status: 'Pending' },
        { name: 'Ethan Hawk', amount: '$4,300', status: 'Paid' },
        { name: 'Leota Adebayo', amount: '$32', status: 'Pending' },
        { name: 'Zorhan Mamdani', amount: '$950', status: 'Paid' },
    ];

    type BadgeStyles = { container: any; text: any };
    const getBadgeStyles = (status: string): BadgeStyles => {
        const baseContainer = {
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 9999,
            border: "none",
        } as const;
        const baseText = {
            fontSize: 12,
            fontWeight: '600' as const,
        };
        switch (status.toLowerCase()) {
            case 'paid':
                return {
                    container: { ...baseContainer, backgroundColor: '#D1FAE5' }, // emerald-200 / emerald-400
                    text: { ...baseText, color: '#065F46' }, // emerald-900
                };
            case 'pending':
                return {
                    container: { ...baseContainer, backgroundColor: '#FEF3C7' }, // amber-200/amber-500
                    text: { ...baseText, color: '#92400E' }, // amber-900
                };
            case 'failed':
                return {
                    container: { ...baseContainer, backgroundColor: '#FECACA' }, // rose/red-200/red-400
                    text: { ...baseText, color: '#7F1D1D' }, // red-900
                };
            default:
                return {
                    container: { ...baseContainer, backgroundColor: '#E5E7EB' }, // gray-200/gray-400
                    text: { ...baseText, color: '#111827' }, // gray-900
                };
        }
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const badge = getBadgeStyles(item.status);
        return (
            <View className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm border border-gray-200">
                <Text className="text-gray-700 text-sm font-semibold" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="font-medium text-xl text-gray-900">{item.amount}</Text>
                <View style={badge.container}>
                    <Text style={badge.text}>{item.status}</Text>
                </View>
            </View>
        );
    };

    return (
        <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={item => item.name}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            showsVerticalScrollIndicator={false}
        />
    );
}
