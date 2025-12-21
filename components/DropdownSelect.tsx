import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import type { DropdownSelectProps } from '../interfaces/components.types';
import type { Theme } from '../theme/restyleTheme';

export default function DropdownSelect({
  value,
  options,
  onChange,
  title,
  showSearch = false,
  hasError = false,
  searchPlaceholder = 'Search',
  maxListHeight = 320,
}: DropdownSelectProps) {
  const theme = useTheme<Theme>();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!showSearch) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const label = o.label.toLowerCase();
      const left = o.leftLabel?.toLowerCase() ?? '';
      return label.includes(q) || left.includes(q);
    });
  }, [options, query, showSearch]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            borderColor: hasError ? theme.colors.destructive : theme.colors.border,
            backgroundColor: theme.colors.muted,
            borderWidth: hasError ? 2 : 1,
          },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <View style={styles.selectorInner}>
          {selected.leftIcon ? (
            <View style={styles.leftIconWrap}>{selected.leftIcon}</View>
          ) : selected.leftLabel ? (
            <Text
              style={[
                styles.leftLabel,
                { color: selected.leftColor ?? theme.colors.mutedForeground },
              ]}
            >
              {selected.leftLabel}
            </Text>
          ) : null}
          <Text
            style={[
              styles.selectorText,
              { color: theme.colors.foreground },
            ]}
            numberOfLines={1}
          >
            {selected.label}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                { color: theme.colors.foreground },
              ]}
            >
              {title}
            </Text>
            {showSearch && (
              <TextInput
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                style={[
                  styles.search,
                  {
                    borderColor: theme.colors.input,
                    backgroundColor: theme.colors.muted,
                    color: theme.colors.foreground,
                  },
                ]}
                value={query}
                onChangeText={setQuery}
              />
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              style={{ maxHeight: maxListHeight }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.row,
                    { borderBottomColor: theme.colors.muted },
                  ]}
                  onPress={() => handleSelect(item.value)}
                  activeOpacity={0.85}
                >
                  {item.leftIcon ? (
                    <View style={styles.leftIconWrap}>{item.leftIcon}</View>
                  ) : item.leftLabel ? (
                    <Text
                      style={[
                        styles.leftLabel,
                        {
                          color:
                            item.leftColor ?? theme.colors.mutedForeground,
                        },
                      ]}
                    >
                      {item.leftLabel}
                    </Text>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: theme.colors.foreground },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.value === value ? (
                    <Text
                      style={[
                        styles.check,
                        { color: theme.colors.success },
                      ]}
                    >
                      ✓
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.empty,
                    { color: theme.colors.mutedForeground },
                  ]}
                >
                  No results
                </Text>
              }
            />
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.closeText,
                  { color: theme.colors.primaryForeground },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  selectorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leftIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  selectorText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  search: {
    height: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leftLabel: {
    width: 24,
    textAlign: 'center',
    fontSize: 16,
  },
  optionLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  check: {
    color: '#10B981',
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 12,
  },
  closeBtn: {
    marginTop: 12,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});


