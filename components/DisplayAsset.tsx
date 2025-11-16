import { Plus } from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Text, TouchableHighlight, TouchableOpacity, View, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/currencyFormater';
import AddInvestmentModal from './AddInvestmentModal';
import { listInvestmentDocuments } from '../services/appwrite';
import { onInvestmentsChanged } from '../services/events';

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
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalCommitted, setTotalCommitted] = useState(0);

  const loadTotal = useCallback(async () => {
    try {
      const docs = await listInvestmentDocuments();
      const sumPaid = docs.reduce((acc: number, d: any) => {
        const isPaid = String(d.status ?? '').toLowerCase() === 'paid';
        if (!isPaid) return acc;
        const n = Number(d.amount ?? 0);
        return acc + (isNaN(n) ? 0 : n);
      }, 0);
      const sumExcludingDismissed = docs.reduce((acc: number, d: any) => {
        const status = String(d.status ?? '').toLowerCase();
        if (status === 'dismissed') return acc;
        const n = Number(d.amount ?? 0);
        return acc + (isNaN(n) ? 0 : n);
      }, 0);
      setTotalInvested(sumPaid);
      setTotalCommitted(sumExcludingDismissed);
    } catch {
      setTotalInvested(0);
      setTotalCommitted(0);
    }
  }, []);

  useEffect(() => {
    void loadTotal();
    const off = onInvestmentsChanged(() => {
      void loadTotal();
    });
    return () => {
      off();
    };
  }, [loadTotal]);

  const handlePress = () => {
    setShowModal(true);
  };

  const remaining = Math.max(0, balance - totalInvested);
  const isOverCommitted = balance < totalCommitted;
  const previousDelta = 0;

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.subtitle}>Total Investment</Text>
          <Text style={styles.mainAmount}>
            {formatCurrency(totalInvested, currencySymbol)}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={[styles.leftAmount, { color: isOverCommitted ? '#DC2626' : '#374151' }]}>
              {formatCurrency(balance, currencySymbol)}
            </Text>
            <Text style={styles.prevText}>
              {`Prev: ${formatCurrency(previousDelta, currencySymbol)}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.addButtonTouchable}
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <View style={styles.addButtonInner}>
            <Plus color={'white'} size={18} />
            <Text style={styles.addButtonText}>Add investment</Text>
          </View>
        </TouchableOpacity>
      </View>

      <AddInvestmentModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  cardContent: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  mainAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
  leftAmount: {
    fontSize: 16,
  },
  prevText: {
    color: '#6B7280',
    fontSize: 12,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  addButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'black',
    borderRadius: 15,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
