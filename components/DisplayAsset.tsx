import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useNavigation } from '@react-navigation/native';
import { listInvestmentDocuments } from '../services/appwrite/investments';
import {
  onInvestmentsChanged,
  emitBalanceExpenseChanged,
} from '../services/events';
import { formatCurrency } from '../utils/currencyFormater';
import { usePreferences } from '../context/PreferencesContext';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import AnimatedCurrency from './AnimatedCurrency';
import {
  getExpenditureTotal,
  upsertExpenditureTotal,
} from '../services/appwrite/expenditures';
import { amountNumberToWords } from '../utils/numberToWords';
import type { DisplayAssetProps } from '../interfaces/components.types';
import type { Theme } from '../theme/restyleTheme';
import { Pencil } from 'lucide-react-native';

export default function DisplayAsset({
  currencySymbol,
  readOnlyInvestments = false,
}: DisplayAssetProps) {
  const theme = useTheme<Theme>();
  const navigation = useNavigation<any>();
  const { currency } = usePreferences();
  const symbol = currencySymbol ?? currency.symbol;

  const [showEditExpense, setShowEditExpense] = useState(false);
  const [expenseAmountInput, setExpenseAmountInput] = useState('');
  const [expenseInputError, setExpenseInputError] = useState(false);
  // Total expense amount added manually via the "Add to Total Expense" modal
  const [totalExpense, setTotalExpense] = useState(0);
  // Total invested amount: sum of all PAID investment amounts
  const [totalInvested, setTotalInvested] = useState(0);
  // Total committed amount: sum of all PENDING investment amounts
  const [totalCommitted, setTotalCommitted] = useState(0);

  const [hasLoadedExpense, setHasLoadedExpense] = useState(false);

  const loadExpenseTotal = useCallback(async () => {
    try {
      const res = await getExpenditureTotal();
      setTotalExpense(res.totalExpense ?? 0);
    } catch {
      setTotalExpense(0);
    } finally {
      setHasLoadedExpense(true);
    }
  }, []);

  const loadTotal = useCallback(async () => {
    try {
      const docs = await listInvestmentDocuments();
      const sumPaid = docs.reduce((acc: number, d: any) => {
        const isPaid = String(d.status ?? '').toLowerCase() === 'paid';
        if (!isPaid) return acc;
        const n = Number(d.amount ?? 0);
        return acc + (isNaN(n) ? 0 : n);
      }, 0);
      const sumPending = docs.reduce((acc: number, d: any) => {
        const status = String(d.status ?? '').toLowerCase();
        if (status !== 'pending') return acc;
        const n = Number(d.amount ?? 0);
        return acc + (isNaN(n) ? 0 : n);
      }, 0);
      // Recalculate from latest data: invested = total PAID, committed = PENDING only
      setTotalInvested(sumPaid);
      setTotalCommitted(sumPending);
    } catch {
      setTotalInvested(0);
      setTotalCommitted(0);
    }
  }, []);

  useEffect(() => {
    void loadExpenseTotal();
  }, [loadExpenseTotal]);

  // Auto-open "Add to Total Expense" modal when landing on dashboard
  // and there is no expense configured yet.
  useEffect(() => {
    if (hasLoadedExpense && totalExpense <= 0) {
      setShowEditExpense(true);
    }
  }, [hasLoadedExpense, totalExpense]);

  useEffect(() => {
    void loadTotal();
    const off = onInvestmentsChanged(() => {
      void loadTotal();
    });
    return () => {
      off();
    };
  }, [loadTotal]);

  const balanceExpense = Math.max(0, totalExpense - totalInvested);
  const isOverCommitted = totalExpense - totalInvested < totalCommitted;
  const previousExpense = 0;

  // Emit balance updates
  useEffect(() => {
    emitBalanceExpenseChanged(balanceExpense);
  }, [balanceExpense]);

  const openEditExpense = () => {
    setExpenseAmountInput('');
    setShowEditExpense(true);
  };

  const addToExpenseTotal = () => {
    const toAdd = Number(expenseAmountInput);
    if (isNaN(toAdd) || toAdd <= 0) {
      showErrorToast('Invalid amount', 'Please enter a positive number.');
      setExpenseInputError(true);
      return;
    }
    // Enforce maximum of 6 digits (values must be less than 1,000,000)
    if (toAdd >= 1000000) {
      showErrorToast(
        'Invalid amount',
        'Maximum amount you can add is 999,999.',
      );
      setExpenseInputError(true);
      return;
    }
    setExpenseInputError(false);
    setTotalExpense((prev) => prev + toAdd);
    (async () => {
      try {
        // Store this addition as a separate expenditure entry
        await upsertExpenditureTotal(toAdd);
      } catch (e: any) {
        showErrorToast(
          'Failed to save',
          e?.message ?? 'Could not save total expense.',
        );
      }
    })();
    setShowEditExpense(false);
    showSuccessToast('Saved', 'Amount added to total expense.');
  };

  const amountInWords = (() => {
    const val = Number(expenseAmountInput);
    if (isNaN(val) || val <= 0) return '';
    return amountNumberToWords(val);
  })();

  const handleGoToCurrent = () => {
    navigation.setParams?.({ readOnlyInvestments: false });
  };

  return (
    <View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {readOnlyInvestments ? (
          // Entered from ExpenditureTimeline: show "Current" pill that switches
          // back to the live/current investments view.
          <TouchableOpacity
            style={[
              styles.editBtn,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}
            onPress={handleGoToCurrent}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.editBtnText,
                { color: theme.colors.mutedForeground },
              ]}
            >
              Current
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.editBtn,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}
            onPress={openEditExpense}
            activeOpacity={0.8}
          >
            <Pencil size={16} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <View style={styles.cardContent}>
          <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>
            Expense Overview
          </Text>
          <AnimatedCurrency
            value={Math.max(0, totalExpense - totalInvested)}
            currencySymbol={symbol}
            style={[
              styles.mainAmount,
              {
                color: isOverCommitted
                  ? theme.colors.destructive
                  : theme.colors.foreground,
              },
            ]}
          />
          <View style={styles.rowBetween}>
            <Text style={[styles.leftAmount, { color: theme.colors.foreground }]}>
              {formatCurrency(totalExpense, symbol)}
            </Text>
            <Text style={[styles.prevText, { color: theme.colors.mutedForeground }]}>
              {formatCurrency(previousExpense, symbol)}
            </Text>
          </View>
        </View>
      </View>

      {/* Add to Total Expense Modal */}
      <Modal
        visible={showEditExpense}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditExpense(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.foreground }]}>
              Add to Total Expense
            </Text>
            <Text
              style={[
                styles.modalCurrent,
                { color: theme.colors.mutedForeground },
              ]}
            >
              Current: {formatCurrency(totalExpense, symbol)}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: expenseInputError
                    ? theme.colors.destructive
                    : theme.colors.input,
                  borderWidth: expenseInputError ? 2 : 1,
                  backgroundColor: theme.colors.muted,
                },
              ]}
              keyboardType="numeric"
              value={expenseAmountInput}
              onChangeText={(text) => {
                setExpenseAmountInput(text);
                if (expenseInputError) {
                  setExpenseInputError(false);
                }
              }}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />
            {amountInWords ? (
              <Text
                style={[
                  styles.modalAmountWords,
                  { color: theme.colors.mutedForeground },
                ]}
              >
                {amountInWords}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowEditExpense(false)}
                style={[
                  styles.modalBtn,
                  styles.modalBtnSecondary,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalBtnSecondaryText,
                    { color: theme.colors.foreground },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addToExpenseTotal}
                style={[
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  { backgroundColor: theme.colors.primary },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalBtnPrimaryText,
                    { color: theme.colors.primaryForeground },
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    alignItems: 'center',
  },
  editBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  mainAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  expenseText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
  leftAmount: {
    fontSize: 20,
  },
  prevText: {
    color: '#6B7280',
    fontSize: 14,
  },
  actionsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalCurrent: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 8,
    fontSize: 16,
  },
  modalInput: {
    height: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
  },
  modalInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  modalAmountWords: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'left',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  modalBtnSecondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalBtnPrimary: {
    backgroundColor: '#111827',
    marginLeft: 8,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
