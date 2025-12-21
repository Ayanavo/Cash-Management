import { useTheme } from '@shopify/restyle';
import { ArrowUpDown, ChevronDown, Plus, TriangleAlert } from 'lucide-react-native';
import moment from 'moment';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDateFormat } from '../context/DateFormatContext';
import { usePreferences } from '../context/PreferencesContext';
import type {
  InvestmentListTransaction as Transaction,
  InvestmentDetailsTransaction as Txn,
} from '../interfaces/components.types';
import {
  listInvestmentDocuments,
  updateInvestmentStatus,
} from '../services/appwrite/investments';
import { getProfileSettings } from '../services/appwrite/settings';
import {
  emitInvestmentsChanged,
  onBalanceExpenseChanged,
  onInvestmentsChanged,
} from '../services/events';
import type { Theme } from '../theme/restyleTheme';
import { formatCurrency } from '../utils/currencyFormater';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import AddInvestmentModal from './AddInvestmentModal';
import InvestmentDetailsSheet from './InvestmentDetailsSheet';

const SORT_PRIORITY = {
  status: 1,
  amount: 2,
} as const;


export default function InvestmentList({ readOnlyInvestments }: { readOnlyInvestments?: boolean }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [sortPendingFirst, setSortPendingFirst] = useState(false);
  const { currency } = usePreferences();
  const [balanceExpense, setBalanceExpense] = useState(0);
  const { formatDate } = useDateFormat();
  const [rangeText, setRangeText] = useState('');
  const theme = useTheme<Theme>();
  const detailsSheetRef = useRef<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const listViewportHeightRef = useRef(0);
  const [sortByAmount, setSortByAmount] = useState<'none' | 'asc' | 'desc'>('none');

  const handleUpdateStatus = useCallback(
    async (id: string, status: 'paid' | 'pending' | 'dismissed') => {
      try {
        await updateInvestmentStatus(id, status);
        emitInvestmentsChanged();
        if (status === 'paid') {
          showSuccessToast(
            'Payment completed',
            'The investment has been marked as paid.',
          );
        } else {
          showSuccessToast('Updated', `Status changed to ${status}.`);
        }
      } catch (e: any) {
        showErrorToast(
          'Update failed',
          e?.message ?? 'Could not update investment status.',
        );
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
          : formatCurrency(amtNum, currency.symbol);
        return {
          id: d.$id,
          name: d.name ?? '-',
          amount,
          status: String(d.status ?? 'pending').toLowerCase(),
          priority: d.priority ?? 'Low',
          createdAt: d.$createdAt ? formatDate(d.$createdAt) : undefined,
          description: d.description ?? undefined,
        };
      });
      setTransactions(mapped);
    } catch (e: any) {
      showErrorToast(
        'Failed to load',
        e?.message ?? 'Could not fetch investments.',
      );
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currency, formatDate]);
  useEffect(() => {
    let mounted = true;

    void load();
    const unsubscribe = onInvestmentsChanged(() => {
      void load();
    });
    const offBalance = onBalanceExpenseChanged((val) => {
      if (mounted) {
        setBalanceExpense(val);
      }
    });

    // Load range display
    (async () => {
      try {
        const settings = await getProfileSettings();
        if (!mounted) return;

        const range = String(settings?.range ?? '').toUpperCase();
        const now = moment();
        const text = range.endsWith('D')
          ? now.format('DD MMM YYYY')
          : range.endsWith('M')
            ? now.format('MMM YYYY')
            : range.endsWith('Y')
              ? now.format('YYYY')
              : '-';
        setRangeText(text);
      } catch {
        if (mounted) {
          setRangeText('');
        }
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
      offBalance();
    };
  }, [load]);

  const parseAmountValue = useCallback((amountStr: string) => {
    const normalized = amountStr.replace(/[^\d.-]/g, '');
    const n = Number(normalized);
    return Number.isNaN(n) ? 0 : n;
  }, []);

  const sortedData = useMemo(() => {
    const data = [...transactions];

    const enabledSorts: Array<'status' | 'amount'> = [];
    if (sortPendingFirst) enabledSorts.push('status');
    if (sortByAmount !== 'none') enabledSorts.push('amount');

    if (enabledSorts.length === 0) {
      return data;
    }

    enabledSorts.sort((a, b) => SORT_PRIORITY[a] - SORT_PRIORITY[b]);

    const compareStatus = (a: Transaction, b: Transaction) => {
      const order = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'pending') return 0;
        if (s === 'paid') return 1;
        return 2;
      };
      return order(a.status) - order(b.status);
    };

    const compareAmount = (a: Transaction, b: Transaction) => {
      const av = parseAmountValue(a.amount);
      const bv = parseAmountValue(b.amount);
      if (sortByAmount === 'asc') {
        return av - bv;
      }
      return bv - av;
    };

    data.sort((a, b) => {
      for (const key of enabledSorts) {
        const diff = key === 'status' ? compareStatus(a, b) : compareAmount(a, b);
        if (diff !== 0) return diff;
      }
      return 0;
    });

    return data;
  }, [transactions, sortPendingFirst, sortByAmount, parseAmountValue]);

  const hasTransactions = transactions.length > 0;

  type BadgeStyles = { container: any; text: any };
  const getBadgeStyles = (status: string): BadgeStyles => {
    const baseContainer = {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 9999,
      border: 'none',
    } as const;
    const baseText = {
      fontSize: 12,
      fontWeight: '600' as const,
    };
    switch (status.toLowerCase()) {
      case 'paid':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.successSoft,
          },
          text: { ...baseText, color: theme.colors.success },
        };
      case 'pending':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.warningSoft,
          },
          text: { ...baseText, color: theme.colors.warning },
        };
      case 'dismissed':
        return {
          container: { ...baseContainer, backgroundColor: theme.colors.red100 },
          text: { ...baseText, color: theme.colors.destructive },
        };
      default:
        return {
          container: { ...baseContainer, backgroundColor: theme.colors.muted },
          text: { ...baseText, color: theme.colors.foreground },
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
          detailsSheetRef.current?.present();
        }}
        className="rounded-xl p-4"
        style={[
          styles.cardRow,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.colors.foreground }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.createdAt ? (
            <Text
              style={[styles.dateText, { color: theme.colors.mutedForeground }]}
            >
              {item.createdAt}
            </Text>
          ) : null}
        </View>
        <Text
          className="font-medium text-xl"
          style={{ color: theme.colors.foreground }}
          numberOfLines={1}
        >
          {item.amount}
        </Text>
        <View style={[badge.container, styles.statusBadge]}>
          <Text style={badge.text}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {!loading && (
        <View style={styles.headerRow}>
          <View style={[styles.headerItem, styles.headerItemLeft]}>
            {rangeText ? (
              <View
                style={[
                  styles.headerChip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerChipText,
                    { color: theme.colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {rangeText}
                </Text>
              </View>
            ) : (
              <View style={{ height: 32 }} />
            )}
          </View>

          {/* Add Investment Button */}
          {!readOnlyInvestments && (
            <View style={[styles.headerItem, styles.headerItemRight]}>
              <TouchableOpacity
                style={styles.addButtonTouchable}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.addButtonInner,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Plus size={16} color={theme.colors.primaryForeground} />
                  <Text
                    style={[
                      styles.addButtonText,
                      { color: theme.colors.primaryForeground },
                    ]}
                  >
                    Add investment
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.headerItem, styles.headerItemRight]}>
            {/* Combined sort button wrapper with two icon segments */}
            <View
              style={[
                styles.sortGroupContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
                (sortPendingFirst || sortByAmount !== 'none') && {
                  borderColor: theme.colors.primary,
                },
                !hasTransactions && { opacity: 0.4 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.sortSegment,
                  sortPendingFirst && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  if (!hasTransactions) return;
                  setSortPendingFirst((prev) => !prev);
                }}
                disabled={!hasTransactions}
                activeOpacity={0.85}
              >
                <View style={styles.sortContent}>
                <Text style={[styles.sortButtonText, { color: sortPendingFirst ? theme.colors.primaryForeground :  theme.colors.foreground }]}>Status</Text>
                </View>
              </TouchableOpacity>

              <View
                style={[
                  styles.sortDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.sortSegment,
                  sortByAmount !== 'none' && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => {
                  if (!hasTransactions) return;
                  // Cycle through: none -> asc -> desc -> none
                  setSortByAmount((prev) => {
                    if (prev === 'none') return 'asc';
                    if (prev === 'asc') return 'desc';
                    return 'none';
                  });
                }}
                disabled={!hasTransactions}
                activeOpacity={0.85}
              >
                <View style={styles.sortContent}>
                 <Text style={[styles.sortButtonText, { color: sortByAmount !== 'none' ? theme.colors.primaryForeground : theme.colors.foreground }]}>{sortByAmount === 'asc' ? 'Amt. ↑' : sortByAmount === 'desc' ? 'Amt. ↓' : 'Amt.'}</Text>

                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 4 }, (_, key) => (
            <View key={key} style={styles.skeletonRow}>
              <View style={styles.skeletonLeft}>
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: '65%', height: 14, marginBottom: 6 },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: '45%', height: 10, marginBottom: 4 },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: '30%', height: 10 },
                  ]}
                />
              </View>
              <View style={styles.skeletonCenter}>
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: 80, height: 18 },
                  ]}
                />
              </View>
              <View style={styles.skeletonRight}>
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: 70, height: 22, borderRadius: 999 },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : sortedData.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <TriangleAlert size={20} color={theme.colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>
            No investments added
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.mutedForeground },
            ]}
          >
            Add your first investment to see it appear in this list.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={sortedData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id ?? item.name}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            showsVerticalScrollIndicator={false}
            onLayout={(e) => {
              listViewportHeightRef.current = e.nativeEvent.layout.height;
            }}
            onContentSizeChange={(_w, h) => {
              const viewport = listViewportHeightRef.current;
              if (!viewport) {
                setHasMoreBelow(false);
                return;
              }
              const threshold = 10;
              setHasMoreBelow(h - viewport > threshold);
            }}
            onScroll={(e) => {
              const { layoutMeasurement, contentSize, contentOffset } = e.nativeEvent;
              const threshold = 10;
              const distanceFromBottom =
                contentSize.height - (contentOffset.y + layoutMeasurement.height);
              setHasMoreBelow(distanceFromBottom > threshold);
            }}
            scrollEventThrottle={10}
          />
          {hasMoreBelow && (
            <View style={styles.moreIndicator}>
              <ChevronDown size={16} color={theme.colors.mutedForeground} />
            </View>
          )}
        </>
      )}

      <InvestmentDetailsSheet
        ref={detailsSheetRef}
        onClose={() => {
          detailsSheetRef.current?.dismiss?.();
          setSelected(null);
        }}
        transaction={selected as unknown as Txn | null}
        balanceExpense={balanceExpense}
        readOnly={!!readOnlyInvestments}
        onPaymentComplete={async () => {
          if (selected?.id) {
            await handleUpdateStatus(selected.id, 'paid');
          } else {
            showErrorToast('Update failed', 'Missing investment identifier.');
          }
        }}
      />

      <AddInvestmentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
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
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    flexWrap: 'nowrap',
  },
  headerItem: {
    flexShrink: 1,
  },
  headerItemLeft: {
    alignItems: 'flex-start',
  },
  headerItemCenter: {
    alignItems: 'center',
  },
  headerItemRight: {
    alignItems: 'flex-end',
  },
  headerChip: {
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  headerChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
  },
  sortButtonText: {
    fontWeight: '600',
    fontSize: 10,
  },
  sortContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortGroupContainer: {
    flexDirection: 'row',
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sortSegment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.15,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    marginLeft: 12,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  skeletonLeft: {
    flex: 1,
    marginRight: 8,
  },
  skeletonCenter: {
    marginRight: 8,
  },
  skeletonRight: {},
  skeletonCard: {
    marginBottom: 10,
  },
  skeletonBlock: {
    backgroundColor: '#E1E1E8',
    borderRadius: 999,
    overflow: 'hidden',
  },
  moreIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
