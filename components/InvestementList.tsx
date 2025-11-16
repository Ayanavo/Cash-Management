import { ArrowUpDown } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import InvestmentDetailsSheet, { Transaction as Txn } from "./InvestmentDetailsSheet";
import { listInvestmentDocuments, updateInvestmentStatus } from "../services/appwrite";
import { emitInvestmentsChanged, onInvestmentsChanged } from "../services/events";

type Transaction = {
    id?: string;
    name: string;
    amount: string;
    status: string;
    priority: string;
};

export default function InvestmentList() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selected, setSelected] = useState<Transaction | null>(null);
    const [visible, setVisible] = useState(false);
    const [sortPendingFirst, setSortPendingFirst] = useState(false);

    const handleUpdateStatus = useCallback(
        async (id: string, status: 'paid' | 'pending' | 'dismissed') => {
            try {
                await updateInvestmentStatus(id, status);
                emitInvestmentsChanged();
                if (status === 'paid') {
                    showSuccessToast('Payment completed', 'The investment has been marked as paid.');
                } else {
                    showSuccessToast('Updated', `Status changed to ${status}.`);
                }
            } catch (e: any) {
                showErrorToast('Update failed', e?.message ?? 'Could not update investment status.');
            }
        },
        [],
    );

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const docs = await listInvestmentDocuments();
            const mapped: Transaction[] = docs.map((d: any) => {
                const amtNum = Number(d.amount ?? 0);
                const amount = isNaN(amtNum)
                    ? `${d.amount}`
                    : `$${amtNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                return {
                    id: d.$id,
                    name: d.name ?? '-',
                    amount,
                    status: d.status ?? 'Pending',
                    priority: d.priority ?? 'Low'
                };
            });
            setTransactions(mapped);
        } catch (e: any) {
            showErrorToast('Failed to load', e?.message ?? 'Could not fetch investments.');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        const unsubscribe = onInvestmentsChanged(() => {
            void load();
        });
        return () => {
            unsubscribe();
        };
    }, [load]);

    const sortedData = useMemo(() => {
        if (!sortPendingFirst) return transactions;
        const order = (status: string) => {
            const s = status.toLowerCase();
            if (s === 'pending') return 0;
            if (s === 'paid') return 1;
            return 2;
        };
        return [...transactions].sort((a, b) => order(a.status) - order(b.status));
    }, [sortPendingFirst, transactions]);

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
            case 'dismissed':
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
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    setSelected(item);
                    setVisible(true);
                }}
                className="bg-white rounded-xl p-4"
                style={styles.cardRow}
            >
                <Text className="text-gray-700 text-sm font-semibold" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="font-medium text-xl text-gray-900">{item.amount}</Text>
                <View style={badge.container}>
                    <Text style={badge.text}>{item.status}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <View style={styles.sortRow}>
                <TouchableOpacity
                    style={[styles.sortButton, sortPendingFirst && styles.sortButtonActive]}
                    onPress={() => setSortPendingFirst((v) => !v)}
                    activeOpacity={0.85}
                >
                    <View style={styles.sortContent}>
                        <ArrowUpDown size={16} color={sortPendingFirst ? '#FFFFFF' : '#111827'} />
                        <Text style={[styles.sortButtonText, sortPendingFirst && styles.sortButtonTextActive]}>
                            {sortPendingFirst ? 'Clear sort' : 'Sort: Pending first'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
            {loading ? (
                <View style={{ paddingTop: 24 }}>
                    <ActivityIndicator />
                </View>
            ) : sortedData.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No records available</Text>
                </View>
            ) : (
                <FlatList
                    data={sortedData}
                    renderItem={renderItem}
                    keyExtractor={item => item.id ?? item.name}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <InvestmentDetailsSheet
                visible={visible}
                onClose={() => setVisible(false)}
                transaction={selected as unknown as Txn | null}
                onPaymentComplete={async () => {
                    if (selected?.id) {
                        await handleUpdateStatus(selected.id, 'paid');
                    } else {
                        showErrorToast('Update failed', 'Missing investment identifier.');
                    }
                    setVisible(false);
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sortRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingBottom: 8,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sortButtonActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    sortButtonText: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 12,
    },
    sortButtonTextActive: {
        color: '#FFFFFF',
    },
    sortContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyWrap: {
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 14,
    },
});
