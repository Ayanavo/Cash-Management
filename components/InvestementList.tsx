import { Text, View } from "react-native";

export default function InvestmentList() {
    const transactions = [
        { name: 'Ada Femi', amount: '$1,923', date: 'Sent by you • Nov 12' },
        { name: 'Musa Adebayor', amount: '$1,532', date: 'Received by you • Nov 14' },
        { name: 'Nneka Malik', amount: '$950', date: 'Sent by you • Nov 12' },
      ];

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {transactions.map((transaction) => (
                <View key={transaction.name}>
                    <Text>{transaction.name}</Text>
                    <Text>{transaction.amount}</Text>
                    <Text>{transaction.date}</Text>
                </View>
            ))}
        </View>
    );
};