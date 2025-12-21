import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { ChevronRight, TriangleAlert } from 'lucide-react-native';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDateFormat } from '../context/DateFormatContext';
import { usePreferences } from '../context/PreferencesContext';
import { ExpenditureDoc, TimelineItem } from '../interfaces/components.types';
import { listExpenditureDocuments } from '../services/appwrite/expenditures';
import { getProfileSettings } from '../services/appwrite/settings';
import type { Theme } from '../theme/restyleTheme';
import { formatCurrency } from '../utils/currencyFormater';

type TimelineViewMode = 'DAY' | 'WEEK' | 'MONTH';

const VIEW_SEQUENCE: TimelineViewMode[] = ['DAY', 'WEEK', 'MONTH'];

function filterByRange(items: TimelineItem[], range: string | null): TimelineItem[] {
  if (!range) return items;

  const upper = range.toUpperCase();
  const now = moment();
  let from: moment.Moment | null = null;

  if (upper.endsWith('D') || upper.endsWith('M') || upper.endsWith('Y')) {
    const unit = upper.slice(-1);
    const numRaw = upper.slice(0, -1);
    const num = parseInt(numRaw || '0', 10) || 0;
    if (num > 0) {
      if (unit === 'D') {
        // Day ranges are calendar-day based:
        // 1D => from start of today
        // 7D => from start of day 6 days ago (inclusive)
        from = now.clone().startOf('day').subtract(num - 1, 'days');
      }
      if (unit === 'M') {
        // Month ranges are calendar-month based
        from = now.clone().startOf('month').subtract(num - 1, 'months');
      }
      if (unit === 'Y') {
        // Year ranges are calendar-year based
        from = now.clone().startOf('year').subtract(num - 1, 'years');
      }
    }
  }

  // "Custom" or unknown => show all
  if (!from) return items;

  return items.filter((it) => moment(it.createdAt).isSameOrAfter(from));
}

function getGroupKeyAndLabel(
  createdAt: string,
  mode: TimelineViewMode,
): { key: string; label: string } {
  const m = moment(createdAt);

  switch (mode) {
    case 'DAY':
      // Group by calendar day
      return {
        key: m.format('YYYY-MM-DD'),
        label: m.format('DD MMM YYYY'),
      };
    case 'WEEK': {
      // Group by ISO week (week-of-year)
      const startOfWeek = m.clone().startOf('isoWeek');
      return {
        key: `${startOfWeek.format('GGGG')}-W${startOfWeek.format('WW')}`,
        label: `Week of ${startOfWeek.format('DD MMM YYYY')}`,
      };
    }
    case 'MONTH':
    default:
      // Group by calendar month
      return {
        key: m.format('YYYY-MM'),
        label: m.format('MMM YYYY'),
      };
  }
}

function getItemDateLabel(
  createdAt: string,
  mode: TimelineViewMode,
  timeFormat: '12' | '24',
): string {
  const m = moment(createdAt);
  const timePart = timeFormat === '24' ? 'HH:mm' : 'hh:mm A';

  if (mode === 'DAY') {
    return m.format(timePart);
  }
  if (mode === 'WEEK') {
    return m.format(`DD, ${timePart}`);
  }
  if (mode === 'MONTH') {
    return m.format(`DD MMM, ${timePart}`);
  }
  return m.format(`DD MMM YYYY, ${timePart}`);
}

function getRangeLabel(mode: TimelineViewMode): string {
  switch (mode) {
    case 'DAY':
      return 'Day';
    case 'WEEK':
      return 'Week';
    case 'MONTH':
      return 'Month';
    default:
      return 'Day';
  }
}


export default function ExpenditureTimeline({ refreshKey }: { refreshKey?: number;}) {
  const theme = useTheme<Theme>();
  const { currency } = usePreferences();
  const { timeFormat } = useDateFormat();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TimelineViewMode>('DAY');
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Load settings for current default range
        try {
          const settings = await getProfileSettings();
          const r = String(settings?.range ?? '');
          if (!cancelled) {
            setTimeRange(r || null);
            const upper = r.toUpperCase();
            const unit = upper.slice(-1);
            const mode: TimelineViewMode =
              unit === 'M' || unit === 'Y' ? 'MONTH' : 'DAY';
            setViewMode(mode);
          }
        } catch {
          if (!cancelled) {
            setTimeRange(null);
            setViewMode('DAY');
          }
        }

        const docs = (await listExpenditureDocuments()) as ExpenditureDoc[];
        const mapped: TimelineItem[] = docs.map((d) => {
          const createdAt = d.$createdAt ?? new Date().toISOString();
          const raw = d.totalAmount ?? 0;
          const amountNum = Number(raw ?? 0);
          return {
            id: d.$id,
            createdAt,
            date: moment(createdAt).format('DD MMM YYYY'),
            amount: Number.isNaN(amountNum) ? 0 : amountNum,
          };
        });

        // Sort newest first
        mapped.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        if (!cancelled) {
          setItems(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filtered = useMemo(
    () => filterByRange(items, timeRange),
    [items, timeRange],
  );

  return (
    <View style={styles.container}>
      {/* Header row with range filter (top-right) */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.rangeButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => {
              setViewMode((prev) => {
                const idx = VIEW_SEQUENCE.findIndex((v) => v === prev);
                if (idx === -1) return 'DAY';
                return VIEW_SEQUENCE[(idx + 1) % VIEW_SEQUENCE.length];
              });
            }}
          >
            <View style={styles.rangeContent}>
              <Text
                style={[
                  styles.rangeLabel,
                  { color: theme.colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                Range
              </Text>
              <Text
                style={[
                  styles.rangeValue,
                  { color: theme.colors.foreground },
                ]}
                numberOfLines={1}
              >
                {getRangeLabel(viewMode)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          {Array.from({ length: 9 }, (_, key) => (
            <View key={key} style={styles.row}>
              <View style={styles.timelineCol}>
                <View
                  style={[
                    styles.dot,
                    styles.skeletonDot,
                  ]}
                />
              </View>
              <View
                style={[
                  styles.card,
                  styles.skeletonCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: '40%', height: 10, marginBottom: 6 },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonBlock,
                    { width: '60%', height: 14 },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <TriangleAlert size={20} color={theme.colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>
            No history available.
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.mutedForeground },
            ]}
          >
            Try changing the range or adding expenditures.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const prev = index > 0 ? filtered[index - 1] : null;
            const next = index < filtered.length - 1 ? filtered[index + 1] : null;

            const { key: thisGroupKey, label: groupLabel } = getGroupKeyAndLabel(
              item.createdAt,
              viewMode,
            );
            const prevGroupKey = prev
              ? getGroupKeyAndLabel(prev.createdAt, viewMode).key
              : null;
            const nextGroupKey = next
              ? getGroupKeyAndLabel(next.createdAt, viewMode).key
              : null;

            const hasPrevInGroup = !!prev && prevGroupKey === thisGroupKey;
            const hasNextInGroup = !!next && nextGroupKey === thisGroupKey;

            const showGroupHeader = !prev || thisGroupKey !== prevGroupKey;

            return (
              <View>
                {showGroupHeader && (
                  <View style={styles.groupHeaderRow}>
                    <Text
                      style={[
                        styles.monthHeader,
                        { color: theme.colors.mutedForeground },
                      ]}
                    >
                      {groupLabel}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.groupActionBtn,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate('Home', {
                          readOnlyInvestments: true,
                        })
                      }
                    >
                      <ChevronRight
                        size={14}
                        color={theme.colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.row}>
                  <View style={styles.timelineCol}>
                    {hasPrevInGroup && (
                      <View
                        style={[
                          styles.line,
                          styles.lineTop,
                          { backgroundColor: theme.colors.border },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.dot,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                        },
                      ]}
                    />
                    {hasNextInGroup && (
                      <View
                        style={[
                          styles.line,
                          styles.lineBottom,
                          { backgroundColor: theme.colors.border },
                        ]}
                      />
                    )}
                  </View>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        { color: theme.colors.mutedForeground },
                      ]}
                    >
                      {getItemDateLabel(item.createdAt, viewMode, timeFormat)}
                    </Text>
                    <Text
                      style={[
                        styles.amountText,
                        { color: theme.colors.foreground },
                      ]}
                    >
                      {formatCurrency(item.amount, currency.symbol)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerRight: {
    flexShrink: 0,
  },
  rangeButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  rangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  rangeValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingWrap: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  emptyWrap: {
    paddingTop: 32,
    alignItems: 'center',
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
    maxWidth: '80%',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  monthHeader: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 0,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  groupActionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
  },
  lineTop: {
    marginBottom: 0,
  },
  lineBottom: {
    marginTop: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
  },
  skeletonDot: {
    borderColor: '#E1E1E8',
    backgroundColor: '#F3F4F6',
  },
  card: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  skeletonCard: {
    marginBottom: 0,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  skeletonBlock: {
    backgroundColor: '#E1E1E8',
    borderRadius: 999,
  },
});


